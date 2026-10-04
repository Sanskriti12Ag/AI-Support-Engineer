import json

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
    Depends
)

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from models.analysis import (
    AnalysisRequest,
    AnalysisResponse
)

from models.database_models import Analysis

from services.database import get_db
from services.analyzer import analyze_error


# -----------------------------
# Router Configuration
# -----------------------------

router = APIRouter(
    prefix="/api/analysis",
    tags=["Analysis"]
)


# -----------------------------
# Constants
# -----------------------------

MAX_LOG_SIZE = 2 * 1024 * 1024  # 2 MB


# -----------------------------
# Save Analysis to Database
# -----------------------------

def save_analysis(
    result: dict,
    original_input: str,
    db: Session
):
    try:
        analysis = Analysis(
            error_type=result["error_type"],
            category=result["category"],
            severity=result["severity"],
            confidence=str(result["confidence"]),
            root_cause=result["root_cause"],
            explanation=result["explanation"],
            suggested_fix=result["suggested_fix"],
            recommended_actions=json.dumps(
                result["recommended_actions"]
            ),
            evidence=json.dumps(
                result["evidence"]
            ),
            original_input=original_input
        )

        db.add(analysis)

        db.commit()

        db.refresh(analysis)

        return analysis

    except (
        SQLAlchemyError,
        KeyError,
        TypeError,
        ValueError
    ):
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to save analysis."
        )


# -----------------------------
# Analyze Pasted Error
# -----------------------------

@router.post(
    "/",
    response_model=AnalysisResponse
)
def analyze(
    request: AnalysisRequest,
    db: Session = Depends(get_db)
):
    result = analyze_error(
        request.error_text
    )

    save_analysis(
        result,
        request.error_text,
        db
    )

    return result


# -----------------------------
# Analyze Uploaded Log File
# -----------------------------

@router.post(
    "/upload",
    response_model=AnalysisResponse
)
async def analyze_log_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    # -----------------------------
    # Validate filename
    # -----------------------------

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file provided."
        )

    # -----------------------------
    # Validate file extension
    # -----------------------------

    if not file.filename.lower().endswith(".log"):
        raise HTTPException(
            status_code=400,
            detail="Only .log files are supported."
        )

    # -----------------------------
    # Read uploaded file
    # -----------------------------

    content = await file.read()

    # -----------------------------
    # Validate file size
    # -----------------------------

    if len(content) > MAX_LOG_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Log file is too large. Maximum size is 2 MB."
        )

    # -----------------------------
    # Decode UTF-8
    # -----------------------------

    try:
        log_text = content.decode("utf-8")

    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Log file must use UTF-8 encoding."
        )

    # -----------------------------
    # Reject empty files
    # -----------------------------

    if not log_text.strip():
        raise HTTPException(
            status_code=400,
            detail="The log file is empty."
        )

    # -----------------------------
    # Analyze log
    # -----------------------------

    result = analyze_error(
        log_text
    )

    # -----------------------------
    # Save analysis
    # -----------------------------

    save_analysis(
        result,
        log_text,
        db
    )

    return result