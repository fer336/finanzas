from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
import logging

from app.database import get_db
from app.repositories.resumen_bancario_repository import ResumenBancarioRepository
from app.core.dependencies import CurrentUser

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/")
async def get_resumenes_bancarios(
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    fecha_desde: Optional[str] = Query(None),
    fecha_hasta: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all bank summaries for the authenticated user"""
    try:
        repo = ResumenBancarioRepository(db)
        
        result = repo.get_all(
            limit=limit,
            offset=offset,
            usuario_id=current_user.id,  # 👈 Siempre usar el usuario del JWT
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting bank summaries: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting bank summaries: {str(e)}")


@router.get("/{resumen_id}")
async def get_resumen_bancario(
    resumen_id: str,
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Get a bank summary by ID (only if it belongs to the user)"""
    try:
        repo = ResumenBancarioRepository(db)
        resumen = repo.get_by_id(UUID(resumen_id))
        
        if not resumen or str(resumen.usuario_id) != str(current_user.id):
            raise HTTPException(status_code=404, detail="Bank summary not found")
        
        return repo._to_dict(resumen)
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting bank summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting bank summary: {str(e)}")


@router.post("/")
async def create_resumen_bancario(
    data: dict,
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Create a new bank summary for the authenticated user"""
    try:
        repo = ResumenBancarioRepository(db)
        
        # Forzar el usuario_id del token
        data['usuario_id'] = current_user.id
        
        resumen = repo.create(data)
        return repo._to_dict(resumen)
        
    except Exception as e:
        logger.error(f"Error creating bank summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating bank summary: {str(e)}")


@router.patch("/{resumen_id}")
async def update_resumen_bancario(
    resumen_id: str,
    data: dict,
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Update a bank summary (only if it belongs to the user)"""
    try:
        repo = ResumenBancarioRepository(db)
        
        # Verificar pertenencia
        resumen_existente = repo.get_by_id(UUID(resumen_id))
        if not resumen_existente or str(resumen_existente.usuario_id) != str(current_user.id):
            raise HTTPException(status_code=404, detail="Bank summary not found")
            
        # No permitir cambiar el usuario_id
        data.pop('usuario_id', None)
        
        resumen = repo.update(UUID(resumen_id), data)
        
        return repo._to_dict(resumen)
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating bank summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating bank summary: {str(e)}")


@router.delete("/{resumen_id}")
async def delete_resumen_bancario(
    resumen_id: str,
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Delete a bank summary (only if it belongs to the user)"""
    try:
        repo = ResumenBancarioRepository(db)
        
        # Verificar pertenencia
        resumen_existente = repo.get_by_id(UUID(resumen_id))
        if not resumen_existente or str(resumen_existente.usuario_id) != str(current_user.id):
            raise HTTPException(status_code=404, detail="Bank summary not found")
            
        success = repo.delete(UUID(resumen_id))
        
        if not success:
            raise HTTPException(status_code=404, detail="Bank summary not found")
        
        return {"message": "Bank summary deleted successfully"}
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting bank summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting bank summary: {str(e)}")
