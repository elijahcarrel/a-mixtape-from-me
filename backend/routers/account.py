from fastapi import APIRouter, Request, Depends
from backend.util.account_middleware import authenticate_account_request, AuthenticatedRequest

router = APIRouter()

async def get_authenticated_request(request: Request) -> AuthenticatedRequest:
    """Dependency that provides authenticated request context for all account endpoints"""
    return await authenticate_account_request(request)

@router.get("/me")
def get_account(auth_request: AuthenticatedRequest = Depends(get_authenticated_request)):
    """Get current user account information"""
    return {
        "id": auth_request.get_user_id(),
        "email": auth_request.get_user_email(),
        "name": auth_request.get_user_name(),
        "user_info": auth_request.user_info
    }

@router.get("/profile")
def get_profile(auth_request: AuthenticatedRequest = Depends(get_authenticated_request)):
    """Get user profile information"""
    return {
        "id": auth_request.get_user_id(),
        "email": auth_request.get_user_email(),
        "name": auth_request.get_user_name(),
        "profile": auth_request.user_info
    }
