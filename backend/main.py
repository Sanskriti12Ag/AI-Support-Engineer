import logging
import time

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from services.database import check_database, init_db

from routes.analysis import router as analysis_router
from routes.chat import router as chat_router
from routes.history import router as history_router


logging.basicConfig(
    level=getattr(
        logging,
        settings.LOG_LEVEL.upper(),
        logging.INFO,
    ),
    format=(
        "%(asctime)s | "
        "%(levelname)s | "
        "%(name)s | "
        "%(message)s"
    ),
)

logger = logging.getLogger(
    "ai-support-engineer"
)


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_logging_middleware(
    request: Request,
    call_next,
):
    start_time = time.perf_counter()

    try:
        response = await call_next(request)

        duration = (
            time.perf_counter() - start_time
        )

        duration_ms = round(
            duration * 1000,
            2,
        )

        response.headers[
            "X-Process-Time"
        ] = f"{duration_ms}ms"

        logger.info(
            "%s %s -> %s | %sms",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )

        return response

    except Exception:
        duration = (
            time.perf_counter() - start_time
        )

        duration_ms = round(
            duration * 1000,
            2,
        )

        logger.exception(
            "%s %s -> 500 | %sms",
            request.method,
            request.url.path,
            duration_ms,
        )

        raise


@app.exception_handler(
    RequestValidationError
)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
):
    logger.warning(
        "Validation error: %s %s",
        request.method,
        request.url.path,
    )

    return JSONResponse(
        status_code=422,
        content={
            "error": "ValidationError",
            "detail": "Invalid request data.",
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(
    request: Request,
    exc: Exception,
):
    logger.exception(
        "Unhandled exception: %s %s",
        request.method,
        request.url.path,
    )

    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "detail": (
                "An unexpected error occurred. "
                "Please try again later."
            ),
        },
    )


@app.on_event("startup")
def startup():
    init_db()

    logger.info(
        "Starting %s in %s environment",
        settings.APP_NAME,
        settings.ENVIRONMENT,
    )


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
    }


@app.get("/ready")
def readiness():
    database_ready = check_database()

    if not database_ready:
        return JSONResponse(
            status_code=503,
            content={
                "status": "not_ready",
                "database": "unavailable",
            },
        )

    return {
        "status": "ready",
        "database": "available",
    }


app.include_router(
    analysis_router
)

app.include_router(
    chat_router
)

app.include_router(
    history_router
)