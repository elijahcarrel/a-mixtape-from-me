from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Load environment variables from .env.local file in development.
print(f"vercel env is {str(os.getenv('VERCEL_ENV'))}")
if os.getenv('VERCEL_ENV') is None:
    print("loading dotenv")
    load_dotenv('.env.local')

api_prefix = "/api/main"

# Create FastAPI instance with custom docs and openapi url
app = FastAPI(docs_url=f"{api_prefix}/docs", openapi_url=f"{api_prefix}/openapi.json")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

from api.routers import spotify, health

# Import and include routers
app.include_router(spotify.router, prefix=f"{api_prefix}/spotify", tags=["spotify"])
app.include_router(health.router, prefix=f"{api_prefix}/health", tags=["health"]) 

@app.get(f"{api_prefix}/")
def root():
    return {"status": "ok", "env": os.getenv("VERCEL_ENV")}

@app.get(f"{api_prefix}/debug")
async def debug(request: Request):
    return dict(request.headers)

@app.middleware("http")
async def debug_path(request: Request, call_next):
    print(f"Incoming path: {request.url.path}")
    response = await call_next(request)
    return response
