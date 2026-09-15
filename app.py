import json
import os
import time

from dotenv import load_dotenv
from flask import Flask, Response, jsonify, request, send_from_directory
from openai import OpenAI

load_dotenv()

app = Flask(__name__, static_folder="frontend", static_url_path="")

API_KEY = os.getenv("OAO_API_KEY", "").strip()
BASE_URL = os.getenv("OAO_BASE_URL", "https://oao.clipora.buzz/v1").strip()

MODELS = [
    "auto-oao-1",
    "claude-fable-5-vip",
    "deepseek-v4-flash",
    "deepseek-v4-pro",
    "gemini-3.7-flash",
    "glm-5.2",
    "glm-5.3",
    "glm-5.3-flash",
    "glm-5.3-vip",
    "gpt-6-astra-vip",
    "grok-4.5",
    "kimi-k3",
    "qwen3.8-27b",
]


def get_client():
    if not API_KEY:
        raise RuntimeError("OAO_API_KEY belum diisi di file .env")
    return OpenAI(api_key=API_KEY, base_url=BASE_URL)


def clean_messages(messages):
    if not isinstance(messages, list):
        raise ValueError("messages harus berupa array")

    cleaned = []
    for item in messages:
        if not isinstance(item, dict):
            continue
        role = item.get("role")
        content = item.get("content")
        if role not in {"system", "user", "assistant"}:
            continue
        if not isinstance(content, str):
            continue
        cleaned.append({"role": role, "content": content})

    if not cleaned:
        raise ValueError("messages kosong")
    return cleaned


@app.get("/")
def index():
    return send_from_directory("frontend", "index.html")


@app.get("/api/health")
def health():
    return jsonify({
        "ok": bool(API_KEY),
        "base_url": BASE_URL,
        "message": "Backend ready" if API_KEY else "API key belum diisi",
    })


@app.get("/api/models")
def models():
    return jsonify({"models": MODELS})


@app.post("/api/chat")
def chat():
    data = request.get_json(silent=True) or {}
    model = (data.get("model") or MODELS[0]).strip()

    try:
        messages = clean_messages(data.get("messages"))
        started = time.perf_counter()

        result = get_client().chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.7,
        )

        elapsed_ms = round((time.perf_counter() - started) * 1000)
        usage = getattr(result, "usage", None)

        return jsonify({
            "content": result.choices[0].message.content or "",
            "model": getattr(result, "model", model),
            "latency_ms": elapsed_ms,
            "usage": {
                "prompt_tokens": getattr(usage, "prompt_tokens", None) if usage else None,
                "completion_tokens": getattr(usage, "completion_tokens", None) if usage else None,
                "total_tokens": getattr(usage, "total_tokens", None) if usage else None,
            },
        })
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.post("/api/chat/stream")
def chat_stream():
    data = request.get_json(silent=True) or {}
    model = (data.get("model") or MODELS[0]).strip()

    try:
        messages = clean_messages(data.get("messages"))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400

    def generate():
        started = time.perf_counter()
        try:
            stream = get_client().chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.7,
                stream=True,
            )

            yield f"event: meta\ndata: {json.dumps({'model': model})}\n\n"

            for chunk in stream:
                delta = ""
                if getattr(chunk, "choices", None):
                    delta_obj = getattr(chunk.choices[0], "delta", None)
                    delta = getattr(delta_obj, "content", None) or ""

                if delta:
                    yield f"data: {json.dumps({'content': delta})}\n\n"

            elapsed_ms = round((time.perf_counter() - started) * 1000)
            yield f"event: done\ndata: {json.dumps({'latency_ms': elapsed_ms})}\n\n"
        except Exception as exc:
            yield f"event: error\ndata: {json.dumps({'error': str(exc)})}\n\n"

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/benchmark")
def benchmark():
    data = request.get_json(silent=True) or {}
    models = data.get("models") or []
    prompt = (data.get("prompt") or "").strip()

    if not prompt:
        return jsonify({"error": "Prompt benchmark belum diisi"}), 400

    valid_models = [m for m in models if m in MODELS]
    if not valid_models:
        return jsonify({"error": "Pilih setidaknya satu model"}), 400

    results = []

    for model in valid_models:
        started = time.perf_counter()
        try:
            result = get_client().chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
            )
            elapsed_ms = round((time.perf_counter() - started) * 1000)
            usage = getattr(result, "usage", None)

            results.append({
                "model": model,
                "ok": True,
                "latency_ms": elapsed_ms,
                "content": result.choices[0].message.content or "",
                "total_tokens": getattr(usage, "total_tokens", None) if usage else None,
            })
        except Exception as exc:
            results.append({
                "model": model,
                "ok": False,
                "latency_ms": round((time.perf_counter() - started) * 1000),
                "error": str(exc),
            })

    return jsonify({"results": results})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
