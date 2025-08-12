# entity.py: Orchestrates multi-table operations for Mixtape and related tables using SQLModel
import threading
import uuid
from datetime import UTC, datetime

from sqlalchemy import desc, func
from sqlmodel import Session, select

from backend.db_models import Mixtape, MixtapeAudit, MixtapeAuditTrack, MixtapeTrack

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


class MixtapeEntity:
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

        # Create mixtape (initial version has no undo/redo targets)
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
            version=version,
            undo_to_version=None,
            redo_to_version=None,
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
            create_time=mixtape.create_time,
            last_modified_time=now,
            version=mixtape.version,
            stack_auth_user_id=stack_auth_user_id,
            undo_to_version=None,
            redo_to_version=None,
        )
        session.add(audit)
        session.flush()  # Get the audit ID

        # Create tracks
        if audit.id is None:
            raise ValueError("audit.id is None after flush; cannot create audit tracks")
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
    def load_by_public_id(session: Session, public_id: str, include_owner: bool = False) -> dict:
        # Get mixtape with tracks
        statement = select(Mixtape).where(Mixtape.public_id == public_id)
        mixtape = session.exec(statement).first()

        if not mixtape:
            raise ValueError("Mixtape not found")

        # Get tracks (they should be loaded via relationship)
        tracks = mixtape.tracks

        result = {
            "public_id": mixtape.public_id,
            "name": mixtape.name,
            "intro_text": mixtape.intro_text,
            "subtitle1": mixtape.subtitle1,
            "subtitle2": mixtape.subtitle2,
            "subtitle3": mixtape.subtitle3,
            "is_public": mixtape.is_public,
            "create_time": mixtape.create_time.isoformat(),
            "last_modified_time": mixtape.last_modified_time.isoformat(),
            "version": mixtape.version,
            "undo_to_version": mixtape.undo_to_version,
            "redo_to_version": mixtape.redo_to_version,
            "tracks": [
                {
                    "track_position": t.track_position,
                    "track_text": t.track_text,
                    "spotify_uri": t.spotify_uri
                } for t in tracks
            ]
        }
        if include_owner:
            result["stack_auth_user_id"] = mixtape.stack_auth_user_id
        return result

    # --------------------------------------------------
    # Helper – create audit snapshot (used by multiple ops)
    # --------------------------------------------------

    @staticmethod
    def _create_audit_snapshot(session: Session, mixtape: Mixtape, now: datetime) -> MixtapeAudit:
        """Persist an audit snapshot for *current* mixtape state and return it."""
        audit = MixtapeAudit(
            mixtape_id=mixtape.id,
            public_id=mixtape.public_id,
            name=mixtape.name,
            intro_text=mixtape.intro_text,
            subtitle1=mixtape.subtitle1,
            subtitle2=mixtape.subtitle2,
            subtitle3=mixtape.subtitle3,
            is_public=mixtape.is_public,
            create_time=mixtape.create_time,
            last_modified_time=now,
            version=mixtape.version,
            stack_auth_user_id=mixtape.stack_auth_user_id,
            undo_to_version=mixtape.undo_to_version,
            redo_to_version=mixtape.redo_to_version,
        )
        session.add(audit)
        session.flush()
        return audit

    @staticmethod
    def update_in_db(session: Session, public_id: str, name: str, intro_text: str | None, subtitle1: str | None, subtitle2: str | None, subtitle3: str | None, is_public: bool, tracks: list[dict]) -> int:
        """
        Update a mixtape and its tracks, create new audit records, and increment version. Returns new version.
        """
        now = datetime.now(UTC)

        # Acquire row-level lock to serialize updates
        stmt = select(Mixtape).where(Mixtape.public_id == public_id).with_for_update()
        mixtape = session.exec(stmt).first()

        if not mixtape:
            raise ValueError("Mixtape not found")

        prev_version = mixtape.version

        # Update mixtape fields
        mixtape.name = name
        mixtape.intro_text = intro_text
        mixtape.subtitle1 = subtitle1
        mixtape.subtitle2 = subtitle2
        mixtape.subtitle3 = subtitle3
        mixtape.is_public = is_public
        mixtape.last_modified_time = now
        mixtape.version = prev_version + 1

        # Maintain undo/redo pointers
        mixtape.undo_to_version = prev_version
        mixtape.redo_to_version = None

        # Update previous audit's redo_to_version pointer so we can redo back
        prev_audit_stmt = select(MixtapeAudit).where(MixtapeAudit.mixtape_id == mixtape.id, MixtapeAudit.version == prev_version).with_for_update()
        prev_audit = session.exec(prev_audit_stmt).first()
        if prev_audit is not None:
            prev_audit.redo_to_version = mixtape.version

        # Create audit record for *new* state
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
            version=mixtape.version,
            stack_auth_user_id=mixtape.stack_auth_user_id,
            undo_to_version=prev_version,
            redo_to_version=None,
        )
        session.add(audit)
        session.flush()

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

        # Update mixtape ownership and maintain version pointers
        prev_version = mixtape.version
        mixtape.stack_auth_user_id = stack_auth_user_id
        mixtape.last_modified_time = now
        mixtape.version = prev_version + 1
        mixtape.undo_to_version = prev_version
        mixtape.redo_to_version = None

        # Update previous audit redo pointer
        prev_audit_stmt = select(MixtapeAudit).where(MixtapeAudit.mixtape_id == mixtape.id, MixtapeAudit.version == prev_version).with_for_update()
        prev_audit = session.exec(prev_audit_stmt).first()
        if prev_audit is not None:
            prev_audit.redo_to_version = mixtape.version

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
            stack_auth_user_id=stack_auth_user_id,
            undo_to_version=mixtape.undo_to_version,
            redo_to_version=mixtape.redo_to_version
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

    @staticmethod
    def list_mixtapes_for_user(session: Session, stack_auth_user_id: str, q: str | None = None, limit: int = 20, offset: int = 0) -> list:
        """
        List all mixtapes for a user, ordered by last_modified_time descending, with optional search and pagination.
        q: partial match on name (case-insensitive)
        limit: max results
        offset: pagination offset
        Returns a list of dicts with public_id, name, last_modified_time.
        """
        statement = select(Mixtape).where(Mixtape.stack_auth_user_id == stack_auth_user_id)
        if q:
            statement = statement.where(func.lower(Mixtape.name).contains(func.lower(q)))
        statement = statement.order_by(desc(Mixtape.last_modified_time)).limit(limit).offset(offset)  # type: ignore[arg-type]
        mixtapes = session.exec(statement).all()
        return [
            {
                "public_id": m.public_id,
                "name": m.name,
                "last_modified_time": m.last_modified_time.isoformat(),
            }
            for m in mixtapes
        ]

    # --------------------------------------------------
    # UNDO / REDO operations
    # --------------------------------------------------

    @staticmethod
    def _apply_audit_state_to_mixtape(session: Session, mixtape: Mixtape, audit_src: MixtapeAudit) -> list[dict]:
        """Replace mixtape's tracks and basic fields with those from audit_src.

        Returns list of dicts representing tracks that were applied (used to
        create new audit tracks).
        """
        # Delete existing tracks
        for t in mixtape.tracks:
            session.delete(t)
        session.flush()

        # Apply scalar fields
        mixtape.name = audit_src.name
        mixtape.intro_text = audit_src.intro_text
        mixtape.subtitle1 = audit_src.subtitle1
        mixtape.subtitle2 = audit_src.subtitle2
        mixtape.subtitle3 = audit_src.subtitle3
        mixtape.is_public = audit_src.is_public

        # Recreate tracks from audit
        applied_tracks: list[dict] = []
        for at in audit_src.tracks:
            td = {
                "track_position": at.track_position,
                "track_text": at.track_text,
                "spotify_uri": at.spotify_uri,
            }
            track = MixtapeTrack(mixtape_id=mixtape.id, **td)
            session.add(track)
            applied_tracks.append(td)
        session.flush()
        return applied_tracks

    @staticmethod
    def undo_in_db(session: Session, public_id: str) -> int:
        """Perform an undo operation and return the new version number."""
        now = datetime.now(UTC)

        stmt = select(Mixtape).where(Mixtape.public_id == public_id).with_for_update()
        mixtape = session.exec(stmt).first()
        if not mixtape:
            raise ValueError("Mixtape not found")
        if mixtape.undo_to_version is None:
            raise ValueError("Nothing to undo")

        target_version = mixtape.undo_to_version

        audit_target_stmt = select(MixtapeAudit).where(MixtapeAudit.mixtape_id == mixtape.id, MixtapeAudit.version == target_version)
        audit_target = session.exec(audit_target_stmt).first()
        if audit_target is None:
            raise ValueError("Undo target not found in audit log")

        current_version = mixtape.version
        mixtape.version = current_version + 1

        # Apply state from audit_target (updates tracks + fields)
        applied_tracks = MixtapeEntity._apply_audit_state_to_mixtape(session, mixtape, audit_target)

        # Pointers
        mixtape.undo_to_version = audit_target.undo_to_version
        mixtape.redo_to_version = current_version

        # Update current audit redo pointer so redo works
        new_audit = MixtapeAudit(
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
            stack_auth_user_id=mixtape.stack_auth_user_id,
            undo_to_version=mixtape.undo_to_version,
            redo_to_version=mixtape.redo_to_version,
        )
        session.add(new_audit)
        session.flush()

        # Audit tracks corresponding to applied state
        for td in applied_tracks:
            session.add(MixtapeAuditTrack(mixtape_audit_id=new_audit.id, **td))

        _maybe_pause_for_tests()

        session.commit()
        return mixtape.version

    @staticmethod
    def redo_in_db(session: Session, public_id: str) -> int:
        """Perform a redo operation and return the new version number."""
        now = datetime.now(UTC)

        stmt = select(Mixtape).where(Mixtape.public_id == public_id).with_for_update()
        mixtape = session.exec(stmt).first()
        if not mixtape:
            raise ValueError("Mixtape not found")
        if mixtape.redo_to_version is None:
            raise ValueError("Nothing to redo")

        target_version = mixtape.redo_to_version

        audit_target_stmt = select(MixtapeAudit).where(MixtapeAudit.mixtape_id == mixtape.id, MixtapeAudit.version == target_version)
        audit_target = session.exec(audit_target_stmt).first()
        if audit_target is None:
            raise ValueError("Redo target not found in audit log")

        current_version = mixtape.version
        mixtape.version = current_version + 1

        applied_tracks = MixtapeEntity._apply_audit_state_to_mixtape(session, mixtape, audit_target)

        # Pointers
        mixtape.undo_to_version = current_version
        mixtape.redo_to_version = audit_target.redo_to_version

        # Update current audit undo pointer
        new_audit = MixtapeAudit(
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
            stack_auth_user_id=mixtape.stack_auth_user_id,
            undo_to_version=mixtape.undo_to_version,
            redo_to_version=mixtape.redo_to_version,
        )
        session.add(new_audit)
        session.flush()

        for td in applied_tracks:
            session.add(MixtapeAuditTrack(mixtape_audit_id=new_audit.id, **td))

        _maybe_pause_for_tests()

        session.commit()
        return mixtape.version

# Additional helpers for DAG management and field propagation will be added here.
