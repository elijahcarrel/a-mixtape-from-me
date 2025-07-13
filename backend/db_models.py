# db_models.py: SQLModel models for database tables
from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship, select
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship

# Remove User model

class Mixtape(SQLModel, table=True):
    __tablename__ = "Mixtape"
    id: Optional[int] = Field(default=None, primary_key=True)
    stack_auth_user_id: Optional[str] = Field(default=None, index=True, description="Stack Auth User ID of the owner (None for anonymous)")
    public_id: str = Field(unique=True, index=True)
    name: str = Field(max_length=255)
    intro_text: Optional[str] = Field(default=None)
    is_public: bool = Field(default=False)
    create_time: datetime = Field(default_factory=datetime.utcnow)
    last_modified_time: datetime = Field(default_factory=datetime.utcnow)
    version: int = Field(default=1)
    # Relationships
    tracks: List["MixtapeTrack"] = Relationship(back_populates="mixtape", cascade_delete=True)
    audits: List["MixtapeAudit"] = Relationship(back_populates="mixtape")
    
    __table_args__ = (
        Index('ix_mixtape_stack_auth_user_id_last_modified_time', 'stack_auth_user_id', 'last_modified_time'),
    )

class MixtapeAudit(SQLModel, table=True):
    __tablename__ = "MixtapeAudit"
    id: Optional[int] = Field(default=None, primary_key=True)
    mixtape_id: int = Field(foreign_key="Mixtape.id")
    public_id: str = Field(index=True)
    name: str = Field(max_length=255)
    intro_text: Optional[str] = Field(default=None)
    is_public: bool = Field(default=False)
    create_time: datetime
    last_modified_time: datetime
    version: int
    stack_auth_user_id: Optional[str] = Field(default=None, description="Stack Auth User ID of the owner (None for anonymous)")
    # Relationships
    mixtape: "Mixtape" = Relationship(back_populates="audits")
    tracks: List["MixtapeAuditTrack"] = Relationship(back_populates="mixtape_audit", cascade_delete=True)

class MixtapeTrack(SQLModel, table=True):
    __tablename__ = "MixtapeTrack"
    id: Optional[int] = Field(default=None, primary_key=True)
    mixtape_id: int = Field(foreign_key="Mixtape.id")
    track_position: int
    track_text: Optional[str] = Field(default=None)
    spotify_uri: str = Field(max_length=255)
    # Relationships
    mixtape: "Mixtape" = Relationship(back_populates="tracks")
    __table_args__ = (
        UniqueConstraint('mixtape_id', 'track_position', name='mixtape_track_unique_position'),
    )

class MixtapeAuditTrack(SQLModel, table=True):
    __tablename__ = "MixtapeAuditTrack"
    id: Optional[int] = Field(default=None, primary_key=True)
    mixtape_audit_id: int = Field(foreign_key="MixtapeAudit.id")
    track_position: int
    track_text: Optional[str] = Field(default=None)
    spotify_uri: str = Field(max_length=255)
    # Relationships
    mixtape_audit: "MixtapeAudit" = Relationship(back_populates="tracks")

# Methods for insert/select/update will be added here for each class. 