from __future__ import annotations

from typing import Any

from fastapi import Depends, FastAPI
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.subscriptions import router as subscriptions_router
from app.db import close_db, get_db
from app.runtime.events import build_default_publisher
from app.runtime.metrics import metrics_payload
from app.runtime.service import track_contract


class PayloadSubmission(BaseModel):
    namespace: str = "default"
    service_name: str
    http_method: str
    route_path: str
    payload: dict[str, Any]


app = FastAPI(title="SchemaPilot Contract Guard", version="1.0.0")


@app.on_event("shutdown")
async def _shutdown() -> None:
    await close_db()


@app.post("/track")
async def track_payload(submission: PayloadSubmission, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    publisher = build_default_publisher()
    return await track_contract(
        db,
        namespace=submission.namespace,
        service_name=submission.service_name,
        http_method=submission.http_method.upper(),
        route_path=submission.route_path,
        payload=submission.payload,
        publisher=publisher,
    )


@app.get("/api/v1/metrics")
async def fetch_runtime_metrics(db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    from app.core.engine import get_runtime_metrics

    return await get_runtime_metrics(db)


@app.get("/metrics")
async def prometheus_metrics() -> Response:
    content, content_type = metrics_payload()
    return Response(content=content, media_type=content_type)


app.include_router(subscriptions_router)
