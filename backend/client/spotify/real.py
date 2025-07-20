import os
import requests
import base64
from collections import OrderedDict
from .client import AbstractSpotifyClient, SpotifyTrack, SpotifyArtist, SpotifyAlbum, SpotifyAlbumImage, SpotifySearchResult

class SpotifyClient(AbstractSpotifyClient):
    def __init__(self):
        self.client_id = os.environ["SPOTIFY_CLIENT_ID"]
        self.client_secret = os.environ["SPOTIFY_CLIENT_SECRET"]
        self.track_cache_size = int(os.environ.get("SPOTIFY_TRACK_CACHE_SIZE", 500))
        self.track_cache = OrderedDict()  # track_id -> SpotifyTrack

    def get_spotify_access_token(self):
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
            return response.json()["access_token"]
        else:
            raise Exception("Failed to get Spotify access token")

    def spotify_api_request(self, endpoint: str, **kwargs):
        access_token = self.get_spotify_access_token()
        headers = {"Authorization": f"Bearer {access_token}"}
        if "headers" in kwargs:
            headers.update(kwargs["headers"])
        kwargs["headers"] = headers
        response = requests.get(f"https://api.spotify.com/v1{endpoint}", **kwargs)
        if response.status_code != 200:
            raise Exception(f"Spotify API error: {response.text}")
        return response.json()

    def search_tracks(self, query: str):
        data = self.spotify_api_request(f"/search?q={query}&type=track&limit=5")
        items = []
        for item in data.get("tracks", {}).get("items", []):
            track = SpotifyTrack(
                id=item["id"],
                name=item["name"],
                artists=[SpotifyArtist(name=a["name"]) for a in item.get("artists", [])],
                album=SpotifyAlbum(
                    name=item["album"]["name"],
                    images=[SpotifyAlbumImage(url=img["url"], width=img["width"], height=img["height"]) for img in item["album"].get("images", [])]
                ),
                uri=item["uri"]
            )
            items.append(track)
        return {"tracks": SpotifySearchResult(items)}

    def get_track(self, track_id: str):
        # LRU cache: move accessed item to end
        if track_id in self.track_cache:
            track = self.track_cache.pop(track_id)
            self.track_cache[track_id] = track  # Mark as most recently used
            return track
        # Not in cache, fetch from API
        item = self.spotify_api_request(f"/tracks/{track_id}")
        track = SpotifyTrack(
            id=item["id"],
            name=item["name"],
            artists=[SpotifyArtist(name=a["name"]) for a in item.get("artists", [])],
            album=SpotifyAlbum(
                name=item["album"]["name"],
                images=[SpotifyAlbumImage(url=img["url"], width=img["width"], height=img["height"]) for img in item["album"].get("images", [])]
            ),
            uri=item["uri"]
        )
        self.track_cache[track_id] = track
        if len(self.track_cache) > self.track_cache_size:
            self.track_cache.popitem(last=False)  # Remove least recently used
        return track

def get_spotify_client():
    return SpotifyClient() 