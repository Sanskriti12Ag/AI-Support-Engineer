import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models.database_models import Analysis
from services.database import get_db


router = APIRouter(
    prefix="/api/history",
    tags=["History"]
)


def analysis_to_response(analysis: Analysis) -> dict:
    """
    Convert a database Analysis object into the format
    expected by the frontend.
    """

    def parse_json(value, default=None):
        if not value:
            return default if default is not None else []

        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return default if default is not None else []

    return {
        "id": analysis.id,
        "error_type": analysis.error_type,
        "category": analysis.category,
        "severity": analysis.severity,
        "confidence": float(analysis.confidence),
        "root_cause": analysis.root_cause,
        "explanation": analysis.explanation,
        "suggested_fix": analysis.suggested_fix,
        "recommended_actions": parse_json(
            analysis.recommended_actions
        ),
        "evidence": parse_json(
            analysis.evidence
        ),
        "original_input": analysis.original_input,
        "created_at": (
            analysis.created_at.isoformat()
            if analysis.created_at
            else None
        ),
    }


@router.get("/")
def get_history(
    db: Session = Depends(get_db)
):
    analyses = (
        db.query(Analysis)
        .order_by(Analysis.created_at.desc())
        .all()
    )

    return [
        {
            "id": analysis.id,
            "error_type": analysis.error_type,
            "category": analysis.category,
            "severity": analysis.severity,
            "confidence": float(analysis.confidence),
            "root_cause": analysis.root_cause,
            "created_at": (
                analysis.created_at.isoformat()
                if analysis.created_at
                else None
            ),
        }
        for analysis in analyses
    ]


@router.get("/{analysis_id}")
def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)
):
    analysis = (
        db.query(Analysis)
        .filter(Analysis.id == analysis_id)
        .first()
    )

    if not analysis:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found."
        )

    return analysis_to_response(analysis)