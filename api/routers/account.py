from fastapi import APIRouter, Depends
from api.util.auth_middleware import get_current_user

router = APIRouter()

@router.get("/me")
def get_account(current_user: dict = Depends(get_current_user)):
    """Get current user account information"""
    return current_user

# Future endpoints can be added here with the same pattern:
# @router.get("/playlists")
# def get_playlists(current_user: dict = Depends(get_current_user)):
#     return {"playlists": []} 