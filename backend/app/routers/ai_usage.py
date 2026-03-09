"""
Router para consultar el consumo de la API de OpenRouter
"""

import logging
from fastapi import APIRouter, HTTPException, Query, Depends
import httpx
import os
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from app.utils.ai_logger import get_ai_history
from app.core.dependencies import CurrentUser
from app.database import get_db
from sqlalchemy.orm import Session
from app.repositories.ai_config_repository import AIConfigRepository

logger = logging.getLogger(__name__)

router = APIRouter()

# No leemos la key aquí globalmente para evitar problemas de importación
# Se lee dentro de cada función usando os.getenv("OPENROUTER_API_KEY")


def _get_provider_key(current_user: CurrentUser, db: Session) -> tuple[str, str]:
    repo = AIConfigRepository(db)
    config = repo.get_by_user_id(current_user.id) or {}
    provider = (config.get("provider") or "openrouter").lower()
    auth_method = (config.get("auth_method") or "api_key").lower()

    key = (
        config.get("access_token") if auth_method == "oauth2" else config.get("api_key")
    )
    if not key:
        key = os.getenv("OPENROUTER_API_KEY", "").strip().strip('"').strip("'")
        provider = "openrouter"

    return provider, key


@router.get("/usage")
async def get_ai_usage(current_user: CurrentUser, db: Session = Depends(get_db)):
    """
    Obtiene información general de uso y créditos de OpenRouter
    Endpoint: https://openrouter.ai/api/v1/auth/key
    """
    provider, api_key = _get_provider_key(current_user, db)

    # Debug log to check which key is being used (masked)
    key_masked = f"{api_key[:10]}...{api_key[-4:]}" if api_key else "None"
    logger.info(f"🔍 Checking AI Usage with Key: {key_masked}")

    if not api_key:
        logger.warning("⚠️ OpenRouter API Key not set, returning empty usage")
        return {"usage": 0, "limit": 0, "label": "No Key", "is_free_tier": False}

    if provider != "openrouter":
        return {"usage": 0, "limit": 0, "label": provider, "is_free_tier": False}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://openrouter.ai/api/v1/auth/key",
                headers={"Authorization": f"Bearer {api_key}"},
            )

            if response.status_code != 200:
                logger.error(f"Error OpenRouter API: {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Error consultando OpenRouter",
                )

            data = response.json()

            return {
                "usage": data.get("data", {}).get("usage", 0),
                "limit": data.get("data", {}).get("limit", 0),
                "label": data.get("data", {}).get("label", "Unknown"),
                "is_free_tier": data.get("data", {}).get("is_free_tier", False),
            }

    except Exception as e:
        logger.error(f"Error fetching AI usage: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.get("/activity")
async def get_ai_activity(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    Obtiene el historial de actividad detallado (Local + OpenRouter si es posible)
    """
    # Intentamos leer el historial local primero
    local_history = get_ai_history(limit)

    # Si tenemos historial local, lo devolvemos
    if local_history:
        return {"data": local_history, "total": len(local_history), "source": "local"}

    # Si no hay local, intentamos OpenRouter (fallback)
    provider, api_key = _get_provider_key(current_user, db)

    if not api_key or provider != "openrouter":
        raise HTTPException(status_code=500, detail="OpenRouter API Key no configurada")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://openrouter.ai/api/v1/activity",
                headers={"Authorization": f"Bearer {api_key}"},
                timeout=10.0,
            )

            if response.status_code != 200:
                # logger.error(f"Error OpenRouter Activity API: {response.text}")
                # Si falla (ej: 403), devolvemos lista vacía
                return {
                    "data": [],
                    "error": "Access denied (requires provisioning key)",
                }

            raw_data = response.json()
            activities = raw_data.get("data", [])
            paginated_activities = activities[offset : offset + limit]

            return {
                "data": paginated_activities,
                "total": len(activities),
                "source": "remote",
            }

    except Exception as e:
        logger.error(f"Error fetching AI activity: {str(e)}")
        return {"data": [], "error": str(e)}
