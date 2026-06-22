from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select

from app.deps import DbSession, require_admin
from app.models import MonitorRun
from app.schemas import MonitorRunOut, MonitorRunResponse
from app.workers.monitor_runner import run_monitor

router = APIRouter(prefix="/api", tags=["monitor"])


@router.post(
    "/monitor/run-once",
    response_model=MonitorRunResponse,
    dependencies=[Depends(require_admin)],
)
async def trigger_monitor(db: DbSession) -> MonitorRunResponse:
    run_id = await run_monitor(db)
    return MonitorRunResponse(monitor_run_id=run_id, status="started")


@router.get("/monitor-runs", response_model=list[MonitorRunOut])
async def list_monitor_runs(
    db: DbSession,
    limit: int = Query(20, ge=1, le=100),
) -> list[MonitorRunOut]:
    r = await db.execute(
        select(MonitorRun).order_by(MonitorRun.started_at.desc()).limit(limit)
    )
    return [MonitorRunOut.model_validate(run) for run in r.scalars().all()]
