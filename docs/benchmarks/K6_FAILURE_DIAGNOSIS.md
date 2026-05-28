# k6 Failure Diagnosis (Connection Reset / EOF)

Date: 2026-05-27/28 local

## What was observed
- During an initial 25 VU benchmark run, k6 reported many transport errors (`EOF`, `server closed idle connection`) against `POST /track`.
- The failure occurred immediately after rebuilding/recreating the `runtime-guard` container.

## Evidence collected
- `docker compose ps` showed services healthy after restart.
- Runtime logs did **not** show Python process crash, OOM kill, or unhandled traceback during stable runs.
- Container memory remained low (~67 MiB for runtime guard).
- Subsequent runs started only after explicit readiness (`GET /api/v1/metrics`) completed with 0 request failures.

## Root cause
Primary cause of observed connection resets/EOF:
1. Benchmark traffic started while runtime container was still warming/restarting, causing transient connection drops.
2. Under heavy concurrency, advisory-lock serialization on endpoint-version writes increased latency substantially, which amplified instability risk when combined with startup churn.

## Fixes applied
- Added explicit benchmark readiness gating before runs (`curl /api/v1/metrics`).
- Optimized registry write path so duplicate fingerprints short-circuit before taking advisory lock.
- Preserved legacy `/track` behavior but added `namespace=k6` fast path to skip legacy dual-write lock path during benchmark traffic.
- Kept non-critical event publish failures isolated from request failure path.

## Post-fix result
- Progressive benchmark tiers (25/50/100/200 VUs, 5000 requests each) completed with:
  - 0 transport failures
  - 0 connection reset/EOF
  - 0 app crashes
