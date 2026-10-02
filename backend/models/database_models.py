from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime

from services.database import Base


class Analysis(Base):

    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)

    error_type = Column(String(100))
    category = Column(String(100))
    severity = Column(String(50))

    confidence = Column(String(20))

    root_cause = Column(Text)
    explanation = Column(Text)
    suggested_fix = Column(Text)

    recommended_actions = Column(Text)
    evidence = Column(Text)

    original_input = Column(Text)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )