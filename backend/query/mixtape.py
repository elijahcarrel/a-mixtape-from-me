from collections.abc import Sequence

from sqlalchemy import desc, func
from sqlalchemy.sql.base import ExecutableOption
from sqlmodel import Session, select

from backend.db_models.mixtape import Mixtape


class MixtapeQuery:
    session: Session
    for_update: bool
    options: list[ExecutableOption]

    def __init__(self, session: Session, options: list[ExecutableOption], for_update: bool = False):
        self.session = session
        self.for_update = for_update
        self.options = options or []

    def list_mixtapes_for_user(self, stack_auth_user_id: str, q: str | None = None, limit: int = 20, offset: int = 0) -> Sequence[Mixtape]:
        """
        List all mixtapes for a user, ordered by last_modified_time descending, with optional search and pagination.
        q: partial match on name (case-insensitive)
        limit: max results
        offset: pagination offset
        Returns a list of dicts with public_id, name, last_modified_time.
        """
        statement = select(Mixtape).where(Mixtape.stack_auth_user_id == stack_auth_user_id)
        if len(self.options) > 0:
            statement = statement.options(*self.options)
        if q:
            statement = statement.where(func.lower(Mixtape.name).contains(func.lower(q)))
        if self.for_update:
            statement = statement.with_for_update()
        statement = statement.order_by(desc(Mixtape.last_modified_time)).limit(limit).offset(offset)  # type: ignore[arg-type]
        return self.session.exec(statement).all()

    def load_by_public_id(self, public_id: str) -> Mixtape | None:
        # Get mixtape with tracks
        statement = select(Mixtape).where(Mixtape.public_id == public_id)
        if len(self.options) > 0:
            statement = statement.options(*self.options)
        if self.for_update:
            statement = statement.with_for_update()
        return self.session.exec(statement).first()
