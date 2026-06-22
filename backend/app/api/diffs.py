from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Query
from sqlalchemy import select

from app.deps import DbSession
from app.models import SchemaDiff
from app.schemas import DiffOut

router = APIRouter(tags=["diffs"])


@router.get("/api/endpoints/{endpoint_id}/diffs", response_model=list[DiffOut])
async def list_diffs_for_endpoint(
    endpoint_id: uuid.UUID,
    db: DbSession,
    limit: int = Query(50, ge=1, le=500),
    severity: Optional[str] = None,
) -> list[DiffOut]:
    q = select(SchemaDiff).where(SchemaDiff.endpoint_id == endpoint_id)
    if severity:
        q = q.where(SchemaDiff.severity == severity)
    q = q.order_by(SchemaDiff.created_at.desc()).limit(limit)
    r = await db.execute(q)
    return [DiffOut.model_validate(d) for d in r.scalars().all()]


@router.get("/api/diffs/recent", response_model=list[DiffOut])
async def list_recent_diffs(
    db: DbSession,
    limit: int = Query(100, ge=1, le=500),
    severity: Optional[str] = None,
) -> list[DiffOut]:
    q = select(SchemaDiff)
    if severity:
        q = q.where(SchemaDiff.severity == severity)
    q = q.order_by(SchemaDiff.created_at.desc()).limit(limit)
    r = await db.execute(q)
    return [DiffOut.model_validate(d) for d in r.scalars().all()]
