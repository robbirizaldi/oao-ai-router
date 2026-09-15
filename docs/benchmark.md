# Benchmark Notes

The benchmark feature is designed as a practical comparison tool rather than a formal scientific evaluation framework.

## What is measured

For each selected model:

1. Start a timer.
2. Send the same prompt.
3. Wait for completion.
4. Record elapsed milliseconds.
5. Capture token usage when available.
6. Store the model response.

## Better evaluation methodology

For more rigorous experiments:

- use a fixed prompt suite
- run each test multiple times
- randomize model order where practical
- separate cold-start from warm requests
- report median and percentile latency
- use task-specific quality metrics
- record failures and rate-limit events
- preserve the exact model/version identifier

Example future table:

| Model | Runs | Median | P95 | Success | Avg tokens |
|---|---:|---:|---:|---:|---:|
| Model A | 10 | 1.9s | 3.0s | 100% | 820 |
| Model B | 10 | 2.4s | 3.6s | 90% | 760 |

Do not interpret a single request as a definitive ranking of model quality.
