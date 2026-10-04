import os
import sys
from pathlib import Path

# ---------------------------------------------------------
# Make the backend directory importable during pytest
# ---------------------------------------------------------

BACKEND_DIR = Path(__file__).resolve().parents[1]

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


# ---------------------------------------------------------
# Use a separate SQLite database for tests
# ---------------------------------------------------------

os.environ["DATABASE_URL"] = "sqlite:///./test_support_engineer.db"


# ---------------------------------------------------------
# Imports after environment/path setup
# ---------------------------------------------------------

import pytest
from fastapi.testclient import TestClient

from main import app
from services.database import Base, engine


# ---------------------------------------------------------
# Test database setup
# ---------------------------------------------------------

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """
    Create all database tables before the test suite starts.

    The test database is completely separate from the normal
    application database.
    """
    Base.metadata.create_all(bind=engine)

    yield

    Base.metadata.drop_all(bind=engine)


# ---------------------------------------------------------
# FastAPI test client
# ---------------------------------------------------------

@pytest.fixture
def client():
    """
    Provide a FastAPI TestClient for each test.
    """
    with TestClient(app) as test_client:
        yield test_client