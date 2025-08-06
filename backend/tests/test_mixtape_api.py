from collections.abc import Generator

import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.engine import Engine
from sqlmodel import SQLModel, create_engine

from backend.app_factory import create_app
from backend.client.spotify.mock import get_mock_spotify_client
from backend.client.stack_auth import MockStackAuthBackend
from backend.routers import auth
from backend.routers import spotify as spotify_router
from backend.util import auth_middleware

# Import models to ensure they're registered with SQLModel metadata


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
def app(engine: Engine, auth_token_and_user):
    """Create FastAPI app with the test database and mock auth backend"""
    db_url = str(engine.url)
    app = create_app(db_url)
    mock_auth, token, fake_user = auth_token_and_user
    # Override auth backend for all routers
    app.dependency_overrides[auth.get_stack_auth_backend] = lambda: mock_auth
    app.dependency_overrides[auth_middleware.get_stack_auth_backend] = lambda: mock_auth
    # Override spotify client with mock
    app.dependency_overrides[spotify_router.get_spotify_client] = get_mock_spotify_client
    return app

@pytest.fixture
def client(app, auth_token_and_user) -> tuple[TestClient, str, dict]:
    """Create test client for the FastAPI app and provide token/user info"""
    return TestClient(app), auth_token_and_user[1], auth_token_and_user[2]

# --- TESTS ---
def mixtape_payload(tracks: list) -> dict:
    return {
        "name": "Test Mixtape",
        "intro_text": "Intro!",
        "subtitle1": "Subtitle 1",
        "subtitle2": "Subtitle 2",
        "subtitle3": "Subtitle 3",
        "is_public": True,
        "tracks": tracks
    }

def test_create_and_get_mixtape(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"},
        {"track_position": 2, "track_text": "Second", "spotify_uri": "spotify:track:track2"}
    ]
    # Create
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks), headers={"x-stack-access-token": token})
    assert_response_created(resp)
    public_id = resp.json()["public_id"]
    # Get
    resp = test_client.get(f"/api/mixtape/{public_id}", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert data["name"] == "Test Mixtape"
    assert data["subtitle1"] == "Subtitle 1"
    assert data["subtitle2"] == "Subtitle 2"
    assert data["subtitle3"] == "Subtitle 3"
    assert data["is_public"] is True
    assert len(data["tracks"]) == 2
    assert data["tracks"][0]["track_position"] == 1
    assert data["tracks"][1]["track_position"] == 2
    # Check TrackDetails present
    expected_names = ["Mock Song One", "Another Track"]
    for t, expected_name in zip(data["tracks"], expected_names, strict=False):
        assert "track" in t
        assert t["track"]["id"] == f"{t['track']['uri'].replace('spotify:track:', '')}"
        assert t["track"]["name"] == expected_name

def test_edit_mixtape_add_remove_modify_tracks(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    # Create
    tracks = [
        {"track_position": 1, "track_text": "A", "spotify_uri": "spotify:track:track1"},
        {"track_position": 2, "track_text": "B", "spotify_uri": "spotify:track:track2"}
    ]
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks), headers={"x-stack-access-token": token})
    assert_response_created(resp)
    public_id = resp.json()["public_id"]
    # Edit: remove track 2, add track 3, modify track 1
    new_tracks = [
        {"track_position": 1, "track_text": "A-modified", "spotify_uri": "spotify:track:track1"},
        {"track_position": 3, "track_text": "C", "spotify_uri": "spotify:track:track3"}
    ]
    resp = test_client.put(f"/api/mixtape/{public_id}", json=mixtape_payload(new_tracks), headers={"x-stack-access-token": token})
    assert_response_success(resp)
    version = resp.json()["version"]
    assert version == 2
    # Get and verify
    resp = test_client.get(f"/api/mixtape/{public_id}", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert len(data["tracks"]) == 2
    assert {t["track_position"] for t in data["tracks"]} == {1, 3}
    assert any(t["track_text"] == "A-modified" for t in data["tracks"])
    assert any(t["track_text"] == "C" for t in data["tracks"])
    for t in data["tracks"]:
        assert "track" in t
        assert t["track"]["id"] == f"{t['track']['uri'].replace('spotify:track:', '')}"

def test_duplicate_track_position_rejected(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    tracks = [
        {"track_position": 1, "track_text": "A", "spotify_uri": "spotify:track:track1"},
        {"track_position": 1, "track_text": "B", "spotify_uri": "spotify:track:track2"}
    ]
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks), headers={"x-stack-access-token": token})
    # Should not create mixtape with duplicate track positions
    assert resp.status_code in [422, 400], f"Expected 422 or 400, got {resp.status_code}. Response: {resp.text}"

def test_get_nonexistent_mixtape(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    resp = test_client.get("/api/mixtape/00000000-0000-0000-0000-000000000000", headers={"x-stack-access-token": token})
    assert_response_not_found(resp)

def test_list_my_mixtapes_pagination_and_search(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    # Create 5 mixtapes with varying names
    names = ["Mock Song One", "Another Track", "Third Song", "Fourth Track", "Fifth Track"]
    track_ids = ["track1", "track2", "track3", "track4", "track5"]
    public_ids = []
    for i, name in enumerate(names):
        resp = test_client.post(
            "/api/mixtape/",
            json={"name": name, "intro_text": "", "is_public": True, "tracks": [{"track_position": 1, "track_text": name, "spotify_uri": f"spotify:track:{track_ids[i]}"}]},
            headers={"x-stack-access-token": token},
        )
        assert_response_created(resp)
        public_ids.append(resp.json()["public_id"])
    # Test limit
    resp = test_client.get("/api/mixtape?limit=2", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert len(data) == 2
    # Test offset
    resp2 = test_client.get("/api/mixtape?limit=2&offset=2", headers={"x-stack-access-token": token})
    assert_response_success(resp2)
    data2 = resp2.json()
    assert len(data2) == 2
    # Test q (partial match, case-insensitive)
    resp3 = test_client.get("/api/mixtape?q=mock", headers={"x-stack-access-token": token})
    assert_response_success(resp3)
    data3 = resp3.json()
    # Should match 'Mock Song One'
    found_names = {d["name"].lower() for d in data3}
    assert "mock song one" in found_names
    # Test q with no matches
    resp4 = test_client.get("/api/mixtape?q=nomatch", headers={"x-stack-access-token": token})
    assert_response_success(resp4)
    data4 = resp4.json()
    assert data4 == []

def test_public_mixtape_viewable_by_unauthenticated_user(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    # Create public mixtape
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks), headers={"x-stack-access-token": token})
    assert_response_created(resp)
    public_id = resp.json()["public_id"]
    # Unauthenticated GET should succeed
    resp = test_client.get(f"/api/mixtape/{public_id}")
    assert_response_success(resp)
    # Make mixtape private
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"name": "Test Mixtape", "intro_text": "Intro!", "is_public": False, "tracks": tracks}, headers={"x-stack-access-token": token})
    assert_response_success(resp)
    # Unauthenticated GET should now fail (401)
    resp = test_client.get(f"/api/mixtape/{public_id}")
    assert resp.status_code == 401

def test_only_owner_can_edit_mixtape(client: tuple[TestClient, str, dict], app) -> None:
    test_client, token, user = client
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    # Create mixtape as user1
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks), headers={"x-stack-access-token": token})
    assert_response_created(resp)
    public_id = resp.json()["public_id"]
    # Register a second user
    mock_auth = app.dependency_overrides[auth.get_stack_auth_backend]()
    user2 = {"id": "user456", "email": "other@example.com", "name": "Other User"}
    token2 = mock_auth.register_user(user2)
    # Try to edit as user2
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"name": "Hacked", "intro_text": "Hacked!", "is_public": True, "tracks": tracks}, headers={"x-stack-access-token": token2})
    assert resp.status_code == 401
    # Try to edit as unauthenticated
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"name": "Hacked", "intro_text": "Hacked!", "is_public": True, "tracks": tracks})
    assert resp.status_code == 401

def test_create_anonymous_mixtape(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    # Create anonymous mixtape (no auth header)
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks))
    assert_response_created(resp)
    public_id = resp.json()["public_id"]
    # Verify it's viewable by anyone
    resp = test_client.get(f"/api/mixtape/{public_id}")
    assert_response_success(resp)
    data = resp.json()
    assert data["name"] == "Test Mixtape"
    assert data["is_public"] is True

def test_claim_anonymous_mixtape(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    # Create anonymous mixtape
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks))
    assert_response_created(resp)
    public_id = resp.json()["public_id"]
    # Claim it
    resp = test_client.post(f"/api/mixtape/{public_id}/claim", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    version = resp.json()["version"]
    assert version == 2
    # Verify it now appears in user's list
    resp = test_client.get("/api/mixtape", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert len(data) == 1
    assert data[0]["public_id"] == public_id

def test_cannot_claim_already_claimed_mixtape(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    # Create anonymous mixtape
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks))
    assert_response_created(resp)
    public_id = resp.json()["public_id"]
    # Claim it
    resp = test_client.post(f"/api/mixtape/{public_id}/claim", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    # Try to claim it again
    resp = test_client.post(f"/api/mixtape/{public_id}/claim", headers={"x-stack-access-token": token})
    assert resp.status_code == 400
    assert "already claimed" in resp.json()["detail"]

def test_edit_anonymous_mixtape(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    # Create anonymous mixtape
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks))
    assert_response_created(resp)
    public_id = resp.json()["public_id"]
    # Edit it without authentication (should work for anonymous mixtapes)
    new_tracks = [
        {"track_position": 1, "track_text": "Modified", "spotify_uri": "spotify:track:track1"},
        {"track_position": 2, "track_text": "New", "spotify_uri": "spotify:track:track2"}
    ]
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"name": "Modified Mixtape", "intro_text": "Modified!", "is_public": True, "tracks": new_tracks})
    assert_response_success(resp)
    version = resp.json()["version"]
    assert version == 2
    # Verify changes
    resp = test_client.get(f"/api/mixtape/{public_id}")
    assert_response_success(resp)
    data = resp.json()
    assert data["name"] == "Modified Mixtape"
    assert len(data["tracks"]) == 2

def test_anonymous_mixtapes_not_in_user_list(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    # Create anonymous mixtape
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks))
    assert_response_created(resp)
    # Verify it doesn't appear in user's list
    resp = test_client.get("/api/mixtape", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert len(data) == 0

def test_claim_then_edit_restricted(client: tuple[TestClient, str, dict], app) -> None:
    test_client, token, user = client
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    # Create anonymous mixtape
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks))
    assert_response_created(resp)
    public_id = resp.json()["public_id"]
    # Claim it
    resp = test_client.post(f"/api/mixtape/{public_id}/claim", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    # Register a second user
    mock_auth = app.dependency_overrides[auth.get_stack_auth_backend]()
    user2 = {"id": "user456", "email": "other@example.com", "name": "Other User"}
    token2 = mock_auth.register_user(user2)
    # Try to edit as user2 (should fail)
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"name": "Hacked", "intro_text": "Hacked!", "is_public": True, "tracks": tracks}, headers={"x-stack-access-token": token2})
    assert resp.status_code == 401
    # Try to edit as unauthenticated (should fail)
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"name": "Hacked", "intro_text": "Hacked!", "is_public": True, "tracks": tracks})
    assert resp.status_code == 401

def test_anonymous_mixtape_must_be_public(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    # Try to create anonymous private mixtape (should fail)
    payload = {
        "name": "Test Mixtape",
        "intro_text": "Intro!",
        "is_public": False,  # This should cause the error
        "tracks": tracks
    }
    resp = test_client.post("/api/mixtape", json=payload)
    assert resp.status_code == 400
    assert "Anonymous mixtapes must be public" in resp.json()["detail"]
    # Verify anonymous public mixtape still works
    payload["is_public"] = True
    resp = test_client.post("/api/mixtape", json=payload)
    assert_response_created(resp)

def test_anonymous_mixtape_cannot_be_made_private_via_put(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    # Create anonymous mixtape
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks))
    assert_response_created(resp)
    public_id = resp.json()["public_id"]
    # Try to make it private via PUT (should fail)
    payload = {
        "name": "Test Mixtape",
        "intro_text": "Intro!",
        "is_public": False,  # This should cause the error
        "tracks": tracks
    }
    resp = test_client.put(f"/api/mixtape/{public_id}", json=payload)
    assert resp.status_code == 400
    assert "Anonymous mixtapes must remain public" in resp.json()["detail"]
    # Verify making it public still works
    payload["is_public"] = True
    resp = test_client.put(f"/api/mixtape/{public_id}", json=payload)
    assert_response_success(resp)
