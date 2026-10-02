import re


def parse_log(log_text: str):
    lines = log_text.splitlines()

    errors = []
    warnings = []
    timestamps = []
    status_codes = []

    for line in lines:

        timestamp_match = re.search(
            r"\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}",
            line
        )

        if timestamp_match:
            timestamps.append(timestamp_match.group())

        if re.search(r"\bERROR\b", line, re.IGNORECASE):
            errors.append(line.strip())

        if re.search(r"\b(WARNING|WARN)\b", line, re.IGNORECASE):
            warnings.append(line.strip())

        status_matches = re.findall(
            r"\b(?:HTTP\s*)?[1-5]\d{2}\b",
            line
        )

        status_codes.extend(status_matches)

    return {
        "total_lines": len(lines),
        "errors": errors[:50],
        "warnings": warnings[:50],
        "timestamps": timestamps[:50],
        "status_codes": list(dict.fromkeys(status_codes))
    }