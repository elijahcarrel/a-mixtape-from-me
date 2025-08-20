from fastapi import APIRouter, Depends
from backend.middleware.auth.authenticated_user import AuthenticatedUser
from backend.middleware.auth.dependency_helpers import get_user

router = APIRouter()

# TODO: deduplicate with /auth/me.
@router.get("/me")
def get_account(auth_request: AuthenticatedUser = Depends(get_user)):
    """Get current user account information"""
    return {
        "id": auth_request.get_user_id(),
        "email": auth_request.get_user_email(),
        "name": auth_request.get_user_name(),
        "user_info": auth_request.user_info
    }
