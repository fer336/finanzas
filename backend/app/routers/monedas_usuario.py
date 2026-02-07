"""
MonedaUsuario Router - Using PostgreSQL with Multi-Tenancy
Todos los endpoints requieren autenticación y filtran por usuario
"""
from fastapi import APIRouter, HTTPException, Query, Depends, Body
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID
import logging

from app.database import get_db
from app.repositories.moneda_usuario_repository import MonedaUsuarioRepository
from app.schemas.monedas import (
    MonedaUsuarioCreate,
    MonedaUsuarioUpdate,
    MonedaUsuarioResponse,
    MonedaUsuarioReorderRequest,
    MonedaUsuarioToggleRequest,
    MONEDAS_PREDETERMINADAS
)
from app.core.dependencies import CurrentUser

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/", response_model=List[MonedaUsuarioResponse])
async def get_user_currencies(
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    activa: Optional[bool] = Query(None, description="Filtrar por estado activo"),
    orden_by: str = Query("orden", description="Campo para ordenar: orden, codigo, nombre"),
    db: Session = Depends(get_db)
):
    """
    Obtener todas las monedas del usuario autenticado
    
    Returns:
        Lista de monedas ordenadas
    """
    try:
        repo = MonedaUsuarioRepository(db)
        monedas = repo.get_all(
            usuario_id=current_user.id,
            activa=activa,
            orden_by=orden_by
        )
        return monedas
        
    except Exception as e:
        logger.error(f"❌ Error obteniendo monedas: {e}")
        raise HTTPException(status_code=500, detail=f"Error obteniendo monedas: {str(e)}")


@router.get("/{moneda_id}", response_model=MonedaUsuarioResponse)
async def get_currency_by_id(
    moneda_id: UUID,
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Obtener una moneda por ID (solo si es del usuario)"""
    try:
        repo = MonedaUsuarioRepository(db)
        moneda = repo.get_by_id(moneda_id, usuario_id=current_user.id)
        
        if not moneda:
            raise HTTPException(
                status_code=404, 
                detail="Moneda no encontrada o no tiene acceso a ella"
            )
        
        return moneda
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error obteniendo moneda: {e}")
        raise HTTPException(status_code=500, detail=f"Error obteniendo moneda: {str(e)}")


@router.get("/codigo/{codigo}", response_model=MonedaUsuarioResponse)
async def get_currency_by_code(
    codigo: str,
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Obtener una moneda por código (USD, EUR, etc.)"""
    try:
        repo = MonedaUsuarioRepository(db)
        moneda = repo.get_by_codigo(codigo, usuario_id=current_user.id)
        
        if not moneda:
            raise HTTPException(
                status_code=404, 
                detail=f"Moneda con código {codigo} no encontrada"
            )
        
        return moneda
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error obteniendo moneda por código: {e}")
        raise HTTPException(status_code=500, detail=f"Error obteniendo moneda: {str(e)}")


@router.post("/", response_model=MonedaUsuarioResponse, status_code=201)
async def create_currency(
    moneda_data: MonedaUsuarioCreate,
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Crear una nueva moneda personalizada para el usuario autenticado"""
    try:
        repo = MonedaUsuarioRepository(db)
        
        # Verificar si el código ya existe para este usuario
        if repo.exists_by_codigo(moneda_data.codigo, usuario_id=current_user.id):
            raise HTTPException(
                status_code=400, 
                detail=f"Ya existe una moneda con el código {moneda_data.codigo}"
            )
        
        # Crear la moneda (el repository asigna automáticamente usuario_id)
        nueva_moneda = repo.create(moneda_data.model_dump(), usuario_id=current_user.id)
        
        logger.info(f"✅ Moneda {moneda_data.codigo} creada para usuario {current_user.id}")
        return nueva_moneda
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creando moneda: {e}")
        raise HTTPException(status_code=500, detail=f"Error creando moneda: {str(e)}")


@router.put("/{moneda_id}", response_model=MonedaUsuarioResponse)
async def update_currency(
    moneda_id: UUID,
    moneda_data: MonedaUsuarioUpdate,
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """
    Actualizar una moneda existente
    
    - Solo el propietario puede editar su moneda
    - No se puede cambiar el código de monedas predeterminadas
    """
    try:
        repo = MonedaUsuarioRepository(db)
        
        # Verificar que la moneda existe y pertenece al usuario
        moneda_actual = repo.get_by_id(moneda_id, usuario_id=current_user.id)
        if not moneda_actual:
            raise HTTPException(
                status_code=404, 
                detail="Moneda no encontrada o no tiene permiso para editarla"
            )
        
        # Si intenta cambiar el código, verificar que no exista
        if moneda_data.codigo and moneda_data.codigo != moneda_actual['codigo']:
            if repo.exists_by_codigo(moneda_data.codigo, usuario_id=current_user.id):
                raise HTTPException(
                    status_code=400, 
                    detail=f"Ya existe una moneda con el código {moneda_data.codigo}"
                )
        
        # Actualizar
        moneda_actualizada = repo.update(
            moneda_id, 
            moneda_data.model_dump(exclude_unset=True), 
            usuario_id=current_user.id
        )
        
        if not moneda_actualizada:
            raise HTTPException(status_code=404, detail="Error al actualizar moneda")
        
        logger.info(f"✅ Moneda {moneda_id} actualizada por usuario {current_user.id}")
        return moneda_actualizada
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error actualizando moneda: {e}")
        raise HTTPException(status_code=500, detail=f"Error actualizando moneda: {str(e)}")


@router.delete("/{moneda_id}", status_code=204)
async def delete_currency(
    moneda_id: UUID,
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """
    Eliminar una moneda (personalizada o predeterminada)
    
    - Solo el propietario puede eliminar sus monedas
    - ⚠️ Eliminar monedas predeterminadas puede afectar transacciones existentes
    """
    try:
        repo = MonedaUsuarioRepository(db)
        
        # Intentar eliminar (el repository valida si es predeterminada)
        eliminado = repo.delete(moneda_id, usuario_id=current_user.id)
        
        if not eliminado:
            raise HTTPException(
                status_code=400, 
                detail="No se puede eliminar: moneda predeterminada o no tiene permiso"
            )
        
        logger.info(f"✅ Moneda {moneda_id} eliminada por usuario {current_user.id}")
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error eliminando moneda: {e}")
        raise HTTPException(status_code=500, detail=f"Error eliminando moneda: {str(e)}")


@router.patch("/{moneda_id}/toggle-active", response_model=MonedaUsuarioResponse)
async def toggle_currency_active(
    moneda_id: UUID,
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """
    Cambiar el estado activo/inactivo de una moneda
    
    - Solo el propietario puede cambiar el estado
    - Permite activar/desactivar cualquier moneda (incluso predeterminadas)
    """
    try:
        repo = MonedaUsuarioRepository(db)
        
        moneda_actualizada = repo.toggle_active(moneda_id, usuario_id=current_user.id)
        
        if not moneda_actualizada:
            raise HTTPException(
                status_code=400, 
                detail="No se puede cambiar estado: moneda predeterminada o no tiene permiso"
            )
        
        logger.info(f"✅ Estado de moneda {moneda_id} cambiado por usuario {current_user.id}")
        return moneda_actualizada
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error cambiando estado de moneda: {e}")
        raise HTTPException(status_code=500, detail=f"Error cambiando estado: {str(e)}")


@router.post("/reorder", status_code=200)
async def reorder_currencies(
    reorder_data: MonedaUsuarioReorderRequest,
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """
    Reordenar las monedas del usuario
    
    Body: { "monedas": [{"id": "uuid", "orden": 0}, ...] }
    """
    try:
        repo = MonedaUsuarioRepository(db)
        
        exito = repo.reorder(usuario_id=current_user.id, monedas_orden=reorder_data.monedas)
        
        if not exito:
            raise HTTPException(status_code=400, detail="Error al reordenar monedas")
        
        logger.info(f"✅ Monedas reordenadas para usuario {current_user.id}")
        return {"message": "Monedas reordenadas exitosamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error reordenando monedas: {e}")
        raise HTTPException(status_code=500, detail=f"Error reordenando monedas: {str(e)}")


@router.post("/initialize-default", status_code=201)
async def initialize_default_currencies(
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """
    Inicializar monedas predeterminadas para el usuario
    
    - Se ejecuta automáticamente al crear cuenta
    - Puede ejecutarse manualmente si el usuario no tiene monedas
    """
    try:
        repo = MonedaUsuarioRepository(db)
        
        # Verificar si el usuario ya tiene monedas
        monedas_existentes = repo.get_all(usuario_id=current_user.id)
        if monedas_existentes:
            return {
                "message": "Usuario ya tiene monedas configuradas",
                "count": len(monedas_existentes)
            }
        
        # Crear monedas predeterminadas
        monedas_creadas = []
        for moneda_default in MONEDAS_PREDETERMINADAS:
            moneda_creada = repo.create(moneda_default.copy(), usuario_id=current_user.id)
            monedas_creadas.append(moneda_creada)
        
        logger.info(f"✅ {len(monedas_creadas)} monedas predeterminadas inicializadas para usuario {current_user.id}")
        return {
            "message": "Monedas predeterminadas inicializadas exitosamente",
            "count": len(monedas_creadas),
            "monedas": monedas_creadas
        }
        
    except Exception as e:
        logger.error(f"❌ Error inicializando monedas predeterminadas: {e}")
        raise HTTPException(status_code=500, detail=f"Error inicializando monedas: {str(e)}")

