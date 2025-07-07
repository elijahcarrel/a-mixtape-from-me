class MockSpotifyClient:
    def __init__(self):
        self.tracks = [
            {"id": "track1", "name": "Mock Song One", "artist": "Mock Artist", "album": "Mock Album"},
            {"id": "track2", "name": "Another Track", "artist": "Another Artist", "album": "Another Album"},
            {"id": "track3", "name": "Third Song", "artist": "Mock Artist", "album": "Mock Album"},
        ]
        self.playlists = [
            {"id": "playlist1", "name": "Mock Playlist 1", "tracks": [self.tracks[0], self.tracks[1]]},
            {"id": "playlist2", "name": "Mock Playlist 2", "tracks": [self.tracks[2]]},
        ]

    def get_playlists(self):
        return {"items": self.playlists}

    def search_tracks(self, query: str):
        # Simple partial string match on track name
        results = [t for t in self.tracks if query.lower() in t["name"].lower()]
        return {"tracks": {"items": results}}

    def get_track(self, track_id: str):
        for t in self.tracks:
            if t["id"] == track_id:
                return t
        raise Exception("Track not found")

def get_mock_spotify_client():
    return MockSpotifyClient() 