import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env.local'))
import sys
import pytest
import httpx
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from pprint import pprint

# Ensure the project root is in sys.path for 'api' imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from api.app_factory import create_app
from api.db_models import User, Mixtape, MixtapeAudit, MixtapeTrack, MixtapeAuditTrack

@pytest.fixture
def engine(postgresql):
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

@pytest.fixture(autouse=True)
def truncate_tables(engine):
    """Truncate all tables before each test"""
    with Session(engine) as session:
        session.query(MixtapeAuditTrack).delete()
        session.query(MixtapeTrack).delete()
        session.query(MixtapeAudit).delete()
        session.query(Mixtape).delete()
        session.query(User).delete()
        session.commit()

@pytest.fixture
def app(engine):
    db_url = str(engine.url)
    return create_app(db_url)

@pytest.fixture
def client(app):
    return TestClient(app)

# --- TESTS ---
def mixtape_payload(tracks):
    return {
        "name": "Test Mixtape",
        "intro_text": "Intro!",
        "is_public": True,
        "tracks": tracks
    }

def test_create_and_get_mixtape(client):
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:1"},
        {"track_position": 2, "track_text": "Second", "spotify_uri": "spotify:track:2"}
    ]
    # Create
    resp = client.post("/api/main/mixtape/", json=mixtape_payload(tracks))
    if resp.status_code != 201:
        print(f"Response status: {resp.status_code}")
        print(f"Response content: {resp.text}")
    assert resp.status_code == 201
    public_id = resp.json()["public_id"]
    # Get
    resp = client.get(f"/api/main/mixtape/{public_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Test Mixtape"
    assert data["is_public"] is True
    assert len(data["tracks"]) == 2
    assert data["tracks"][0]["track_position"] == 1
    assert data["tracks"][1]["track_position"] == 2

def test_edit_mixtape_add_remove_modify_tracks(client):
    # Create
    tracks = [
        {"track_position": 1, "track_text": "A", "spotify_uri": "spotify:track:1"},
        {"track_position": 2, "track_text": "B", "spotify_uri": "spotify:track:2"}
    ]
    resp = client.post("/api/main/mixtape/", json=mixtape_payload(tracks))
    public_id = resp.json()["public_id"]
    # Edit: remove track 2, add track 3, modify track 1
    new_tracks = [
        {"track_position": 1, "track_text": "A-modified", "spotify_uri": "spotify:track:1"},
        {"track_position": 3, "track_text": "C", "spotify_uri": "spotify:track:3"}
    ]
    resp = client.put(f"/api/main/mixtape/{public_id}", json=mixtape_payload(new_tracks))
    assert resp.status_code == 200
    version = resp.json()["version"]
    assert version == 2
    # Get and verify
    resp = client.get(f"/api/main/mixtape/{public_id}")
    data = resp.json()
    assert len(data["tracks"]) == 2
    assert {t["track_position"] for t in data["tracks"]} == {1, 3}
    assert any(t["track_text"] == "A-modified" for t in data["tracks"])
    assert any(t["track_text"] == "C" for t in data["tracks"])

def test_duplicate_track_position_rejected(client):
    tracks = [
        {"track_position": 1, "track_text": "A", "spotify_uri": "spotify:track:1"},
        {"track_position": 1, "track_text": "B", "spotify_uri": "spotify:track:2"}
    ]
    resp = client.post("/api/main/mixtape/", json=mixtape_payload(tracks))
    assert resp.status_code == 422 or resp.status_code == 400
    # Should not create mixtape with duplicate track positions

def test_get_nonexistent_mixtape(client):
    resp = client.get("/api/main/mixtape/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404 