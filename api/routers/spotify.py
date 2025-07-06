import os
import requests
from fastapi import APIRouter, HTTPException, Depends
from api.util.auth_middleware import get_current_user

router = APIRouter()

# Spotify service account credentials
SPOTIFY_CLIENT_ID = os.environ["SPOTIFY_CLIENT_ID"]
SPOTIFY_CLIENT_SECRET = os.environ["SPOTIFY_CLIENT_SECRET"]

def get_spotify_access_token():
    """Get access token using client credentials flow"""
    auth_string = f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}"
    auth_bytes = auth_string.encode("utf-8")
    import base64
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
        raise HTTPException(status_code=500, detail="Failed to get Spotify access token")

def spotify_api_request(endpoint: str, **kwargs):
    """Make a request to Spotify API using service account credentials"""
    access_token = get_spotify_access_token()
    headers = {"Authorization": f"Bearer {access_token}"}
    
    if "headers" in kwargs:
        headers.update(kwargs["headers"])
    kwargs["headers"] = headers
    
    response = requests.get(f"https://api.spotify.com/v1{endpoint}", **kwargs)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=f"Spotify API error: {response.text}")
    return response.json()

@router.get("/playlists")
def get_playlists(user_info: dict = Depends(get_current_user)):
    """Get user's playlists using service account credentials"""
    # For now, return some sample playlists since we don't have user-specific access
    # In a real implementation, you might want to store user playlist IDs in your database
    # and fetch them using the service account credentials
    
    # Example: Get featured playlists
    try:
        playlists = spotify_api_request("/browse/featured-playlists?limit=20")
        return playlists
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch playlists: {str(e)}")

@router.get("/search")
def search_tracks(query: str, user_info: dict = Depends(get_current_user)):
    """Search for tracks using service account credentials"""
    try:
        results = spotify_api_request(f"/search?q={query}&type=track&limit=20")
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search tracks: {str(e)}")

@router.get("/track/{track_id}")
def get_track(track_id: str, user_info: dict = Depends(get_current_user)):
    """Get track details using service account credentials"""
    try:
        track = spotify_api_request(f"/tracks/{track_id}")
        return track
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch track: {str(e)}") 