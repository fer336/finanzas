"""The single uvicorn worker must never be blocked by a request handler.

FastAPI runs `async def` handlers on the event loop and plain `def` handlers in
a threadpool. A handler that does blocking work (sync SQLAlchemy, `requests`,
`time.sleep`) must therefore be a plain `def`, or every other request waits.
"""
import ast
import asyncio
import time
from pathlib import Path

import httpx
import pytest

ROUTERS_DIR = Path(__file__).resolve().parents[1] / "app" / "routers"
ROUTE_DECORATORS = {"get", "post", "put", "patch", "delete", "api_route"}


def _is_route_handler(node):
    for deco in node.decorator_list:
        target = deco.func if isinstance(deco, ast.Call) else deco
        if isinstance(target, ast.Attribute) and target.attr in ROUTE_DECORATORS:
            return True
    return False


def _awaits(node):
    return any(isinstance(n, (ast.Await, ast.AsyncFor, ast.AsyncWith)) for n in ast.walk(node))


def test_async_route_handlers_only_when_they_await():
    offenders = []
    for path in sorted(ROUTERS_DIR.glob("*.py")):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            if isinstance(node, ast.AsyncFunctionDef) and _is_route_handler(node) and not _awaits(node):
                offenders.append(f"{path.name}:{node.lineno} {node.name}")
    assert offenders == []


def test_slow_cedears_download_does_not_block_other_requests(monkeypatch):
    import main
    from app.routers import yfinance_router

    def slow_download(batch):
        time.sleep(1.0)  # stands in for sequential Yahoo HTTP calls
        return {}

    monkeypatch.setattr(yfinance_router, "get_multiple_cedears_data", slow_download)
    monkeypatch.setattr(yfinance_router, "_cache", {})

    async def scenario():
        transport = httpx.ASGITransport(app=main.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            started = time.perf_counter()
            slow = asyncio.create_task(client.get("/api/yfinance/cedears", params={"limite": 1}))
            await asyncio.sleep(0.1)  # let the slow request start first
            health = await client.get("/health")
            # Measured from the start of the slow request: a blocked loop delays
            # even the sleep above, so timing only the /health call would hide it.
            health_elapsed = time.perf_counter() - started
            slow_response = await slow
            return health, health_elapsed, slow_response

    health, health_elapsed, slow_response = asyncio.run(scenario())

    assert health.status_code == 200
    assert slow_response.status_code == 200
    assert health_elapsed < 0.5, f"/health waited {health_elapsed:.2f}s behind the CEDEARs download"


@pytest.mark.parametrize("path", ["/api/v1/presupuestos/active/", "/api/v1/objetivos/active/", "/api/v1/balance-inicial/neto/"])
def test_trailing_slash_paths_used_by_the_frontend_do_not_redirect(path):
    import main

    async def call():
        transport = httpx.ASGITransport(app=main.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.get(path)

    response = asyncio.run(call())
    # Unauthenticated, so 401/403 is fine; a 307 means an extra round trip.
    assert response.status_code != 307
