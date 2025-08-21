from collections.abc import Generator

from sqlmodel import Session

from backend.middleware.db_conn.global_db_conn import get_current_engine


def get_readonly_session() -> Generator[Session, None, None]:  # pragma: no cover – utility
    """FastAPI dependency that yields a *read-only* SQLModel session.

    The session is *not* committed when the request finishes – it is intended
    for read operations only. It is nevertheless enclosed in its own session
    context so that connection pooling works correctly.
    """
    engine = get_current_engine()
    with Session(engine) as session:
        yield session


def get_write_session() -> Generator[Session, None, None]:  # pragma: no cover – utility
    """FastAPI dependency that provides a writable/transactional session.

    Any unhandled exception will cause a rollback. Otherwise, the transaction
    is committed after the request completes.
    """
    engine = get_current_engine()
    with Session(engine) as session:
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
