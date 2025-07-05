from fastapi import Request, HTTPException, Depends
from api.util.cache import get_cached_user_info

async def get_current_user(request: Request):
    """
    Middleware function that extracts the access token and returns the current user.
    Can be used as a dependency in FastAPI endpoints.
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
    
    return user_info 