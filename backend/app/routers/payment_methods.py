"""
Payment Methods Router - Using PostgreSQL with Multi-Tenancy
Todos los endpoints requieren autenticación y filtran por usuario
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from uuid import UUID

from app.database import get_db
from app.repositories.metodo_pago_repository import MetodoPagoRepository
from app.core.dependencies import CurrentUser

router = APIRouter()


@router.get("/")
async def get_payment_methods(
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    limit: int = Query(500, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    activo: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Obtener métodos de pago del usuario autenticado + métodos globales
    
    Returns:
        - Métodos personalizados del usuario (es_global=False, usuario_id=current_user.id)
        - Métodos globales del sistema (es_global=True, usuario_id=NULL)
    """
    try:
        repo = MetodoPagoRepository(db)
        result = repo.get_all(
            usuario_id=current_user.id,  # 👈 Siempre usar el usuario del JWT
            limit=limit, 
            offset=offset, 
            activo=activo
        )
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo métodos de pago: {str(e)}")


@router.get("/{metodo_id}")
async def get_payment_method_by_id(
    metodo_id: str,
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Obtener un método de pago por ID (solo si es del usuario o es global)"""
    try:
        repo = MetodoPagoRepository(db)
        metodo = repo.get_by_id(UUID(metodo_id), usuario_id=current_user.id)
        
        if not metodo:
            raise HTTPException(
                status_code=404, 
                detail="Método de pago no encontrado o no tiene acceso a él"
            )
        
        return metodo
        
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo método de pago: {str(e)}")


@router.post("/")
async def create_payment_method(
    metodo_data: Dict[str, Any],
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Crear un nuevo método de pago personalizado para el usuario autenticado"""
    try:
        repo = MetodoPagoRepository(db)
        
        # El repository automáticamente asigna usuario_id y es_global=False
        nuevo_metodo = repo.create(metodo_data, usuario_id=current_user.id)
        return nuevo_metodo
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creando método de pago: {str(e)}")


@router.patch("/{metodo_id}")
async def update_payment_method(
    metodo_id: str,
    metodo_data: Dict[str, Any],
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """
    Actualizar un método de pago existente
    
    Solo puede actualizar:
        - Métodos personalizados del usuario (es_global=False)
        - NO puede actualizar métodos globales
    """
    try:
        repo = MetodoPagoRepository(db)
        metodo_actualizado = repo.update(
            UUID(metodo_id), 
            metodo_data, 
            usuario_id=current_user.id  # 👈 Valida que sea del usuario
        )
        
        if not metodo_actualizado:
            raise HTTPException(
                status_code=404, 
                detail="Método de pago no encontrado o no tiene permiso para editarlo"
            )
        
        return metodo_actualizado
        
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error actualizando método de pago: {str(e)}")


@router.delete("/{metodo_id}")
async def delete_payment_method(
    metodo_id: str,
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """
    Eliminar un método de pago
    
    Solo puede eliminar:
        - Métodos personalizados del usuario (es_global=False)
        - NO puede eliminar métodos globales
    """
    try:
        repo = MetodoPagoRepository(db)
        success = repo.delete(UUID(metodo_id), usuario_id=current_user.id)
        
        if not success:
            raise HTTPException(
                status_code=404, 
                detail="Método de pago no encontrado o no tiene permiso para eliminarlo"
            )
        
        return {"message": "Método de pago eliminado exitosamente", "id": metodo_id}
        
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error eliminando método de pago: {str(e)}")
