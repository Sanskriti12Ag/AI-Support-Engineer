import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models.database_models import Analysis
from services.database import get_db


router = APIRouter(
    prefix="/api/history",
    tags=["History"]
)


@router.get("/")
def get_history(
    db: Session = Depends(get_db)
):

    analyses = (
        db.query(Analysis)
        .order_by(Analysis.created_at.desc())
        .limit(50)
        .all()
    )

    return [
        {
            "id": item.id,
            "error_type": item.error_type,
            "category": item.category,
            "severity": item.severity,
            "confidence": float(item.confidence),
            "root_cause": item.root_cause,
            "created_at": item.created_at
        }
        for item in analyses
    ]


@router.get("/{analysis_id}")
def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)
):

    item = (
        db.query(Analysis)
        .filter(Analysis.id == analysis_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found"
        )

    return {
        "id": item.id,
        "error_type": item.error_type,
        "category": item.category,
        "severity": item.severity,
        "confidence": float(item.confidence),
        "root_cause": item.root_cause,
        "explanation": item.explanation,
        "suggested_fix": item.suggested_fix,
        "recommended_actions": json.loads(
            item.recommended_actions
        ),
        "evidence": json.loads(
            item.evidence
        ),
        "original_input": item.original_input,
        "created_at": item.created_at
    }