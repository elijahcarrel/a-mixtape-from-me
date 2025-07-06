# entity.py: Orchestrates multi-table operations for Mixtape and related tables using SQLModel
from typing import Optional, List
from datetime import datetime, UTC
import uuid
from sqlmodel import Session, select
from api.db_models import Mixtape, MixtapeAudit, MixtapeTrack, MixtapeAuditTrack, User

class MixtapeEntity:
    def __init__(self, name: str, intro_text: Optional[str], is_public: bool, tracks: List[dict]):
        self.name = name
        self.intro_text = intro_text
        self.is_public = is_public
        self.tracks = tracks  # List of dicts with track_position, track_text, spotify_uri

    @staticmethod
    def create_in_db(session: Session, user_id: Optional[int], name: str, intro_text: Optional[str], is_public: bool, tracks: List[dict]) -> str:
        """
        Create a new mixtape, its tracks, and audit records in a transaction. Returns the public_id.
        """
        public_id = str(uuid.uuid4())
        now = datetime.now(UTC)
        version = 1
        
        # Create mixtape
        mixtape = Mixtape(
            user_id=user_id,
            public_id=public_id,
            name=name,
            intro_text=intro_text,
            is_public=is_public,
            create_time=now,
            last_modified_time=now,
            version=version
        )
        session.add(mixtape)
        session.flush()  # Get the ID
        
        # Create audit record
        audit = MixtapeAudit(
            mixtape_id=mixtape.id,
            public_id=public_id,
            name=name,
            intro_text=intro_text,
            is_public=is_public,
            create_time=now,
            last_modified_time=now,
            version=version
        )
        session.add(audit)
        session.flush()  # Get the audit ID
        
        # Create tracks
        for track_data in tracks:
            track = MixtapeTrack(
                mixtape_id=mixtape.id,
                track_position=track_data['track_position'],
                track_text=track_data.get('track_text'),
                spotify_uri=track_data['spotify_uri']
            )
            session.add(track)
            
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
    def load_by_public_id(session: Session, public_id: str) -> dict:
        # Get mixtape with tracks
        statement = select(Mixtape).where(Mixtape.public_id == public_id)
        mixtape = session.exec(statement).first()
        
        if not mixtape:
            raise ValueError("Mixtape not found")
        
        # Get tracks (they should be loaded via relationship)
        tracks = mixtape.tracks
        
        return {
            "public_id": mixtape.public_id,
            "name": mixtape.name,
            "intro_text": mixtape.intro_text,
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

    @staticmethod
    def update_in_db(session: Session, public_id: str, name: str, intro_text: Optional[str], is_public: bool, tracks: List[dict]) -> int:
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
        mixtape.is_public = is_public
        mixtape.last_modified_time = now
        mixtape.version += 1
        
        # Create audit record
        audit = MixtapeAudit(
            mixtape_id=mixtape.id,
            public_id=public_id,
            name=name,
            intro_text=intro_text,
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
        
        # Create new tracks
        for track_data in tracks:
            track = MixtapeTrack(
                mixtape_id=mixtape.id,
                track_position=track_data['track_position'],
                track_text=track_data.get('track_text'),
                spotify_uri=track_data['spotify_uri']
            )
            session.add(track)
            
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
    def get_user_by_stack_auth_id(session: Session, stack_auth_user_id: str) -> Optional[User]:
        """Get user by StackAuth user ID"""
        statement = select(User).where(User.stack_auth_user_id == stack_auth_user_id)
        return session.exec(statement).first()

    @staticmethod
    def create_user(session: Session, stack_auth_user_id: str) -> User:
        """Create a new user"""
        user = User(stack_auth_user_id=stack_auth_user_id)
        session.add(user)
        session.commit()
        session.refresh(user)
        return user

# Additional helpers for DAG management and field propagation will be added here. 