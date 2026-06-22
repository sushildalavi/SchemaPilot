from __future__ import annotations

import uuid

from fastapi import APIRouter, Query
from sqlalchemy import select

from app.deps import DbSession
from app.models import SchemaSnapshot
from app.schemas import SnapshotOut

router = APIRouter(prefix="/api/endpoints", tags=["snapshots"])


@router.get("/{endpoint_id}/snapshots", response_model=list[SnapshotOut])
async def list_snapshots(
    endpoint_id: uuid.UUID,
    db: DbSession,
    limit: int = Query(50, ge=1, le=200),
) -> list[SnapshotOut]:
    r = await db.execute(
        select(SchemaSnapshot)
        .where(SchemaSnapshot.endpoint_id == endpoint_id)
        .order_by(SchemaSnapshot.created_at.desc())
        .limit(limit)
    )
    return [SnapshotOut.model_validate(s) for s in r.scalars().all()]
