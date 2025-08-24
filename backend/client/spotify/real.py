import base64
import os
import threading
from collections import OrderedDict
from typing import Any

import requests

from .client import (
    AbstractSpotifyClient,
    SpotifyTrack,
)

# TODO: move the cache into the abstract spotify client so that both real and mock use the cache?

class SpotifyClient(AbstractSpotifyClient):
    def __init__(self):
        # The OAuth token must have the playlist-modify-public (and optionally
        # playlist-modify-private) scopes. For backend jobs we read it from an
        # env var set at runtime (e.g. via secrets manager). The token is short-
        # lived, but for simplicity we assume the operator refreshes it.
        self._access_token = os.environ["SPOTIFY_OAUTH_TOKEN"]

        # Cache for track look-ups to avoid repeated API calls during a single
        # request burst.
        self.track_cache_size = int(os.environ.get("SPOTIFY_TRACK_CACHE_SIZE", 500))
        self.track_cache = OrderedDict[str, SpotifyTrack]()  # track_id -> SpotifyTrack
        self._cache_lock = threading.Lock()

        self._user_id: str | None = None  # populated lazily

    # --- Auth helpers ---
    def get_spotify_access_token(self)->str:
        """Return the bearer token provided via env var."""
        return self._access_token

    def _auth_headers(self)->dict[str, str]:
        return {"Authorization": f"Bearer {self.get_spotify_access_token()}"}

    def spotify_api_request(self, method: str, endpoint: str, **kwargs)->Any:
        """Low-level HTTP helper (raises on non-2xx)."""
        headers = self._auth_headers()
        if "headers" in kwargs:
            headers.update(kwargs["headers"])
        kwargs["headers"] = headers
        url = f"https://api.spotify.com/v1{endpoint}"
        response = requests.request(method, url, **kwargs)
        if response.status_code >= 400:
            raise Exception(f"Spotify API error {response.status_code}: {response.text}")
        if response.status_code == 204:  # No content
            return None
        return response.json()

    # --- User info ---
    def _get_user_id(self)->str:
        if self._user_id is None:
            data = self.spotify_api_request("GET", "/me")
            self._user_id = data["id"]
        return self._user_id

    def search_tracks(self, query: str)->list[SpotifyTrack]:
        data = self.spotify_api_request("GET", f"/search", params={"q": query, "type": "track", "limit": 5})
        items = []
        # TODO: why do we check for both "tracks" and "items"? Should only need one.
        for item in data.get("tracks", {}).get("items", []):
            track = SpotifyTrack.from_dict(item)
            items.append(track)
        return items

    def get_track(self, track_id: str)->SpotifyTrack:
        with self._cache_lock:
            if track_id in self.track_cache:
                track: SpotifyTrack = self.track_cache.pop(track_id)
                self.track_cache[track_id] = track  # Mark as most recently used
                return track
        # Not in cache, fetch from API (do not hold lock during network call)
        # TODO: ensure we use a single flight so that we don't fetch the same track multiple times
        # from multiple threads. In golang there's a singleflight package we could use; this surely
        # exists in Python so we just need to find it.
        item = self.spotify_api_request("GET", f"/tracks/{track_id}")
        track = SpotifyTrack.from_dict(item)

        with self._cache_lock:
            self.track_cache[track_id] = track
            if len(self.track_cache) > self.track_cache_size:
                self.track_cache.popitem(last=False)  # Remove least recently used
        return track

    # --- Playlist methods ---
    def _playlist_id_from_uri(self, playlist_uri: str) -> str:
        return playlist_uri.split(":")[-1]

    def create_playlist(self, title: str, description: str, track_uris: list[str]) -> str:
        user_id = self._get_user_id()
        payload = {"name": title, "description": description, "public": True}
        data = self.spotify_api_request("POST", f"/users/{user_id}/playlists", json=payload)
        playlist_id = data["id"]

        if track_uris:
            self.spotify_api_request("PUT", f"/playlists/{playlist_id}/tracks", json={"uris": track_uris})

        return data["uri"]

    def update_playlist(self, playlist_uri: str, title: str, description: str, track_uris: list[str]) -> None:
        playlist_id = self._playlist_id_from_uri(playlist_uri)
        # Change details
        self.spotify_api_request("PUT", f"/playlists/{playlist_id}", json={"name": title, "description": description, "public": True})

        # Replace tracks (PUT replaces)
        self.spotify_api_request("PUT", f"/playlists/{playlist_id}/tracks", json={"uris": track_uris})

def get_spotify_client():
    return SpotifyClient()
