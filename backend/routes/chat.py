import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models.analysis import ChatRequest, ChatResponse
from models.database_models import Analysis
from services.ai_service import answer_follow_up
from services.database import get_db


router = APIRouter(
    prefix="/api/chat",
    tags=["AI Chat"]
)


@router.post(
    "/",
    response_model=ChatResponse
)
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db)
):

    item = (
        db.query(Analysis)
        .filter(Analysis.id == request.analysis_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found"
        )

    analysis = {
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
        "original_input": item.original_input
    }

    answer = answer_follow_up(
        request.question,
        analysis
    )

    return {
        "answer": answer
    }