import os
from typing import Optional
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.pool import StaticPool
# Import models to ensure they're registered with SQLModel metadata
from backend.db_models import User, Mixtape, MixtapeAudit, MixtapeTrack, MixtapeAuditTrack

_engines = {}
_current_db_url: Optional[str] = None

def set_database_url(db_url: Optional[str]):
    """Set the database URL for the current context"""
    global _current_db_url
    _current_db_url = db_url

def get_engine(db_url: str):
    if not db_url:
        raise RuntimeError('database URL must be set or provided to get_engine')
    if db_url not in _engines:
        # Convert psycopg URL to SQLAlchemy format if needed
        if db_url.startswith('postgresql://'):
            # Already in SQLAlchemy format
            engine_url = db_url
        elif db_url.startswith('postgresql+psycopg://'):
            # Already in correct format
            engine_url = db_url
        else:
            # Convert from psycopg format
            engine_url = db_url.replace('postgresql://', 'postgresql+psycopg://')
        
        _engines[db_url] = create_engine(
            engine_url,
            pool_pre_ping=True,
            pool_recycle=300,
            echo=False  # Set to True for SQL debugging
        )
    return _engines[db_url]

def get_db(db_url: str):
    engine = get_engine(db_url)
    with Session(engine) as session:
        yield session

def create_tables(db_url: str):
    """Create all tables defined in SQLModel models"""
    engine = get_engine(db_url)
    SQLModel.metadata.create_all(engine) 