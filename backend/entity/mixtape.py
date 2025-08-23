from sqlmodel import Session
from backend.db_models.mixtape import Mixtape
from backend.entity.base.base import BaseEntity, DatabaseIdEntity


class MixtapeEntity(BaseEntity, DatabaseIdEntity):
    def __init__(self, session: Session, mixtape: Mixtape):
        super().__init__(session)
        self.mixtape = mixtape

    def get_database_id(self) -> int:
        return self.mixtape.id

    def execute(self):
        self.session.add(self.mixtape)