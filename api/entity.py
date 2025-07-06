# entity.py: Orchestrates multi-table operations for Mixtape and related tables.
from typing import Optional, List
from datetime import datetime
import uuid
from api.db_models import MixtapeDB, MixtapeAuditDB, MixtapeTrackDB, MixtapeAuditTrackDB

class MixtapeEntity:
    def __init__(self, name: str, intro_text: Optional[str], is_public: bool, tracks: List[dict]):
        self.name = name
        self.intro_text = intro_text
        self.is_public = is_public
        self.tracks = tracks  # List of dicts with track_position, track_text, spotify_uri

    @staticmethod
    def create_in_db(conn, user_id: Optional[int], name: str, intro_text: Optional[str], is_public: bool, tracks: List[dict]) -> str:
        """
        Create a new mixtape, its tracks, and audit records in a transaction. Returns the public_id.
        """
        public_id = str(uuid.uuid4())
        now = datetime.utcnow()
        version = 1
        with conn:
            mixtape_id = MixtapeDB.insert(conn, user_id, public_id, name, intro_text, is_public, now, now, version)
            audit_id = MixtapeAuditDB.insert(conn, mixtape_id, public_id, name, intro_text, is_public, now, now, version)
            for track in tracks:
                MixtapeTrackDB.insert(conn, mixtape_id, track['track_position'], track.get('track_text'), track['spotify_uri'])
                MixtapeAuditTrackDB.insert(conn, audit_id, track['track_position'], track.get('track_text'), track['spotify_uri'])
        return public_id

    @staticmethod
    def load_by_public_id(conn, public_id: str) -> dict:
        mixtape = MixtapeDB.select_by_public_id(conn, public_id)
        if not mixtape:
            raise ValueError("Mixtape not found")
        tracks = MixtapeTrackDB.select_by_mixtape_id(conn, mixtape.id)
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
    def update_in_db(conn, public_id: str, name: str, intro_text: Optional[str], is_public: bool, tracks: List[dict]) -> int:
        """
        Update a mixtape and its tracks, create new audit records, and increment version. Returns new version.
        """
        now = datetime.utcnow()
        with conn:
            new_version, mixtape_id = MixtapeDB.update_by_public_id(conn, public_id, name, intro_text, is_public, now)
            mixtape = MixtapeDB.select_by_public_id(conn, public_id)
            if not mixtape:
                raise ValueError("Mixtape not found after update")
            audit_id = MixtapeAuditDB.insert(conn, mixtape_id, public_id, name, intro_text, is_public, mixtape.create_time, now, new_version)
            MixtapeDB.delete_tracks_by_mixtape_id(conn, mixtape_id)
            for track in tracks:
                MixtapeTrackDB.insert(conn, mixtape_id, track['track_position'], track.get('track_text'), track['spotify_uri'])
                MixtapeAuditTrackDB.insert(conn, audit_id, track['track_position'], track.get('track_text'), track['spotify_uri'])
        return new_version

    # Methods to prepare and insert all related db_models in correct order
    # Will auto-set CreateTime, LastModifiedTime, and handle foreign keys

# Additional helpers for DAG management and field propagation will be added here. 