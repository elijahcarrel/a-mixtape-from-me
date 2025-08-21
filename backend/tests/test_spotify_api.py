from backend.tests.assertion_utils import assert_response_success


def assert_track_details(track):
    assert "id" in track
    assert "name" in track
    assert "artists" in track and isinstance(track["artists"], list)
    for artist in track["artists"]:
        assert "name" in artist
    assert "album" in track
    assert "name" in track["album"]
    assert "images" in track["album"] and isinstance(track["album"]["images"], list)
    for img in track["album"]["images"]:
        assert "url" in img and "width" in img and "height" in img
    assert "uri" in track

def test_search_tracks(client):
    test_client, token, _ = client
    resp = test_client.get("/api/spotify/search?query=Mock", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert isinstance(data, list)
    # Should match at least one track with 'Mock' in the name
    found = False
    for t in data:
        if "Mock" in t["name"]:
            found = True
        assert_track_details(t)
    assert found

def test_get_track(client):
    test_client, token, _ = client
    track_id = "track1"
    resp = test_client.get(f"/api/spotify/track/{track_id}", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert data["id"] == track_id
    assert_track_details(data)

def test_get_track_not_found(client):
    test_client, token, _ = client
    resp = test_client.get("/api/spotify/track/doesnotexist", headers={"x-stack-access-token": token})
    assert resp.status_code == 500
    assert "Failed to fetch track" in resp.text

def test_search_tracks_without_auth(client):
    test_client, _, _ = client
    resp = test_client.get("/api/spotify/search?query=Mock")
    assert_response_success(resp)
    data = resp.json()
    assert isinstance(data, list)
    # Should match at least one track with 'Mock' in the name
    found = False
    for t in data:
        if "Mock" in t["name"]:
            found = True
        assert_track_details(t)
    assert found

def test_get_track_without_auth(client):
    test_client, _, _ = client
    track_id = "track1"
    resp = test_client.get(f"/api/spotify/track/{track_id}")
    assert_response_success(resp)
    data = resp.json()
    assert data["id"] == track_id
    assert_track_details(data)
