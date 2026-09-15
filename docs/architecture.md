# Architecture

```text
User
  │
  ▼
Browser
  │
  ├── UI state
  ├── local chat history
  └── benchmark selection
  │
  ▼
Flask backend
  │
  ├── /api/chat
  ├── /api/chat/stream
  ├── /api/benchmark
  └── /api/models
  │
  ▼
OpenAI-compatible gateway
  │
  └── selected LLM model
```

## Security boundary

The browser does not receive the upstream credential.

```text
Browser ──► Flask ──► external API
                 ▲
                 │
                .env
```

This is appropriate for local development. A production deployment would still require proper secret management, authentication, rate limiting, logging policy, and a production WSGI server.
