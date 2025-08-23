from datetime import datetime

from sqlalchemy import (
    Index,
    UniqueConstraint,
)
from sqlmodel import Field, Relationship, SQLModel


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

    def to_audit(self)->"MixtapeAudit":
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

    def to_audit(self)->"MixtapeAuditTrack":
        return MixtapeAuditTrack(
            track_position=self.track_position,
            track_text=self.track_text,
            spotify_uri=self.spotify_uri,
        )


class MixtapeAuditTrack(SQLModel, table=True):
    __tablename__ = "MixtapeAuditTrack"
    id: int | None = Field(default=None, primary_key=True)
    mixtape_audit_id: int = Field(foreign_key="MixtapeAudit.id")
    track_position: int
    track_text: str | None = Field(default=None)
    spotify_uri: str = Field(max_length=255)
    # Relationships
    mixtape_audit: "MixtapeAudit" = Relationship(back_populates="tracks")
