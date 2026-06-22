# Agentic Contract Review

The SchemaPilot contract review agent is a deterministic wrapper around the existing OpenAPI diff logic.

## Workflow

1. OpenAPI Diff Agent
2. Breaking Change Classifier
3. Migration Suggestion Agent
4. CI Gate Agent
5. PR Comment Generator

## Output

- breaking changes
- non-breaking changes
- risk level
- suggested migration
- CI decision
- PR comment markdown
- trace

## Guardrails

- The agent does not merge code.
- The agent does not replace the canonical diff engine.
- Output is based on fixture files or local OpenAPI payloads only.
