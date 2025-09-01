import httpx
from fastapi.testclient import TestClient

from backend.client.spotify.mock import MockSpotifyClient
from backend.routers import auth, spotify
from backend.tests.assertion_utils import (
    assert_response_created,
    assert_response_not_found,
    assert_response_success,
)


# --- TESTS ---
def mixtape_payload(tracks: list, public_id: str) -> dict:
    """Create mixtape payload."""
    payload = {
        "public_id": public_id,
        "name": "Test Mixtape",
        "intro_text": "Intro!",
        "subtitle1": "Subtitle 1",
        "subtitle2": "Subtitle 2",
        "subtitle3": "Subtitle 3",
        "is_public": True,
        "tracks": tracks
    }
    return payload

def create_mixtape_with_id(test_client, public_id: str, tracks: list, token: str | None = None):
    """Helper function to create a mixtape with a specific public_id."""
    headers = {"x-stack-access-token": token} if token else {}
    return test_client.post("/api/mixtape", json=mixtape_payload(tracks, public_id), headers=headers)

def test_create_and_get_mixtape(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"},
        {"track_position": 2, "track_text": "Second", "spotify_uri": "spotify:track:track2"}
    ]
    # Create with client-provided public_id
    public_id = "test-uuid-123"
    resp = create_mixtape_with_id(test_client, public_id, tracks, token)
    assert_response_created(resp)
    assert resp.json()["public_id"] == public_id
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

def test_public_id_collision_returns_409(client: tuple[TestClient, str, dict]) -> None:
    """Test that using an already-taken public ID returns a 409 conflict error."""
    test_client, token, _ = client
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    public_id = "collision-test-uuid"

    # Create first mixtape
    resp = create_mixtape_with_id(test_client, public_id, tracks, token)
    assert_response_created(resp)

    # Try to create second mixtape with same public_id
    resp = create_mixtape_with_id(test_client, public_id, tracks, token)
    assert resp.status_code == 409
    assert "already taken" in resp.json()["detail"]

def test_spotify_export_create_and_update(client: tuple[TestClient, str, dict], app) -> None:
    """Test creating a Spotify playlist and then updating it idempotently."""
    test_client, token, _ = client
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"},
        {"track_position": 2, "track_text": "Second", "spotify_uri": "spotify:track:track2"},
    ]
    # Create mixtape
    public_id = "spotify-export-test-uuid"
    resp = create_mixtape_with_id(test_client, public_id, tracks, token)
    assert_response_created(resp)

    # Export to Spotify for the first time (should create playlist)
    resp_export1 = test_client.post(
        f"/api/mixtape/{public_id}/spotify-export",
        headers={"x-stack-access-token": token},
    )
    assert_response_success(resp_export1)
    data1 = resp_export1.json()
    url1 = data1["spotify_playlist_url"]
    assert url1 is not None and url1.startswith("https://open.spotify.com/playlist/"), "Playlist URL should be set"

    # Ensure mock client stored playlist
    mock_spotify: MockSpotifyClient = app.dependency_overrides[spotify.get_spotify_client]()
    # Extract playlist ID from URL to check against mock client
    playlist_id = url1.split('/')[-1]
    uri1 = f"spotify:playlist:{playlist_id}"
    assert uri1 in mock_spotify.playlists, "Playlist should exist in mock client store"
    assert mock_spotify.playlists[uri1]["title"] == data1["name"]

    # Export again (should update existing, keep same URI)
    resp_export2 = test_client.post(
        f"/api/mixtape/{public_id}/spotify-export",
        headers={"x-stack-access-token": token},
    )
    assert_response_success(resp_export2)
    data2 = resp_export2.json()
    assert data2["spotify_playlist_url"] == url1, "URL should stay the same on update"

def test_edit_mixtape_add_remove_modify_tracks(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    # Create
    tracks = [
        {"track_position": 1, "track_text": "A", "spotify_uri": "spotify:track:track1"},
        {"track_position": 2, "track_text": "B", "spotify_uri": "spotify:track:track2"}
    ]
    public_id = "edit-test-uuid"
    resp = create_mixtape_with_id(test_client, public_id, tracks, token)
    assert_response_created(resp)
    # Edit: remove track 2, add track 3, modify track 1
    new_tracks = [
        {"track_position": 1, "track_text": "A-modified", "spotify_uri": "spotify:track:track1"},
        {"track_position": 3, "track_text": "C", "spotify_uri": "spotify:track:track3"}
    ]
    resp = test_client.put(f"/api/mixtape/{public_id}", json=mixtape_payload(new_tracks, public_id), headers={"x-stack-access-token": token})
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
    public_id = "duplicate-pos-test-uuid"
    resp = create_mixtape_with_id(test_client, public_id, tracks, token)
    # Should not create mixtape with duplicate track positions
    assert resp.status_code in [422, 400], f"Expected 422 or 400, got {resp.status_code}. Response: {resp.text}"

def test_put_public_id_mismatch_rejected(client: tuple[TestClient, str, dict]) -> None:
    """Test that PUT requests with mismatched public_id in URL vs body are rejected."""
    test_client, token, _ = client
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    # Create mixtape
    public_id = "mismatch-test-uuid"
    resp = create_mixtape_with_id(test_client, public_id, tracks, token)
    assert_response_created(resp)

    # Try to update with different public_id in body
    wrong_public_id = "wrong-uuid"
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"public_id": wrong_public_id, "name": "Updated", "intro_text": "Updated!", "is_public": True, "tracks": tracks}, headers={"x-stack-access-token": token})
    assert resp.status_code == 400
    assert f"Public ID in URL ('{public_id}') must match public ID in request body ('{wrong_public_id}')" in resp.json()["detail"]

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
        public_id = f"pagination-test-uuid-{i}"
        resp = test_client.post(
            "/api/mixtape",
            json={"public_id": public_id, "name": name, "intro_text": "", "is_public": True, "tracks": [{"track_position": 1, "track_text": name, "spotify_uri": f"spotify:track:{track_ids[i]}"}]},
            headers={"x-stack-access-token": token},
        )
        assert_response_created(resp)
        public_ids.append(public_id)
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
    public_id = "public-view-test-uuid"
    resp = create_mixtape_with_id(test_client, public_id, tracks, token)
    assert_response_created(resp)
    # Unauthenticated GET should succeed
    resp = test_client.get(f"/api/mixtape/{public_id}")
    assert_response_success(resp)
    # Make mixtape private
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"public_id": public_id, "name": "Test Mixtape", "intro_text": "Intro!", "is_public": False, "tracks": tracks}, headers={"x-stack-access-token": token})
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
    public_id = "owner-edit-test-uuid"
    resp = create_mixtape_with_id(test_client, public_id, tracks, token)
    assert_response_created(resp)
    # Register a second user
    mock_auth = app.dependency_overrides[auth.get_stack_auth_backend]()
    user2 = {"id": "user456", "email": "other@example.com", "name": "Other User"}
    token2 = mock_auth.register_user(user2)
    # Try to edit as user2
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"public_id": public_id, "name": "Hacked", "intro_text": "Hacked!", "is_public": True, "tracks": tracks}, headers={"x-stack-access-token": token2})
    assert resp.status_code == 401
    # Try to edit as unauthenticated
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"public_id": public_id, "name": "Hacked", "intro_text": "Hacked!", "is_public": True, "tracks": tracks})
    assert resp.status_code == 401

def test_create_anonymous_mixtape(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    # Create anonymous mixtape (no auth header)
    public_id = "anon-test-uuid"
    resp = create_mixtape_with_id(test_client, public_id, tracks)
    assert_response_created(resp)
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
    public_id = "claim-test-uuid"
    resp = create_mixtape_with_id(test_client, public_id, tracks)
    assert_response_created(resp)
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
    public_id = "claim-already-claimed-test-uuid"
    resp = create_mixtape_with_id(test_client, public_id, tracks)
    assert_response_created(resp)
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
    public_id = "edit-anon-test-uuid"
    resp = create_mixtape_with_id(test_client, public_id, tracks)
    assert_response_created(resp)
    # Edit it without authentication (should work for anonymous mixtapes)
    new_tracks = [
        {"track_position": 1, "track_text": "Modified", "spotify_uri": "spotify:track:track1"},
        {"track_position": 2, "track_text": "New", "spotify_uri": "spotify:track:track2"}
    ]
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"public_id": public_id, "name": "Modified Mixtape", "intro_text": "Modified!", "is_public": True, "tracks": new_tracks})
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
    public_id = "anon-not-in-list-test-uuid"
    resp = create_mixtape_with_id(test_client, public_id, tracks)
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
    public_id = "claim-then-edit-test-uuid"
    resp = create_mixtape_with_id(test_client, public_id, tracks)
    assert_response_created(resp)
    # Claim it
    resp = test_client.post(f"/api/mixtape/{public_id}/claim", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    # Register a second user
    mock_auth = app.dependency_overrides[auth.get_stack_auth_backend]()
    user2 = {"id": "user456", "email": "other@example.com", "name": "Other User"}
    token2 = mock_auth.register_user(user2)
    # Try to edit as user2 (should fail)
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"public_id": public_id, "name": "Hacked", "intro_text": "Hacked!", "is_public": True, "tracks": tracks}, headers={"x-stack-access-token": token2})
    assert resp.status_code == 401
    # Try to edit as unauthenticated (should fail)
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"public_id": public_id, "name": "Hacked", "intro_text": "Hacked!", "is_public": True, "tracks": tracks})
    assert resp.status_code == 401

def test_anonymous_mixtape_must_be_public(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    # Try to create anonymous private mixtape (should fail)
    public_id = "anon-private-test-uuid"
    payload = {
        "public_id": public_id,
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
    public_id = "anon-public-test-uuid"
    payload["public_id"] = public_id
    resp = test_client.post("/api/mixtape", json=payload)
    assert_response_created(resp)

def test_anonymous_mixtape_cannot_be_made_private_via_put(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    # Create anonymous mixtape
    public_id = "anon-private-put-test-uuid"
    resp = create_mixtape_with_id(test_client, public_id, tracks)
    assert_response_created(resp)
    # Try to make it private via PUT (should fail)
    payload = {
        "public_id": public_id,
        "name": "Test Mixtape",
        "intro_text": "Intro!",
        "is_public": False,  # This should cause the error
        "tracks": tracks
    }
    resp = test_client.put(f"/api/mixtape/{public_id}", json=payload)
    assert resp.status_code == 400
    assert "Only claimed mixtapes can be made private; unclaimed mixtapes must remain public" in resp.json()["detail"]
    # Verify making it public still works
    payload["is_public"] = True
    resp = test_client.put(f"/api/mixtape/{public_id}", json=payload)
    assert_response_success(resp)

def test_concurrent_put_requests_processed_sequentially(client: tuple[TestClient, str, dict]) -> None:
    """Simulate two concurrent PUT requests and verify they are processed in order.

    We use the test pause mechanism in backend.service.mixtape to block the first request
    while it holds a row-level lock. The second request should wait until the
    first completes. After unblocking, we expect the second request's data to
    be the final state in the database and the mixtape version to increment
    sequentially.
    """
    import threading  # Local import to avoid affecting other tests
    import time

    from backend.routers import (
        mixtape as mixtape_router,
    )

    test_client, token, _ = client

    # Create initial mixtape
    create_tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    public_id = "concurrent-test-uuid"
    resp_create = test_client.post(
        "/api/mixtape",
        json={
            "public_id": public_id,
            "name": "Initial Mixtape",
            "intro_text": "Intro",
            "is_public": True,
            "tracks": create_tracks,
        },
        headers={"x-stack-access-token": token},
    )
    assert_response_created(resp_create)

    # Enable test pause mechanism before issuing PUT requests
    mixtape_router._TEST_PAUSE_EVENT = threading.Event()
    mixtape_router._TEST_PAUSE_ENABLED = True

    results: list[tuple[str, httpx.Response]] = []

    def send_update(name: str, track_text: str) -> None:  # noqa: D401 – simple verb
        update_tracks = [
            {"track_position": 1, "track_text": track_text, "spotify_uri": "spotify:track:track1"}
        ]
        resp = test_client.put(
            f"/api/mixtape/{public_id}",
            json={
                "public_id": public_id,
                "name": name,
                "intro_text": "Intro",
                "is_public": True,
                "tracks": update_tracks,
            },
            headers={"x-stack-access-token": token},
        )
        results.append((name, resp))

    # Start first update thread (will acquire lock and then pause)
    t1 = threading.Thread(target=send_update, args=("FirstUpdate", "A"), daemon=True)
    t1.start()

    time.sleep(0.5)  # Give t1 time to reach the pause
    assert t1.is_alive(), "First update should be waiting due to test pause"

    # Start second update thread (should block on SELECT FOR UPDATE)
    t2 = threading.Thread(target=send_update, args=("SecondUpdate", "B"), daemon=True)
    t2.start()

    time.sleep(0.5)
    assert t2.is_alive(), "Second update should be blocked by row lock"

    # Unblock the first request, allowing both to finish sequentially
    mixtape_router._TEST_PAUSE_ENABLED = False
    assert mixtape_router._TEST_PAUSE_EVENT is not None  # mypy reassurance
    mixtape_router._TEST_PAUSE_EVENT.set()

    t1.join(timeout=5)
    t2.join(timeout=5)

    assert not t1.is_alive() and not t2.is_alive(), "Both updates should have completed"

    # Validate both responses were successful and the second update prevailed
    for _name, resp in results:
        assert_response_success(resp)

    versions = [resp.json().get("version") for _, resp in results]
    assert len(versions) == 2 and sorted(versions) == versions, "Versions should increment sequentially"

    # Final GET should reflect the second update
    resp_final = test_client.get(f"/api/mixtape/{public_id}", headers={"x-stack-access-token": token})
    assert_response_success(resp_final)
    data_final = resp_final.json()
    assert data_final["name"] == "SecondUpdate", "Latest update should win"

    # Clean up test pause globals to avoid side effects on other tests
    mixtape_router._TEST_PAUSE_EVENT = None
    mixtape_router._TEST_PAUSE_ENABLED = False

    # TODO: Once version history endpoint exists, assert that version 2 has
    #       name == "FirstUpdate" and version 3 has name == "SecondUpdate".

# --- UNDO/REDO TESTS ---

def test_undo_mixtape_basic(client: tuple[TestClient, str, dict]) -> None:
    """Test basic undo functionality."""
    test_client, token, _ = client

    # Create mixtape
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    public_id = "undo-basic-test-uuid"
    resp = create_mixtape_with_id(test_client, public_id, tracks, token)
    assert_response_created(resp)

    # Edit mixtape
    new_tracks = [
        {"track_position": 1, "track_text": "Modified", "spotify_uri": "spotify:track:track1"},
        {"track_position": 2, "track_text": "New", "spotify_uri": "spotify:track:track2"}
    ]
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"public_id": public_id, "name": "Modified Mixtape", "intro_text": "Modified!", "is_public": True, "tracks": new_tracks}, headers={"x-stack-access-token": token})
    assert_response_success(resp)

    # Undo should restore to original state
    resp = test_client.post(f"/api/mixtape/{public_id}/undo", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()

    assert data["name"] == "Test Mixtape"
    assert data["intro_text"] == "Intro!"
    assert len(data["tracks"]) == 1
    assert data["tracks"][0]["track_text"] == "First"
    assert data["can_undo"] is False  # Can't undo further
    assert data["can_redo"] is True   # Can redo

def test_redo_mixtape_basic(client: tuple[TestClient, str, dict]) -> None:
    """Test basic redo functionality."""
    test_client, token, _ = client

    # Create and edit mixtape
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    public_id = "redo-basic-test-uuid"
    resp = create_mixtape_with_id(test_client, public_id, tracks, token)
    assert_response_created(resp)

    new_tracks = [
        {"track_position": 1, "track_text": "Modified", "spotify_uri": "spotify:track:track1"}
    ]
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"public_id": public_id, "name": "Modified Mixtape", "intro_text": "Modified!", "is_public": True, "tracks": new_tracks}, headers={"x-stack-access-token": token})
    assert_response_success(resp)

    # Undo
    resp = test_client.post(f"/api/mixtape/{public_id}/undo", headers={"x-stack-access-token": token})
    assert_response_success(resp)

    # Redo should restore to modified state
    resp = test_client.post(f"/api/mixtape/{public_id}/redo", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()

    assert data["name"] == "Modified Mixtape"
    assert data["intro_text"] == "Modified!"
    assert len(data["tracks"]) == 1
    assert data["tracks"][0]["track_text"] == "Modified"
    assert data["can_undo"] is True   # Can undo again
    assert data["can_redo"] is False  # Can't redo further

def test_undo_redo_chain(client: tuple[TestClient, str, dict]) -> None:
    """Test a chain of undo/redo operations."""
    test_client, token, _ = client

    # Create mixtape
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    public_id = "undo-redo-chain-test-uuid"
    resp = create_mixtape_with_id(test_client, public_id, tracks, token)
    assert_response_created(resp)

    # Edit 1: Add track
    new_tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"},
        {"track_position": 2, "track_text": "Second", "spotify_uri": "spotify:track:track2"}
    ]
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"public_id": public_id, "name": "Two Tracks", "intro_text": "Two!", "is_public": True, "tracks": new_tracks}, headers={"x-stack-access-token": token})
    assert_response_success(resp)

    # Edit 2: Change name
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"public_id": public_id, "name": "Final Name", "intro_text": "Two!", "is_public": True, "tracks": new_tracks}, headers={"x-stack-access-token": token})
    assert_response_success(resp)

    # Undo 1: Should go back to "Two Tracks"
    resp = test_client.post(f"/api/mixtape/{public_id}/undo", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert data["name"] == "Two Tracks"
    assert data["can_undo"] is True
    assert data["can_redo"] is True

    # Undo 2: Should go back to "Test Mixtape"
    resp = test_client.post(f"/api/mixtape/{public_id}/undo", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert data["name"] == "Test Mixtape"
    assert data["can_undo"] is False
    assert data["can_redo"] is True

    # Redo 1: Should go to "Two Tracks"
    resp = test_client.post(f"/api/mixtape/{public_id}/redo", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert data["name"] == "Two Tracks"
    assert data["can_undo"] is True
    assert data["can_redo"] is True

    # Redo 2: Should go to "Final Name"
    resp = test_client.post(f"/api/mixtape/{public_id}/redo", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert data["name"] == "Final Name"
    assert data["can_undo"] is True
    assert data["can_redo"] is False

def test_edit_breaks_redo_chain(client: tuple[TestClient, str, dict]) -> None:
    """Test that editing after undo breaks the redo chain."""
    test_client, token, _ = client

    # Create and edit mixtape
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    public_id = "edit-breaks-redo-test-uuid"
    resp = create_mixtape_with_id(test_client, public_id, tracks, token)
    assert_response_created(resp)

    new_tracks = [
        {"track_position": 1, "track_text": "Modified", "spotify_uri": "spotify:track:track1"}
    ]
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"public_id": public_id, "name": "Modified Mixtape", "intro_text": "Modified!", "is_public": True, "tracks": new_tracks}, headers={"x-stack-access-token": token})
    assert_response_success(resp)

    # Undo
    resp = test_client.post(f"/api/mixtape/{public_id}/undo", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    assert resp.json()["can_redo"] is True

    # Edit again - this should break the redo chain
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"public_id": public_id, "name": "New Edit", "intro_text": "New!", "is_public": True, "tracks": tracks}, headers={"x-stack-access-token": token})
    assert_response_success(resp)

    # Should not be able to redo anymore
    resp = test_client.get(f"/api/mixtape/{public_id}", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert data["can_redo"] is False
    assert data["can_undo"] is True

def test_cannot_undo_new_mixtape(client: tuple[TestClient, str, dict]) -> None:
    """Test that a newly created mixtape cannot be undone."""
    test_client, token, _ = client

    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    public_id = "cannot-undo-new-test-uuid"
    resp = create_mixtape_with_id(test_client, public_id, tracks, token)
    assert_response_created(resp)

    # Try to undo - should fail
    resp = test_client.post(f"/api/mixtape/{public_id}/undo", headers={"x-stack-access-token": token})
    assert resp.status_code == 400
    assert "Cannot undo: no previous version available" in resp.json()["detail"]

def test_cannot_redo_mixtape_without_undo(client: tuple[TestClient, str, dict]) -> None:
    """Test that a mixtape cannot be redone without first undoing."""
    test_client, token, _ = client

    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    public_id = "cannot-redo-without-undo-test-uuid"
    resp = create_mixtape_with_id(test_client, public_id, tracks, token)
    assert_response_created(resp)

    # Try to redo - should fail
    resp = test_client.post(f"/api/mixtape/{public_id}/redo", headers={"x-stack-access-token": token})
    assert resp.status_code == 400
    assert "Cannot redo: no later version available" in resp.json()["detail"]

def test_undo_redo_anonymous_mixtape(client: tuple[TestClient, str, dict]) -> None:
    """Test undo/redo on anonymous mixtapes."""
    test_client, token, _ = client

    # Create anonymous mixtape
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    public_id = "undo-redo-anon-test-uuid"
    resp = create_mixtape_with_id(test_client, public_id, tracks)
    assert_response_created(resp)

    # Edit anonymous mixtape
    new_tracks = [
        {"track_position": 1, "track_text": "Modified", "spotify_uri": "spotify:track:track1"}
    ]
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"public_id": public_id, "name": "Modified Mixtape", "intro_text": "Modified!", "is_public": True, "tracks": new_tracks})
    assert_response_success(resp)

    # Undo should work
    resp = test_client.post(f"/api/mixtape/{public_id}/undo")
    assert_response_success(resp)
    data = resp.json()
    assert data["name"] == "Test Mixtape"
    assert data["can_redo"] is True

    # Redo should work
    resp = test_client.post(f"/api/mixtape/{public_id}/redo")
    assert_response_success(resp)
    data = resp.json()
    assert data["name"] == "Modified Mixtape"

def test_undo_redo_private_mixtape_requires_auth(client: tuple[TestClient, str, dict], app) -> None:
    """Test that undo/redo on private mixtapes requires authentication."""
    test_client, token, user = client

    # Create private mixtape
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    public_id = "private-auth-test-uuid"
    resp = test_client.post("/api/mixtape", json={"public_id": public_id, "name": "Private Mixtape", "intro_text": "Private!", "is_public": False, "tracks": tracks}, headers={"x-stack-access-token": token})
    assert_response_created(resp)

    # Edit to create undo history
    new_tracks = [
        {"track_position": 1, "track_text": "Modified", "spotify_uri": "spotify:track:track1"}
    ]
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"public_id": public_id, "name": "Modified Private", "intro_text": "Modified!", "is_public": False, "tracks": new_tracks}, headers={"x-stack-access-token": token})
    assert_response_success(resp)

    # Register a second user
    mock_auth = app.dependency_overrides[auth.get_stack_auth_backend]()
    user2 = {"id": "user456", "email": "other@example.com", "name": "Other User"}
    token2 = mock_auth.register_user(user2)

    # Try to undo as user2 - should fail
    resp = test_client.post(f"/api/mixtape/{public_id}/undo", headers={"x-stack-access-token": token2})
    assert resp.status_code == 401

    # Try to undo as unauthenticated - should fail
    resp = test_client.post(f"/api/mixtape/{public_id}/undo")
    assert resp.status_code == 401

    # Undo as owner should work
    resp = test_client.post(f"/api/mixtape/{public_id}/undo", headers={"x-stack-access-token": token})
    assert_response_success(resp)

def test_undo_redo_preserves_tracks(client: tuple[TestClient, str, dict]) -> None:
    """Test that undo/redo correctly restores track information."""
    test_client, token, _ = client

    # Create mixtape with tracks
    tracks = [
        {"track_position": 1, "track_text": "First Track", "spotify_uri": "spotify:track:track1"},
        {"track_position": 2, "track_text": "Second Track", "spotify_uri": "spotify:track:track2"}
    ]
    public_id = "undo-redo-tracks-test-uuid"
    resp = create_mixtape_with_id(test_client, public_id, tracks, token)
    assert_response_created(resp)

    # Edit tracks
    new_tracks = [
        {"track_position": 1, "track_text": "Modified First", "spotify_uri": "spotify:track:track1"},
        {"track_position": 3, "track_text": "New Third", "spotify_uri": "spotify:track:track3"}
    ]
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"public_id": public_id, "name": "Modified Mixtape", "intro_text": "Modified!", "is_public": True, "tracks": new_tracks}, headers={"x-stack-access-token": token})
    assert_response_success(resp)

    # Undo should restore original tracks
    resp = test_client.post(f"/api/mixtape/{public_id}/undo", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()

    assert len(data["tracks"]) == 2
    assert data["tracks"][0]["track_position"] == 1
    assert data["tracks"][0]["track_text"] == "First Track"
    assert data["tracks"][1]["track_position"] == 2
    assert data["tracks"][1]["track_text"] == "Second Track"

    # Verify track details are present
    for track in data["tracks"]:
        assert "track" in track
        assert track["track"]["id"] == f"{track['track']['uri'].replace('spotify:track:', '')}"

def test_undo_redo_concurrent_requests(client: tuple[TestClient, str, dict]) -> None:
    """Test that concurrent undo/redo requests are handled correctly."""
    import threading
    import time

    from backend.routers import mixtape as mixtape_router

    test_client, token, _ = client

    # Create and edit mixtape
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    public_id = "concurrent-undo-redo-test-uuid"
    resp = create_mixtape_with_id(test_client, public_id, tracks, token)
    assert_response_created(resp)

    new_tracks = [
        {"track_position": 1, "track_text": "Modified", "spotify_uri": "spotify:track:track1"}
    ]
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"public_id": public_id, "name": "Modified Mixtape", "intro_text": "Modified!", "is_public": True, "tracks": new_tracks}, headers={"x-stack-access-token": token})
    assert_response_success(resp)

    # Enable test pause mechanism
    mixtape_router._TEST_PAUSE_EVENT = threading.Event()
    mixtape_router._TEST_PAUSE_ENABLED = True

    results: list[tuple[str, httpx.Response]] = []

    def send_undo() -> None:
        resp = test_client.post(f"/api/mixtape/{public_id}/undo", headers={"x-stack-access-token": token})
        results.append(("undo", resp))

    def send_redo() -> None:
        resp = test_client.post(f"/api/mixtape/{public_id}/redo", headers={"x-stack-access-token": token})
        results.append(("redo", resp))

    # Start undo thread (will acquire lock and then pause)
    t1 = threading.Thread(target=send_undo, daemon=True)
    t1.start()

    time.sleep(0.5)  # Give t1 time to reach the pause
    assert t1.is_alive(), "First undo should be waiting due to test pause"

    # Start redo thread (should block on SELECT FOR UPDATE)
    t2 = threading.Thread(target=send_redo, daemon=True)
    t2.start()

    time.sleep(0.5)
    assert t2.is_alive(), "Second redo should be blocked by row lock"

    # Unblock the first request
    mixtape_router._TEST_PAUSE_ENABLED = False
    assert mixtape_router._TEST_PAUSE_EVENT is not None
    mixtape_router._TEST_PAUSE_EVENT.set()

    t1.join(timeout=5)
    t2.join(timeout=5)

    assert not t1.is_alive() and not t2.is_alive(), "Both operations should have completed"

    # Validate responses
    for _name, resp in results:
        assert_response_success(resp)

    # Assert that the mixtape is back to the updated state.
    resp = test_client.get(f"/api/mixtape/{public_id}", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert data["name"] == "Modified Mixtape"
    assert data["intro_text"] == "Modified!"
    assert len(data["tracks"]) == 1
    assert data["tracks"][0]["track_text"] == "Modified"
    assert data["can_undo"] is True
    assert data["can_redo"] is False

    # Clean up test pause globals
    mixtape_router._TEST_PAUSE_EVENT = None
    mixtape_router._TEST_PAUSE_ENABLED = False

# --- APPEND-ONLY VERSION HISTORY TESTS ---

def test_append_only_version_history_basic_scenario(client: tuple[TestClient, str, dict]) -> None:
    """Test the append-only version history with the exact scenario from the user requirements."""
    test_client, token, _ = client

    # Create mixtape (version 1)
    tracks = [
        {"track_position": 1, "track_text": "Original Track", "spotify_uri": "spotify:track:track1"}
    ]
    public_id = "append-only-basic-test-uuid"
    resp = create_mixtape_with_id(test_client, public_id, tracks, token)
    assert_response_created(resp)

    # Verify initial state
    resp = test_client.get(f"/api/mixtape/{public_id}", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert data["version"] == 1
    assert data["can_undo"] is False
    assert data["can_redo"] is False

    # Make 4 PUT requests (versions 2, 3, 4, 5)
    for i in range(2, 6):
        new_tracks = [
            {"track_position": 1, "track_text": f"Track Version {i}", "spotify_uri": "spotify:track:track1"}
        ]
        resp = test_client.put(f"/api/mixtape/{public_id}", json={"public_id": public_id, "name": f"Mixtape V{i}", "intro_text": "Updated!", "is_public": True, "tracks": new_tracks}, headers={"x-stack-access-token": token})
        assert_response_success(resp)
        assert resp.json()["version"] == i

        # Verify the state
        resp = test_client.get(f"/api/mixtape/{public_id}", headers={"x-stack-access-token": token})
        assert_response_success(resp)
        data = resp.json()
        assert data["version"] == i
        assert data["name"] == f"Mixtape V{i}"
        assert data["tracks"][0]["track_text"] == f"Track Version {i}"
        assert data["can_undo"] is True
        assert data["can_redo"] is False

    # Now at version 5, undo (should create version 6 that resembles version 4)
    resp = test_client.post(f"/api/mixtape/{public_id}/undo", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert data["version"] == 6  # New version created
    assert data["name"] == "Mixtape V4"  # Content from version 4
    assert data["tracks"][0]["track_text"] == "Track Version 4"
    assert data["can_undo"] is True  # Can undo to version 3
    assert data["can_redo"] is True  # Can redo to version 5

def test_append_only_double_undo_scenario(client: tuple[TestClient, str, dict]) -> None:
    """Test double undo scenario: undo twice from version 5."""
    test_client, token, _ = client

    # Setup: Create mixtape and make 4 edits to reach version 5
    tracks = [{"track_position": 1, "track_text": "Original", "spotify_uri": "spotify:track:track1"}]
    public_id = "double-undo-test-uuid"
    resp = create_mixtape_with_id(test_client, public_id, tracks, token)
    assert_response_created(resp)

    for i in range(2, 6):
        new_tracks = [{"track_position": 1, "track_text": f"Version {i}", "spotify_uri": "spotify:track:track1"}]
        resp = test_client.put(f"/api/mixtape/{public_id}", json={"public_id": public_id, "name": f"Name V{i}", "intro_text": "Test", "is_public": True, "tracks": new_tracks}, headers={"x-stack-access-token": token})
        assert_response_success(resp)

    # First undo: version 5 -> version 6 (resembles version 4)
    resp = test_client.post(f"/api/mixtape/{public_id}/undo", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert data["version"] == 6
    assert data["name"] == "Name V4"
    assert data["tracks"][0]["track_text"] == "Version 4"

    # Second undo: version 6 -> version 7 (resembles version 3)
    resp = test_client.post(f"/api/mixtape/{public_id}/undo", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert data["version"] == 7
    assert data["name"] == "Name V3"
    assert data["tracks"][0]["track_text"] == "Version 3"
    assert data["can_undo"] is True  # Can undo to version 2
    assert data["can_redo"] is True  # Can redo to version 4 (via version 6)

def test_append_only_redo_after_undo_scenario(client: tuple[TestClient, str, dict]) -> None:
    """Test redo scenario: undo then redo from version 5."""
    test_client, token, _ = client

    # Setup: Create mixtape and make 4 edits to reach version 5
    tracks = [{"track_position": 1, "track_text": "Original", "spotify_uri": "spotify:track:track1"}]
    public_id = "redo-after-undo-test-uuid"
    resp = create_mixtape_with_id(test_client, public_id, tracks, token)
    assert_response_created(resp)

    for i in range(2, 6):
        new_tracks = [{"track_position": 1, "track_text": f"Version {i}", "spotify_uri": "spotify:track:track1"}]
        resp = test_client.put(f"/api/mixtape/{public_id}", json={"public_id": public_id, "name": f"Name V{i}", "intro_text": "Test", "is_public": True, "tracks": new_tracks}, headers={"x-stack-access-token": token})
        assert_response_success(resp)

    # Undo: version 5 -> version 6 (resembles version 4)
    resp = test_client.post(f"/api/mixtape/{public_id}/undo", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    assert resp.json()["version"] == 6

    # Redo: version 6 -> version 7 (resembles version 5)
    resp = test_client.post(f"/api/mixtape/{public_id}/redo", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert data["version"] == 7
    assert data["name"] == "Name V5"
    assert data["tracks"][0]["track_text"] == "Version 5"
    assert data["can_undo"] is True  # Can undo to version 4 (via version 6)
    assert data["can_redo"] is False  # No more redo available

def test_append_only_edit_after_undo_breaks_chain(client: tuple[TestClient, str, dict]) -> None:
    """Test that editing after undo breaks the redo chain and creates proper version."""
    test_client, token, _ = client

    # Setup: Create mixtape and make 4 edits to reach version 5
    tracks = [{"track_position": 1, "track_text": "Original", "spotify_uri": "spotify:track:track1"}]
    public_id = "edit-after-undo-test-uuid"
    resp = create_mixtape_with_id(test_client, public_id, tracks, token)
    assert_response_created(resp)

    for i in range(2, 6):
        new_tracks = [{"track_position": 1, "track_text": f"Version {i}", "spotify_uri": "spotify:track:track1"}]
        resp = test_client.put(f"/api/mixtape/{public_id}", json={"public_id": public_id, "name": f"Name V{i}", "intro_text": "Test", "is_public": True, "tracks": new_tracks}, headers={"x-stack-access-token": token})
        assert_response_success(resp)

    # Undo: version 5 -> version 6 (resembles version 4)
    resp = test_client.post(f"/api/mixtape/{public_id}/undo", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert data["version"] == 6
    assert data["can_redo"] is True

    # Edit: version 6 -> version 7 (new content, breaks redo chain)
    new_tracks = [{"track_position": 1, "track_text": "New Branch", "spotify_uri": "spotify:track:track1"}]
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"public_id": public_id, "name": "Branched Edit", "intro_text": "New!", "is_public": True, "tracks": new_tracks}, headers={"x-stack-access-token": token})
    assert_response_success(resp)
    assert resp.json()["version"] == 7

    # Verify the state
    resp = test_client.get(f"/api/mixtape/{public_id}", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert data["version"] == 7
    assert data["name"] == "Branched Edit"
    assert data["tracks"][0]["track_text"] == "New Branch"
    assert data["can_undo"] is True  # Can undo to version 6
    assert data["can_redo"] is False  # Redo chain is broken

def test_append_only_versions_always_increment(client: tuple[TestClient, str, dict]) -> None:
    """Test that version numbers always increment, never go backwards."""
    test_client, token, _ = client

    # Create mixtape
    tracks = [{"track_position": 1, "track_text": "Track", "spotify_uri": "spotify:track:track1"}]
    public_id = "versions-increment-test-uuid"
    resp = create_mixtape_with_id(test_client, public_id, tracks, token)
    assert_response_created(resp)

    expected_version = 1

    # Make several edits
    for i in range(2, 5):
        new_tracks = [{"track_position": 1, "track_text": f"Edit {i}", "spotify_uri": "spotify:track:track1"}]
        resp = test_client.put(f"/api/mixtape/{public_id}", json={"public_id": public_id, "name": f"Name {i}", "intro_text": "Test", "is_public": True, "tracks": new_tracks}, headers={"x-stack-access-token": token})
        assert_response_success(resp)
        expected_version = i
        assert resp.json()["version"] == expected_version

    # Perform undo/redo operations and verify version always increments
    operations = [
        ("undo", lambda: test_client.post(f"/api/mixtape/{public_id}/undo", headers={"x-stack-access-token": token})),
        ("undo", lambda: test_client.post(f"/api/mixtape/{public_id}/undo", headers={"x-stack-access-token": token})),
        ("redo", lambda: test_client.post(f"/api/mixtape/{public_id}/redo", headers={"x-stack-access-token": token})),
        ("edit", lambda: test_client.put(f"/api/mixtape/{public_id}", json={"public_id": public_id, "name": "Final", "intro_text": "Test", "is_public": True, "tracks": tracks}, headers={"x-stack-access-token": token})),
    ]

    for op_name, op_func in operations:
        resp = op_func()
        assert_response_success(resp)
        expected_version += 1
        actual_version = resp.json()["version"]
        assert actual_version == expected_version, f"After {op_name}, expected version {expected_version}, got {actual_version}"
