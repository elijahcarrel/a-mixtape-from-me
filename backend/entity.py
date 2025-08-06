# entity.py: Orchestrates multi-table operations for Mixtape and related tables using SQLModel
import uuid
from datetime import UTC, datetime

from sqlalchemy import desc
from sqlmodel import Session, select

from backend.db_models import Mixtape, MixtapeAudit, MixtapeAuditTrack, MixtapeTrack


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

    @staticmethod
    def update_in_db(session: Session, public_id: str, name: str, intro_text: str | None, subtitle1: str | None, subtitle2: str | None, subtitle3: str | None, is_public: bool, tracks: list[dict]) -> int:
        """
        Update a mixtape and its tracks, create new audit records, and increment version. Returns new version.
        """
        now = datetime.now(UTC)

        # Get existing mixtape
        statement = select(Mixtape).where(Mixtape.public_id == public_id)
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

        session.commit()
        return mixtape.version

    @staticmethod
    def claim_mixtape(session: Session, public_id: str, stack_auth_user_id: str) -> int:
        """
        Claim an anonymous mixtape by assigning it to a user. Returns new version.
        """
        now = datetime.now(UTC)

        # Get existing mixtape
        statement = select(Mixtape).where(Mixtape.public_id == public_id)
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
            statement = statement.where(Mixtape.name.ilike(f"%{q}%"))
        statement = statement.order_by(desc(Mixtape.last_modified_time)).limit(limit).offset(offset)
        mixtapes = session.exec(statement).all()
        return [
            {
                "public_id": m.public_id,
                "name": m.name,
                "last_modified_time": m.last_modified_time.isoformat(),
            }
            for m in mixtapes
        ]

# Additional helpers for DAG management and field propagation will be added here.
