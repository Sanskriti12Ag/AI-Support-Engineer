from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models.analysis import ChatRequest, ChatResponse
from models.database_models import Analysis
from services.database import get_db
from services.ai_service import answer_follow_up

router = APIRouter(
    prefix="/api/chat",
    tags=["Chat"]
)


@router.post("/", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    analysis = (
        db.query(Analysis)
        .filter(Analysis.id == request.analysis_id)
        .first()
    )

    if not analysis:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found."
        )

    answer = answer_follow_up(
        analysis.original_input,
        analysis,
        request.question
    )

    return {
        "answer": answer
    }