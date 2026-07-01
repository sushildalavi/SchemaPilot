from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass
from typing import Any, Protocol

from app.runtime.models import DriftEvent

log = logging.getLogger("schemapilot.runtime.events")


class DriftEventBackend(Protocol):
    async def publish_drift_detected(self, event: DriftEvent) -> None:
        ...


def _event_payload(event: DriftEvent) -> dict[str, Any]:
    return {
        "event_id": event.event_id,
        "endpoint_id": event.endpoint_id,
        "endpoint_path_name": event.endpoint_name,
        "namespace": event.namespace,
        "old_fingerprint": event.old_fingerprint,
        "new_fingerprint": event.new_fingerprint,
        "old_version": event.old_version,
        "new_version": event.new_version,
        "severity": event.severity,
        "compatibility_classification": event.compatibility_classification,
        "timestamp": event.timestamp,
        "schema_diff_summary": event.schema_diff_summary,
        "affected_consumer_count": event.affected_consumer_count,
    }


@dataclass(slots=True)
class NoopEventBackend:
    async def publish_drift_detected(self, event: DriftEvent) -> None:
        return


@dataclass(slots=True)
class KafkaEventBackend:
    producer: Any
    topic: str = "drift.detected"

    async def publish_drift_detected(self, event: DriftEvent) -> None:
        sender = getattr(self.producer, "send_and_wait", None)
        if not callable(sender):
            raise TypeError("Kafka producer must expose async send_and_wait(topic, payload)")
        payload = json.dumps(_event_payload(event), separators=(",", ":")).encode("utf-8")
        await sender(self.topic, payload)


@dataclass(slots=True)
class AzureServiceBusEventBackend:
    sender: Any
    queue_name: str = "drift-detected"

    async def publish_drift_detected(self, event: DriftEvent) -> None:
        payload = json.dumps(_event_payload(event), separators=(",", ":"))
        send = getattr(self.sender, "send_messages", None)
        if callable(send):
            try:
                from azure.servicebus import ServiceBusMessage

                message = ServiceBusMessage(payload, content_type="application/json")
            except Exception:
                message = payload
            await send(message)
            return
        send = getattr(self.sender, "send_message", None)
        if callable(send):
            await send(payload)
            return
        raise TypeError("Azure Service Bus sender must expose send_messages or send_message")


def _configured_backend_name() -> str:
    return os.getenv("EVENT_BACKEND", "noop").strip().lower()


def build_event_backend(
    *,
    kafka_producer: Any | None = None,
    service_bus_sender: Any | None = None,
) -> DriftEventBackend:
    backend = _configured_backend_name()
    if backend == "kafka":
        if kafka_producer is not None:
            return KafkaEventBackend(kafka_producer)
        log.info("EVENT_BACKEND=kafka configured without producer; falling back to noop backend")
        return NoopEventBackend()
    if backend == "azure_service_bus":
        if service_bus_sender is not None:
            return AzureServiceBusEventBackend(service_bus_sender)
        log.info(
            "EVENT_BACKEND=azure_service_bus configured without sender; falling back to noop backend"
        )
        return NoopEventBackend()
    return NoopEventBackend()
