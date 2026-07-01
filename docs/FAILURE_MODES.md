# Failure Modes

How DriftGate behaves when things go wrong, by component.

## Webhook gateway (`gateway/`)

| Failure | Behavior | Status code |
|---|---|---|
| Missing `X-Signature` header | Rejected before body processing | `401` |
| Invalid HMAC signature | Rejected via constant-time comparison | `403` |
| Malformed JSON body | Rejected with structured error | `400` |
| Duplicate idempotency key | Rejected, original response not replayed | `409` |
| Payload exceeds body size limit (default 256 KiB) | Rejected by Fastify body parser | `413` |
| Runtime service unreachable / enqueue throws | Structured `enqueue_failed` error returned to caller | `502` |

The gateway never silently drops a webhook: every rejection returns a structured JSON
error body so callers (and their retry logic) can distinguish a permanent rejection
(signature/schema) from a transient one (`502`).

## Runtime contract guard (`app/`)

- **Drift classification failure**: if a payload can't be normalized or fingerprinted,
  the request fails validation rather than being silently accepted as a new schema
  version — see `app/core/parser.py` and `app/runtime/classifier.py`.
- **Concurrent registration race**: `POST /track` inserts new fingerprints under
  `pg_advisory_xact_lock`, so two concurrent requests for the same endpoint can't create
  duplicate schema versions (see `docs/ARCHITECTURE.md`).
- **Document store unavailable**: payload snapshots, diff documents, and validation
  errors are best-effort writes to MongoDB. A document store outage does not block the
  Postgres-backed validation/drift decision path — Postgres remains the source of truth
  for schema state; Mongo failures degrade auditability, not correctness.

## Webhook delivery / DLQ (`app/runtime/webhook.py`)

- Deliveries are retried up to `max_attempts` (default 3) with per-attempt logging to
  `webhook_delivery_attempts`.
- After the final failed attempt, the event is upserted into `webhook_delivery_dlq`
  (keyed on `event_id, consumer_id`, so repeated failures update attempt count rather
  than duplicating rows).
- Inactive subscriptions (`subscription.active = false`) are skipped entirely — no
  delivery attempt, no DLQ entry.
- **DLQ replay** (`replay_dlq_entry`) makes a single attempt (`max_attempts=1`,
  `persist_dlq=False`) so a bad replay doesn't create a second DLQ entry for the same
  failure; the outcome (`replayed: true/false`) is recorded as a replay artifact in the
  document store when one is configured.
- If the original subscription no longer exists at replay time, replay fails fast with
  `subscription_not_found` instead of guessing a target.

## Event backend (`app/runtime/event_backends.py`)

- Selecting `EVENT_BACKEND=kafka` or `EVENT_BACKEND=azure_service_bus` without supplying
  a working producer/sender raises `RuntimeError` at startup — this is intentional
  fail-fast behavior so a misconfigured deployment doesn't silently drop drift events by
  falling back to no-op.
- The no-op backend (default) is the explicit "events disabled" state; it never raises.

## MongoDB document store (`app/runtime/document_store.py`)

- List/query helpers return empty results rather than raising when a collection is
  empty — callers (dashboard pages) render an empty state instead of an error.
- Document writes are independent per document type (snapshot, diff, validation error,
  replay artifact); a failure writing one does not roll back or block the others.

## Known limitations

- No dead-letter queue exists for drift *events* published to Kafka/Service Bus — only
  webhook *deliveries* to consumers have a DLQ today.
- Retry backoff between webhook delivery attempts is not currently configurable per
  consumer.
- Document store writes are fire-and-forget; there is no reconciliation job to detect a
  missed write after a Mongo outage.
