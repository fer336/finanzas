"""Password login exists only on local installs.

It is enabled by LOCAL_AUTH_ENABLED, which the local installer sets and
production does not. Without the flag the endpoint does not exist (404).
"""
import asyncio
from types import SimpleNamespace

import httpx
import pytest

DEMO_EMAIL = "demo@example.com"
DEMO_PASSWORD = "demo1234"


@pytest.fixture
def local_auth(monkeypatch):
    from app.core.config import settings
    from app.routers import local_auth as module

    monkeypatch.setattr(settings, "LOCAL_AUTH_ENABLED", True, raising=False)
    monkeypatch.setattr(settings, "LOCAL_AUTH_EMAIL", DEMO_EMAIL, raising=False)
    monkeypatch.setattr(settings, "LOCAL_AUTH_PASSWORD", DEMO_PASSWORD, raising=False)

    users = {DEMO_EMAIL: SimpleNamespace(email=DEMO_EMAIL, full_name="Usuario Demo", is_active=True)}

    async def find_user(db, email):
        return users.get(email)

    monkeypatch.setattr(module, "find_user_by_email", find_user)
    return users


def _call(method, path, **kwargs):
    import main

    async def run():
        transport = httpx.ASGITransport(app=main.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.request(method, path, **kwargs)

    return asyncio.run(run())


def _login(email=DEMO_EMAIL, password=DEMO_PASSWORD):
    return _call("POST", "/auth/local/login", json={"email": email, "password": password})


def test_login_returns_a_token_the_api_accepts(local_auth):
    from app.core.security import verify_token

    response = _login()

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["user"] == {"email": DEMO_EMAIL, "name": "Usuario Demo"}
    assert verify_token(body["access_token"])["sub"] == DEMO_EMAIL


def test_login_ignores_email_case_and_spaces(local_auth):
    assert _login(email="  Demo@Example.com ").status_code == 200


@pytest.mark.parametrize("email,password", [
    (DEMO_EMAIL, "wrong"),
    ("other@example.com", DEMO_PASSWORD),
    (DEMO_EMAIL, ""),
    (DEMO_EMAIL, "contraseña"),
])
def test_wrong_credentials_are_rejected_with_one_generic_message(local_auth, email, password):
    response = _login(email=email, password=password)
    assert response.status_code == 401
    assert response.json()["message"] == "Email o contraseña incorrectos"
    assert "access_token" not in response.json()


def test_inactive_or_missing_demo_user_cannot_log_in(local_auth):
    local_auth[DEMO_EMAIL].is_active = False
    assert _login().status_code == 401
    local_auth.clear()
    assert _login().status_code == 401


def test_empty_configured_password_never_logs_in(local_auth, monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "LOCAL_AUTH_PASSWORD", "", raising=False)
    assert _login(password="").status_code == 401


def test_without_the_flag_login_does_not_exist(local_auth, monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "LOCAL_AUTH_ENABLED", False, raising=False)
    assert _login().status_code == 404
    assert _call("GET", "/auth/local/status").json() == {"enabled": False}


def test_status_reports_enabled_without_revealing_credentials(local_auth):
    response = _call("GET", "/auth/local/status")
    assert response.status_code == 200
    assert response.json() == {"enabled": True}


def test_flag_defaults_to_off(monkeypatch):
    monkeypatch.delenv("LOCAL_AUTH_ENABLED", raising=False)
    from app.core.config import Settings

    assert Settings().LOCAL_AUTH_ENABLED is False
