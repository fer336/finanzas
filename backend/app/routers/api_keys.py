"""
API Keys Router - Using PostgreSQL with Multi-Tenancy
Todos los endpoints requieren autenticación y filtran por usuario
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.repositories.api_key_repository import ApiKeyRepository
from app.core.dependencies import CurrentUser
from app.schemas.api_keys import ApiKeyCreate, ApiKeyCreated, ApiKeyPublic

router = APIRouter()


@router.post("/", response_model=ApiKeyCreated)
async def create_api_key(
    body: ApiKeyCreate,
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Crear una nueva API key para el usuario autenticado"""
    try:
        repo = ApiKeyRepository(db)
        api_key, raw_key = repo.create(current_user.id, body.nombre)

        return ApiKeyCreated(
            id=api_key.id,
            nombre=api_key.nombre,
            key=raw_key,
            key_prefix=api_key.key_prefix,
            creado_en=api_key.creado_en,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creando API key: {str(e)}")


@router.get("/", response_model=List[ApiKeyPublic])
async def get_api_keys(
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Obtener las API keys del usuario autenticado"""
    try:
        repo = ApiKeyRepository(db)
        return repo.list_by_user(current_user.id)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo API keys: {str(e)}")


@router.delete("/{key_id}")
async def revoke_api_key(
    key_id: str,
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Revocar una API key del usuario autenticado"""
    try:
        repo = ApiKeyRepository(db)
        success = repo.revoke(UUID(key_id), usuario_id=current_user.id)

        if not success:
            raise HTTPException(
                status_code=404,
                detail="API key no encontrada o ya revocada"
            )

        return {"message": "API key revocada exitosamente", "id": key_id}

    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error revocando API key: {str(e)}")
