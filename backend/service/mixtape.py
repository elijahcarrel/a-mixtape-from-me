import threading
import uuid
from datetime import UTC, datetime
from sqlmodel import Session, select

from backend.db_models.mixtape import Mixtape, MixtapeAudit, MixtapeAuditTrack, MixtapeTrack

# --- TESTING CONCURRENCY SUPPORT ---
# These globals are used ONLY during tests to deterministically pause execution
# in the middle of an update/claim operation while holding a row-level lock.
# They have *no effect* in normal operation because _TEST_PAUSE_ENABLED is False
# by default and production code never toggles it.
_TEST_PAUSE_ENABLED: bool = False
_TEST_PAUSE_EVENT: threading.Event | None = None


def _maybe_pause_for_tests() -> None:
    """Block execution if the test pause flag/event is enabled.

    This allows tests to hold the row-level lock acquired by SELECT FOR UPDATE
    while another concurrent request attempts to obtain the lock. In production
    the function is a no-op.
    """
    global _TEST_PAUSE_ENABLED, _TEST_PAUSE_EVENT
    if _TEST_PAUSE_ENABLED and _TEST_PAUSE_EVENT is not None:
        # Wait until the event is set by the test to resume execution.
        _TEST_PAUSE_EVENT.wait()


class MixtapeService:
    def __init__(self, name: str, intro_text: str | None, subtitle1: str | None, subtitle2: str | None, subtitle3: str | None, is_public: bool, tracks: list[dict]):
        self.name = name
        self.intro_text = intro_text
        self.subtitle1 = subtitle1
        self.subtitle2 = subtitle2
        self.subtitle3 = subtitle3
        self.is_public = is_public
        self.tracks = tracks  # List of dicts with track_position, track_text, spotify_uri

    @staticmethod
    def create_in_db(session: Session, stack_auth_user_id: str | None, name: str, intro_text: str | None, subtitle1: str | None, subtitle2: str | None, subtitle3: str | None, is_public: bool, tracks: list[dict]) -> str:
        """
        Create a new mixtape, its tracks, and audit records in a transaction. Returns the public_id.
        stack_auth_user_id can be None for anonymous mixtapes.
        """
        public_id = str(uuid.uuid4())
        now = datetime.now(UTC)
        version = 1

        # Create mixtape
        mixtape = Mixtape(
            stack_auth_user_id=stack_auth_user_id,
            public_id=public_id,
            name=name,
            intro_text=intro_text,
            subtitle1=subtitle1,
            subtitle2=subtitle2,
            subtitle3=subtitle3,
            is_public=is_public,
            create_time=now,
            last_modified_time=now,
            version=version
        )
        session.add(mixtape)
        session.flush()  # Get the ID
        if mixtape.id is None:
            raise ValueError("mixtape.id is None after flush; cannot create tracks")

        # Create audit record
        audit = MixtapeAudit(
            mixtape_id=mixtape.id,
            public_id=public_id,
            name=name,
            intro_text=intro_text,
            subtitle1=subtitle1,
            subtitle2=subtitle2,
            subtitle3=subtitle3,
            is_public=is_public,
            create_time=now,
            last_modified_time=now,
            version=version,
            stack_auth_user_id=stack_auth_user_id
        )
        session.add(audit)
        session.flush()  # Get the audit ID
        if audit.id is None:
            raise ValueError("audit.id is None after flush; cannot create audit tracks")

        # Create tracks
        for track_data in tracks:
            track = MixtapeTrack(
                mixtape_id=mixtape.id,
                track_position=track_data['track_position'],
                track_text=track_data.get('track_text'),
                spotify_uri=track_data['spotify_uri']
            )
            session.add(track)
        for track_data in tracks:
            audit_track = MixtapeAuditTrack(
                mixtape_audit_id=audit.id,
                track_position=track_data['track_position'],
                track_text=track_data.get('track_text'),
                spotify_uri=track_data['spotify_uri']
            )
            session.add(audit_track)

        session.commit()
        return public_id

    @staticmethod
    def update_in_db(session: Session, public_id: str, name: str, intro_text: str | None, subtitle1: str | None, subtitle2: str | None, subtitle3: str | None, is_public: bool, tracks: list[dict]) -> int:
        """
        Update a mixtape and its tracks, create new audit records, and increment version. Returns new version.
        """
        now = datetime.now(UTC)

        # Acquire a row-level lock on the mixtape so that concurrent updates are
        # processed sequentially. Other transactions will block on this lock
        # until we commit or roll back.
        statement = (
            select(Mixtape)
            .where(Mixtape.public_id == public_id)
            .with_for_update()
        )
        mixtape = session.exec(statement).first()

        if not mixtape:
            raise ValueError("Mixtape not found")

        # Update mixtape
        mixtape.name = name
        mixtape.intro_text = intro_text
        mixtape.subtitle1 = subtitle1
        mixtape.subtitle2 = subtitle2
        mixtape.subtitle3 = subtitle3
        mixtape.is_public = is_public
        mixtape.last_modified_time = now
        mixtape.version += 1

        # Create audit record
        audit = MixtapeAudit(
            mixtape_id=mixtape.id,
            public_id=public_id,
            name=name,
            intro_text=intro_text,
            subtitle1=subtitle1,
            subtitle2=subtitle2,
            subtitle3=subtitle3,
            is_public=is_public,
            create_time=mixtape.create_time,
            last_modified_time=now,
            version=mixtape.version
        )
        session.add(audit)
        session.flush()  # Get the audit ID

        # Delete existing tracks (cascade will handle audit tracks)
        for track in mixtape.tracks:
            session.delete(track)
        # Flush to ensure deletions are processed before adding new tracks
        session.flush()
        # Create new tracks
        if mixtape.id is None:
            raise ValueError("mixtape.id is None after flush; cannot create tracks")
        for track_data in tracks:
            track = MixtapeTrack(
                mixtape_id=mixtape.id,
                track_position=track_data['track_position'],
                track_text=track_data.get('track_text'),
                spotify_uri=track_data['spotify_uri']
            )
            session.add(track)
        if audit.id is None:
            raise ValueError("audit.id is None after flush; cannot create audit tracks")
        for track_data in tracks:
            audit_track = MixtapeAuditTrack(
                mixtape_audit_id=audit.id,
                track_position=track_data['track_position'],
                track_text=track_data.get('track_text'),
                spotify_uri=track_data['spotify_uri']
            )
            session.add(audit_track)

        # Pause after all modifications but *before* releasing the lock to allow
        # test cases to control concurrency ordering deterministically.
        _maybe_pause_for_tests()

        session.commit()
        return mixtape.version

    @staticmethod
    def claim_mixtape(session: Session, public_id: str, stack_auth_user_id: str) -> int:
        """
        Claim an anonymous mixtape by assigning it to a user. Returns new version.
        """
        now = datetime.now(UTC)

        # Acquire row-level lock to ensure claims are processed sequentially
        statement = (
            select(Mixtape)
            .where(Mixtape.public_id == public_id)
            .with_for_update()
        )
        mixtape = session.exec(statement).first()

        if not mixtape:
            raise ValueError("Mixtape not found")

        if mixtape.stack_auth_user_id is not None:
            raise ValueError("Mixtape is already claimed")

        # Update mixtape ownership
        mixtape.stack_auth_user_id = stack_auth_user_id
        mixtape.last_modified_time = now
        mixtape.version += 1

        # Create audit record for the claim
        audit = MixtapeAudit(
            mixtape_id=mixtape.id,
            public_id=public_id,
            name=mixtape.name,
            intro_text=mixtape.intro_text,
            subtitle1=mixtape.subtitle1,
            subtitle2=mixtape.subtitle2,
            subtitle3=mixtape.subtitle3,
            is_public=mixtape.is_public,
            create_time=mixtape.create_time,
            last_modified_time=now,
            version=mixtape.version,
            stack_auth_user_id=stack_auth_user_id
        )
        session.add(audit)
        session.flush()  # Get the audit ID

        # Create audit tracks for the claim
        if audit.id is None:
            raise ValueError("audit.id is None after flush; cannot create audit tracks")
        for track in mixtape.tracks:
            audit_track = MixtapeAuditTrack(
                mixtape_audit_id=audit.id,
                track_position=track.track_position,
                track_text=track.track_text,
                spotify_uri=track.spotify_uri
            )
            session.add(audit_track)

        # Pause before releasing the lock for deterministic concurrency tests.
        _maybe_pause_for_tests()

        session.commit()
        return mixtape.version

# Additional helpers for DAG management and field propagation will be added here.
