from abc import ABC, abstractmethod
from enum import Enum
from typing import Callable
from sqlmodel import Session
from uuid import uuid4, UUID
import threading

class EntityState(Enum):
    NOT_VALIDATED = "NOT_VALIDATED"
    VALIDATED = "VALIDATED"
    PROCESSING = "PROCESSING"
    EXECUTED = "EXECUTED"

class Entity(ABC):
    @abstractmethod
    def execute(self, session: Session) -> None:
        """
        Execute performs the database operation for this entity.
        """
        pass

    @abstractmethod
    def get_dependencies(self) -> list["Entity"]:
        """
        Returns a list of entities that this entity depends on.
        These entities must be executed before this entity.
        """
        pass

    @abstractmethod
    def get_uuid(self) -> UUID:
        """
        Returns the uuid of this entity.
        """
        pass

    @abstractmethod
    def get_state(self) -> EntityState:
        """
        Returns the state of this entity.
        """
        pass

    @abstractmethod
    def set_state(self, state: EntityState) -> None:
        """
        Sets the state of this entity.
        """
        pass

class DatabaseIdEntity(Entity):
    @abstractmethod
    def get_database_id(self) -> int:
        """
        Returns the database id of this entity.
        """
        pass

class ReferenceField:
    def __init__(self, entity: DatabaseIdEntity, setter: Callable[[int], None]):
        self.entity = entity
        self.setter = setter

class BaseEntity(Entity):
    def __init__(self, session: Session):
        self.uuid = uuid4()
        self.session = session
        self.dependencies: list["Entity"] = []
        self.reference_fields: list[ReferenceField] = []
        self.state: EntityState = EntityState.NOT_VALIDATED

    def get_dependencies(self) -> list["Entity"]:
        """
        Returns a list of dependencies that this entity depends on.
        """
        return self.dependencies

    def add_dependency(self, dependency: "Entity") -> None:
        self.dependencies.append(dependency)

    def get_reference_fields(self) -> list[ReferenceField]:
        """
        Returns a list of reference fields from dependent entities that this entity will use.
        """
        return self.reference_fields

    def add_reference_field(self, reference_field: ReferenceField) -> None:
        self.reference_fields.append(reference_field)

    def get_state(self) -> EntityState:
        return self.state

    def set_state(self, state: EntityState) -> None:
        self.state = state

    def get_uuid(self) -> UUID:
        return self.uuid

    # TODO: is this the cleanest way to do this?
    def execute() -> None:
        raise ValueError("Needs to be implemented by the descendant class")

# --- TESTING CONCURRENCY SUPPORT ---
# These globals are used ONLY during tests to deterministically pause execution
# in the middle of an update/claim operation while holding a row-level lock.
# They have *no effect* in normal operation because _TEST_PAUSE_ENABLED is False
# by default and production code never toggles it.
_TEST_PAUSE_ENABLED: bool = False
_TEST_PAUSE_EVENT: threading.Event | None = None

def _maybe_pause_for_tests() -> None:
    """Block execution if the test pause flag/event is enabled.

    This allows tests to hold the row-level lock acquired by SELECT FOR UPDATE
    while another concurrent request attempts to obtain the lock. In production
    the function is a no-op.
    """
    global _TEST_PAUSE_ENABLED, _TEST_PAUSE_EVENT
    if _TEST_PAUSE_ENABLED and _TEST_PAUSE_EVENT is not None:
        # Wait until the event is set by the test to resume execution.
        _TEST_PAUSE_EVENT.wait()


class Executor:
    def __init__(self, session: Session):
        self.session = session
        self.entities: list[Entity] = []

    def has_entity(self, entity: Entity) -> bool:
        return entity.get_uuid() in [e.get_uuid() for e in self.entities]

    def add_entity(self, entity: Entity) -> None:
        if entity.get_state() == EntityState.VALIDATED:
            if not(self.has_entity(entity)):
                self.entities.append(entity)
            return
        if entity.get_state() == EntityState.PROCESSING:
            raise ValueError(f"Circular dependency detected on entity with uuid: {str(entity.get_uuid())}")
        if entity.get_state() == EntityState.EXECUTED:
            raise ValueError(f"Entity with uuid: {str(entity.get_uuid())} is already finished")

        entity.set_state(EntityState.PROCESSING)
        if entity.get_state() != EntityState.PROCESSING:
            raise ValueError(f"set_state on entity with uuid: {str(entity.get_uuid())} failed to move it to the processing state")
        
        for dependency in entity.get_dependencies():
            self.add_entity(dependency)

        self.entities.append(entity)
        entity.set_state(EntityState.VALIDATED)
        if entity.get_state() != EntityState.VALIDATED:
            raise ValueError(f"set_state on entity with uuid: {str(entity.get_uuid())} failed to move it to the validated state")

    def execute_all(self, entities: list[Entity]) -> None:
        # Pause after all modifications but *before* releasing the lock to allow
        # test cases to control concurrency ordering deterministically.
        _maybe_pause_for_tests()

        for entity in entities:
            reference_fields = entity.get_reference_fields()
            for reference_field in reference_fields:
                if reference_field.entity.get_state() != EntityState.EXECUTED:
                    raise ValueError(f"Error during execution of entity {str(entity.get_uuid())}: reference field entity with uuid: {str(reference_field.entity.get_uuid())} has not already been executed")
                id = reference_field.entity.get_database_id()
                if id is None:
                    raise ValueError(f"Error during execution of entity {str(entity.get_uuid())}: reference field entity with uuid: {str(reference_field.entity.get_uuid())} has no database id")
                reference_field.setter(id)

            entity.execute(self.session)
            entity.set_state(EntityState.EXECUTED)
            if entity.get_state() != EntityState.EXECUTED:
                raise ValueError(f"set_state on entity with uuid: {str(entity.get_uuid())} failed to move it to the executed state")