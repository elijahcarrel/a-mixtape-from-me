from datetime import UTC, datetime

from sqlalchemy import (
    Index,
    UniqueConstraint,
)
from sqlmodel import Field, Relationship, SQLModel


# Captures the state of a “mixtape” created by a user. A mixtape is basically a
# playlist: a collection of songs along with metadata such as commentary that
# goes along with the songs as well as other customizable features.
class Mixtape(SQLModel, table=True):
    __tablename__ = "Mixtape"
    id: int | None = Field(default=None, primary_key=True)
    stack_auth_user_id: str | None = Field(default=None, index=True, description="Stack Auth User ID of the owner (None for anonymous)")
    public_id: str = Field(unique=True, index=True)
    name: str = Field(max_length=255)
    intro_text: str | None = Field(default=None)
    subtitle1: str | None = Field(default=None, max_length=60)
    subtitle2: str | None = Field(default=None, max_length=60)
    subtitle3: str | None = Field(default=None, max_length=60)
    is_public: bool = Field(default=False)
    create_time: datetime = Field(default_factory=datetime.utcnow)
    last_modified_time: datetime = Field(default_factory=datetime.utcnow)
    version: int = Field(default=1)
    # Relationships
    tracks: list["MixtapeTrack"] = Relationship(back_populates="mixtape", cascade_delete=True)
    audits: list["MixtapeAudit"] = Relationship(back_populates="mixtape")

    __table_args__ = (
        Index('ix_mixtape_stack_auth_user_id_last_modified_time', 'stack_auth_user_id', 'last_modified_time'),
    )

    def _to_audit(self)->"MixtapeAudit":
        return MixtapeAudit(
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
        )

    # finalize increments the version, sets the last modified time to the
    # current timestamp, and generates audit entries for the update. It should
    # be the last command called before the updates are flushed to the database.
    def finalize(self):
        now = datetime.now(UTC)
        if self.id is None:
            # Mixtape is being created for the first time.
            self.create_time = now
            self.version = 1
        else:
            # Mixtape is being updated.
            self.version += 1

        self.last_modified_time = now
        self._generate_audits()

    def _generate_audits(self):
        # Build a new MixtapeAudit and attach to mixtape
        new_audit = self._to_audit()    # this fills everything except mixtape_id
        self.audits.append(new_audit)  # sets new_audit.mixtape_id automatically

        # Build and attach MixtapeAuditTracks for each MixtapeTrack
        for track in self.tracks:
            audit_track = track._to_audit()
            new_audit.tracks.append(audit_track)  # sets mixtape_audit_id automatically


#  MixtapeAudit is an audit log for the Mixtape table, capturing a snapshot of
#  each entry in the Mixtape table as it has existed at every moment it gets
#  updated throughout history, including the current values, with the exception
#  of immutable columns like id and public_id. This means that the current
#  information is always duplicated in both tables (which is a bit wasteful),
#  but provides full audit trails for version history. This means that for a
#  given Mixtape entry, there should be at least one MixtapeAudit entries (the
#  only time it would only have exactly one if was created once and never
#  modified after that). This is an internal database table not exposed to
#  clients (unless/until we build a way to see version history).
class MixtapeAudit(SQLModel, table=True):
    __tablename__ = "MixtapeAudit"
    id: int | None = Field(default=None, primary_key=True)
    mixtape_id: int = Field(foreign_key="Mixtape.id")
    public_id: str = Field(index=True)
    name: str = Field(max_length=255)
    intro_text: str | None = Field(default=None)
    subtitle1: str | None = Field(default=None, max_length=60)
    subtitle2: str | None = Field(default=None, max_length=60)
    subtitle3: str | None = Field(default=None, max_length=60)
    is_public: bool = Field(default=False)
    create_time: datetime
    last_modified_time: datetime
    version: int
    stack_auth_user_id: str | None = Field(default=None, description="Stack Auth User ID of the owner (None for anonymous)")
    # Relationships
    mixtape: "Mixtape" = Relationship(back_populates="audits")
    tracks: list["MixtapeAuditTrack"] = Relationship(back_populates="mixtape_audit", cascade_delete=True)

# MixtapeTrack represents a single track within a single playlist.
class MixtapeTrack(SQLModel, table=True):
    __tablename__ = "MixtapeTrack"
    id: int | None = Field(default=None, primary_key=True)
    mixtape_id: int = Field(foreign_key="Mixtape.id")
    track_position: int
    track_text: str | None = Field(default=None)
    spotify_uri: str = Field(max_length=255)
    # Relationships
    mixtape: "Mixtape" = Relationship(back_populates="tracks")
    __table_args__ = (
        UniqueConstraint('mixtape_id', 'track_position', name='mixtape_track_unique_position'),
    )

    def _to_audit(self)->"MixtapeAuditTrack":
        return MixtapeAuditTrack(
            track_position=self.track_position,
            track_text=self.track_text,
            spotify_uri=self.spotify_uri,
        )

# MixtapeAuditTrack is an audit log for the MixtapeTrack table, capturing a
# snapshot of each entry in the MixtapeTrack table as it has existed at every
# moment the Mixtape gets updated throughout history. This means that the
# current information is always duplicated in both tables (which is a bit
# wasteful), but provides full audit trails for version history. Note that it is
# a “child” of the Mixtape table in that it has a foreign key to the
# MixtapeAudit table. This allows us to not worry about maintaining our own Version,
# CreateTime, or LastModifiedTime entries here; rather, we can just determine
# that from joining this with the “parent” MixtapeAudit table. This is an
# internal database table not exposed to clients (unless/until we build a way to
# see version history).
class MixtapeAuditTrack(SQLModel, table=True):
    __tablename__ = "MixtapeAuditTrack"
    id: int | None = Field(default=None, primary_key=True)
    mixtape_audit_id: int = Field(foreign_key="MixtapeAudit.id")
    track_position: int
    track_text: str | None = Field(default=None)
    spotify_uri: str = Field(max_length=255)
    # Relationships
    mixtape_audit: "MixtapeAudit" = Relationship(back_populates="tracks")
