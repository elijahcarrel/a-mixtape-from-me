from sqlmodel import Session
from backend.db_models.mixtape import Mixtape, MixtapeAudit, MixtapeAuditTrack, MixtapeTrack
from backend.entity.base.base import BaseEntity, DatabaseIdEntity, ReferenceField
from backend.entity.mixtape import MixtapeEntity
from backend.entity.mixtape_audit import MixtapeAuditEntity
from backend.entity.mixtape_audit_track import MixtapeAuditTrackEntity
from backend.entity.mixtape_track import MixtapeTrackEntity
from datetime import datetime, UTC


class MixtapeOrchestratorEntity(BaseEntity):
    session: Session
    mixtape_entity: MixtapeEntity
    mixtape_audit_entity: MixtapeAuditEntity
    track_position_to_mixtape_track_entity: dict[int, MixtapeTrackEntity]
    track_position_to_mixtape_audit_track_entities: dict[int, MixtapeAuditTrackEntity]

    def __init__(self, session: Session, mixtape: Mixtape):
        super().__init__(session)

        now = datetime.now(UTC)
        mixtape.last_modified_time = now

        print(f"Creating MixtapeEntity from mixtape {str(mixtape)}")
        self.mixtape_entity = MixtapeEntity(session, mixtape)
        print(f"Created MixtapeEntity {self.mixtape_entity}")
        self.add_dependency(self.mixtape_entity)

        mixtape_audit = mixtape.to_audit()
        mixtape_audit.version += 1

        self.mixtape_audit_entity = MixtapeAuditEntity(session, mixtape_audit)
        print(f"Created MixtapeAuditEntity {self.mixtape_audit_entity}")
        self.add_dependency(self.mixtape_audit_entity)
        self.mixtape_audit_entity.add_dependency(self.mixtape_entity)
        def mixtape_audit_setter(id: int)->None:
            mixtape_audit.mixtape_id = id
        self.mixtape_audit_entity.add_reference_field(ReferenceField(self.mixtape_entity, mixtape_audit_setter))

    def set_tracks(self, tracks: list[MixtapeTrack]):
        self.track_position_to_mixtape_track_entity = {}
        self.track_position_to_mixtape_audit_track_entities = {}
        self.add_tracks(tracks)

    def add_tracks(self, tracks: list[MixtapeTrack]):
        for track in tracks:
            self.add_track(track)

    def add_track(self, track: MixtapeTrack):
        mixtape_track_entity = MixtapeTrackEntity(self.session, track)
        print(f"Created MixtapeTrackEntity {mixtape_track_entity}")
        self.add_dependency(mixtape_track_entity)
        self.track_position_to_mixtape_track_entity[track.track_position] = mixtape_track_entity

        mixtape_track_entity.add_dependency(self.mixtape_entity)
        def mixtape_track_setter(id: int)->None:
            track.mixtape_id = id
        
        mixtape_track_entity.add_reference_field(ReferenceField(self.mixtape_entity, mixtape_track_setter))

        mixtape_audit_track = track.to_audit()
        mixtape_audit_track_entity = MixtapeAuditTrackEntity(self.session, mixtape_audit_track)
        print(f"Created MixtapeAuditTrackEntity {mixtape_audit_track_entity}")
        self.add_dependency(mixtape_audit_track_entity)
        self.track_position_to_mixtape_audit_track_entities[track.track_position] = mixtape_audit_track_entity
        mixtape_audit_track_entity.add_dependency(self.mixtape_audit_entity)
        def mixtape_track_audit_setter(id: int)->None:
            mixtape_audit_track.mixtape_audit_id = id
        
        mixtape_audit_track_entity.add_reference_field(ReferenceField(self.mixtape_audit_entity, mixtape_track_audit_setter))

    def set_stack_auth_user_id(self, stack_auth_user_id: str | None)->None:
        self.mixtape_entity.mixtape.stack_auth_user_id = stack_auth_user_id
        self.mixtape_audit_entity.mixtape.stack_auth_user_id = stack_auth_user_id

    def set_public_id(self, public_id: str)->None:
        self.mixtape_entity.mixtape.public_id = public_id
        self.mixtape_audit_entity.mixtape.public_id = public_id

    def set_name(self, name: str)->None:
        self.mixtape_entity.mixtape.name = name
        self.mixtape_audit_entity.mixtape.name = name

    def set_intro_text(self, intro_text: str | None)->None:
        self.mixtape_entity.mixtape.intro_text = intro_text
        self.mixtape_audit_entity.mixtape.intro_text = intro_text

    def set_subtitle1(self, subtitle1: str | None)->None:
        self.mixtape_entity.mixtape.subtitle1 = subtitle1
        self.mixtape_audit_entity.mixtape.subtitle1 = subtitle1

    def set_subtitle2(self, subtitle2: str | None)->None:
        self.mixtape_entity.mixtape.subtitle2 = subtitle2
        self.mixtape_audit_entity.mixtape.subtitle2 = subtitle2

    def set_subtitle3(self, subtitle3: str | None)->None:
        self.mixtape_entity.mixtape.subtitle3 = subtitle3
        self.mixtape_audit_entity.mixtape.subtitle3 = subtitle3

    def set_is_public(self, is_public: bool)->None:
        self.mixtape_entity.mixtape.is_public = is_public
        self.mixtape_audit_entity.mixtape.is_public = is_public

    def execute(self):
        # Nothing to do. Everything happens inside the dependencies.
        print(f"executing the orchestrator. here are my dependencies: {self.get_dependencies()}")
        pass