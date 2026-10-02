from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routes.analysis import router as analysis_router
from routes.history import router as history_router
from routes.chat import router as chat_router


app = FastAPI(
    title="AI Support Engineer",
    description="AI-powered developer troubleshooting assistant",
    version="1.0.0",
)


# -----------------------------
# CORS
# -----------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Global Error Handling
# -----------------------------

@app.exception_handler(RuntimeError)
async def runtime_error_handler(
    request: Request,
    exc: RuntimeError,
):
    return JSONResponse(
        status_code=503,
        content={
            "error": str(exc),
            "service": "AI Support Engineer",
        },
    )


# -----------------------------
# Routes
# -----------------------------

app.include_router(analysis_router)
app.include_router(history_router)
app.include_router(chat_router)


# -----------------------------
# Basic Endpoints
# -----------------------------

@app.get("/")
def root():
    return {
        "message": "AI Support Engineer API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "AI Support Engineer",
    }