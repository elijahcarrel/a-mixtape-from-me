from .client import AbstractSpotifyClient, SpotifyTrack, SpotifyArtist, SpotifyAlbum, SpotifyAlbumImage, SpotifySearchResult

class MockSpotifyClient(AbstractSpotifyClient):
    def __init__(self):
        self.reset_tracks()

    def reset_tracks(self):
        self.tracks = [
            SpotifyTrack(
                id="track1",
                name="Mock Song One",
                artists=[SpotifyArtist(name="Mock Artist")],
                album=SpotifyAlbum(
                    name="Mock Album",
                    images=[SpotifyAlbumImage(url="https://example.com/mock1.jpg", width=300, height=300)]
                ),
                uri="spotify:track:track1"
            ),
            SpotifyTrack(
                id="track2",
                name="Another Track",
                artists=[SpotifyArtist(name="Another Artist")],
                album=SpotifyAlbum(
                    name="Another Album",
                    images=[SpotifyAlbumImage(url="https://example.com/mock2.jpg", width=300, height=300)]
                ),
                uri="spotify:track:track2"
            ),
            SpotifyTrack(
                id="track3",
                name="Third Song",
                artists=[SpotifyArtist(name="Mock Artist")],
                album=SpotifyAlbum(
                    name="Mock Album",
                    images=[SpotifyAlbumImage(url="https://example.com/mock3.jpg", width=300, height=300)]
                ),
                uri="spotify:track:track3"
            ),
            SpotifyTrack(
                id="track4",
                name="Fourth Track",
                artists=[SpotifyArtist(name="Fourth Artist")],
                album=SpotifyAlbum(
                    name="Fourth Album",
                    images=[SpotifyAlbumImage(url="https://example.com/mock4.jpg", width=300, height=300)]
                ),
                uri="spotify:track:track4"
            ),
            SpotifyTrack(
                id="track5",
                name="Fifth Track",
                artists=[SpotifyArtist(name="Fifth Artist")],
                album=SpotifyAlbum(
                    name="Fifth Album",
                    images=[SpotifyAlbumImage(url="https://example.com/mock5.jpg", width=300, height=300)]
                ),
                uri="spotify:track:track5"
            ),
        ]

    def add_track(self, track: SpotifyTrack):
        self.tracks.append(track)

    def search_tracks(self, query: str):
        results = [t for t in self.tracks if query.lower() in t.name.lower()]
        return {"tracks": SpotifySearchResult(results)}

    def get_track(self, track_id: str):
        for t in self.tracks:
            if t.id == track_id:
                return t
        raise Exception("Track not found")

def get_mock_spotify_client():
    return MockSpotifyClient() 