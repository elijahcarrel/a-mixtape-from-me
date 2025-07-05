from fastapi import Request, HTTPException
from api.util.cache import get_cached_user_info
import requests

class AuthenticatedRequest:
    """Wrapper class that provides authenticated request context"""
    def __init__(self, request: Request, user_info: dict):
        self.request = request
        self.user_info = user_info
        self.access_token = user_info["access_token"]
    
    def get_spotify_headers(self):
        """Get headers for Spotify API requests"""
        return {"Authorization": f"Bearer {self.access_token}"}
    
    def spotify_request(self, method: str, url: str, **kwargs):
        """Make a request to Spotify API with proper headers"""
        headers = self.get_spotify_headers()
        if "headers" in kwargs:
            headers.update(kwargs["headers"])
        kwargs["headers"] = headers
        
        response = requests.request(method, url, **kwargs)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=f"Spotify API error: {response.text}")
        return response.json()
    
    def spotify_get(self, endpoint: str, **kwargs):
        """Convenience method for GET requests to Spotify API"""
        return self.spotify_request("GET", f"https://api.spotify.com/v1{endpoint}", **kwargs)
    
    def spotify_post(self, endpoint: str, **kwargs):
        """Convenience method for POST requests to Spotify API"""
        return self.spotify_request("POST", f"https://api.spotify.com/v1{endpoint}", **kwargs)

async def authenticate_account_request(request: Request):
    """
    Middleware function that authenticates all account requests.
    Returns an AuthenticatedRequest object with user info and access token.
    """
    # Try to get token from cookie first
    access_token = request.cookies.get("accessToken")
    
    # If not in cookie, try Authorization header
    if not access_token:
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.lower().startswith("bearer "):
            access_token = auth_header[7:]
    
    if not access_token:
        raise HTTPException(status_code=401, detail="No access token provided")
    
    # Get user info from cache (with automatic token refresh if needed)
    user_info = get_cached_user_info(access_token)
    
    if not user_info:
        raise HTTPException(status_code=401, detail="Invalid or expired access token")
    
    return AuthenticatedRequest(request, user_info) 