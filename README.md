# OAO AI Router — Multi-Model AI Client

A portfolio-ready local AI client built around an OpenAI-compatible API gateway.

The project demonstrates:
- REST API integration
- Flask backend architecture
- API-key isolation with `.env`
- multi-model selection
- streamed chat responses
- Markdown rendering and code blocks
- local chat history
- model benchmarking with latency/token comparison
- responsive UI

## Architecture

```text
Browser
   │
   ▼
HTML / CSS / JavaScript
   │
   ▼
Flask API (localhost)
   │
   ├── /api/chat
   ├── /api/chat/stream
   └── /api/benchmark
   │
   ▼
OpenAI-compatible API gateway
   │
   ├── auto-oao-1
   ├── Claude family
   ├── DeepSeek family
   ├── Gemini family
   ├── GLM family
   └── other models exposed by the provider
```

## Run on Windows

1. Extract the ZIP.
2. Open the folder in VS Code.
3. Copy `.env.example` to `.env`.
4. Put your **new** API key into `.env`.
5. Double-click `run_windows.bat`.

Or use VS Code terminal:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

Then open:

`http://127.0.0.1:5000`

## Important security note

Do not commit `.env` to GitHub. The supplied `.gitignore` already excludes it.

The API key that was previously exposed in chat/screenshots should be considered compromised. Use a regenerated key.

## Portfolio positioning

Suggested title:

**Multi-Model AI Router & Benchmark Client**

Suggested one-line description:

> Built a local AI client that routes requests through an OpenAI-compatible gateway, supports multiple LLMs, streams responses, and benchmarks model latency and token usage.

See `portfolio/case-study.md` for a ready-to-use case study.
