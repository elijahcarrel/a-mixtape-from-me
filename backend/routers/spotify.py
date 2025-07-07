from fastapi import APIRouter, HTTPException, Depends
from backend.util.auth_middleware import get_current_user
from backend.client.spotify import get_spotify_client, SpotifyClient

router = APIRouter()

@router.get("/playlists")
def get_playlists(user_info: dict = Depends(get_current_user), spotify_client: SpotifyClient = Depends(get_spotify_client)):
    """Get user's playlists using service account credentials"""
    try:
        playlists = spotify_client.get_playlists()
        return playlists
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch playlists: {str(e)}")

@router.get("/search")
def search_tracks(query: str, user_info: dict = Depends(get_current_user), spotify_client: SpotifyClient = Depends(get_spotify_client)):
    """Search for tracks using service account credentials"""
    try:
        results = spotify_client.search_tracks(query)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search tracks: {str(e)}")

@router.get("/track/{track_id}")
def get_track(track_id: str, user_info: dict = Depends(get_current_user), spotify_client: SpotifyClient = Depends(get_spotify_client)):
    """Get track details using service account credentials"""
    try:
        track = spotify_client.get_track(track_id)
        return track
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch track: {str(e)}") 