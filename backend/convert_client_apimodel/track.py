from backend.apimodel.spotify import TrackAlbum, TrackAlbumImage, TrackArtist, TrackDetails
from backend.client.spotify.client import SpotifyTrack


def spotify_track_to_mixtape_track_details(details: SpotifyTrack)->TrackDetails:
    return TrackDetails(
        id=details.id,
        name=details.name,
        artists=[
            TrackArtist(
                name=artist.name,
            )
            for artist in details.artists
        ],
        album=TrackAlbum(
            name=details.album.name,
            images=[
                TrackAlbumImage(
                    url=image.url,
                    width=image.width,
                    height=image.height,
                )
                for image in details.album.images
            ]
        ),
        uri=details.uri,
    )