from fastapi import APIRouter
from sqlalchemy import text

from app import __version__
from app.database import engine

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict:
    db_ok = "ok"
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:
        db_ok = "error"
    return {"status": "ok", "db": db_ok, "version": __version__}
