"""
Préstamos Router - Using PostgreSQL with Multi-Tenancy
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import date
import logging

from app.database import get_db
from app.repositories.prestamo_repository import PrestamoRepository
from app.repositories.transaccion_repository import TransaccionRepository
from app.core.dependencies import CurrentUser

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/")
async def get_prestamos(
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    limit: int = Query(500, ge=1, le=2000),
    offset: int = Query(0, ge=0),
    estado: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Obtener todos los préstamos del usuario autenticado"""
    try:
        repo = PrestamoRepository(db)
        return repo.get_all(
            usuario_id=current_user.id,
            limit=limit,
            offset=offset,
            estado=estado
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo préstamos: {str(e)}")


@router.get("/{prestamo_id}")
async def get_prestamo_by_id(
    prestamo_id: str,
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Obtener un préstamo por ID (solo si es del usuario)"""
    try:
        repo = PrestamoRepository(db)
        prestamo = repo.get_by_id(UUID(prestamo_id))

        if not prestamo or str(prestamo.get('usuario_id')) != str(current_user.id):
            raise HTTPException(status_code=404, detail="Préstamo no encontrado")

        return prestamo

    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo préstamo: {str(e)}")


@router.post("/")
async def create_prestamo(
    prestamo_data: Dict[str, Any],
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Crear un nuevo préstamo para el usuario autenticado"""
    try:
        repo = PrestamoRepository(db)

        if not prestamo_data.get('nombre_fuente'):
            raise HTTPException(status_code=400, detail="nombre_fuente es requerido")
        if prestamo_data.get('monto_prestado') is None:
            raise HTTPException(status_code=400, detail="monto_prestado es requerido")
        if prestamo_data.get('monto_a_devolver') is None:
            raise HTTPException(status_code=400, detail="monto_a_devolver es requerido")
        if not prestamo_data.get('fecha_vencimiento'):
            raise HTTPException(status_code=400, detail="fecha_vencimiento es requerida")

        # No permitir spoofear el usuario
        prestamo_data['usuario_id'] = current_user.id

        logger.info(f"📝 Creating préstamo for user {current_user.id}")
        nuevo_prestamo = repo.create(prestamo_data)

        # Recibir un préstamo es plata que entra — se refleja como ingreso
        # real en Movimientos, mismo patrón que pagos.py usa para el lado
        # del repago (transacción creada "a mano" con TransaccionRepository,
        # tageada en notas para poder rastrearla/borrarla después).
        transaccion_repo = TransaccionRepository(db)
        fecha_prestamo = nuevo_prestamo.get('fecha_prestamo') or date.today().isoformat()
        monto_prestado = nuevo_prestamo.get('monto_prestado', 0)
        transaccion_data = {
            "monto": abs(float(monto_prestado)),
            "moneda": nuevo_prestamo.get('moneda', 'ARS'),
            "monto_ars": abs(float(monto_prestado)),
            "tasa_cambio": 1.0,
            "descripcion": f"Préstamo recibido — {nuevo_prestamo.get('nombre_fuente')}",
            "fecha_transaccion": fecha_prestamo,
            "tipo": "ingreso",
            "notas": f"Préstamo recibido\n[PRESTAMO_ID: {nuevo_prestamo['id']}]",
            "usuario_id": current_user.id,
        }
        nueva_transaccion = transaccion_repo.create(transaccion_data)

        return {**nuevo_prestamo, "transaccion_id": nueva_transaccion["id"]}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creating préstamo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creando préstamo: {str(e)}")


@router.patch("/{prestamo_id}")
async def update_prestamo(
    prestamo_id: str,
    prestamo_data: Dict[str, Any],
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Actualizar un préstamo existente (solo si es del usuario)"""
    try:
        repo = PrestamoRepository(db)

        prestamo_existente = repo.get_by_id(UUID(prestamo_id))
        if not prestamo_existente or str(prestamo_existente.get('usuario_id')) != str(current_user.id):
            raise HTTPException(status_code=404, detail="Préstamo no encontrado")

        # No permitir cambiar el usuario_id
        prestamo_data.pop('usuario_id', None)

        logger.info(f"📝 Updating préstamo {prestamo_id} for user {current_user.id}")
        return repo.update(UUID(prestamo_id), prestamo_data)

    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error actualizando préstamo: {str(e)}")


@router.delete("/{prestamo_id}")
async def delete_prestamo(
    prestamo_id: str,
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Eliminar un préstamo (solo si es del usuario)"""
    try:
        repo = PrestamoRepository(db)

        prestamo_existente = repo.get_by_id(UUID(prestamo_id))
        if not prestamo_existente or str(prestamo_existente.get('usuario_id')) != str(current_user.id):
            raise HTTPException(status_code=404, detail="Préstamo no encontrado")

        # Borrar también el ingreso que se creó al recibir el préstamo (mismo
        # patrón de búsqueda por tag en notas que usa pagos.py/deshacer_pago)
        transaccion_repo = TransaccionRepository(db)
        result = transaccion_repo.get_all(usuario_id=current_user.id, tipo='ingreso', limit=1000)
        tag = f"[PRESTAMO_ID: {prestamo_id}]"
        for t in result.get('list', []):
            if tag in str(t.get('notas', '')):
                transaccion_repo.delete(UUID(str(t['id'])))

        success = repo.delete(UUID(prestamo_id))
        if not success:
            raise HTTPException(status_code=404, detail="Préstamo no encontrado")

        return {"message": "Préstamo eliminado exitosamente", "id": prestamo_id}

    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error eliminando préstamo: {str(e)}")
