from fastapi import APIRouter, Depends, Request

from backend.client.stack_auth import AbstractStackAuthBackend, get_stack_auth_backend
from backend.util.account_middleware import (
    AuthenticatedRequest,
    authenticate_account_request,
)

router = APIRouter()

# TODO: rather than returning random dicts here, define API types in apimodel and then return those.

async def get_authenticated_request(
    request: Request,
    stack_auth: AbstractStackAuthBackend = Depends(get_stack_auth_backend)
) -> AuthenticatedRequest:
    """Dependency that provides authenticated request context for all account endpoints"""
    return await authenticate_account_request(request, stack_auth)

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
