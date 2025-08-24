import os
from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from backend.middleware.db_conn.global_db_conn import initialize_engine

# Import custom middleware for detailed exception logging
from backend.middleware.error_logging import exception_logging_middleware
from backend.routers import account, auth, health, mixtape, spotify


def create_app(database_url: str | None = None) -> FastAPI:
    """Factory function to create FastAPI app with configurable database"""

    # Initialize the database connection.
    if database_url is not None:
        initialize_engine(database_url)

    api_prefix = "/api"

    app = FastAPI(
        docs_url=f"{api_prefix}/docs",
        openapi_url=f"{api_prefix}/openapi.json",
    )

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allows all origins
        allow_credentials=True,
        allow_methods=["*"],  # Allows all methods
        allow_headers=["*"],  # Allows all headers
    )

    # Include routers
    app.include_router(auth.router, prefix=f"{api_prefix}/auth", tags=["auth"])
    app.include_router(account.router, prefix=f"{api_prefix}/account", tags=["account"])
    app.include_router(health.router, prefix=f"{api_prefix}/health", tags=["health"])
    app.include_router(spotify.router, prefix=f"{api_prefix}/spotify", tags=["spotify"])
    app.include_router(mixtape.router, prefix=f"{api_prefix}/mixtape", tags=["mixtape"])

    # TODO: delete some of this middleware or move it elsewhere.
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

    # Add global exception logging middleware
    app.middleware("http")(exception_logging_middleware)

    return app
