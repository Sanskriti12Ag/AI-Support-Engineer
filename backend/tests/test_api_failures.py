from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_health():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_readiness():
    response = client.get("/ready")

    assert response.status_code == 200
    assert response.json()["status"] == "ready"


def test_empty_analysis():
    response = client.post(
        "/api/analysis/",
        json={
            "error_text": ""
        },
    )

    assert response.status_code == 422


def test_analysis_missing_field():
    response = client.post(
        "/api/analysis/",
        json={},
    )

    assert response.status_code == 422


def test_analysis_too_large():
    response = client.post(
        "/api/analysis/",
        json={
            "error_text": "A" * 50001
        },
    )

    assert response.status_code == 422


def test_invalid_log_extension():
    response = client.post(
        "/api/analysis/upload",
        files={
            "file": (
                "error.txt",
                b"some error",
                "text/plain",
            )
        },
    )

    assert response.status_code == 400


def test_missing_analysis():
    response = client.get(
        "/api/history/999999"
    )

    assert response.status_code == 404


def test_invalid_chat_analysis_id():
    response = client.post(
        "/api/chat/",
        json={
            "analysis_id": 999999,
            "question": "Why did this fail?",
        },
    )

    assert response.status_code == 404


def test_process_time_header():
    response = client.get("/health")

    assert "X-Process-Time" in response.headers