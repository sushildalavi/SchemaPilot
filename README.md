# SchemaPilot

SchemaPilot tracks JSON API contract drift.

It has two paths:

1. Scheduled drift monitoring for live endpoints.
2. Runtime contract guarding for payload samples submitted by middleware.

## What it does

- Infers schemas from observed payloads
- Computes deterministic schema hashes
- Diffs schema changes and classifies severity
- Persists snapshots and violations
- Powers a dashboard for triage and history

## Architecture

```mermaid
flowchart LR
  subgraph Sources
    A[Public APIs]
    B[Internal APIs]
    C[Drift simulator]
  end

  subgraph Backend
    M1[Monitor worker]
    M2[Schema inference]
    M3[Severity classifier]
    M4[Runtime guard]
  end

  DB[(PostgreSQL)]
  FE[React dashboard]

  A --> M1
  B --> M1
  C --> M1
  M1 --> M2 --> M3 --> DB
  M4 --> DB
  FE --> Backend
```

## Local run

```bash
docker compose up -d --build
curl -X POST http://localhost:8080/api/monitor/run-once \
  -H "X-SCHEMAPILOT-ADMIN-SECRET: dev-secret"
```

## Runtime guard

The runtime guard exposes a `POST /track` endpoint for live payload samples and a metrics endpoint for counts.

## Portfolio Proof

- Architecture and evaluation: [docs/PORTFOLIO_PROOF.md](/Users/sushildalavi/Desktop/Github/SchemaPilot/docs/PORTFOLIO_PROOF.md)
- Demo and local mode: use the Docker Compose command above
- Test commands: `pytest`, `npm run build`, `docker compose config`
- Evidence: benchmark and regression docs under `docs/`
