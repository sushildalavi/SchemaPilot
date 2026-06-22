import time

from fastapi import FastAPI

app = FastAPI(title="Drift Simulator")


def stage() -> int:
    # rotates every 10 minutes through 4 stages
    return int(time.time() // 600) % 4


@app.get("/payload")
def payload() -> dict:
    s = stage()
    base = {"id": 1, "name": "Alice", "active": True, "score": 42}
    if s == 0:
        return {**base, "email": "a@x.com"}
    if s == 1:
        return {**base, "email": "a@x.com", "role": "admin"}
    if s == 2:
        return {**base, "role": "admin"}
    return {**base, "id": "uuid-1", "role": "admin"}


@app.get("/healthz")
def healthz() -> dict:
    return {"status": "ok", "stage": stage()}
