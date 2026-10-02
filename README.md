# AI Support Engineer

AI-powered developer troubleshooting assistant that analyzes application errors and log files, identifies probable root causes, explains failures, and recommends practical remediation steps.

## Overview

AI Support Engineer is a full-stack troubleshooting application designed to help developers investigate application failures faster.

Users can:

- Paste an application error
- Upload `.log` files
- Automatically parse log information
- Analyze errors using a locally running LLM
- Identify error category and severity
- Generate a probable root cause
- Receive a clear explanation
- Get suggested fixes and recommended actions
- View supporting evidence from the submitted error
- Ask follow-up questions about an analyzed error
- View previous analyses through history

The application uses Ollama with Llama 3 locally, so AI analysis can run without sending log data to an external AI API.

---

## Features

### Error Analysis

Submit an application error and receive structured troubleshooting information:

- Error type
- Category
- Severity
- Confidence
- Probable root cause
- Explanation
- Suggested fix
- Evidence
- Recommended actions

### Log File Analysis

Upload `.log` files directly from the frontend.

The backend:

1. Validates the file extension
2. Enforces a 2 MB upload limit
3. Validates UTF-8 encoding
4. Rejects empty files
5. Parses useful log information
6. Sends the log to the local AI model
7. Stores the analysis result

### Log Parsing

The application extracts information such as:

- Total number of lines
- Error messages
- Warning messages
- Timestamps
- HTTP status codes

### AI Troubleshooting

The application uses:

- Ollama
- Llama 3 8B
- Structured JSON prompting
- JSON response extraction
- Confidence-based analysis

The AI is instructed not to invent evidence and to identify uncertain root causes as probable causes.

### Follow-up AI Chat

After analyzing an error, users can ask additional technical questions about the same problem.

### Analysis History

Completed analyses are stored in SQLite and can be retrieved through the backend API.

### Automated Testing

The backend includes pytest tests for:

- Health endpoint
- Analysis request validation

---

## Architecture

```text
                    AI SUPPORT ENGINEER
                           |
              +------------+------------+
              |                         |
              v                         v
        Paste an Error             Upload Log
              |                         |
              +------------+------------+
                           |
                           v
                    React Frontend
                           |
                           v
                    FastAPI REST API
                           |
                           v
                    Python Backend
                           |
              +------------+------------+
              |                         |
              v                         v
        Log Parser                 AI Service
              |                         |
              +------------+------------+
                           |
                           v
                    Analysis Engine
                           |
             +-------------+-------------+
             |             |             |
             v             v             v
         Severity      Root Cause    Suggested Fix
             |             |             |
             +-------------+-------------+
                           |
                           v
                    SQLite Database
                           |
                           v
                    Analysis History
