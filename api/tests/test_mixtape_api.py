import os
from typing import Generator
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env.local'))
import sys
import pytest
import httpx
from fastapi.testclient import TestClient
from sqlmodel import MetaData, Session, SQLModel, create_engine, delete
from sqlalchemy.engine import Engine

# Ensure the project root is in sys.path for 'api' imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from api.app_factory import create_app

# Utility functions for better test assertions
def assert_response_success(response: httpx.Response, expected_status: int = 200) -> None:
    """Assert that a response was successful with detailed error information"""
    if response.status_code != expected_status:
        error_detail = f"Expected status {expected_status}, got {response.status_code}"
        if response.text:
            try:
                error_json = response.json()
                if "detail" in error_json:
                    error_detail += f"\nError detail: {error_json['detail']}"
                else:
                    error_detail += f"\nResponse body: {response.text}"
            except:
                error_detail += f"\nResponse body: {response.text}"
        
        # Create a custom exception that will show the calling line
        import traceback
        # Get the caller's frame (skip this function and the wrapper function)
        caller_frame = traceback.extract_stack()[-3]  # -3 to skip this function and the wrapper
        error_detail += f"\n\nCalled from: {caller_frame.filename}:{caller_frame.lineno} in {caller_frame.name}"
        error_detail += f"\nLine: {caller_frame.line}"
        
        raise AssertionError(error_detail)

def assert_response_created(response: httpx.Response) -> None:
    """Assert that a response indicates successful creation (201)"""
    assert_response_success(response, 201)

def assert_response_not_found(response: httpx.Response) -> None:
    """Assert that a response indicates not found (404)"""
    assert_response_success(response, 404)

def assert_response_bad_request(response: httpx.Response) -> None:
    """Assert that a response indicates bad request (400)"""
    assert_response_success(response, 400)

def assert_response_validation_error(response: httpx.Response) -> None:
    """Assert that a response indicates validation error (422)"""
    assert_response_success(response, 422)

@pytest.fixture
def engine(postgresql) -> Generator[Engine, None, None]:
    """Create SQLAlchemy engine from pytest-postgresql fixture"""
    # Build SQLAlchemy URL directly from postgresql attributes
    if postgresql.info.password:
        db_url = f"postgresql+psycopg://{postgresql.info.user}:{postgresql.info.password}@{postgresql.info.host}:{postgresql.info.port}/{postgresql.info.dbname}"
    else:
        db_url = f"postgresql+psycopg://{postgresql.info.user}@{postgresql.info.host}:{postgresql.info.port}/{postgresql.info.dbname}"
    
    engine = create_engine(db_url)
    # Create tables in this test database
    SQLModel.metadata.create_all(engine)
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
def app(engine: Engine):
    """Create FastAPI app with the test database"""
    db_url = str(engine.url)
    return create_app(db_url)

@pytest.fixture
def client(app) -> TestClient:
    """Create test client for the FastAPI app"""
    return TestClient(app)

# --- TESTS ---
def mixtape_payload(tracks: list) -> dict:
    return {
        "name": "Test Mixtape",
        "intro_text": "Intro!",
        "is_public": True,
        "tracks": tracks
    }

def test_create_and_get_mixtape(client: TestClient) -> None:
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:1"},
        {"track_position": 2, "track_text": "Second", "spotify_uri": "spotify:track:2"}
    ]
    # Create
    resp = client.post("/api/main/mixtape/", json=mixtape_payload(tracks))
    assert_response_created(resp)
    public_id = resp.json()["public_id"]
    # Get
    resp = client.get(f"/api/main/mixtape/{public_id}")
    assert_response_success(resp)
    data = resp.json()
    assert data["name"] == "Test Mixtape"
    assert data["is_public"] is True
    assert len(data["tracks"]) == 2
    assert data["tracks"][0]["track_position"] == 1
    assert data["tracks"][1]["track_position"] == 2

def test_edit_mixtape_add_remove_modify_tracks(client: TestClient) -> None:
    # Create
    tracks = [
        {"track_position": 1, "track_text": "A", "spotify_uri": "spotify:track:1"},
        {"track_position": 2, "track_text": "B", "spotify_uri": "spotify:track:2"}
    ]
    resp = client.post("/api/main/mixtape/", json=mixtape_payload(tracks))
    assert_response_created(resp)
    public_id = resp.json()["public_id"]
    # Edit: remove track 2, add track 3, modify track 1
    new_tracks = [
        {"track_position": 1, "track_text": "A-modified", "spotify_uri": "spotify:track:1"},
        {"track_position": 3, "track_text": "C", "spotify_uri": "spotify:track:3"}
    ]
    resp = client.put(f"/api/main/mixtape/{public_id}", json=mixtape_payload(new_tracks))
    assert_response_success(resp)
    version = resp.json()["version"]
    assert version == 2
    # Get and verify
    resp = client.get(f"/api/main/mixtape/{public_id}")
    assert_response_success(resp)
    data = resp.json()
    assert len(data["tracks"]) == 2
    assert {t["track_position"] for t in data["tracks"]} == {1, 3}
    assert any(t["track_text"] == "A-modified" for t in data["tracks"])
    assert any(t["track_text"] == "C" for t in data["tracks"])

def test_duplicate_track_position_rejected(client: TestClient) -> None:
    tracks = [
        {"track_position": 1, "track_text": "A", "spotify_uri": "spotify:track:1"},
        {"track_position": 1, "track_text": "B", "spotify_uri": "spotify:track:2"}
    ]
    resp = client.post("/api/main/mixtape/", json=mixtape_payload(tracks))
    # Should not create mixtape with duplicate track positions
    assert resp.status_code in [422, 400], f"Expected 422 or 400, got {resp.status_code}. Response: {resp.text}"

def test_get_nonexistent_mixtape(client: TestClient) -> None:
    resp = client.get("/api/main/mixtape/00000000-0000-0000-0000-000000000000")
    assert_response_not_found(resp) 