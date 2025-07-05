import time
import hashlib
import requests
import os
from typing import Dict, Optional, Any

# In-memory cache - can be easily replaced with Redis later
token_cache: Dict[str, Dict[str, Any]] = {}

CLIENT_ID = os.environ["SPOTIFY_CLIENT_ID"]
CLIENT_SECRET = os.environ["SPOTIFY_CLIENT_SECRET"]

def hash_token(token: str) -> str:
    """Create a hash of the access token for use as cache key"""
    return hashlib.sha256(token.encode()).hexdigest()

def get_user_info_from_spotify(access_token: str) -> Optional[Dict[str, Any]]:
    """Fetch user info from Spotify API"""
    headers = {"Authorization": f"Bearer {access_token}"}
    resp = requests.get("https://api.spotify.com/v1/me", headers=headers)
    if resp.status_code == 200:
        return resp.json()
    return None

def refresh_access_token(refresh_token: str) -> Optional[Dict[str, Any]]:
    """Refresh an access token using the refresh token"""
    import base64
    
    request_string = CLIENT_ID + ":" + CLIENT_SECRET
    encoded_bytes = base64.b64encode(request_string.encode("utf-8"))
    encoded_string = str(encoded_bytes, "utf-8")
    header = {"Authorization": "Basic " + encoded_string}

    form_data = {"grant_type": "refresh_token", "refresh_token": refresh_token}
    url = "https://accounts.spotify.com/api/token"

    response = requests.post(url, data=form_data, headers=header)
    if response.status_code == 200:
        return response.json()
    return None

def get_cached_user_info(access_token: str) -> Optional[Dict[str, Any]]:
    """
    Get user info from cache, refreshing token if expired.
    Returns None if token is invalid or refresh fails.
    """
    token_hash = hash_token(access_token)
    
    if token_hash not in token_cache:
        return None
    
    cache_entry = token_cache[token_hash]
    current_time = time.time()
    
    # Check if token is expired
    if current_time >= cache_entry["expires_at"]:
        # Try to refresh the token
        refresh_result = refresh_access_token(cache_entry["refresh_token"])
        if refresh_result:
            new_access_token = refresh_result["access_token"]
            new_expires_in = refresh_result.get("expires_in", 3600)
            
            # Get user info with new token
            user_info = get_user_info_from_spotify(new_access_token)
            if user_info:
                # Create new cache entry
                new_token_hash = hash_token(new_access_token)
                token_cache[new_token_hash] = {
                    "access_token": new_access_token,
                    "refresh_token": cache_entry["refresh_token"],  # Keep same refresh token
                    "expires_at": current_time + new_expires_in,
                    "user_info": user_info
                }
                
                # Remove old cache entry
                del token_cache[token_hash]
                
                return user_info
        
        # If refresh failed, remove expired entry
        del token_cache[token_hash]
        return None
    
    return cache_entry["user_info"] 