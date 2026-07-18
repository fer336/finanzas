"""
Pagos Pendientes Router - Using PostgreSQL with Multi-Tenancy
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import date, datetime
import logging

from app.database import get_db
from app.repositories.pago_pendiente_repository_pg import PagoPendienteRepositoryPG
from app.core.dependencies import CurrentUser

router = APIRouter()
logger = logging.getLogger(__name__)

FIRST_DUE_DATE_ALIASES = (
    'Fechavencimiento',
    'FechaVencimiento',
    'fecha_vencimiento',
    'fechaVencimiento',
)
SECOND_DUE_DATE_ALIASES = (
    'segunda_fecha_vencimiento',
    'segundaFechaVencimiento',
    'SegundaFechaVencimiento',
    'fecha_segundo_vencimiento',
    'fechasegundovencimiento',
)


def _parse_date_only(value: Any, field_name: str) -> Optional[date]:
    if value in (None, ''):
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        try:
            return date.fromisoformat(value[:10])
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=f"{field_name} debe tener formato YYYY-MM-DD") from exc
    raise HTTPException(status_code=400, detail=f"{field_name} debe tener formato YYYY-MM-DD")


def _normalize_due_date_aliases(pago_data: Dict[str, Any]) -> None:
    for alias in FIRST_DUE_DATE_ALIASES:
        if alias in pago_data and 'fechavencimiento' not in pago_data:
            pago_data['fechavencimiento'] = pago_data.pop(alias)
        else:
            pago_data.pop(alias, None)

    for alias in SECOND_DUE_DATE_ALIASES:
        if alias in pago_data and alias != 'segunda_fecha_vencimiento':
            if 'segunda_fecha_vencimiento' not in pago_data:
                pago_data['segunda_fecha_vencimiento'] = pago_data.pop(alias)
            else:
                pago_data.pop(alias, None)

    if 'fechavencimiento' in pago_data:
        pago_data['fechavencimiento'] = _parse_date_only(pago_data['fechavencimiento'], 'fechavencimiento')
    if 'segunda_fecha_vencimiento' in pago_data:
        pago_data['segunda_fecha_vencimiento'] = _parse_date_only(
            pago_data['segunda_fecha_vencimiento'],
            'segunda_fecha_vencimiento',
        )


def _validate_second_due_date_after_first(first_due_date: Optional[date], second_due_date: Optional[date]) -> None:
    if first_due_date and second_due_date and second_due_date <= first_due_date:
        raise HTTPException(
            status_code=400,
            detail='segunda_fecha_vencimiento debe ser posterior a fechavencimiento',
        )


@router.get("/")
async def get_pending_payments(
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    limit: int = Query(500, ge=1, le=2000),
    offset: int = Query(0, ge=0),
    estado: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Obtener todos los pagos pendientes del usuario autenticado"""
    try:
        repo = PagoPendienteRepositoryPG(db)
        
        result = repo.get_all(
            usuario_id=current_user.id,  # 👈 Siempre usar el usuario del JWT
            limit=limit,
            offset=offset,
            estado=estado
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo pagos pendientes: {str(e)}")


@router.get("/{pago_id}")
async def get_pending_payment_by_id(
    pago_id: str,
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Obtener un pago pendiente por ID (solo si es del usuario)"""
    try:
        repo = PagoPendienteRepositoryPG(db)
        pago = repo.get_by_id(UUID(pago_id))
        
        if not pago or str(pago.get('usuario_id')) != str(current_user.id):
            raise HTTPException(status_code=404, detail="Pago pendiente no encontrado")
        
        return pago
        
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo pago pendiente: {str(e)}")


@router.post("/")
async def create_pending_payment(
    pago_data: Dict[str, Any],
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Crear un nuevo pago pendiente para el usuario autenticado"""
    try:
        repo = PagoPendienteRepositoryPG(db)
        
        # MAP FRONTEND STATUS TO BACKEND ESTADO (English -> Spanish)
        STATUS_MAP = {
            "paid": "pagado",
            "pending": "pendiente",
            "overdue": "vencido",
            "in_arrears": "en_mora",
            "cancelled": "cancelado",
            "Pendiente": "pendiente",
            "Pagado": "pagado",
            "Vencido": "vencido",
            "En mora": "en_mora"
        }
        _normalize_due_date_aliases(pago_data)
        
        # Remove invalid fields (capitalized versions)
        invalid_fields = ['Estado', 'Nombre', 'Descripcion', 'Monto', 'Moneda', 'Fechavencimiento',
                          'Tipo', 'Prioridad', 'Notas', 'status']
        for field in invalid_fields:
            if field in pago_data:
                pago_data.pop(field, None)

        # Mapear Recurrente/FrecuenciaRecurrencia (PascalCase, como las manda
        # el frontend) a las columnas reales del modelo (snake_case)
        if 'Recurrente' in pago_data:
            pago_data['recurrente'] = pago_data.pop('Recurrente')
        if 'FrecuenciaRecurrencia' in pago_data:
            pago_data['frecuencia_recurrencia'] = pago_data.pop('FrecuenciaRecurrencia') or None

        if 'frecuenciarecurrencia' in pago_data and 'frecuencia_recurrencia' not in pago_data:
            pago_data['frecuencia_recurrencia'] = pago_data.pop('frecuenciarecurrencia') or None

        # Si viene 'estado' en español con mayúscula, normalizarlo
        if 'estado' in pago_data:
            estado_value = pago_data['estado']
            if estado_value in STATUS_MAP:
                pago_data['estado'] = STATUS_MAP[estado_value]

        # Convert string IDs to UUID
        if pago_data.get('categorias_id'):
            pago_data['categorias_id'] = UUID(pago_data['categorias_id'])
        if pago_data.get('metodos_pago_id'):
            pago_data['metodos_pago_id'] = UUID(pago_data['metodos_pago_id'])

        # Forzar el usuario_id del token
        pago_data['usuario_id'] = current_user.id

        _validate_second_due_date_after_first(
            pago_data.get('fechavencimiento'),
            pago_data.get('segunda_fecha_vencimiento'),
        )

        logger.info(f"📝 Creating pago pendiente for user {current_user.id}")
        nuevo_pago = repo.create(pago_data)
        return nuevo_pago
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creating pago pendiente: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creando pago pendiente: {str(e)}")


@router.patch("/{pago_id}")
async def update_pending_payment(
    pago_id: str,
    pago_data: Dict[str, Any],
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Actualizar un pago pendiente existente (solo si es del usuario)"""
    try:
        repo = PagoPendienteRepositoryPG(db)
        
        # Verificar pertenencia
        pago_existente = repo.get_by_id(UUID(pago_id))
        if not pago_existente or str(pago_existente.get('usuario_id')) != str(current_user.id):
            raise HTTPException(status_code=404, detail="Pago pendiente no encontrado")
        
        # MAP FRONTEND STATUS TO BACKEND ESTADO (English -> Spanish)
        STATUS_MAP = {
            "paid": "pagado",
            "pending": "pendiente",
            "overdue": "vencido",
            "in_arrears": "en_mora",
            "cancelled": "cancelado"
        }
        _normalize_due_date_aliases(pago_data)
        
        # Si viene 'status' en inglés, convertir a 'estado' en español
        if 'status' in pago_data:
            status_value = pago_data.pop('status')
            pago_data['estado'] = STATUS_MAP.get(status_value, status_value)
        
        # Si viene 'estado' en inglés, traducirlo
        if 'estado' in pago_data and pago_data['estado'] in STATUS_MAP:
            original = pago_data['estado']
            pago_data['estado'] = STATUS_MAP[original]

        # Mapear Recurrente/FrecuenciaRecurrencia (PascalCase) a snake_case
        if 'Recurrente' in pago_data:
            pago_data['recurrente'] = pago_data.pop('Recurrente')
        if 'FrecuenciaRecurrencia' in pago_data:
            pago_data['frecuencia_recurrencia'] = pago_data.pop('FrecuenciaRecurrencia') or None

        if 'frecuenciarecurrencia' in pago_data and 'frecuencia_recurrencia' not in pago_data:
            pago_data['frecuencia_recurrencia'] = pago_data.pop('frecuenciarecurrencia') or None

        # Convert string IDs to UUID
        if pago_data.get('categorias_id'):
            pago_data['categorias_id'] = UUID(pago_data['categorias_id'])
        if pago_data.get('metodos_pago_id'):
            pago_data['metodos_pago_id'] = UUID(pago_data['metodos_pago_id'])

        # No permitir cambiar el usuario_id
        pago_data.pop('usuario_id', None)

        first_due_date = pago_data['fechavencimiento'] if 'fechavencimiento' in pago_data else _parse_date_only(pago_existente.get('fechavencimiento'), 'fechavencimiento')
        second_due_date = pago_data['segunda_fecha_vencimiento'] if 'segunda_fecha_vencimiento' in pago_data else _parse_date_only(pago_existente.get('segunda_fecha_vencimiento'), 'segunda_fecha_vencimiento')
        _validate_second_due_date_after_first(first_due_date, second_due_date)
        
        logger.info(f"📝 Updating payment {pago_id} for user {current_user.id}")
        pago_actualizado = repo.update(UUID(pago_id), pago_data)
        
        return pago_actualizado
        
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error actualizando pago pendiente: {str(e)}")


@router.delete("/{pago_id}")
async def delete_pending_payment(
    pago_id: str,
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Eliminar un pago pendiente (solo si es del usuario)"""
    try:
        repo = PagoPendienteRepositoryPG(db)
        
        # Verificar pertenencia
        pago_existente = repo.get_by_id(UUID(pago_id))
        if not pago_existente or str(pago_existente.get('usuario_id')) != str(current_user.id):
            raise HTTPException(status_code=404, detail="Pago pendiente no encontrado")
            
        success = repo.delete(UUID(pago_id))
        
        if not success:
            raise HTTPException(status_code=404, detail="Pago pendiente no encontrado")
        
        return {"message": "Pago pendiente eliminado exitosamente", "id": pago_id}
        
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error eliminando pago pendiente: {str(e)}")
