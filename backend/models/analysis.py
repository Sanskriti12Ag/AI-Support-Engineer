from typing import List, Literal

from pydantic import BaseModel, Field


# -----------------------------
# Analysis Request
# -----------------------------

class AnalysisRequest(BaseModel):
    error_text: str = Field(
        ...,
        min_length=1,
        max_length=50000
    )


# -----------------------------
# Log Summary
# -----------------------------

class LogSummary(BaseModel):
    total_lines: int = Field(
        ge=0
    )

    errors: List[str]

    warnings: List[str]

    timestamps: List[str]

    status_codes: List[str]


# -----------------------------
# Analysis Response
# -----------------------------

class AnalysisResponse(BaseModel):
    error_type: str = Field(
        min_length=1,
        max_length=200
    )

    category: Literal[
        "Database",
        "API",
        "Network",
        "Application",
        "Authentication",
        "Configuration",
        "Other"
    ]

    severity: Literal[
        "Low",
        "Medium",
        "High",
        "Critical"
    ]

    confidence: float = Field(
        ge=0.0,
        le=1.0
    )

    root_cause: str = Field(
        min_length=1,
        max_length=5000
    )

    explanation: str = Field(
        min_length=1,
        max_length=10000
    )

    suggested_fix: str = Field(
        min_length=1,
        max_length=10000
    )

    recommended_actions: List[str]

    evidence: List[str]

    log_summary: LogSummary


# -----------------------------
# Chat Request
# -----------------------------

class ChatRequest(BaseModel):
    analysis_id: int = Field(
        gt=0
    )

    question: str = Field(
        ...,
        min_length=1,
        max_length=5000
    )


# -----------------------------
# Chat Response
# -----------------------------

class ChatResponse(BaseModel):
    answer: str = Field(
        min_length=1,
        max_length=10000
    )