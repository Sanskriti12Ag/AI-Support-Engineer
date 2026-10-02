from services.log_parser import parse_log
from services.ai_service import analyze_with_ai


def analyze_error(error_text: str):

    parsed_log = parse_log(error_text)

    ai_result = analyze_with_ai(
        error_text,
        parsed_log
    )

    ai_result["log_summary"] = parsed_log

    return ai_result