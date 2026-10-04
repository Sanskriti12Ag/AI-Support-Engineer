from services.ai_service import analyze_with_ai
from services.rules_engine import (
    build_hypotheses,
    build_troubleshooting_actions,
    detect_signals,
)


def run_troubleshooting(
    error_text: str,
    parsed_log: dict | None = None,
) -> dict:

    signals = detect_signals(error_text)

    hypotheses = build_hypotheses(
        error_text,
        signals,
    )

    rule_actions = build_troubleshooting_actions(
        error_text,
        signals,
    )

    ai_result = analyze_with_ai(
        error_text,
        parsed_log,
    )

    evidence = list(
        ai_result.get("evidence", [])
    )

    for category in signals["detected_categories"]:
        evidence.append(
            f"Rule engine detected {category}-related technical signals."
        )

    evidence = list(
        dict.fromkeys(evidence)
    )[:10]

    ai_actions = list(
        ai_result.get(
            "recommended_actions",
            [],
        )
    )

    recommended_actions = list(
        dict.fromkeys(
            ai_actions + rule_actions
        )
    )[:12]

    return {
        **ai_result,
        "hypotheses": hypotheses,
        "detected_signals": signals[
            "detected_categories"
        ],
        "recommended_actions": recommended_actions,
        "evidence": evidence,
    }