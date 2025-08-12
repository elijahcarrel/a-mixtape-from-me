from sqlmodel import Session, SQLModel, create_engine

# Import models to ensure they're registered with SQLModel metadata

_engines = {}
_current_db_url: str | None = None

def set_database_url(db_url: str | None):
    """Set the database URL for the current context"""
    global _current_db_url
    _current_db_url = db_url

def get_engine(db_url: str):
    if not db_url:
        raise RuntimeError('database URL must be set or provided to get_engine')
    if db_url not in _engines:
        # Convert psycopg URL to SQLAlchemy format if needed
        if db_url.startswith('postgres://'):
            # Convert to SQLAlchemy format
            engine_url = db_url.replace('postgres://', 'postgresql://')
        elif db_url.startswith('postgresql://'):
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

# ------------------------------------------------------------
# FastAPI dependency helpers
# ------------------------------------------------------------

from collections.abc import Generator


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
