import os
from fastapi import APIRouter, Request, HTTPException, Depends
from backend.util.stack_auth import get_stack_auth_backend, StackAuthBackend
from backend.util.cache import cache_user_info, remove_cached_user

router = APIRouter()

@router.get("/me")
def get_current_user(request: Request, stack_auth: StackAuthBackend = Depends(get_stack_auth_backend)):
    """Get current user information from Stack Auth token"""
    # Get access token from headers
    access_token = request.headers.get("x-stack-access-token")
    
    if not access_token:
        raise HTTPException(status_code=401, detail="No access token provided")
    
    try:
        # Verify token with Stack Auth and get user info
        user_info = stack_auth.get_user_with_access_token(access_token)
        if not user_info:
            raise HTTPException(status_code=401, detail="Invalid access token")
        
        # Cache the user info for future requests
        cache_user_info(access_token, user_info)
        
        return user_info
        
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Failed to get user info: {str(e)}")

@router.post("/logout")
def logout(request: Request):
    """Logout the current user (clear cache)"""
    access_token = request.headers.get("x-stack-access-token")
    
    if access_token:
        # Remove from cache
        remove_cached_user(access_token)
    
    return {"message": "Logged out successfully"}

@router.get("/verify")
def verify_token(request: Request, stack_auth: StackAuthBackend = Depends(get_stack_auth_backend)):
    """Verify if the provided token is valid"""
    access_token = request.headers.get("x-stack-access-token")
    
    if not access_token:
        raise HTTPException(status_code=401, detail="No access token provided")
    
    try:
        user_info = stack_auth.get_user_with_access_token(access_token)
        if not user_info:
            raise HTTPException(status_code=401, detail="Invalid access token")
        
        return {"valid": True, "user": user_info}
        
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")

 