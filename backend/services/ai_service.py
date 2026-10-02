import json
import os
import re

import requests


OLLAMA_URL = os.getenv(
    "OLLAMA_URL",
    "http://localhost:11434/api/chat",
)

OLLAMA_MODEL = os.getenv(
    "OLLAMA_MODEL",
    "llama3:8b",
)


# -----------------------------
# Ollama Request
# -----------------------------

def call_ollama(prompt: str) -> str:
    """
    Send a prompt to the locally running Ollama model.
    """

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are an expert software support engineer. "
                            "Give accurate, practical and concise technical answers."
                        ),
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                "stream": False,
                "options": {
                    "temperature": 0.1,
                },
            },
            timeout=120,
        )

        response.raise_for_status()

        data = response.json()

        return data["message"]["content"].strip()

    except requests.exceptions.ConnectionError:
        raise RuntimeError(
            "Ollama is not running. Please start Ollama and try again."
        )

    except requests.exceptions.Timeout:
        raise RuntimeError(
            "The AI model took too long to respond. Please try again."
        )

    except requests.exceptions.RequestException as exc:
        raise RuntimeError(
            f"Ollama request failed: {exc}"
        )

    except (KeyError, TypeError, ValueError):
        raise RuntimeError(
            "Ollama returned an unexpected response."
        )


# -----------------------------
# Extract JSON from AI Response
# -----------------------------

def extract_json(content: str) -> dict:
    """
    Extract a JSON object from the AI response.

    Handles responses such as:

    {
        ...
    }

    or:

    Here is the JSON:

    {
        ...
    }

    or:

    ```json
    {
        ...
    }
    ```
    """

    content = content.strip()

    # Remove Markdown code fences if present
    content = re.sub(
        r"```json\s*",
        "",
        content,
        flags=re.IGNORECASE
    )

    content = re.sub(
        r"```\s*$",
        "",
        content
    )

    content = content.strip()

    # First attempt:
    # Try parsing the complete response.
    try:
        return json.loads(content)

    except json.JSONDecodeError:
        pass

    # Second attempt:
    # Find the first JSON object in the response.
    start = content.find("{")

    if start == -1:
        raise ValueError(
            "No JSON object found in AI response."
        )

    # Try possible closing braces.
    for end in range(
        len(content),
        start,
        -1
    ):
        candidate = content[start:end].strip()

        if not candidate.endswith("}"):
            continue

        try:
            return json.loads(candidate)

        except json.JSONDecodeError:
            continue

    raise ValueError(
        "AI response contained JSON, but it could not be parsed."
    )


# -----------------------------
# Analyze Error With AI
# -----------------------------

def analyze_with_ai(
    error_text: str,
    parsed_log=None
):
    """
    Analyze an application error or log using local Ollama AI.
    """

    log_context = ""

    if parsed_log:
        log_context = f"""
Parsed log information:

{json.dumps(parsed_log, indent=2)}
"""

    prompt = f"""
You are an expert software support engineer.

Analyze the following application error or log:

{error_text}

{log_context}

Return ONLY a JSON object.

Do NOT write:
- "Here is the JSON"
- explanations before the JSON
- explanations after the JSON
- Markdown code fences
- ```json

The response must start with {{ and end with }}.

Use exactly these fields:

{{
    "error_type": "short error type",
    "category": "Database/API/Network/Application/Authentication/Configuration/Other",
    "severity": "Low/Medium/High/Critical",
    "confidence": 0.0,
    "root_cause": "probable root cause",
    "explanation": "clear explanation of what happened",
    "suggested_fix": "specific practical fix",
    "evidence": [
        "evidence from the supplied error"
    ],
    "recommended_actions": [
        "action 1",
        "action 2",
        "action 3"
    ]
}}

Rules:

- confidence must be a number between 0 and 1.
- Do not invent evidence.
- Only use evidence present in the supplied error or parsed log.
- Keep the diagnosis practical.
- If the exact root cause cannot be confirmed, say it is a probable cause.
- Return ONLY the JSON object.
"""

    content = call_ollama(prompt)

    try:
        result = extract_json(content)

        return result

    except ValueError:
        return {
            "error_type": "AI Response Parsing Error",
            "category": "Application",
            "severity": "Medium",
            "confidence": 0.5,
            "root_cause": (
                "The local AI model returned a response "
                "that could not be parsed as JSON."
            ),
            "explanation": content,
            "suggested_fix": (
                "Retry the analysis with a shorter error log."
            ),
            "evidence": [
                "The AI response could not be parsed as JSON."
            ],
            "recommended_actions": [
                "Retry the analysis",
                "Reduce the log size",
                "Check the Ollama model response",
            ],
        }


# -----------------------------
# Follow-up AI Chat
# -----------------------------

def answer_follow_up(
    error_text: str,
    question: str
):
    """
    Answer a user's follow-up question about
    a previously analyzed error.
    """

    prompt = f"""
You are an expert software support engineer.

The user previously submitted this error:

{error_text}

The user now asks:

{question}

Answer the question clearly and practically.

Rules:

- Stay focused on the supplied error.
- Explain technical concepts simply.
- Do not invent facts that are not supported by the error.
- If something cannot be determined from the error, say so.
- Give commands or code examples when useful.
"""

    return call_ollama(prompt)