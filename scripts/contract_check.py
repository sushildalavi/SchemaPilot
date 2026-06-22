from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.openapi_diff import diff_openapi_documents, _load_json


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run a local contract check against two schema fixtures.")
    parser.add_argument("--old", default="tests/fixtures/openapi_old.json")
    parser.add_argument("--new", default="tests/fixtures/openapi_new.json")
    return parser


def main() -> None:
    args = build_parser().parse_args()
    result = diff_openapi_documents(_load_json(Path(args.old)), _load_json(Path(args.new)))
    print(json.dumps(result, indent=2, sort_keys=True))
    if result["breaking"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
