
from typing import Generator
from fastapi import Depends
from sqlmodel import Session
from backend.entity.base.base import Executor
from backend.middleware.db_conn.dependency_helpers import get_write_session

def get_executor(
    session: Session = Depends(get_write_session),
) -> Generator[Executor, None, None]:
    """FastAPI dependency that provides an Executor wrapping a writable session."""
    executor = Executor(session=session)
    yield executor