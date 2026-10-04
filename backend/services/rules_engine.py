import re


SIGNAL_PATTERNS = {
    "database": [
        r"\bdatabase\b",
        r"\bsql\b",
        r"\bmysql\b",
        r"\bpostgres\b",
        r"\bpostgresql\b",
        r"\bmongodb\b",
        r"\bmongo\b",
        r"connection refused.*database",
        r"relation .* does not exist",
        r"table .* does not exist",
        r"database connection",
    ],
    "network": [
        r"connection refused",
        r"connection reset",
        r"connection timed out",
        r"\btimeout\b",
        r"timed out",
        r"\bdns\b",
        r"network unreachable",
        r"no route to host",
        r"\bsocket\b",
        r"host unreachable",
    ],
    "api": [
        r"http\s+4\d\d",
        r"http\s+5\d\d",
        r"status code",
        r"bad gateway",
        r"gateway timeout",
        r"internal server error",
        r"\b404\b",
        r"\b401\b",
        r"\b403\b",
        r"\b429\b",
        r"\b500\b",
        r"\b502\b",
        r"\b503\b",
        r"\b504\b",
    ],
    "authentication": [
        r"unauthorized",
        r"authentication failed",
        r"invalid token",
        r"invalid credentials",
        r"access denied",
        r"permission denied",
        r"forbidden",
        r"\bjwt\b",
        r"token expired",
    ],
    "application": [
        r"\bexception\b",
        r"\btraceback\b",
        r"nullpointer",
        r"attributeerror",
        r"typeerror",
        r"valueerror",
        r"keyerror",
        r"referenceerror",
        r"segmentation fault",
        r"panic:",
        r"fatal error",
    ],
    "configuration": [
        r"environment variable",
        r"env var",
        r"configuration",
        r"\bconfig\b",
        r"missing .* variable",
        r"invalid configuration",
        r"configuration error",
    ],
    "linux": [
        r"permission denied",
        r"command not found",
        r"no such file or directory",
        r"disk full",
        r"no space left on device",
        r"out of memory",
        r"oom",
        r"process killed",
        r"\bkilled\b",
        r"port .* already in use",
        r"address already in use",
        r"segmentation fault",
        r"cannot execute",
        r"failed to start",
        r"service failed",
        r"systemd",
        r"journalctl",
    ],
    "performance": [
        r"slow request",
        r"high latency",
        r"latency",
        r"response time",
        r"request took",
        r"performance",
        r"cpu usage",
        r"memory usage",
        r"high memory",
        r"high cpu",
    ],
}


def detect_signals(error_text: str) -> dict:
    text = error_text.lower()

    signals = {
        category: []
        for category in SIGNAL_PATTERNS
    }

    for category, patterns in SIGNAL_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, text):
                signals[category].append(pattern)

    detected_categories = [
        category
        for category, matches in signals.items()
        if matches
    ]

    return {
        "signals": signals,
        "detected_categories": detected_categories,
        "signal_count": sum(
            len(matches)
            for matches in signals.values()
        ),
    }


def build_hypotheses(error_text: str, signals: dict) -> list[str]:
    categories = signals.get("detected_categories", [])
    hypotheses = []

    if "linux" in categories:
        if re.search(
            r"permission denied|cannot execute",
            error_text,
            re.IGNORECASE,
        ):
            hypotheses.append(
                "The process may not have sufficient Linux file or execution permissions."
            )

        if re.search(
            r"disk full|no space left on device",
            error_text,
            re.IGNORECASE,
        ):
            hypotheses.append(
                "The Linux filesystem may be out of available disk space."
            )

        if re.search(
            r"out of memory|oom|process killed",
            error_text,
            re.IGNORECASE,
        ):
            hypotheses.append(
                "The system or container may have exhausted available memory."
            )

        if re.search(
            r"port .* already in use|address already in use",
            error_text,
            re.IGNORECASE,
        ):
            hypotheses.append(
                "Another process may already be listening on the required port."
            )

        if re.search(
            r"command not found",
            error_text,
            re.IGNORECASE,
        ):
            hypotheses.append(
                "The required command may not be installed or may be missing from PATH."
            )

    if "database" in categories:
        hypotheses.append(
            "The application may be unable to connect to or query the database."
        )

    if "network" in categories:
        hypotheses.append(
            "A network connectivity, DNS, timeout, or service availability problem may be occurring."
        )

    if "api" in categories:
        hypotheses.append(
            "The application may be receiving an unsuccessful response from an API or downstream service."
        )

    if "authentication" in categories:
        hypotheses.append(
            "Authentication, authorization, credentials, or token validation may be failing."
        )

    if "application" in categories:
        hypotheses.append(
            "An application-level exception may be caused by invalid data, missing values, or unexpected program state."
        )

    if "configuration" in categories:
        hypotheses.append(
            "A missing or invalid configuration value may be preventing the application from operating correctly."
        )

    if "performance" in categories:
        hypotheses.append(
            "The application or infrastructure may be experiencing elevated latency or resource utilization."
        )

    if not hypotheses:
        hypotheses.append(
            "The available log information is insufficient to determine a specific root cause."
        )

    return list(dict.fromkeys(hypotheses))[:8]


def build_troubleshooting_actions(
    error_text: str,
    signals: dict,
) -> list[str]:
    categories = signals.get("detected_categories", [])
    actions = []

    if "linux" in categories:
        if re.search(
            r"permission denied|cannot execute",
            error_text,
            re.IGNORECASE,
        ):
            actions.extend([
                "Check file and directory permissions with ls -l.",
                "Verify the process user has the required permissions.",
                "Check ownership with ls -la and chown where appropriate.",
            ])

        if re.search(
            r"disk full|no space left on device",
            error_text,
            re.IGNORECASE,
        ):
            actions.extend([
                "Check filesystem usage with df -h.",
                "Check large directories and files with du -sh.",
                "Remove or rotate unnecessary logs and temporary files.",
            ])

        if re.search(
            r"out of memory|oom|process killed",
            error_text,
            re.IGNORECASE,
        ):
            actions.extend([
                "Check memory usage with free -h.",
                "Inspect processes with top or ps.",
                "Check whether the system OOM killer terminated the process.",
            ])

        if re.search(
            r"port .* already in use|address already in use",
            error_text,
            re.IGNORECASE,
        ):
            actions.extend([
                "Identify the process using the port with ss -ltnp.",
                "Stop or reconfigure the conflicting service.",
            ])

        if re.search(
            r"command not found",
            error_text,
            re.IGNORECASE,
        ):
            actions.extend([
                "Verify the required command is installed.",
                "Check the PATH environment variable.",
            ])

        if re.search(
            r"failed to start|service failed|systemd",
            error_text,
            re.IGNORECASE,
        ):
            actions.extend([
                "Check service status with systemctl status.",
                "Inspect service logs with journalctl.",
            ])

    if "network" in categories:
        actions.extend([
            "Verify DNS resolution and network connectivity.",
            "Check whether the destination service is reachable.",
        ])

    if "database" in categories:
        actions.extend([
            "Verify database availability and connection settings.",
            "Check database credentials and connectivity.",
        ])

    if "api" in categories:
        actions.extend([
            "Check the HTTP response code and downstream service logs.",
            "Verify request parameters, authentication, and API availability.",
        ])

    if "authentication" in categories:
        actions.extend([
            "Verify credentials, tokens, permissions, and authentication configuration.",
        ])

    if "performance" in categories:
        actions.extend([
            "Check CPU and memory utilization.",
            "Measure request latency and inspect slow operations.",
        ])

    return list(dict.fromkeys(actions))[:12]