from typing import List
from pydantic import BaseModel, Field


class AnalysisRequest(BaseModel):
    error_text: str = Field(..., min_length=1, max_length=50000)


class LogSummary(BaseModel):
    total_lines: int
    errors: List[str]
    warnings: List[str]
    timestamps: List[str]
    status_codes: List[str]


class AnalysisResponse(BaseModel):
    error_type: str
    category: str
    severity: str
    confidence: float
    root_cause: str
    explanation: str
    suggested_fix: str
    recommended_actions: List[str]
    evidence: List[str]
    log_summary: LogSummary


class ChatRequest(BaseModel):
    analysis_id: int
    question: str = Field(..., min_length=1, max_length=5000)


class ChatResponse(BaseModel):
    answer: str