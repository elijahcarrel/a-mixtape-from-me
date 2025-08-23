from sqlmodel import Session
from backend.db_models.mixtape import Mixtape, MixtapeAudit, MixtapeAuditTrack, MixtapeTrack
from backend.entity.base.base import BaseEntity, DatabaseIdEntity, ReferenceField
from backend.entity.mixtape import MixtapeEntity
from backend.entity.mixtape_audit import MixtapeAuditEntity
from backend.entity.mixtape_track import MixtapeTrackEntity


class MixtapeOrchestratorEntity(BaseEntity):
    def __init__(self, session: Session, mixtape: Mixtape, tracks: list[MixtapeTrack]):
        super().__init__(session)

        mixtape_entity = MixtapeEntity(session, mixtape)
        self.add_dependency(mixtape_entity)

        mixtape_audit = mixtape.to_audit()
        mixtape_audit_entity = MixtapeAuditEntity(session, mixtape_audit)
        self.add_dependency(mixtape_audit_entity)
        mixtape_audit_entity.add_dependency(mixtape_entity)
        def mixtape_audit_setter(id: int)->None:
            mixtape_audit.mixtape_id = id
        mixtape_audit_entity.add_reference_field(ReferenceField(mixtape_entity, mixtape_audit_setter))

        for track in tracks:
            mixtape_track_entity = MixtapeTrackEntity(session, track)
            self.add_dependency(mixtape_track_entity)

            mixtape_track_entity.add_dependency(mixtape_entity)
            def mixtape_track_setter(id: int)->None:
                track.mixtape_id = id
            
            mixtape_track_entity.add_reference_field(ReferenceField(mixtape_entity, mixtape_track_setter))

            mixtape_audit_track = track.to_audit()
            mixtape_audit_track_entity = MixtapeAuditEntity(session, mixtape_audit_track)
            self.add_dependency(mixtape_audit_track_entity)
            mixtape_audit_track_entity.add_dependency(mixtape_audit)
            def mixtape_track_audit_setter(id: int)->None:
                mixtape_audit_track.mixtape_audit_id = id
            
            mixtape_audit_track_entity.add_reference_field(ReferenceField(mixtape_audit_entity, mixtape_track_audit_setter))



    def execute(self):
        # Nothing to do. Everything happens inside the dependencies.
        pass