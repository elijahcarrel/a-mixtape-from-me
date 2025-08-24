import logging
import traceback
from fastapi import Request, Response
from fastapi.responses import JSONResponse


# Configure basic logging at import time if the root logger has no handlers configured.
# This is important on platforms like Vercel where the runtime might not configure logging.
if not logging.getLogger().handlers:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )


async def exception_logging_middleware(request: Request, call_next) -> Response:  # type: ignore
    """Middleware that logs unhandled exceptions with full traceback.

    The middleware catches all exceptions raised downstream, logs the full traceback, and
    returns a generic 500 response. This ensures that we never swallow errors silently in
    production (e.g. Vercel logs).
    """
    try:
        return await call_next(request)
    except Exception as exc:  # pylint: disable=broad-except
        # Log full traceback along with request information for debugging.
        logging.error(
            "Unhandled exception while processing %s %s: %s\n%s",
            request.method,
            request.url.path,
            exc,
            traceback.format_exc(),
        )

        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )