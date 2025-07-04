import random
import math
import requests
import base64
import os
import hashlib
import time
from urllib.parse import urlencode
from fastapi import APIRouter, Response, Request, HTTPException
from fastapi.responses import RedirectResponse
from api.util.request import get_domain
from api.util.cache import token_cache, hash_token, get_user_info_from_spotify

router = APIRouter()

STATE_KEY = "spotify_auth_state"
CLIENT_ID = os.environ["SPOTIFY_CLIENT_ID"]
CLIENT_SECRET = os.environ["SPOTIFY_CLIENT_SECRET"]
REDIRECT_URI = os.environ["SPOTIFY_REDIRECT_URI"]
DEFAULT_NEXT_URI = os.environ["SPOTIFY_DEFAULT_NEXT_URI"]

def generate_random_string(string_length):
    possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    text = "".join(
        [
            possible[math.floor(random.random() * len(possible))]
            for i in range(string_length)
        ]
    )
    return text



@router.get("/login")
def read_root(response: Response, request: Request):
    state = generate_random_string(20)
    scope = "user-read-private user-read-email playlist-read-private playlist-read-collaborative"

    # Get the 'next' parameter from the query string, default if not provided
    next_url = request.query_params.get("next") or get_domain(request) + DEFAULT_NEXT_URI

    params = {
        "response_type": "code",
        "client_id": CLIENT_ID,
        "scope": scope,
        "redirect_uri": get_domain(request) + REDIRECT_URI,
        "state": state,
    }
    # If the user has manually logged out, force re-prompt
    if request.cookies.get("spotify_logged_out") == "1":
        params["show_dialog"] = "true"

    response = RedirectResponse(
        url="https://accounts.spotify.com/authorize?" + urlencode(params)
    )
    response.set_cookie(key=STATE_KEY, value=state)
    response.set_cookie(key="spotify_next_url", value=next_url)
    return response

@router.get("/callback")
def callback(request: Request, response: Response):
    code = request.query_params["code"]
    state = request.query_params["state"]
    stored_state = request.cookies.get(STATE_KEY)
    next_url = request.cookies.get("spotify_next_url") or get_domain(request) + DEFAULT_NEXT_URI

    if state == None or state != stored_state:
        raise HTTPException(status_code=400, detail="State mismatch")
    else:
        response.delete_cookie(STATE_KEY, path="/", domain=None)
        response.delete_cookie("spotify_next_url", path="/", domain=None)
        response.delete_cookie("spotify_logged_out", path="/", domain=None)

        url = "https://accounts.spotify.com/api/token"
        request_string = CLIENT_ID + ":" + CLIENT_SECRET
        encoded_bytes = base64.b64encode(request_string.encode("utf-8"))
        encoded_string = str(encoded_bytes, "utf-8")
        header = {"Authorization": "Basic " + encoded_string}

        form_data = {
            "code": code,
            "redirect_uri": get_domain(request) + REDIRECT_URI,
            "grant_type": "authorization_code",
        }

        api_response = requests.post(url, data=form_data, headers=header)

        if api_response.status_code == 200:
            data = api_response.json()
            access_token = data["access_token"]
            refresh_token = data["refresh_token"]
            expires_in = data.get("expires_in", 3600)  # Default to 1 hour

            # Cache the user info and token details
            token_hash = hash_token(access_token)
            user_info = get_user_info_from_spotify(access_token)
            
            token_cache[token_hash] = {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "expires_at": time.time() + expires_in,
                "user_info": user_info
            }

            response = RedirectResponse(url=next_url)
            response.set_cookie(key="accessToken", value=access_token)
            response.set_cookie(key="refreshToken", value=refresh_token)
            response.delete_cookie("spotify_logged_out", path="/", domain=None)

        return response

@router.get("/refresh_token")
def refresh_token(request: Request):
    refresh_token = request.query_params["refresh_token"]
    request_string = CLIENT_ID + ":" + CLIENT_SECRET
    encoded_bytes = base64.b64encode(request_string.encode("utf-8"))
    encoded_string = str(encoded_bytes, "utf-8")
    header = {"Authorization": "Basic " + encoded_string}

    form_data = {"grant_type": "refresh_token", "refresh_token": refresh_token}
    url = "https://accounts.spotify.com/api/token"

    response = requests.post(url, data=form_data, headers=header)
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Error with refresh token")
    else:
        data = response.json()
        access_token = data["access_token"]
        expires_in = data.get("expires_in", 3600)
        
        # Update cache with new token
        token_hash = hash_token(access_token)
        user_info = get_user_info_from_spotify(access_token)
        
        token_cache[token_hash] = {
            "access_token": access_token,
            "refresh_token": refresh_token,  # Keep the same refresh token
            "expires_at": time.time() + expires_in,
            "user_info": user_info
        }
        
        return {"access_token": access_token}

@router.get("/logout")
def logout(response: Response):
    response = RedirectResponse(url="/")
    response.delete_cookie("accessToken", path="/", domain=None)
    response.delete_cookie("refreshToken", path="/", domain=None)
    response.delete_cookie(STATE_KEY, path="/", domain=None)
    response.delete_cookie("spotify_next_url", path="/", domain=None)
    response.set_cookie("spotify_logged_out", "1", path="/")
    return response

 