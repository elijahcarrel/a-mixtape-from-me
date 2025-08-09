import logging
import os
from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse


def create_app(database_url: str | None = None) -> FastAPI:
    """Factory function to create FastAPI app with configurable database"""

    # Set the database URL for this app instance

    from backend.database import create_tables, get_db, set_database_url

    set_database_url(database_url)

    # Create tables if database URL is provided
    if database_url:
        try:
            create_tables(database_url)
        except Exception as e:
            # Log the error but don't fail app creation (useful for tests)
            print(f"Warning: Could not create tables: {e}")

    api_prefix = "/api"

    app = FastAPI(
        docs_url=f"{api_prefix}/docs",
        openapi_url=f"{api_prefix}/openapi.json",
    )

    # Store the database dependency in app state
    def get_db_dep():
        if database_url:
            yield from get_db(database_url)
        else:
            # For testing or when no database is configured
            yield None

    app.state.get_db_dep = get_db_dep

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allows all origins
        allow_credentials=True,
        allow_methods=["*"],  # Allows all methods
        allow_headers=["*"],  # Allows all headers
    )

    # Import routers
    from backend.routers import account, auth, health, mixtape, spotify

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

    @app.middleware("http")
    async def catch_exceptions_middleware(request: Request, call_next):
        try:
            return await call_next(request)
        except Exception as e:
            print(f"Unhandled exception: {e}")
            logging.exception("Exception caught in middleware")
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"},
            )

    return app
