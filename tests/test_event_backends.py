from __future__ import annotations

import json

import pytest

from app.runtime.event_backends import AzureServiceBusEventBackend, KafkaEventBackend
from app.runtime.models import DriftEvent


class FakeSender:
    def __init__(self) -> None:
        self.messages = []

    async def send_messages(self, message):
        self.messages.append(message)


class FakeProducer:
    def __init__(self) -> None:
        self.calls = []

    async def send_and_wait(self, topic: str, blob: bytes):
        self.calls.append((topic, blob))


@pytest.mark.asyncio
async def test_kafka_backend_serializes_payload():
    producer = FakeProducer()
    backend = KafkaEventBackend(producer)
    event = DriftEvent(
        event_id="e1",
        endpoint_id="ep",
        endpoint_name="svc POST /x",
        namespace="ns",
        old_fingerprint="old",
        new_fingerprint="new",
        old_version=1,
        new_version=2,
        severity="RISKY",
        compatibility_classification="RISKY",
        timestamp="2026-05-27T00:00:00Z",
        schema_diff_summary=[{"path": "score", "classification": "RISKY"}],
        affected_consumer_count=3,
    )
    await backend.publish_drift_detected(event)
    topic, blob = producer.calls[0]
    payload = json.loads(blob.decode("utf-8"))
    assert topic == "drift.detected"
    assert payload["event_id"] == "e1"
    assert payload["affected_consumer_count"] == 3


@pytest.mark.asyncio
async def test_azure_service_bus_backend_uses_sender():
    sender = FakeSender()
    backend = AzureServiceBusEventBackend(sender)
    event = DriftEvent(
        event_id="e2",
        endpoint_id="ep",
        endpoint_name="svc POST /x",
        namespace="ns",
        old_fingerprint="old",
        new_fingerprint="new",
        old_version=1,
        new_version=2,
        severity="BREAKING",
        compatibility_classification="BREAKING",
        timestamp="2026-05-27T00:00:00Z",
        schema_diff_summary=[],
        affected_consumer_count=0,
    )
    await backend.publish_drift_detected(event)
    assert sender.messages
