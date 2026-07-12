"""
Presupuestos Router - CRUD operations for budgets
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from uuid import UUID
from datetime import date

from app.database import get_db
from app.repositories.presupuesto_repository import PresupuestoRepository
from app.core.dependencies import CurrentUser

router = APIRouter()


@router.get("/")
async def get_presupuestos(
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    activo: Optional[bool] = None,
    categoria_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all budgets for the authenticated user"""
    try:
        repo = PresupuestoRepository(db)
        
        result = repo.get_all(
            usuario_id=current_user.id,  # 👈 Siempre usar el usuario del JWT
            limit=limit,
            offset=offset
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo presupuestos: {str(e)}")


@router.get("/active")
async def get_active_presupuestos(
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Get active budgets for current period with calculated spending"""
    try:
        repo = PresupuestoRepository(db)
        presupuestos = repo.get_active_budgets(usuario_id=current_user.id)
        
        return {
            "list": presupuestos,
            "count": len(presupuestos)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo presupuestos activos: {str(e)}")


@router.get("/{presupuesto_id}")
async def get_presupuesto(
    presupuesto_id: str,
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Get budget by ID (only if it belongs to the user)"""
    try:
        repo = PresupuestoRepository(db)
        presupuesto = repo.get_by_id(UUID(presupuesto_id))
        
        if not presupuesto or str(presupuesto.get('usuario_id')) != str(current_user.id):
            raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
        
        # Calculate current spending
        from app.models.db_models import Presupuesto
        budget_obj = db.query(Presupuesto).filter(Presupuesto.id == UUID(presupuesto_id)).first()
        if budget_obj:
            presupuesto['monto_gastado'] = repo._calculate_spending(budget_obj)
            presupuesto['monto_disponible'] = presupuesto['monto_limite'] - presupuesto['monto_gastado']
            presupuesto['porcentaje_usado'] = (presupuesto['monto_gastado'] / presupuesto['monto_limite'] * 100) if presupuesto['monto_limite'] > 0 else 0
        
        return presupuesto
        
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo presupuesto: {str(e)}")


@router.post("/")
async def create_presupuesto(
    presupuesto_data: Dict[str, Any],
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Create new budget for the authenticated user"""
    try:
        repo = PresupuestoRepository(db)
        
        # Remove 'id' if present
        if 'id' in presupuesto_data:
            del presupuesto_data['id']
        
        # Convert string IDs to UUID
        if presupuesto_data.get('categoria_id'):
            presupuesto_data['categoria_id'] = UUID(presupuesto_data['categoria_id'])
        
        # Forzar usuario del token
        presupuesto_data['usuario_id'] = current_user.id
        
        # Ensure dates are date objects
        if isinstance(presupuesto_data.get('fecha_inicio'), str):
            presupuesto_data['fecha_inicio'] = date.fromisoformat(presupuesto_data['fecha_inicio'])
        if isinstance(presupuesto_data.get('fecha_fin'), str):
            presupuesto_data['fecha_fin'] = date.fromisoformat(presupuesto_data['fecha_fin'])
        
        nuevo_presupuesto = repo.create(presupuesto_data)
        
        return nuevo_presupuesto
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creando presupuesto: {str(e)}")


@router.patch("/{presupuesto_id}")
async def update_presupuesto(
    presupuesto_id: str,
    presupuesto_data: Dict[str, Any],
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Update budget (only if it belongs to the user)"""
    try:
        repo = PresupuestoRepository(db)
        
        # Verificar pertenencia
        presupuesto_existente = repo.get_by_id(UUID(presupuesto_id))
        if not presupuesto_existente or str(presupuesto_existente.get('usuario_id')) != str(current_user.id):
            raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
            
        # Convert string IDs to UUID
        if presupuesto_data.get('categoria_id'):
            presupuesto_data['categoria_id'] = UUID(presupuesto_data['categoria_id'])
        
        # No permitir cambiar el usuario_id
        presupuesto_data.pop('usuario_id', None)
        
        # Ensure dates are date objects
        if isinstance(presupuesto_data.get('fecha_inicio'), str):
            presupuesto_data['fecha_inicio'] = date.fromisoformat(presupuesto_data['fecha_inicio'])
        if isinstance(presupuesto_data.get('fecha_fin'), str):
            presupuesto_data['fecha_fin'] = date.fromisoformat(presupuesto_data['fecha_fin'])
        
        presupuesto = repo.update(UUID(presupuesto_id), presupuesto_data)
        
        if not presupuesto:
            raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
        
        return presupuesto
        
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error actualizando presupuesto: {str(e)}")


@router.delete("/{presupuesto_id}")
async def delete_presupuesto(
    presupuesto_id: str,
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """Delete budget (only if it belongs to the user)"""
    try:
        repo = PresupuestoRepository(db)
        
        # Verificar pertenencia
        presupuesto_existente = repo.get_by_id(UUID(presupuesto_id))
        if not presupuesto_existente or str(presupuesto_existente.get('usuario_id')) != str(current_user.id):
            raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
            
        success = repo.delete(UUID(presupuesto_id))
        
        if not success:
            raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
        
        return {"message": "Presupuesto eliminado exitosamente", "id": presupuesto_id}
        
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error eliminando presupuesto: {str(e)}")


@router.post("/analyze-purchase")
async def analyze_purchase(
    data: Dict[str, Any],
    current_user: CurrentUser,  # 🔒 Requiere autenticación
    db: Session = Depends(get_db)
):
    """
    Analyze if a purchase fits within budget

    Body:
        - monto: float (required)
        - categoria_id: str (optional)
        - fecha: str (optional, default: today)

    Returns:
        - tiene_presupuesto: bool
        - puede_comprar: bool
        - Analysis details and recommendation
    """
    try:
        repo = PresupuestoRepository(db)

        monto = data.get('monto')
        if not monto:
            raise HTTPException(status_code=400, detail="El campo 'monto' es requerido")

        categoria_id = UUID(data['categoria_id']) if data.get('categoria_id') else None
        fecha = date.fromisoformat(data['fecha']) if data.get('fecha') else date.today()

        result = repo.analyze_purchase(
            monto=float(monto),
            categoria_id=categoria_id,
            fecha=fecha,
            usuario_id=current_user.id
        )

        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analizando compra: {str(e)}")

