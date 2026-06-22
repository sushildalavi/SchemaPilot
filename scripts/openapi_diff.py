from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def _load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _extract_schema(payload: Any) -> dict[str, Any]:
    if isinstance(payload, dict):
        if "components" in payload and isinstance(payload["components"], dict):
            schemas = payload["components"].get("schemas")
            if isinstance(schemas, dict):
                return schemas
        if "schema" in payload and isinstance(payload["schema"], dict):
            return payload["schema"]
    return payload if isinstance(payload, dict) else {}


def diff_schemas(old: dict[str, Any], new: dict[str, Any]) -> dict[str, list[str]]:
    removed_fields: list[str] = []
    type_changes: list[str] = []
    required_changes: list[str] = []
    added_optional_fields: list[str] = []

    old_props = old.get("properties", {}) if isinstance(old, dict) else {}
    new_props = new.get("properties", {}) if isinstance(new, dict) else {}
    old_required = set(old.get("required", []) or [])
    new_required = set(new.get("required", []) or [])

    for field in sorted(set(old_props) - set(new_props)):
        removed_fields.append(field)
    for field in sorted(set(new_props) - set(old_props)):
        if field in new_required:
            required_changes.append(f"added required field: {field}")
        else:
            added_optional_fields.append(field)

    for field in sorted(set(old_props) & set(new_props)):
        old_type = _field_type(old_props[field])
        new_type = _field_type(new_props[field])
        if old_type and new_type and old_type != new_type:
            type_changes.append(f"{field}: {old_type} -> {new_type}")

    for field in sorted(new_required - old_required):
        required_changes.append(f"field became required: {field}")
    for field in sorted(old_required - new_required):
        required_changes.append(f"field no longer required: {field}")

    return {
        "removed_fields": removed_fields,
        "type_changes": type_changes,
        "required_changes": required_changes,
        "added_optional_fields": added_optional_fields,
    }


def classify_diff(diff: dict[str, list[str]]) -> dict[str, Any]:
    breaking = bool(diff["removed_fields"] or diff["type_changes"] or any("required" in item and "no longer" not in item for item in diff["required_changes"]))
    return {"breaking": breaking, "diff": diff}


def diff_openapi_documents(old_payload: Any, new_payload: Any) -> dict[str, Any]:
    old_schemas = _extract_schema(old_payload)
    new_schemas = _extract_schema(new_payload)

    aggregate = {
        "removed_fields": [],
        "type_changes": [],
        "required_changes": [],
        "added_optional_fields": [],
    }

    old_names = set(old_schemas) if isinstance(old_schemas, dict) else set()
    new_names = set(new_schemas) if isinstance(new_schemas, dict) else set()

    for schema_name in sorted(old_names - new_names):
        aggregate["removed_fields"].append(f"schema:{schema_name}")
    for schema_name in sorted(new_names - old_names):
        aggregate["added_optional_fields"].append(f"schema:{schema_name}")

    for schema_name in sorted(old_names & new_names):
        diff = diff_schemas(old_schemas[schema_name], new_schemas[schema_name])
        for key in aggregate:
            aggregate[key].extend(diff[key])

    return classify_diff(aggregate)


def _field_type(field_schema: Any) -> str:
    if isinstance(field_schema, dict):
        value = field_schema.get("type")
        if isinstance(value, str):
            return value
    return ""


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Diff two OpenAPI/JSON schema payloads.")
    parser.add_argument("--old", required=True)
    parser.add_argument("--new", required=True)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    result = diff_openapi_documents(_load_json(Path(args.old)), _load_json(Path(args.new)))
    print(json.dumps(result, indent=2, sort_keys=True))
    if result["breaking"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
