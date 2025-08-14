from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.engine import Engine
from sqlmodel import SQLModel, create_engine

from backend.app_factory import create_app
from backend.client.spotify import MockSpotifyClient
from backend.client.stack_auth import MockStackAuthBackend, get_stack_auth_backend
from backend.routers import spotify


@pytest.fixture
def engine(postgresql) -> Generator[Engine, None, None]:
    """Create SQLAlchemy engine from pytest-postgresql fixture"""
    # Build SQLAlchemy URL directly from postgresql attributes
    if postgresql.info.password:
        db_url = f"postgresql+psycopg://{postgresql.info.user}:{postgresql.info.password}@{postgresql.info.host}:{postgresql.info.port}/{postgresql.info.dbname}"
    else:
        db_url = f"postgresql+psycopg://{postgresql.info.user}@{postgresql.info.host}:{postgresql.info.port}/{postgresql.info.dbname}"

    engine = create_engine(db_url)

    # Import models to ensure they're registered with SQLModel metadata

    # Create tables in this test database
    print(f"Creating tables in database: {db_url}")
    SQLModel.metadata.create_all(engine)
    print("Tables created successfully")
    yield engine
    # No need to drop tables; the database will be destroyed after the test

# @pytest.fixture(autouse=True)
# def truncate_tables(engine: Engine) -> None:
#     """Truncate all tables before each test"""
#     with Session(engine) as session:
#         meta = MetaData()
#         connection = engine.connect()
#         transaction = connection.begin()
#         for table in meta.sorted_tables:
#             connection.execute(table.delete())
#         transaction.commit()

@pytest.fixture
def auth_token_and_user():
    mock_auth = MockStackAuthBackend()
    fake_user = {"id": "user123", "email": "test@example.com", "name": "Test User"}
    token = mock_auth.register_user(fake_user)
    return mock_auth, token, fake_user

@pytest.fixture
def app(engine: Engine, auth_token_and_user: tuple[str, str, dict]):
    """Create FastAPI app with the test database and mock auth backend"""
    db_url = str(engine.url)
    app = create_app(db_url)
    mock_auth, _, _ = auth_token_and_user
    # Override auth backend for all routers
    app.dependency_overrides[get_stack_auth_backend] = lambda: mock_auth
    # Override spotify client with mock
    mock_spotify = MockSpotifyClient()
    app.dependency_overrides[spotify.get_spotify_client] = lambda: mock_spotify
    return app

@pytest.fixture
def client(app, auth_token_and_user: tuple[str, str, dict]) -> tuple[TestClient, str, dict]:
    """Create test client for the FastAPI app and provide token/user info"""
    _, token, fake_user = auth_token_and_user
    return TestClient(app), token, fake_user
