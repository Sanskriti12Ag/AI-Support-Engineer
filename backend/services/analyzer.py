from services.log_parser import parse_log
from services.troubleshooter import run_troubleshooting


def analyze_error(error_text: str) -> dict:
    """
    Main analysis entry point.

    The workflow:
    - Parse the supplied log/error.
    - Run deterministic signal detection.
    - Generate troubleshooting hypotheses.
    - Use AI for deeper reasoning.
    """

    parsed_log = parse_log(error_text)

    result = run_troubleshooting(
        error_text,
        parsed_log,
    )

    result["log_summary"] = parsed_log

    return result