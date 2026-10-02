from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_analysis_validation():
    response = client.post(
        "/api/analysis/",
        json={
            "error_text": ""
        }
    )

    assert response.status_code in [400, 422]