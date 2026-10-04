from services.rules_engine import (
    build_hypotheses,
    build_troubleshooting_actions,
    detect_signals,
)


def test_detect_linux_permission_error():
    result = detect_signals(
        "Linux permission denied while opening /var/log/app.log"
    )

    assert "linux" in result["detected_categories"]


def test_detect_disk_full():
    result = detect_signals(
        "No space left on device"
    )

    assert "linux" in result["detected_categories"]


def test_detect_out_of_memory():
    result = detect_signals(
        "Process killed because of out of memory"
    )

    assert "linux" in result["detected_categories"]


def test_detect_port_conflict():
    result = detect_signals(
        "Address already in use: port 8000"
    )

    assert "linux" in result["detected_categories"]


def test_detect_http_error():
    result = detect_signals(
        "HTTP 503 Service Unavailable"
    )

    assert "api" in result["detected_categories"]


def test_detect_database_and_network():
    result = detect_signals(
        "Connection refused while connecting to PostgreSQL"
    )

    assert "database" in result["detected_categories"]
    assert "network" in result["detected_categories"]


def test_build_linux_hypothesis():
    signals = detect_signals(
        "Permission denied while executing deploy.sh"
    )

    hypotheses = build_hypotheses(
        "Permission denied while executing deploy.sh",
        signals,
    )

    assert len(hypotheses) > 0
    assert any(
        "permissions" in hypothesis.lower()
        for hypothesis in hypotheses
    )


def test_build_linux_actions():
    text = "No space left on device"

    signals = detect_signals(text)

    actions = build_troubleshooting_actions(
        text,
        signals,
    )

    assert any(
        "df -h" in action
        for action in actions
    )