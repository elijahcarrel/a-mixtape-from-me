from sqlmodel import Session
from backend.db_models.mixtape import MixtapeAudit
from backend.entity.base.base import BaseEntity, DatabaseIdEntity


class MixtapeAuditEntity(BaseEntity, DatabaseIdEntity):
    def __init__(self, session: Session, mixtape_audit: MixtapeAudit):
        super().__init__(session)
        self.mixtape_audit = mixtape_audit

    def get_database_id(self) -> int | None:
        return self.mixtape_audit.id

    def execute(self):
        self.session.add(self.mixtape_audit)
        self.session.flush()
