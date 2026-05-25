from __future__ import annotations

import asyncio
import os
import random
from dataclasses import dataclass
from typing import Any

import httpx
import psycopg2

TRACK_URL = "http://localhost:8000/track"
REQUESTS = 5000
CONCURRENCY = 200


@dataclass
class SimulationResult:
    total: int
    success: int
    failure: int


def payload_variant(i: int) -> dict[str, Any]:
    base: dict[str, Any] = {
        "user_id": i,
        "meta": {"tags": ["admin", "staff"], "active": True},
        "score": 42,
        "price": 42.5,
    }
    phase = i % 5
    if phase == 1:
        base["optional"] = None
    elif phase == 2:
        base["score"] = 42.5
    elif phase == 3:
        base["price"] = 42
    elif phase == 4:
        base.pop("meta")
    return base


async def _submit(client: httpx.AsyncClient, i: int) -> bool:
    body = {
        "service_name": "chaos-client",
        "http_method": "POST",
        "route_path": "/mocked/contracts",
        "payload": payload_variant(i),
    }
    try:
        r = await client.post(TRACK_URL, json=body)
        return r.status_code == 200
    except httpx.HTTPError:
        return False


async def run_simulation() -> SimulationResult:
    sem = asyncio.Semaphore(CONCURRENCY)

    async with httpx.AsyncClient(timeout=15) as client:
        async def bounded(i: int) -> bool:
            async with sem:
                await asyncio.sleep(random.random() * 0.01)
                return await _submit(client, i)

        results = await asyncio.gather(*(bounded(i) for i in range(REQUESTS)))

    success = sum(1 for ok in results if ok)
    return SimulationResult(total=REQUESTS, success=success, failure=REQUESTS - success)


async def main() -> None:
    result = await run_simulation()
    print(f"total={result.total} success={result.success} failure={result.failure}")
    assert result.failure == 0, "simulation encountered failed submissions"

    dsn = os.getenv("DATABASE_URL_SYNC", "postgresql://schemapilot:dev@localhost:5432/schemapilot")
    with psycopg2.connect(dsn) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM api_endpoints WHERE route_path = %s", ("/mocked/contracts",))
            endpoint_count = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM schema_snapshots")
            snapshot_count = cur.fetchone()[0]
            cur.execute(
                """
                SELECT severity, COUNT(*)
                FROM contract_drift_violations
                GROUP BY severity
                ORDER BY severity
                """
            )
            severity_rows = cur.fetchall()

    assert endpoint_count == 1, f"expected exactly one endpoint row, got {endpoint_count}"
    assert snapshot_count >= 1, "expected at least one schema snapshot"
    severity_counts = {sev: count for sev, count in severity_rows}

    async with httpx.AsyncClient(timeout=15) as client:
        metrics_url = TRACK_URL.rsplit("/track", 1)[0] + "/api/v1/metrics"
        metrics_res = await client.get(metrics_url)
        assert metrics_res.status_code == 200, f"metrics endpoint failed: {metrics_res.status_code}"
        metrics_json = metrics_res.json()

    print(
        "metrics:",
        {
            "endpoint_count": endpoint_count,
            "snapshot_count": snapshot_count,
            "severity_counts": severity_counts,
            "metrics_endpoint": metrics_json,
        },
    )
    assert severity_counts.get("SAFE", 0) > 0, "expected SAFE drift logs"
    assert severity_counts.get("RISKY", 0) > 0, "expected RISKY drift logs"
    assert severity_counts.get("BREAKING", 0) > 0, "expected BREAKING drift logs"


if __name__ == "__main__":
    asyncio.run(main())
