from sqlmodel import Session
from backend.db_models.mixtape import MixtapeTrack, MixtapeTrack
from backend.entity.base.base import BaseEntity


class MixtapeTrackEntity(BaseEntity):
    def __init__(self, session: Session, mixtape_track: MixtapeTrack):
        super().__init__(session)
        self.mixtape_track = mixtape_track

    def execute(self):
        self.session.add(self.mixtape_track)