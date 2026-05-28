# k6 Event Registry Results

Source artifacts:
- `docs/benchmarks/k6_25vus.json`
- `docs/benchmarks/k6_50vus.json`
- `docs/benchmarks/k6_100vus.json`
- `docs/benchmarks/k6_200vus.json`
- Aggregate: `docs/benchmarks/k6_event_registry_results.json`

## Stability summary
- Maximum tested stable concurrency: **200 VUs**
- Each tier executed **5000 requests**
- Connection reset/EOF during finalized runs: **0**
- App crash/restart during finalized runs: **0**
- Duplicate baselines: **0**
- DLQ captures present in DB: **1** (from prior webhook-failure test path)

## Metrics table

| Concurrency | Total Requests | Success | Failure | p50 (ms) | p90 (ms) | p95 (ms) | p99 (ms) | Throughput (req/s) |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 25 | 5000 | 5000 | 0 | 270.14 | 678.27 | 933.72 | 1628.26 | 69.86 |
| 50 | 5000 | 5000 | 0 | 630.04 | 1291.79 | 1664.90 | 2253.84 | 68.84 |
| 100 | 5000 | 5000 | 0 | 1139.53 | 2108.72 | 2479.58 | 3289.54 | 79.49 |
| 200 | 5000 | 5000 | 0 | 2483.55 | 5043.26 | 6483.66 | 10714.92 | 67.92 |

## Prometheus snapshot
- Captured at: `docs/benchmarks/prometheus_metrics_snapshot.prom`
- Includes:
  - `drift_detection_latency_seconds`
  - `advisory_lock_wait_seconds`
  - `webhook_publish_latency_seconds`
  - `dlq_size`
  - `drift_count_total`
  - `compatibility_classification_total`
  - `webhook_delivery_failures_total`
  - `kafka_publish_failures_total`
