import os


def get_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default

    return value.strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }


class Settings:
    APP_NAME = os.getenv(
        "APP_NAME",
        "AI Support Engineer",
    )

    ENVIRONMENT = os.getenv(
        "ENVIRONMENT",
        "development",
    )

    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "sqlite:///./support_engineer.db",
    )

    OLLAMA_URL = os.getenv(
        "OLLAMA_URL",
        "http://localhost:11434/api/chat",
    )

    OLLAMA_MODEL = os.getenv(
        "OLLAMA_MODEL",
        "llama3:8b",
    )

    MAX_LOG_SIZE = int(
        os.getenv(
            "MAX_LOG_SIZE",
            str(2 * 1024 * 1024),
        )
    )

    FRONTEND_ORIGINS = [
        origin.strip()
        for origin in os.getenv(
            "FRONTEND_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    ]

    LOG_LEVEL = os.getenv(
        "LOG_LEVEL",
        "INFO",
    )

    DEBUG = get_bool(
        os.getenv("DEBUG"),
        default=False,
    )


settings = Settings()