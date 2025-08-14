from collections.abc import Generator

from sqlalchemy import Engine
from sqlmodel import Session, create_engine

# Global variables holding the database URL and engine connection.
# We assume there is only one global database connection to a single database. If in the future
# we need to support multiple databases, this code will need to change.
# TODO: make this thread-safe? Overkill since it only gets loaded on startup.
# TODO: rather than global variables, instantiate these at a known time and pass them through the app.
_current_engine: Engine | None = None
_current_db_url: str | None = None

def set_database_url(db_url: str | None):
    """Set the database URL for the current context"""
    global _current_db_url
    _current_db_url = db_url

def normalize_db_url(db_url: str)->str:
    # Convert Neon `postgres://` URL to SQLAlchemy `postgresql://` format if needed
    if db_url.startswith('postgres://'):
        # Convert to SQLAlchemy format
        return db_url.replace('postgres://', 'postgresql://')
    elif db_url.startswith('postgresql://'):
        # Already in SQLAlchemy format
        return db_url
    elif db_url.startswith('postgresql+psycopg://') or db_url.startswith('postgresql+psycopg2://'):
        # Already in correct psycopg format
        return db_url
    else:
        raise Exception(f"db_url {db_url} is invalid")

def load_engine(engine_url: str)->Engine:
    return create_engine(
        engine_url,
        pool_pre_ping=True,
        pool_recycle=300,
        echo=False  # Set to True for SQL debugging
    )

def get_engine(db_url: str)->Engine:
    global _current_engine
    engine_url = normalize_db_url(db_url)
    if _current_engine is None:
        _current_engine = load_engine(engine_url)
    elif str(_current_engine.url) != engine_url:
        raise Exception(f"engine was already loaded with url {_current_engine.url}, cannot load a engine at different url {engine_url} (which is a normalized version of {db_url})")
    return _current_engine

# ------------------------------------------------------------
# FastAPI dependency helpers
# ------------------------------------------------------------

def get_readonly_session() -> Generator[Session, None, None]:  # pragma: no cover – utility
    """FastAPI dependency that yields a *read-only* SQLModel session.

    The session is *not* committed when the request finishes – it is intended
    for read operations only. It is nevertheless enclosed in its own session
    context so that connection pooling works correctly.
    """
    if _current_db_url is None:
        raise RuntimeError("Database URL has not been configured – call create_app() first")
    engine = get_engine(_current_db_url)
    with Session(engine) as session:
        yield session


def get_write_session() -> Generator[Session, None, None]:  # pragma: no cover – utility
    """FastAPI dependency that provides a writable/transactional session.

    Any unhandled exception will cause a rollback. Otherwise, the transaction
    is committed after the request completes.
    """
    if _current_db_url is None:
        raise RuntimeError("Database URL has not been configured – call create_app() first")
    engine = get_engine(_current_db_url)
    with Session(engine) as session:
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
