from typing import Any, Dict, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.dependencies import CurrentUser
from app.database import get_db
from app.repositories.ai_config_repository import AIConfigRepository


router = APIRouter()


class AIConfigUpsertRequest(BaseModel):
    provider: str = Field(default="openrouter")
    auth_method: str = Field(default="api_key")
    api_key: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    modelo_preferido: str = Field(default="google/gemini-3-flash-preview")
    modelo_vision: Optional[str] = Field(default="google/gemini-pro-vision")
    temperatura: float = Field(default=0.7)
    max_tokens: int = Field(default=4000)


def _mask_key(secret: Optional[str]) -> Optional[str]:
    if not secret:
        return None
    if len(secret) <= 8:
        return "****"
    return f"{secret[:8]}...{secret[-4:]}"


def _default_models(provider: str) -> Dict[str, Any]:
    models = {
        "openrouter": [
            "google/gemini-3-flash-preview",
            "google/gemini-2.0-flash-001",
            "anthropic/claude-3.5-sonnet",
            "openai/gpt-4o-mini",
            "meta-llama/llama-3.1-70b-instruct",
        ],
        "openai": ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"],
        "google": ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"],
        "anthropic": [
            "claude-3-5-sonnet-latest",
            "claude-3-5-haiku-latest",
            "claude-3-opus-latest",
        ],
    }
    return {"modelos": models.get(provider, models["openrouter"]), "source": "default"}


@router.get("/")
async def get_ai_config(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    repo = AIConfigRepository(db)
    config = repo.get_by_user_id(current_user.id)
    if not config:
        return None

    key = config.get("api_key") or config.get("access_token")
    config["api_key"] = None
    config["access_token"] = None
    config["refresh_token"] = None
    config["api_key_preview"] = _mask_key(key)
    return config


@router.post("/")
async def create_ai_config(
    payload: AIConfigUpsertRequest,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    repo = AIConfigRepository(db)
    data = payload.model_dump()
    saved = repo.upsert(current_user.id, data)
    saved["api_key"] = None
    saved["access_token"] = None
    saved["refresh_token"] = None
    saved["api_key_preview"] = _mask_key(payload.api_key or payload.access_token)
    return saved


@router.put("/")
async def update_ai_config(
    payload: AIConfigUpsertRequest,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    repo = AIConfigRepository(db)
    current = repo.get_by_user_id(current_user.id) or {}
    merged = {
        **current,
        **{k: v for k, v in payload.model_dump().items() if v is not None},
    }
    saved = repo.upsert(current_user.id, merged)
    saved["api_key"] = None
    saved["access_token"] = None
    saved["refresh_token"] = None
    key = merged.get("api_key") or merged.get("access_token")
    saved["api_key_preview"] = _mask_key(key)
    return saved


@router.delete("/")
async def delete_ai_config(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    repo = AIConfigRepository(db)
    deleted = repo.delete(current_user.id)
    if not deleted:
        raise HTTPException(
            status_code=404, detail="No hay configuración para eliminar"
        )
    return {"status": "ok"}


@router.get("/modelos")
async def get_modelos(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    repo = AIConfigRepository(db)
    config = repo.get_by_user_id(current_user.id)
    provider = config.get("provider") if config else "openrouter"
    return _default_models(provider)


@router.get("/my-models")
async def get_my_models(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    repo = AIConfigRepository(db)
    config = repo.get_by_user_id(current_user.id)
    if not config:
        return _default_models("openrouter")

    provider = (config.get("provider") or "openrouter").lower()
    auth_method = (config.get("auth_method") or "api_key").lower()
    key = (
        config.get("access_token") if auth_method == "oauth2" else config.get("api_key")
    )

    if provider != "openrouter" or not key:
        return _default_models(provider)

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(
                "https://openrouter.ai/api/v1/models",
                headers={
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json",
                },
            )

        if not response.ok:
            return _default_models(provider)

        data = response.json()
        modelos = sorted([m.get("id") for m in data.get("data", []) if m.get("id")])
        return {"modelos": modelos, "source": "openrouter-account"}
    except Exception:
        return _default_models(provider)
