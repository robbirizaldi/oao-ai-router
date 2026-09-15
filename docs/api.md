# API Notes

The Flask backend exposes a thin local API so the browser never receives the upstream API credential.

## GET /api/health

Returns basic backend readiness.

## GET /api/models

Returns the configured model list used by the UI.

## POST /api/chat

Request:

```json
{
  "model": "auto-oao-1",
  "messages": [
    {"role": "user", "content": "Hello"}
  ]
}
```

Response shape:

```json
{
  "content": "Hello...",
  "model": "auto-oao-1",
  "latency_ms": 1200,
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 15,
    "total_tokens": 25
  }
}
```

Usage fields can be `null` if the upstream provider does not return usage metadata.

## POST /api/chat/stream

The endpoint emits incremental text using an event-stream response.

Conceptually:

```text
event: meta
data: {"model":"auto-oao-1"}

data: {"content":"Hello"}

data: {"content":" world"}

event: done
data: {"latency_ms":1200}
```

The exact upstream streaming behavior depends on provider compatibility.

## POST /api/benchmark

Request:

```json
{
  "prompt": "Explain class weighting versus SMOTE.",
  "models": ["auto-oao-1", "deepseek-v4-pro"]
}
```

The endpoint sequentially requests each selected model and returns a result object per model.
