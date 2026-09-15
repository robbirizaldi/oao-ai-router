# Multi-Model AI Router & Benchmark Client

## Overview

This project explores a practical approach to interacting with multiple large language models through a single OpenAI-compatible API interface.

Instead of building a separate client for each model, the application centralizes model selection, conversation management, response streaming, and lightweight performance benchmarking behind one local Flask backend.

## Problem

Different LLMs can behave differently across reasoning, coding, speed, and cost-related trade-offs.

Switching between providers manually is inconvenient, and raw API calls are not an ideal interface for iterative experimentation.

## Solution

I built a small full-stack AI client with:

- a responsive browser interface
- a Flask API backend
- secure API-key handling through environment variables
- model selection
- streaming responses
- Markdown/code rendering
- local chat history
- a benchmark mode for comparing models on the same prompt

## Technical Architecture

```text
Frontend
HTML + CSS + JavaScript
        │
        ▼
Flask Backend
        │
        ├── Chat
        ├── Streaming
        └── Benchmark
        │
        ▼
OpenAI-compatible API
        │
        ▼
Multiple LLM models
```

## Technical Decisions

### Why Flask?

The backend is intentionally lightweight. Flask makes the REST layer easy to inspect and keeps the project focused on API integration rather than framework complexity.

### Why keep the API key server-side?

Putting an API key into browser JavaScript would expose it to every visitor. The frontend only talks to the local Flask backend; the backend holds the secret in `.env`.

### Why benchmark models?

A model name alone does not tell the whole story. The benchmark view makes it easier to compare:

- response latency
- successful/failed requests
- token usage when returned by the provider
- qualitative output side-by-side

## Limitations

The upstream provider is third-party. Model availability, naming, limits, response formats, and reliability may change independently of this project.

This project is therefore best presented as an **API integration and model-routing experiment**, not as evidence that the upstream provider is an official endpoint for every listed model.

## Possible Future Work

- persistent database-backed conversations
- authentication
- configurable system prompts
- file/document ingestion
- retrieval-augmented generation (RAG)
- automatic model routing based on task type
- evaluation datasets and scoring metrics
- background benchmark jobs
- production deployment using a WSGI server

## Portfolio Summary

> A full-stack multi-model AI client built with Flask and vanilla JavaScript, featuring streaming chat, model selection, local conversation history, and cross-model performance benchmarking through an OpenAI-compatible API gateway.
