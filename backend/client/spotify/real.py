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
        self.client_id = os.environ["SPOTIFY_CLIENT_ID"]
        self.client_secret = os.environ["SPOTIFY_CLIENT_SECRET"]
        self.track_cache_size = int(os.environ.get("SPOTIFY_TRACK_CACHE_SIZE", 500))
        self.track_cache = OrderedDict[str, SpotifyTrack]()  # track_id -> SpotifyTrack
        self._cache_lock = threading.Lock()

    def get_spotify_access_token(self)->str:
        auth_string = f"{self.client_id}:{self.client_secret}"
        auth_bytes = auth_string.encode("utf-8")
        auth_b64 = str(base64.b64encode(auth_bytes), "utf-8")
        url = "https://accounts.spotify.com/api/token"
        headers = {
            "Authorization": f"Basic {auth_b64}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {"grant_type": "client_credentials"}
        response = requests.post(url, headers=headers, data=data)
        if response.status_code == 200:
            return str(response.json()["access_token"])
        else:
            raise Exception("Failed to get Spotify access token")

    def spotify_api_request(self, endpoint: str, **kwargs)->Any:
        access_token = self.get_spotify_access_token()
        headers = {"Authorization": f"Bearer {access_token}"}
        if "headers" in kwargs:
            headers.update(kwargs["headers"])
        kwargs["headers"] = headers
        response = requests.get(f"https://api.spotify.com/v1{endpoint}", **kwargs)
        if response.status_code != 200:
            raise Exception(f"Spotify API error: {response.text}")
        return response.json()

    def search_tracks(self, query: str)->list[SpotifyTrack]:
        data = self.spotify_api_request(f"/search?q={query}&type=track&limit=5")
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
        item = self.spotify_api_request(f"/tracks/{track_id}")
        track = SpotifyTrack.from_dict(item)

        with self._cache_lock:
            self.track_cache[track_id] = track
            if len(self.track_cache) > self.track_cache_size:
                self.track_cache.popitem(last=False)  # Remove least recently used
        return track

def get_spotify_client():
    return SpotifyClient()
