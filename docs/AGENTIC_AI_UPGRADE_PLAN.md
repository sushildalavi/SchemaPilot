# SchemaPilot Agentic AI Upgrade Plan

## Current relevant capabilities
- Deterministic schema diffing exists in `scripts/openapi_diff.py` and `backend/app/core/schema_diff.py`.
- Severity classification is already rule-based in `backend/app/core/severity.py`.
- Scheduled monitoring and runtime guard paths already exist in `backend/app/main.py`, `backend/app/workers/monitor_runner.py`, and the API routers.
- Tests and benchmark artifacts already cover diffing, severity, and load behavior.

## Safest agentic extension points
- Build a deterministic contract-review agent around the existing diff and severity code.
- Keep the output as review assistance, not an autonomous CI system.
- Reuse fixture-based OpenAPI inputs and existing classification outputs.
- Make the generated PR comment purely descriptive and evidence-backed.

## Proposed files to change
- `scripts/contract_review_agent.py`
- `docs/AGENTIC_CONTRACT_REVIEW.md`
- `tests/test_contract_review_agent.py`
- `backend/app/schemas.py` only if a shared trace model is needed

## Tests to add
- Removed required field fails.
- Added optional field passes.
- Type change fails.
- Generated PR comment includes evidence.
- Trace schema remains stable.

## Local demo command
- `python scripts/contract_check.py --old tests/fixtures/openapi_old.json --new tests/fixtures/openapi_new.json`

## Risks / unknowns
- The repo already has a strong deterministic path, so an agent layer should stay small and not become the source of truth.
- The output must not imply CI autonomy beyond the actual diff result.
- Need to confirm whether the agent should target the monitor path, the runtime guard path, or both.

## What not to claim
- Do not claim autonomous merge decisions.
- Do not claim production CI integration.
- Do not claim the agent is LLM-dependent by default.
- Do not claim more than the underlying diff logic proves.
