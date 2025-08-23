from sqlmodel import Session
from backend.db_models.mixtape import MixtapeAuditTrack, MixtapeTrack
from backend.entity.base.base import BaseEntity


class MixtapeAuditTrackEntity(BaseEntity):
    def __init__(self, session: Session, mixtape_audit_track: MixtapeAuditTrack):
        super().__init__(session)
        self.mixtape_audit_track = mixtape_audit_track

    def execute(self):
        self.session.add(self.mixtape_audit_track)
        self.session.flush()