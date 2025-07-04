from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Load environment variables from .env.local file in development.
if os.getenv('VERCEL_ENV') is None:
    load_dotenv('.env.local')

# Create FastAPI instance with custom docs and openapi url
app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Import and include routers
from api.routers import spotify, health

app.include_router(spotify.router, prefix="/api/py/spotify", tags=["spotify"])
app.include_router(health.router, prefix="/api/py/health", tags=["health"]) 