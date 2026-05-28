# SchemaPilot Production Cleanup Plan

## Current State (Audit)
- Active branch: `schema-upgrade-event-driven-registry`
- Repo currently contains two backend surfaces:
  - `app/` runtime guard service (`/track` path)
  - `backend/` separate API service
- Benchmark and migration artifacts exist but are partially inconsistent with latest runtime refactors.
- Local/dev artifacts are already ignored by `.gitignore`; no tracked `.pyc`, `__pycache__`, `node_modules`, or cache directories.

## Risks To Address
1. Runtime path correctness and performance hardening after outbox refactor.
2. Incomplete Kafka integration (publisher currently defaults to noop).
3. Lifecycle/worker reliability (startup/shutdown safety, retry correctness).
4. Test coverage gaps for outbox worker and non-blocking request path.
5. Documentation drift between old benchmark notes and current code behavior.

## Execution Plan (Commit-by-commit)
1. Repo hygiene and documentation baseline.
2. Runtime API surface normalization and route clarity docs.
3. Outbox enqueue path transactional test coverage.
4. Outbox worker unit/integration tests.
5. Kafka publisher abstraction completion and tests.
6. Metrics coverage updates (including outbox metrics assertions).
7. Docker/runtime config hardening.
8. Bench harness normalization and repeatability.
9. QA gate scripts and final cleanup.

## Non-Goals
- No destructive cleanup of user-owned baseline files.
- No benchmark number claims without real run artifacts.
