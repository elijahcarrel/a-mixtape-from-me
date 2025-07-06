from fastapi import FastAPI, Request, Response
from typing import Awaitable, Callable, Optional
from fastapi.middleware.cors import CORSMiddleware
import os

def create_app(database_url: Optional[str] = None) -> FastAPI:
    """Factory function to create FastAPI app with configurable database"""
    
    # Set the database URL for this app instance
    from api.database import set_database_url
    set_database_url(database_url)
    
    api_prefix = "/api/main"
    
    app = FastAPI(docs_url=f"{api_prefix}/docs", openapi_url=f"{api_prefix}/openapi.json")
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allows all origins
        allow_credentials=True,
        allow_methods=["*"],  # Allows all methods
        allow_headers=["*"],  # Allows all headers
    )
    
    # Import routers (they'll use the database_url when get_db is called)
    from api.routers import auth, account, health, spotify, mixtape
    
    # Include routers
    app.include_router(auth.router, prefix=f"{api_prefix}/auth", tags=["auth"])
    app.include_router(account.router, prefix=f"{api_prefix}/account", tags=["account"])
    app.include_router(health.router, prefix=f"{api_prefix}/health", tags=["health"])
    app.include_router(spotify.router, prefix=f"{api_prefix}/spotify", tags=["spotify"])
    app.include_router(mixtape.router, prefix=f"{api_prefix}/mixtape", tags=["mixtape"])
    
    @app.get(f"{api_prefix}/")
    def root():
        return {"status": "ok", "env": os.getenv("VERCEL_ENV")}
    
    @app.get(f"{api_prefix}/debug")
    async def debug(request: Request):
        return dict(request.headers)
    
    @app.middleware("http")
    async def debug_path(request: Request, call_next: Callable[[Request], Awaitable[Response]]):
        print(f"Incoming path: {request.url.path}")
        response = await call_next(request)
        print(f"Outgoing response status: {str(response.status_code)}")
        return response
    
    return app 