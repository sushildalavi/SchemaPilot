from __future__ import annotations

import hashlib
import json
from typing import Any


def canonicalize(payload: Any) -> Any:
    if isinstance(payload, dict):
        return {k: canonicalize(v) for k, v in sorted(payload.items(), key=lambda kv: kv[0])}
    if isinstance(payload, list):
        return [canonicalize(v) for v in payload]
    if payload is None:
        return {"type": "null", "nullable": True}
    if isinstance(payload, bool):
        return {"type": "boolean", "nullable": False}
    if isinstance(payload, int):
        return {"type": "integer", "nullable": False}
    if isinstance(payload, float):
        return {"type": "number", "nullable": False}
    if isinstance(payload, str):
        return {"type": "string", "nullable": False}
    return {"type": "unknown", "nullable": True}


def fingerprint(canonical_schema: dict[str, Any]) -> str:
    blob = json.dumps(canonical_schema, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(blob.encode("utf-8")).hexdigest()
