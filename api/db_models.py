# db_models.py: Python classes mapping to database tables, with raw SQL methods.
from typing import Optional, List
from datetime import datetime

class UserDB:
    def __init__(self, id: int, stack_auth_user_id: Optional[str]):
        self.id = id
        self.stack_auth_user_id = stack_auth_user_id

    @staticmethod
    def select_by_stack_auth_user_id(conn, stack_auth_user_id: str) -> Optional['UserDB']:
        with conn.cursor() as cur:
            cur.execute('SELECT ID, StackAuthUserId FROM "User" WHERE StackAuthUserId = %s', (stack_auth_user_id,))
            row = cur.fetchone()
            if row:
                return UserDB(id=row[0], stack_auth_user_id=row[1])
            return None

    @staticmethod
    def insert(conn, stack_auth_user_id: str) -> int:
        with conn.cursor() as cur:
            cur.execute('INSERT INTO "User" (StackAuthUserId) VALUES (%s) RETURNING ID', (stack_auth_user_id,))
            return cur.fetchone()[0]

class MixtapeDB:
    def __init__(self, id: int, user_id: Optional[int], public_id: str, name: str, intro_text: Optional[str], is_public: bool, create_time: datetime, last_modified_time: datetime, version: int):
        self.id = id
        self.user_id = user_id
        self.public_id = public_id
        self.name = name
        self.intro_text = intro_text
        self.is_public = is_public
        self.create_time = create_time
        self.last_modified_time = last_modified_time
        self.version = version

    @staticmethod
    def insert(conn, user_id: Optional[int], public_id: str, name: str, intro_text: Optional[str], is_public: bool, create_time: datetime, last_modified_time: datetime, version: int) -> int:
        with conn.cursor() as cur:
            cur.execute('''
                INSERT INTO Mixtape (UserId, PublicID, Name, IntroText, IsPublic, CreateTime, LastModifiedTime, Version)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING ID
            ''', (user_id, public_id, name, intro_text, is_public, create_time, last_modified_time, version))
            return cur.fetchone()[0]

    @staticmethod
    def select_by_public_id(conn, public_id: str) -> Optional['MixtapeDB']:
        with conn.cursor() as cur:
            cur.execute('''
                SELECT ID, UserId, PublicID, Name, IntroText, IsPublic, CreateTime, LastModifiedTime, Version
                FROM Mixtape WHERE PublicID = %s
            ''', (public_id,))
            row = cur.fetchone()
            if row:
                return MixtapeDB(*row)
            return None

    @staticmethod
    def update_by_public_id(conn, public_id: str, name: str, intro_text: Optional[str], is_public: bool, last_modified_time: datetime) -> tuple[int, int]:
        """
        Update mixtape fields and increment version. Returns (new_version, mixtape_id).
        """
        with conn.cursor() as cur:
            cur.execute('''
                UPDATE Mixtape
                SET Name = %s, IntroText = %s, IsPublic = %s, LastModifiedTime = %s, Version = Version + 1
                WHERE PublicID = %s
                RETURNING Version, ID
            ''', (name, intro_text, is_public, last_modified_time, public_id))
            row = cur.fetchone()
            if not row:
                raise ValueError("Mixtape not found")
            return row[0], row[1]

    @staticmethod
    def delete_tracks_by_mixtape_id(conn, mixtape_id: int):
        with conn.cursor() as cur:
            cur.execute('DELETE FROM MixtapeTrack WHERE MixtapeId = %s', (mixtape_id,))

class MixtapeAuditDB:
    def __init__(self, id: int, mixtape_id: int, public_id: str, name: str, intro_text: Optional[str], is_public: bool, create_time: datetime, last_modified_time: datetime, version: int):
        self.id = id
        self.mixtape_id = mixtape_id
        self.public_id = public_id
        self.name = name
        self.intro_text = intro_text
        self.is_public = is_public
        self.create_time = create_time
        self.last_modified_time = last_modified_time
        self.version = version

    @staticmethod
    def insert(conn, mixtape_id: int, public_id: str, name: str, intro_text: Optional[str], is_public: bool, create_time: datetime, last_modified_time: datetime, version: int) -> int:
        with conn.cursor() as cur:
            cur.execute('''
                INSERT INTO MixtapeAudit (MixtapeId, PublicID, Name, IntroText, IsPublic, CreateTime, LastModifiedTime, Version)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING ID
            ''', (mixtape_id, public_id, name, intro_text, is_public, create_time, last_modified_time, version))
            return cur.fetchone()[0]

class MixtapeTrackDB:
    def __init__(self, id: int, mixtape_id: int, track_position: int, track_text: Optional[str], spotify_uri: str):
        self.id = id
        self.mixtape_id = mixtape_id
        self.track_position = track_position
        self.track_text = track_text
        self.spotify_uri = spotify_uri

    @staticmethod
    def insert(conn, mixtape_id: int, track_position: int, track_text: Optional[str], spotify_uri: str) -> int:
        with conn.cursor() as cur:
            cur.execute('''
                INSERT INTO MixtapeTrack (MixtapeId, TrackPosition, TrackText, SpotifyURI)
                VALUES (%s, %s, %s, %s)
                RETURNING ID
            ''', (mixtape_id, track_position, track_text, spotify_uri))
            return cur.fetchone()[0]

    @staticmethod
    def select_by_mixtape_id(conn, mixtape_id: int) -> List['MixtapeTrackDB']:
        with conn.cursor() as cur:
            cur.execute('''
                SELECT ID, MixtapeId, TrackPosition, TrackText, SpotifyURI
                FROM MixtapeTrack WHERE MixtapeId = %s ORDER BY TrackPosition ASC
            ''', (mixtape_id,))
            rows = cur.fetchall()
            return [MixtapeTrackDB(*row) for row in rows]

class MixtapeAuditTrackDB:
    def __init__(self, id: int, mixtape_audit_id: int, track_position: int, track_text: Optional[str], spotify_uri: str):
        self.id = id
        self.mixtape_audit_id = mixtape_audit_id
        self.track_position = track_position
        self.track_text = track_text
        self.spotify_uri = spotify_uri

    @staticmethod
    def insert(conn, mixtape_audit_id: int, track_position: int, track_text: Optional[str], spotify_uri: str) -> int:
        with conn.cursor() as cur:
            cur.execute('''
                INSERT INTO MixtapeAuditTrack (MixtapeAuditId, TrackPosition, TrackText, SpotifyURI)
                VALUES (%s, %s, %s, %s)
                RETURNING ID
            ''', (mixtape_audit_id, track_position, track_text, spotify_uri))
            return cur.fetchone()[0]

# Methods for insert/select/update will be added here for each class. 