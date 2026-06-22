from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def _load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _metric(metrics: dict[str, Any], key: str, stat: str) -> Any:
    value = metrics.get(key, {})
    if isinstance(value, dict):
        return value.get(stat)
    return None


def summarize_artifact(path: Path) -> dict[str, Any]:
    payload = _load_json(path)
    metrics = payload.get("metrics", {})
    http_reqs = metrics.get("http_reqs", {})
    duration = metrics.get("http_req_duration", {})
    failed = metrics.get("http_req_failed", {})
    vus = metrics.get("vus", metrics.get("vus_max", {}))
    return {
        "artifact": path.name,
        "vus": vus.get("value") if isinstance(vus, dict) else None,
        "requests": http_reqs.get("count") if isinstance(http_reqs, dict) else None,
        "p95_latency_ms": duration.get("p(95)") if isinstance(duration, dict) else None,
        "error_rate": failed.get("value") if isinstance(failed, dict) else None,
        "throughput_rps": http_reqs.get("rate") if isinstance(http_reqs, dict) else None,
    }


def render_markdown(rows: list[dict[str, Any]]) -> str:
    lines = [
        "# SchemaPilot Benchmark Summary",
        "",
        "| artifact | VUs | requests | p95 latency ms | error rate | throughput rps |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    for row in rows:
        lines.append(
            "| {artifact} | {vus} | {requests} | {p95_latency_ms} | {error_rate} | {throughput_rps} |".format(
                **row
            )
        )
    return "\n".join(lines)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Summarize SchemaPilot k6 benchmark artifacts.")
    parser.add_argument(
        "--artifacts",
        nargs="+",
        default=["docs/benchmarks/k6_smoke.json", "docs/benchmarks/k6_50vus.json"],
    )
    parser.add_argument("--output", default="")
    return parser


def main() -> None:
    args = build_parser().parse_args()
    rows = [summarize_artifact(Path(path)) for path in args.artifacts]
    markdown = render_markdown(rows)
    if args.output:
        Path(args.output).write_text(markdown + "\n", encoding="utf-8")
    else:
        print(markdown)


if __name__ == "__main__":
    main()

