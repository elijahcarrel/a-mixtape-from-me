from fastapi import Request, HTTPException, Depends
from backend.util.cache import get_cached_user_info
from backend.client.stack_auth import get_stack_auth_backend, StackAuthBackend

async def get_current_user(request: Request, stack_auth: StackAuthBackend = Depends(get_stack_auth_backend)):
    """
    Middleware function that extracts the access token from headers and returns the current user.
    Can be used as a dependency in FastAPI endpoints.
    """
    # Get access token from Stack Auth header
    access_token = request.headers.get("x-stack-access-token")
    
    if not access_token:
        raise HTTPException(status_code=401, detail="No access token provided")
    
    # Get user info from cache (with automatic validation if needed)
    user_info = get_cached_user_info(access_token, stack_auth)
    
    if not user_info:
        raise HTTPException(status_code=401, detail="Invalid or expired access token")
    
    return user_info 

async def get_optional_user(request: Request, stack_auth: StackAuthBackend = Depends(get_stack_auth_backend)):
    """
    Like get_current_user, but returns None if no access token is provided.
    If a token is provided but invalid, raises 401.
    """
    access_token = request.headers.get("x-stack-access-token")
    if not access_token:
        return None
    user_info = get_cached_user_info(access_token, stack_auth)
    if not user_info:
        raise HTTPException(status_code=401, detail="Invalid or expired access token")
    return user_info 