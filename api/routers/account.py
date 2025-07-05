from fastapi import APIRouter, Request, Depends
from api.util.account_middleware import authenticate_account_request, AuthenticatedRequest

router = APIRouter()

async def get_authenticated_request(request: Request) -> AuthenticatedRequest:
    """Dependency that provides authenticated request context for all account endpoints"""
    return await authenticate_account_request(request)

@router.get("/me")
def get_account(auth_request: AuthenticatedRequest = Depends(get_authenticated_request)):
    """Get current user account information"""
    return auth_request.user_info

@router.get("/playlists")
def get_playlists(auth_request: AuthenticatedRequest = Depends(get_authenticated_request)):
    """Get user's playlists"""
    user_id = auth_request.user_info["id"]
    
    # Use the convenience method for Spotify API requests
    playlists = auth_request.spotify_get(f"/users/{user_id}/playlists")
    return playlists
