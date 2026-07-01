from __future__ import annotations

import asyncio
import logging

from app.runtime.event_backends import (
    DriftEventBackend,
    KafkaEventBackend,
    NoopEventBackend,
    AzureServiceBusEventBackend,
    build_event_backend,
)
from app.runtime.metrics import KAFKA_PUBLISH_FAILURES_TOTAL
from app.runtime.models import DriftEvent

logger = logging.getLogger(__name__)

EventPublisher = DriftEventBackend


async def publish_with_retry(
    publisher: DriftEventBackend, event: DriftEvent, retries: int = 3
) -> None:
    wait = 0.05
    for attempt in range(1, retries + 1):
        try:
            await publisher.publish_drift_detected(event)
            return
        except Exception:
            if attempt == retries:
                raise
            await asyncio.sleep(wait)
            wait *= 2


def publish_fire_and_forget(publisher: DriftEventBackend, event: DriftEvent) -> None:
    async def _run() -> None:
        try:
            await publish_with_retry(publisher, event)
        except Exception:
            KAFKA_PUBLISH_FAILURES_TOTAL.inc()
            logger.exception("Kafka publish failed for event_id=%s", event.event_id)

    asyncio.create_task(_run())


def build_default_publisher() -> DriftEventBackend:
    return build_event_backend()


__all__ = [
    "EventPublisher",
    "AzureServiceBusEventBackend",
    "DriftEventBackend",
    "KafkaEventBackend",
    "NoopEventBackend",
    "build_default_publisher",
    "publish_fire_and_forget",
    "publish_with_retry",
]
