from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.deps import DbSession
from app.models import ApiEndpoint, SchemaSnapshot
from app.schemas import EndpointOut

router = APIRouter(prefix="/api/endpoints", tags=["endpoints"])


@router.get("", response_model=list[EndpointOut])
async def list_endpoints(db: DbSession) -> list[EndpointOut]:
    result = await db.execute(select(ApiEndpoint).order_by(ApiEndpoint.name))
    endpoints = result.scalars().all()
    out = []
    for ep in endpoints:
        latest = await _latest_snapshot(db, ep.id)
        o = EndpointOut.model_validate(ep)
        if latest:
            o.latest_snapshot_hash = latest.schema_hash
            o.latest_checked_at = latest.created_at
        out.append(o)
    return out


@router.get("/{endpoint_id}", response_model=EndpointOut)
async def get_endpoint(endpoint_id: uuid.UUID, db: DbSession) -> EndpointOut:
    ep = await db.get(ApiEndpoint, endpoint_id)
    if not ep:
        raise HTTPException(404, "endpoint not found")
    latest = await _latest_snapshot(db, ep.id)
    o = EndpointOut.model_validate(ep)
    if latest:
        o.latest_snapshot_hash = latest.schema_hash
        o.latest_checked_at = latest.created_at
    return o


async def _latest_snapshot(
    db: DbSession, endpoint_id: uuid.UUID
) -> Optional[SchemaSnapshot]:
    r = await db.execute(
        select(SchemaSnapshot)
        .where(SchemaSnapshot.endpoint_id == endpoint_id)
        .order_by(SchemaSnapshot.created_at.desc())
        .limit(1)
    )
    return r.scalar_one_or_none()
