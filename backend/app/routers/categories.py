"""
Categories Router - Using PostgreSQL with Multi-Tenancy
Todos los endpoints requieren autenticación y filtran por usuario
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from uuid import UUID

from app.database import get_db
from app.repositories.categoria_repository import CategoriaRepository
from app.core.dependencies import CurrentUser

router = APIRouter()


@router.get("/")
async def get_categories(
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    limit: int = Query(500, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    activa: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Obtener categorías del usuario autenticado + categorías globales
    
    Returns:
        - Categorías personalizadas del usuario (es_global=False, usuario_id=current_user.id)
        - Categorías globales del sistema (es_global=True, usuario_id=NULL)
    """
    try:
        repo = CategoriaRepository(db)
        result = repo.get_all(
            usuario_id=current_user.id,  # 👈 Siempre usar el usuario del JWT
            limit=limit, 
            offset=offset, 
            activa=activa
        )
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo categorías: {str(e)}")


@router.get("/{categoria_id}")
async def get_category_by_id(
    categoria_id: str,
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Obtener una categoría por ID (solo si es del usuario o es global)"""
    try:
        repo = CategoriaRepository(db)
        categoria = repo.get_by_id(UUID(categoria_id), usuario_id=current_user.id)
        
        if not categoria:
            raise HTTPException(
                status_code=404, 
                detail="Categoría no encontrada o no tiene acceso a ella"
            )
        
        return categoria
        
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo categoría: {str(e)}")


@router.post("/")
async def create_category(
    categoria_data: Dict[str, Any],
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Crear una nueva categoría personalizada para el usuario autenticado"""
    try:
        repo = CategoriaRepository(db)
        
        # El repository automáticamente asigna usuario_id y es_global=False
        nueva_categoria = repo.create(categoria_data, usuario_id=current_user.id)
        return nueva_categoria
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creando categoría: {str(e)}")


@router.patch("/{categoria_id}")
async def update_category(
    categoria_id: str,
    categoria_data: Dict[str, Any],
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """
    Actualizar una categoríaexistente
    
    Solo puede actualizar:
        - Categorías personalizadas del usuario (es_global=False)
        - NO puede actualizar categorías globales
    """
    try:
        repo = CategoriaRepository(db)
        categoria_actualizada = repo.update(
            UUID(categoria_id), 
            categoria_data, 
            usuario_id=current_user.id  # 👈 Valida que sea del usuario
        )
        
        if not categoria_actualizada:
            raise HTTPException(
                status_code=404, 
                detail="Categoría no encontrada o no tiene permiso para editarla"
            )
        
        return categoria_actualizada
        
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error actualizando categoría: {str(e)}")


@router.delete("/{categoria_id}")
async def delete_category(
    categoria_id: str,
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """
    Eliminar una categoría
    
    Solo puede eliminar:
        - Categorías personalizadas del usuario (es_global=False)
        - NO puede eliminar categorías globales
    """
    try:
        repo = CategoriaRepository(db)
        success = repo.delete(UUID(categoria_id), usuario_id=current_user.id)
        
        if not success:
            raise HTTPException(
                status_code=404, 
                detail="Categoría no encontrada o no tiene permiso para eliminarla"
            )
        
        return {"message": "Categoría eliminada exitosamente", "id": categoria_id}
        
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error eliminando categoría: {str(e)}")
