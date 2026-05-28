from __future__ import annotations

import time
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.runtime.canonical import canonicalize, fingerprint
from app.runtime.classifier import diff_and_classify, summarize_classification
from app.runtime.events import EventPublisher, publish_with_retry
from app.runtime.metrics import (
    COMPATIBILITY_CLASSIFICATION_TOTAL,
    DLQ_SIZE,
    DRIFT_COUNT_TOTAL,
    DRIFT_DETECTION_LATENCY_SECONDS,
    KAFKA_PUBLISH_FAILURES_TOTAL,
)
from app.runtime.models import DriftEvent
from app.runtime.registry import get_current_schema, upsert_schema_version
from app.runtime.subscriptions import select_affected_subscriptions
from app.runtime.webhook import deliver_with_retry


async def track_contract(
    db: AsyncSession,
    *,
    namespace: str,
    service_name: str,
    http_method: str,
    route_path: str,
    payload: dict[str, Any],
    publisher: EventPublisher,
) -> dict[str, Any]:
    start = time.perf_counter()
    canonical_schema = canonicalize(payload)
    new_fingerprint = fingerprint(canonical_schema)

    endpoint_id, endpoint_name, new_record, inserted = await upsert_schema_version(
        db,
        namespace=namespace,
        service_name=service_name,
        http_method=http_method,
        route_path=route_path,
        fingerprint=new_fingerprint,
        canonical_schema=canonical_schema,
        classification="SAFE",
    )

    current = await get_current_schema(db, endpoint_id)
    diffs: list[dict[str, Any]] = []
    classification = "SAFE"
    old_fp = new_fingerprint
    old_version = new_record.version
    affected = []
    deliveries = []

    if inserted and new_record.previous_version_id:
        prior = await db.execute(
            text(
                """
                SELECT version, fingerprint, canonical_schema
                FROM contract_schema_versions
                WHERE id = CAST(:id AS uuid)
                """
            ),
            {"id": new_record.previous_version_id},
        )
        p = prior.one()
        old_version = int(p[0])
        old_fp = str(p[1])
        diff_objs = diff_and_classify(p[2], canonical_schema)
        diffs = [d.__dict__ for d in diff_objs]
        classification = summarize_classification(diff_objs)
        await db.execute(
            text(
                """
                UPDATE contract_schema_versions
                SET compatibility_classification = :classification
                WHERE id = CAST(:id AS uuid)
                """
            ),
            {"classification": classification, "id": new_record.id},
        )
        await db.commit()

        COMPATIBILITY_CLASSIFICATION_TOTAL.labels(classification=classification).inc()
        DRIFT_COUNT_TOTAL.labels(severity=classification, endpoint_id=endpoint_id).inc()

        affected = await select_affected_subscriptions(
            db,
            endpoint_id=endpoint_id,
            new_version=new_record.version,
            severity=classification,
        )

        event = DriftEvent(
            event_id=str(uuid.uuid4()),
            endpoint_id=endpoint_id,
            endpoint_name=endpoint_name,
            namespace=namespace,
            old_fingerprint=old_fp,
            new_fingerprint=new_fingerprint,
            old_version=old_version,
            new_version=new_record.version,
            severity=classification,
            compatibility_classification=classification,
            timestamp=datetime.now(timezone.utc).isoformat(),
            schema_diff_summary=diffs,
            affected_consumer_count=len(affected),
        )
        try:
            await publish_with_retry(publisher, event)
        except Exception:
            KAFKA_PUBLISH_FAILURES_TOTAL.inc()

        for sub in affected:
            ok = await deliver_with_retry(
                db,
                event_id=event.event_id,
                endpoint_id=endpoint_id,
                subscription=sub,
                payload={
                    "event_id": event.event_id,
                    "endpoint_id": endpoint_id,
                    "classification": classification,
                    "new_version": new_record.version,
                    "diffs": diffs,
                },
            )
            deliveries.append({"subscription_id": sub["id"], "ok": ok})

    dlq = await db.execute(text("SELECT COUNT(*) FROM webhook_delivery_dlq"))
    DLQ_SIZE.set(float(dlq.scalar_one()))

    elapsed = time.perf_counter() - start
    DRIFT_DETECTION_LATENCY_SECONDS.observe(elapsed)

    return {
        "endpoint_id": endpoint_id,
        "endpoint_name": endpoint_name,
        "namespace": namespace,
        "schema_version": new_record.version,
        "fingerprint": new_fingerprint,
        "inserted": inserted,
        "compatibility_classification": classification,
        "diff_count": len(diffs),
        "affected_consumer_count": len(affected),
        "deliveries": deliveries,
        "latency_seconds": elapsed,
    }
