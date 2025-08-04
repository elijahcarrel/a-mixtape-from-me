import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine
from sqlalchemy.pool import StaticPool
from backend.app_factory import create_app
from backend.database import get_session
from backend.client.spotify.mock import MockSpotifyClient
from backend.client.stack_auth.mock import MockStackAuthClient
import os

# Use an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

def get_test_session():
    with Session(engine) as session:
        yield session

@pytest.fixture
def test_client():
    app = create_app()
    app.dependency_overrides[get_session] = get_test_session
    app.state.get_db_dep = get_test_session
    app.state.spotify_client = MockSpotifyClient()
    app.state.stack_auth_client = MockStackAuthClient()
    return TestClient(app)

@pytest.fixture
def mock_spotify_client():
    return MockSpotifyClient()

@pytest.fixture
def mock_stack_auth_client():
    return MockStackAuthClient()

def test_create_mixtape_success(test_client, mock_spotify_client):
    """Test successful mixtape creation"""
    # Mock track data
    track_id = "test_track_id"
    mock_spotify_client.tracks[track_id] = {
        "id": track_id,
        "name": "Test Track",
        "artists": [{"name": "Test Artist"}],
        "album": {"name": "Test Album", "images": []},
        "uri": f"spotify:track:{track_id}"
    }
    
    mixtape_data = {
        "name": "Test Mixtape",
        "intro_text": "This is a test mixtape",
        "subtitle1": "Subtitle 1",
        "subtitle2": "Subtitle 2", 
        "subtitle3": "Subtitle 3",
        "is_public": True,
        "tracks": [
            {
                "track_position": 1,
                "track_text": "Test track description",
                "spotify_uri": f"spotify:track:{track_id}"
            }
        ]
    }
    
    response = test_client.post("/api/mixtape", json=mixtape_data)
    assert response.status_code == 201
    data = response.json()
    assert "public_id" in data

def test_create_mixtape_invalid_track(test_client):
    """Test mixtape creation with invalid track"""
    mixtape_data = {
        "name": "Test Mixtape",
        "intro_text": "This is a test mixtape",
        "subtitle1": "Subtitle 1",
        "subtitle2": "Subtitle 2",
        "subtitle3": "Subtitle 3",
        "is_public": True,
        "tracks": [
            {
                "track_position": 1,
                "track_text": "Test track description",
                "spotify_uri": "spotify:track:invalid_track_id"
            }
        ]
    }
    
    response = test_client.post("/api/mixtape", json=mixtape_data)
    assert response.status_code == 400

def test_create_mixtape_duplicate_track_positions(test_client, mock_spotify_client):
    """Test mixtape creation with duplicate track positions"""
    track_id = "test_track_id"
    mock_spotify_client.tracks[track_id] = {
        "id": track_id,
        "name": "Test Track",
        "artists": [{"name": "Test Artist"}],
        "album": {"name": "Test Album", "images": []},
        "uri": f"spotify:track:{track_id}"
    }
    
    mixtape_data = {
        "name": "Test Mixtape",
        "intro_text": "This is a test mixtape",
        "subtitle1": "Subtitle 1",
        "subtitle2": "Subtitle 2",
        "subtitle3": "Subtitle 3",
        "is_public": True,
        "tracks": [
            {
                "track_position": 1,
                "track_text": "Test track description",
                "spotify_uri": f"spotify:track:{track_id}"
            },
            {
                "track_position": 1,  # Duplicate position
                "track_text": "Another track description",
                "spotify_uri": f"spotify:track:{track_id}"
            }
        ]
    }
    
    response = test_client.post("/api/mixtape", json=mixtape_data)
    assert response.status_code == 422

def test_get_mixtape_success(test_client, mock_spotify_client):
    """Test successful mixtape retrieval"""
    # Create a mixtape first
    track_id = "test_track_id"
    mock_spotify_client.tracks[track_id] = {
        "id": track_id,
        "name": "Test Track",
        "artists": [{"name": "Test Artist"}],
        "album": {"name": "Test Album", "images": []},
        "uri": f"spotify:track:{track_id}"
    }
    
    mixtape_data = {
        "name": "Test Mixtape",
        "intro_text": "This is a test mixtape",
        "subtitle1": "Subtitle 1",
        "subtitle2": "Subtitle 2",
        "subtitle3": "Subtitle 3",
        "is_public": True,
        "tracks": [
            {
                "track_position": 1,
                "track_text": "Test track description",
                "spotify_uri": f"spotify:track:{track_id}"
            }
        ]
    }
    
    create_response = test_client.post("/api/mixtape", json=mixtape_data)
    assert create_response.status_code == 201
    public_id = create_response.json()["public_id"]
    
    # Retrieve the mixtape
    response = test_client.get(f"/api/mixtape/{public_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Mixtape"
    assert data["intro_text"] == "This is a test mixtape"
    assert data["subtitle1"] == "Subtitle 1"
    assert data["subtitle2"] == "Subtitle 2"
    assert data["subtitle3"] == "Subtitle 3"
    assert data["is_public"] == True
    assert len(data["tracks"]) == 1

def test_get_mixtape_not_found(test_client):
    """Test retrieving a non-existent mixtape"""
    response = test_client.get("/api/mixtape/non_existent_id")
    assert response.status_code == 404

def test_update_mixtape_success(test_client, mock_spotify_client):
    """Test successful mixtape update"""
    # Create a mixtape first
    track_id = "test_track_id"
    mock_spotify_client.tracks[track_id] = {
        "id": track_id,
        "name": "Test Track",
        "artists": [{"name": "Test Artist"}],
        "album": {"name": "Test Album", "images": []},
        "uri": f"spotify:track:{track_id}"
    }
    
    mixtape_data = {
        "name": "Test Mixtape",
        "intro_text": "This is a test mixtape",
        "subtitle1": "Subtitle 1",
        "subtitle2": "Subtitle 2",
        "subtitle3": "Subtitle 3",
        "is_public": True,
        "tracks": [
            {
                "track_position": 1,
                "track_text": "Test track description",
                "spotify_uri": f"spotify:track:{track_id}"
            }
        ]
    }
    
    create_response = test_client.post("/api/mixtape", json=mixtape_data)
    assert create_response.status_code == 201
    public_id = create_response.json()["public_id"]
    
    # Update the mixtape
    updated_data = {
        "name": "Updated Mixtape",
        "intro_text": "Updated intro text",
        "subtitle1": "Updated Subtitle 1",
        "subtitle2": "Updated Subtitle 2",
        "subtitle3": "Updated Subtitle 3",
        "is_public": False,
        "tracks": [
            {
                "track_position": 1,
                "track_text": "Updated track description",
                "spotify_uri": f"spotify:track:{track_id}"
            }
        ]
    }
    
    response = test_client.put(f"/api/mixtape/{public_id}", json=updated_data)
    assert response.status_code == 200
    data = response.json()
    assert "version" in data
    
    # Verify the update
    get_response = test_client.get(f"/api/mixtape/{public_id}")
    assert get_response.status_code == 200
    updated_mixtape = get_response.json()
    assert updated_mixtape["name"] == "Updated Mixtape"
    assert updated_mixtape["intro_text"] == "Updated intro text"
    assert updated_mixtape["subtitle1"] == "Updated Subtitle 1"
    assert updated_mixtape["subtitle2"] == "Updated Subtitle 2"
    assert updated_mixtape["subtitle3"] == "Updated Subtitle 3"
    assert updated_mixtape["is_public"] == False

def test_update_mixtape_not_found(test_client):
    """Test updating a non-existent mixtape"""
    updated_data = {
        "name": "Updated Mixtape",
        "intro_text": "Updated intro text",
        "subtitle1": "Updated Subtitle 1",
        "subtitle2": "Updated Subtitle 2",
        "subtitle3": "Updated Subtitle 3",
        "is_public": False,
        "tracks": []
    }
    
    response = test_client.put("/api/mixtape/non_existent_id", json=updated_data)
    assert response.status_code == 404

def test_claim_mixtape_success(test_client, mock_spotify_client):
    """Test successful mixtape claiming"""
    # Create an anonymous mixtape
    track_id = "test_track_id"
    mock_spotify_client.tracks[track_id] = {
        "id": track_id,
        "name": "Test Track",
        "artists": [{"name": "Test Artist"}],
        "album": {"name": "Test Album", "images": []},
        "uri": f"spotify:track:{track_id}"
    }
    
    mixtape_data = {
        "name": "Anonymous Mixtape",
        "intro_text": "This is an anonymous mixtape",
        "subtitle1": "Subtitle 1",
        "subtitle2": "Subtitle 2",
        "subtitle3": "Subtitle 3",
        "is_public": True,
        "tracks": [
            {
                "track_position": 1,
                "track_text": "Test track description",
                "spotify_uri": f"spotify:track:{track_id}"
            }
        ]
    }
    
    create_response = test_client.post("/api/mixtape", json=mixtape_data)
    assert create_response.status_code == 201
    public_id = create_response.json()["public_id"]
    
    # Mock authentication
    test_client.app.state.stack_auth_client.user_info = {"user_id": "test_user_id"}
    
    # Claim the mixtape
    response = test_client.post(f"/api/mixtape/{public_id}/claim")
    assert response.status_code == 200
    data = response.json()
    assert "version" in data
    
    # Verify the mixtape is now claimed
    get_response = test_client.get(f"/api/mixtape/{public_id}")
    assert get_response.status_code == 200
    claimed_mixtape = get_response.json()
    assert claimed_mixtape["stack_auth_user_id"] == "test_user_id"

def test_claim_mixtape_not_found(test_client):
    """Test claiming a non-existent mixtape"""
    # Mock authentication
    test_client.app.state.stack_auth_client.user_info = {"user_id": "test_user_id"}
    
    response = test_client.post("/api/mixtape/non_existent_id/claim")
    assert response.status_code == 404

def test_claim_mixtape_already_claimed(test_client, mock_spotify_client):
    """Test claiming an already claimed mixtape"""
    # Create a claimed mixtape
    track_id = "test_track_id"
    mock_spotify_client.tracks[track_id] = {
        "id": track_id,
        "name": "Test Track",
        "artists": [{"name": "Test Artist"}],
        "album": {"name": "Test Album", "images": []},
        "uri": f"spotify:track:{track_id}"
    }
    
    mixtape_data = {
        "name": "Claimed Mixtape",
        "intro_text": "This is a claimed mixtape",
        "subtitle1": "Subtitle 1",
        "subtitle2": "Subtitle 2",
        "subtitle3": "Subtitle 3",
        "is_public": True,
        "tracks": [
            {
                "track_position": 1,
                "track_text": "Test track description",
                "spotify_uri": f"spotify:track:{track_id}"
            }
        ]
    }
    
    # Mock authentication for creation
    test_client.app.state.stack_auth_client.user_info = {"user_id": "user1"}
    
    create_response = test_client.post("/api/mixtape", json=mixtape_data)
    assert create_response.status_code == 201
    public_id = create_response.json()["public_id"]
    
    # Try to claim with different user
    test_client.app.state.stack_auth_client.user_info = {"user_id": "user2"}
    response = test_client.post(f"/api/mixtape/{public_id}/claim")
    assert response.status_code == 400

def test_list_my_mixtapes_success(test_client, mock_spotify_client):
    """Test successful listing of user's mixtapes"""
    # Create multiple mixtapes
    track_id = "test_track_id"
    mock_spotify_client.tracks[track_id] = {
        "id": track_id,
        "name": "Test Track",
        "artists": [{"name": "Test Artist"}],
        "album": {"name": "Test Album", "images": []},
        "uri": f"spotify:track:{track_id}"
    }
    
    # Mock authentication
    test_client.app.state.stack_auth_client.user_info = {"user_id": "test_user_id"}
    
    # Create first mixtape
    mixtape_data1 = {
        "name": "First Mixtape",
        "intro_text": "First mixtape intro",
        "subtitle1": "Subtitle 1",
        "subtitle2": "Subtitle 2",
        "subtitle3": "Subtitle 3",
        "is_public": True,
        "tracks": [
            {
                "track_position": 1,
                "track_text": "Test track description",
                "spotify_uri": f"spotify:track:{track_id}"
            }
        ]
    }
    
    create_response1 = test_client.post("/api/mixtape", json=mixtape_data1)
    assert create_response1.status_code == 201
    
    # Create second mixtape
    mixtape_data2 = {
        "name": "Second Mixtape",
        "intro_text": "Second mixtape intro",
        "subtitle1": "Subtitle 1",
        "subtitle2": "Subtitle 2",
        "subtitle3": "Subtitle 3",
        "is_public": False,
        "tracks": [
            {
                "track_position": 1,
                "track_text": "Test track description",
                "spotify_uri": f"spotify:track:{track_id}"
            }
        ]
    }
    
    create_response2 = test_client.post("/api/mixtape", json=mixtape_data2)
    assert create_response2.status_code == 201
    
    # List mixtapes
    response = test_client.get("/api/mixtape")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert any(m["name"] == "First Mixtape" for m in data)
    assert any(m["name"] == "Second Mixtape" for m in data)

def test_list_my_mixtapes_with_search(test_client, mock_spotify_client):
    """Test listing mixtapes with search parameter"""
    track_id = "test_track_id"
    mock_spotify_client.tracks[track_id] = {
        "id": track_id,
        "name": "Test Track",
        "artists": [{"name": "Test Artist"}],
        "album": {"name": "Test Album", "images": []},
        "uri": f"spotify:track:{track_id}"
    }
    
    # Mock authentication
    test_client.app.state.stack_auth_client.user_info = {"user_id": "test_user_id"}
    
    # Create mixtapes with different names
    mixtape_data1 = {
        "name": "Rock Mixtape",
        "intro_text": "Rock music",
        "subtitle1": "Subtitle 1",
        "subtitle2": "Subtitle 2",
        "subtitle3": "Subtitle 3",
        "is_public": True,
        "tracks": [
            {
                "track_position": 1,
                "track_text": "Test track description",
                "spotify_uri": f"spotify:track:{track_id}"
            }
        ]
    }
    
    mixtape_data2 = {
        "name": "Jazz Mixtape",
        "intro_text": "Jazz music",
        "subtitle1": "Subtitle 1",
        "subtitle2": "Subtitle 2",
        "subtitle3": "Subtitle 3",
        "is_public": True,
        "tracks": [
            {
                "track_position": 1,
                "track_text": "Test track description",
                "spotify_uri": f"spotify:track:{track_id}"
            }
        ]
    }
    
    test_client.post("/api/mixtape", json=mixtape_data1)
    test_client.post("/api/mixtape", json=mixtape_data2)
    
    # Search for "Rock"
    response = test_client.get("/api/mixtape?q=Rock")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Rock Mixtape"

def test_private_mixtape_access_control(test_client, mock_spotify_client):
    """Test access control for private mixtapes"""
    track_id = "test_track_id"
    mock_spotify_client.tracks[track_id] = {
        "id": track_id,
        "name": "Test Track",
        "artists": [{"name": "Test Artist"}],
        "album": {"name": "Test Album", "images": []},
        "uri": f"spotify:track:{track_id}"
    }
    
    # Create private mixtape
    mixtape_data = {
        "name": "Private Mixtape",
        "intro_text": "Private mixtape",
        "subtitle1": "Subtitle 1",
        "subtitle2": "Subtitle 2",
        "subtitle3": "Subtitle 3",
        "is_public": False,
        "tracks": [
            {
                "track_position": 1,
                "track_text": "Test track description",
                "spotify_uri": f"spotify:track:{track_id}"
            }
        ]
    }
    
    # Mock authentication for creation
    test_client.app.state.stack_auth_client.user_info = {"user_id": "owner_id"}
    
    create_response = test_client.post("/api/mixtape", json=mixtape_data)
    assert create_response.status_code == 201
    public_id = create_response.json()["public_id"]
    
    # Try to access without authentication
    test_client.app.state.stack_auth_client.user_info = None
    response = test_client.get(f"/api/mixtape/{public_id}")
    assert response.status_code == 401
    
    # Try to access with different user
    test_client.app.state.stack_auth_client.user_info = {"user_id": "other_user_id"}
    response = test_client.get(f"/api/mixtape/{public_id}")
    assert response.status_code == 401
    
    # Access with owner
    test_client.app.state.stack_auth_client.user_info = {"user_id": "owner_id"}
    response = test_client.get(f"/api/mixtape/{public_id}")
    assert response.status_code == 200

def test_anonymous_mixtape_must_be_public(test_client):
    """Test that anonymous mixtapes must be public"""
    mixtape_data = {
        "name": "Anonymous Mixtape",
        "intro_text": "Anonymous mixtape",
        "subtitle1": "Subtitle 1",
        "subtitle2": "Subtitle 2",
        "subtitle3": "Subtitle 3",
        "is_public": False,  # This should fail
        "tracks": []
    }
    
    # No authentication
    test_client.app.state.stack_auth_client.user_info = None
    
    response = test_client.post("/api/mixtape", json=mixtape_data)
    assert response.status_code == 400

def test_subtitle_validation(test_client, mock_spotify_client):
    """Test subtitle field validation"""
    track_id = "test_track_id"
    mock_spotify_client.tracks[track_id] = {
        "id": track_id,
        "name": "Test Track",
        "artists": [{"name": "Test Artist"}],
        "album": {"name": "Test Album", "images": []},
        "uri": f"spotify:track:{track_id}"
    }
    
    # Test with newlines in subtitles (should be stripped)
    mixtape_data = {
        "name": "Test Mixtape",
        "intro_text": "Test intro",
        "subtitle1": "Subtitle\nwith\nnewlines",
        "subtitle2": "Subtitle\r\nwith\r\nnewlines",
        "subtitle3": "Subtitle\rwith\rnewlines",
        "is_public": True,
        "tracks": [
            {
                "track_position": 1,
                "track_text": "Test track description",
                "spotify_uri": f"spotify:track:{track_id}"
            }
        ]
    }
    
    response = test_client.post("/api/mixtape", json=mixtape_data)
    assert response.status_code == 201
    
    # Verify newlines were stripped
    public_id = response.json()["public_id"]
    get_response = test_client.get(f"/api/mixtape/{public_id}")
    assert get_response.status_code == 200
    data = get_response.json()
    assert data["subtitle1"] == "Subtitlewithnewlines"
    assert data["subtitle2"] == "Subtitlewithnewlines"
    assert data["subtitle3"] == "Subtitlewithnewlines"

def test_subtitle_length_validation(test_client, mock_spotify_client):
    """Test subtitle field length validation"""
    track_id = "test_track_id"
    mock_spotify_client.tracks[track_id] = {
        "id": track_id,
        "name": "Test Track",
        "artists": [{"name": "Test Artist"}],
        "album": {"name": "Test Album", "images": []},
        "uri": f"spotify:track:{track_id}"
    }
    
    # Test with subtitle longer than 60 characters
    long_subtitle = "A" * 61
    mixtape_data = {
        "name": "Test Mixtape",
        "intro_text": "Test intro",
        "subtitle1": long_subtitle,
        "subtitle2": "Normal subtitle",
        "subtitle3": "Normal subtitle",
        "is_public": True,
        "tracks": [
            {
                "track_position": 1,
                "track_text": "Test track description",
                "spotify_uri": f"spotify:track:{track_id}"
            }
        ]
    }
    
    response = test_client.post("/api/mixtape", json=mixtape_data)
    assert response.status_code == 422  # Validation error 