from __future__ import annotations

import json

import pytest

from app.runtime.event_backends import KafkaEventBackend, NoopEventBackend, build_event_backend
from app.runtime.events import publish_with_retry
from app.runtime.models import DriftEvent


class FakeProducer:
    def __init__(self, fail_times: int = 0) -> None:
        self.fail_times = fail_times
        self.calls = []

    async def send_and_wait(self, topic: str, blob: bytes):
        self.calls.append((topic, blob))
        if self.fail_times > 0:
            self.fail_times -= 1
            raise RuntimeError("boom")


@pytest.mark.asyncio
async def test_payload_shape():
    producer = FakeProducer()
    pub = KafkaEventBackend(producer)
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
    await pub.publish_drift_detected(event)
    topic, blob = producer.calls[0]
    assert topic == "drift.detected"
    payload = json.loads(blob.decode("utf-8"))
    assert payload["event_id"] == "e1"
    assert payload["affected_consumer_count"] == 3


@pytest.mark.asyncio
async def test_retry_on_failure_then_success():
    producer = FakeProducer(fail_times=2)
    pub = KafkaEventBackend(producer)
    event = DriftEvent("e1", "ep", "name", "ns", "old", "new", 1, 2, "BREAKING", "BREAKING", "ts", [], 1)
    await publish_with_retry(pub, event, retries=3)
    assert len(producer.calls) == 3


@pytest.mark.asyncio
async def test_exhausted_retries_raises():
    producer = FakeProducer(fail_times=5)
    pub = KafkaEventBackend(producer)
    event = DriftEvent("e1", "ep", "name", "ns", "old", "new", 1, 2, "BREAKING", "BREAKING", "ts", [], 1)
    with pytest.raises(RuntimeError):
        await publish_with_retry(pub, event, retries=3)


def test_factory_defaults_to_noop(monkeypatch):
    monkeypatch.delenv("EVENT_BACKEND", raising=False)
    backend = build_event_backend()
    assert isinstance(backend, NoopEventBackend)


def test_factory_selects_kafka_with_injected_producer(monkeypatch):
    monkeypatch.setenv("EVENT_BACKEND", "kafka")
    producer = FakeProducer()
    backend = build_event_backend(kafka_producer=producer)
    assert isinstance(backend, KafkaEventBackend)
