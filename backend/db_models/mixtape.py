from datetime import UTC, datetime

from sqlalchemy import (
    Index,
    UniqueConstraint,
)
from sqlmodel import Field, Relationship, SQLModel


# The mixtape table captures the state of a "mixtape" created by a user. A
# mixtape is basically a playlist: a collection of songs along with metadata
# such as commentary that goes along with the songs as well as other
# customizable features.
class Mixtape(SQLModel, table=True):
    __tablename__ = "mixtape"
    id: int | None = Field(default=None, primary_key=True)
    stack_auth_user_id: str | None = Field(default=None, index=True, description="Stack Auth User ID of the owner (None for anonymous)")
    public_id: str = Field(unique=True, index=True)
    name: str = Field(max_length=255)
    intro_text: str | None = Field(default=None)
    subtitle1: str | None = Field(default=None, max_length=60)
    subtitle2: str | None = Field(default=None, max_length=60)
    subtitle3: str | None = Field(default=None, max_length=60)
    is_public: bool = Field(default=False)
    create_time: datetime = Field(default_factory=lambda: datetime.now(UTC))
    last_modified_time: datetime = Field(default_factory=lambda: datetime.now(UTC))
    version: int = Field(default=1)
    undo_to_version: int | None = Field(default=None, description="Version to go to when undoing from this version")
    redo_to_version: int | None = Field(default=None, description="Version to go to when redoing from this version")
    # Relationships
    tracks: list["MixtapeTrack"] = Relationship(back_populates="mixtape", cascade_delete=True)
    snapshots: list["MixtapeSnapshot"] = Relationship(back_populates="mixtape")

    __table_args__ = (
        Index('ix_mixtape_stack_auth_user_id_last_modified_time', 'stack_auth_user_id', 'last_modified_time'),
    )

    def _to_snapshot(self)->"MixtapeSnapshot":
        return MixtapeSnapshot(
            public_id=self.public_id,
            name=self.name,
            intro_text=self.intro_text,
            subtitle1=self.subtitle1,
            subtitle2=self.subtitle2,
            subtitle3=self.subtitle3,
            is_public=self.is_public,
            create_time=self.create_time,
            last_modified_time=self.last_modified_time,
            version=self.version,
            stack_auth_user_id=self.stack_auth_user_id,
            undo_to_version=self.undo_to_version,
            redo_to_version=self.redo_to_version,
        )

    def finalize(self):
        """
        Finalize the mixtape update by incrementing version and creating snapshots.
        
        This method should be called as the last step before committing changes to
        the database. It handles:
        1. Version management (increment for updates, set to 1 for new mixtapes)
        2. Timestamp updates (create_time for new, last_modified_time for all)
        3. Undo/redo pointer management (clear redo chain after edits)
        4. Snapshot generation for audit trail
        
        For new mixtapes:
        - Sets create_time and last_modified_time to current time
        - Sets version to 1
        - Initializes undo/redo pointers to None (no history)
        
        For existing mixtapes:
        - Increments version number
        - Updates last_modified_time
        - Clears redo_to_version to break the redo chain
        - Preserves undo_to_version for undo functionality
        """
        now = datetime.now(UTC)
        if self.id is None:
            # Mixtape is being created for the first time.
            self.create_time = now
            self.version = 1
            # New mixtapes have no undo/redo history
            self.undo_to_version = None
            self.redo_to_version = None
        else:
            # Mixtape is being updated.
            self.version += 1
            # After an edit, break the redo chain
            self.redo_to_version = None

        self.last_modified_time = now
        self._generate_snapshots()

    def restore_from_snapshot(self, snapshot: "MixtapeSnapshot") -> None:
        """
        Restore the mixtape to the state captured in the given snapshot.
        
        This method performs a complete restoration of the mixtape's state from
        a historical snapshot, including all metadata fields and undo/redo pointers.
        The tracks are not restored here - that must be done separately by the
        calling code to maintain proper relationship management.
        
        Args:
            snapshot: The MixtapeSnapshot instance containing the state to restore
            
        Note:
            This method modifies the current mixtape instance in-place. The tracks
            relationship should be managed separately to avoid SQLAlchemy relationship
            conflicts. The mixtape_id field is preserved to maintain database
            referential integrity.
        """
        self.name = snapshot.name
        self.intro_text = snapshot.intro_text
        self.subtitle1 = snapshot.subtitle1
        self.subtitle2 = snapshot.subtitle2
        self.subtitle3 = snapshot.subtitle3
        self.is_public = snapshot.is_public
        self.create_time = snapshot.create_time
        self.last_modified_time = snapshot.last_modified_time
        self.version = snapshot.version
        self.undo_to_version = snapshot.undo_to_version
        self.redo_to_version = snapshot.redo_to_version

    def _generate_snapshots(self):
        """
        Generate snapshot records for the current mixtape state.
        
        This private method creates audit trail snapshots by:
        1. Creating a new MixtapeSnapshot with the current mixtape state
        2. Creating MixtapeSnapshotTrack records for each track
        3. Establishing bidirectional relationships between snapshots and tracks
        
        The snapshots are automatically linked to the mixtape via SQLAlchemy
        relationship management. This method is called by finalize() to ensure
        every version change is captured in the audit trail.
        
        Note:
            This method relies on SQLAlchemy's relationship management to set
            foreign key fields automatically when objects are appended to
            relationship collections.
        """
        # Build a new MixtapeSnapshot and attach to mixtape
        new_snapshot = self._to_snapshot()    # this fills everything except mixtape_id
        self.snapshots.append(new_snapshot)  # sets new_snapshot.mixtape_id automatically

        # Build and attach MixtapeSnapshotTracks for each MixtapeTrack
        for track in self.tracks:
            snapshot_track = track._to_snapshot()
            new_snapshot.tracks.append(snapshot_track)  # sets mixtape_snapshot_id automatically


#  The mixtape_snapshot table is an audit/version log for the mixtape table,
#  capturing a snapshot of each entry in the mixtape table as it has existed at
#  every moment it gets updated throughout history, including the current
#  values, with the exception of immutable columns like id and public_id. This
#  means that the current information is always duplicated in both tables (which
#  is a bit wasteful), but provides full snapshot trails for version history.
#  This means that for a given mixtape entry, there should be at least one
#  mixtape_snapshot entry (the only time it would only have exactly one if was
#  created once and never modified after that). This is an internal database
#  table not exposed to clients (unless/until we build a way to see version
#  history).
class MixtapeSnapshot(SQLModel, table=True):
    __tablename__ = "mixtape_snapshot"
    id: int | None = Field(default=None, primary_key=True)
    mixtape_id: int = Field(foreign_key="mixtape.id")
    public_id: str = Field(index=True)
    name: str = Field(max_length=255)
    intro_text: str | None = Field(default=None)
    subtitle1: str | None = Field(default=None, max_length=60)
    subtitle2: str | None = Field(default=None, max_length=60)
    subtitle3: str | None = Field(default=None, max_length=60)
    is_public: bool = Field(default=False)
    create_time: datetime = Field(default_factory=lambda: datetime.now(UTC))
    last_modified_time: datetime = Field(default_factory=lambda: datetime.now(UTC))
    version: int
    stack_auth_user_id: str | None = Field(default=None, description="Stack Auth User ID of the owner (None for anonymous)")
    undo_to_version: int | None = Field(default=None, description="Version to go to when undoing from this version")
    redo_to_version: int | None = Field(default=None, description="Version to go to when redoing from this version")
    # Relationships
    mixtape: "Mixtape" = Relationship(back_populates="snapshots")
    tracks: list["MixtapeSnapshotTrack"] = Relationship(back_populates="mixtape_snapshot", cascade_delete=True)

# The mixtape_track table represents a single track within a single playlist.
class MixtapeTrack(SQLModel, table=True):
    __tablename__ = "mixtape_track"
    id: int | None = Field(default=None, primary_key=True)
    mixtape_id: int = Field(foreign_key="mixtape.id")
    track_position: int
    track_text: str | None = Field(default=None)
    spotify_uri: str = Field(max_length=255)
    # Relationships
    mixtape: "Mixtape" = Relationship(back_populates="tracks")
    __table_args__ = (
        UniqueConstraint('mixtape_id', 'track_position', name='mixtape_track_unique_position'),
    )

    def _to_snapshot(self)->"MixtapeSnapshotTrack":
        return MixtapeSnapshotTrack(
            track_position=self.track_position,
            track_text=self.track_text,
            spotify_uri=self.spotify_uri,
        )

    def restore_from_snapshot(self, snapshot_track: "MixtapeSnapshotTrack") -> None:
        """
        Restore the track to the state captured in the given snapshot.
        
        This method restores the track's state from a historical snapshot,
        updating all mutable fields while preserving the database relationship
        to the parent mixtape.
        
        Args:
            snapshot_track: The MixtapeSnapshotTrack instance containing the state to restore
            
        Note:
            This method modifies the current track instance in-place. The mixtape_id
            field is preserved to maintain database referential integrity.
        """
        self.track_position = snapshot_track.track_position
        self.track_text = snapshot_track.track_text
        self.spotify_uri = snapshot_track.spotify_uri

# The mixtape_snapshot_track table is a snapshot for the mixtape_track table,
# capturing a snapshot of each entry in the mixtape_track table as it has
# existed at every moment the mixtape gets updated throughout history. This
# means that the current information is always duplicated in both tables (which
# is a bit wasteful), but provides full snapshot trails for version history.
# Note that it is a “child” of the mixtape table in that it has a foreign key to
# the mixtape_snapshot table. This allows us to not worry about maintaining our
# own version, create_time, or last_modified_time entries here; rather, we can
# just determine that from joining this with the “parent” mixtape_snapshot
# table. This is an internal database table not exposed to clients (unless/until
# we build a way to see version history).
class MixtapeSnapshotTrack(SQLModel, table=True):
    __tablename__ = "mixtape_snapshot_track"
    id: int | None = Field(default=None, primary_key=True)
    mixtape_snapshot_id: int = Field(foreign_key="mixtape_snapshot.id")
    track_position: int
    track_text: str | None = Field(default=None)
    spotify_uri: str = Field(max_length=255)
    # Relationships
    mixtape_snapshot: "MixtapeSnapshot" = Relationship(back_populates="tracks")
