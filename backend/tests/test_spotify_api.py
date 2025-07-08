import pytest
from fastapi.testclient import TestClient
from backend.app_factory import create_app
from backend.client.spotify import MockSpotifyClient
from backend.routers import spotify
from backend.routers import auth
from backend.util import auth_middleware

@pytest.fixture
def client():
    app = create_app()
    # Set up mock auth
    from backend.client.stack_auth import MockStackAuthBackend
    mock_auth = MockStackAuthBackend()
    fake_user = {"id": "user123", "email": "test@example.com", "name": "Test User"}
    token = mock_auth.register_user(fake_user)
    app.dependency_overrides[auth.get_stack_auth_backend] = lambda: mock_auth
    app.dependency_overrides[auth_middleware.get_stack_auth_backend] = lambda: mock_auth
    # Set up mock spotify
    mock_spotify = MockSpotifyClient()
    app.dependency_overrides[spotify.get_spotify_client] = lambda: mock_spotify
    return TestClient(app), token, mock_spotify

def test_search_tracks(client):
    test_client, token, mock_spotify = client
    resp = test_client.get("/api/main/spotify/search?query=Mock", headers={"x-stack-access-token": token})
    assert resp.status_code == 200
    data = resp.json()
    assert "tracks" in data
    assert "items" in data["tracks"]
    # Should match at least one track with 'Mock' in the name
    assert any("Mock" in t["name"] for t in data["tracks"]["items"])

def test_get_track(client):
    test_client, token, mock_spotify = client
    track_id = mock_spotify.tracks[0]["id"]
    resp = test_client.get(f"/api/main/spotify/track/{track_id}", headers={"x-stack-access-token": token})
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == track_id
    assert "name" in data

def test_get_track_not_found(client):
    test_client, token, _ = client
    resp = test_client.get("/api/main/spotify/track/doesnotexist", headers={"x-stack-access-token": token})
    assert resp.status_code == 500
    assert "Failed to fetch track" in resp.text 