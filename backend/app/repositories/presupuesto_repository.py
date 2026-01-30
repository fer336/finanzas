"""
Presupuesto Repository - PostgreSQL with SQLAlchemy
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, extract, func
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from uuid import UUID
import logging

from app.models.db_models import Presupuesto, Categoria, Transaccion

logger = logging.getLogger(__name__)


class PresupuestoRepository:
    """Repository for Presupuesto using PostgreSQL"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_all(
        self,
        usuario_id: Optional[UUID] = None,
        activo: Optional[bool] = None,
        categoria_id: Optional[UUID] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Get all budgets with filters"""
        query = self.db.query(Presupuesto).options(
            joinedload(Presupuesto.categoria)
        )
        
        if usuario_id:
            query = query.filter(Presupuesto.usuario_id == usuario_id)
        
        if activo is not None:
            if activo:
                query = query.filter(Presupuesto.estado == 'activo')
            else:
                query = query.filter(Presupuesto.estado != 'activo')
        
        if categoria_id:
            query = query.filter(Presupuesto.categoria_id == categoria_id)
        
        # Order by fecha_inicio descending
        query = query.order_by(Presupuesto.fecha_inicio.desc())
        
        # Get total count before pagination
        total_count = query.count()
        
        # Apply pagination
        presupuestos = query.offset(offset).limit(limit).all()
        
        return {
            "list": [self._to_dict(p) for p in presupuestos],
            "pageInfo": {"totalRows": total_count}
        }
    
    def get_by_id(self, presupuesto_id: UUID) -> Optional[Dict[str, Any]]:
        """Get budget by ID"""
        presupuesto = self.db.query(Presupuesto).options(
            joinedload(Presupuesto.categoria)
        ).filter(Presupuesto.id == presupuesto_id).first()
        
        return self._to_dict(presupuesto) if presupuesto else None
    
    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new budget"""
        presupuesto = Presupuesto(**data)
        self.db.add(presupuesto)
        self.db.commit()
        self.db.refresh(presupuesto)
        
        logger.info(f"✅ Presupuesto creado: {presupuesto.id}")
        return self._to_dict(presupuesto)
    
    def update(self, presupuesto_id: UUID, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update budget"""
        presupuesto = self.db.query(Presupuesto).filter(Presupuesto.id == presupuesto_id).first()
        
        if not presupuesto:
            return None
        
        # Update fields
        for key, value in data.items():
            if hasattr(presupuesto, key) and value is not None:
                setattr(presupuesto, key, value)
        
        presupuesto.fecha_actualizacion = datetime.utcnow()
        self.db.commit()
        self.db.refresh(presupuesto)
        
        logger.info(f"✅ Presupuesto actualizado: {presupuesto.id}")
        return self._to_dict(presupuesto)
    
    def delete(self, presupuesto_id: UUID) -> bool:
        """Delete budget"""
        presupuesto = self.db.query(Presupuesto).filter(Presupuesto.id == presupuesto_id).first()
        
        if not presupuesto:
            return False
        
        self.db.delete(presupuesto)
        self.db.commit()
        
        logger.info(f"✅ Presupuesto eliminado: {presupuesto_id}")
        return True
    
    def get_active_budgets(self, usuario_id: Optional[UUID] = None) -> List[Dict[str, Any]]:
        """Get active budgets for current period"""
        today = date.today()
        
        query = self.db.query(Presupuesto).options(
            joinedload(Presupuesto.categoria)
        ).filter(
            and_(
                Presupuesto.fecha_inicio <= today,
                Presupuesto.fecha_fin >= today,
                Presupuesto.estado == 'activo'
            )
        )
        
        if usuario_id:
            query = query.filter(Presupuesto.usuario_id == usuario_id)
        
        presupuestos = query.all()
        
        # Calculate spending for each budget
        result = []
        for p in presupuestos:
            budget_dict = self._to_dict(p)
            budget_dict['monto_gastado'] = self._calculate_spending(p)
            budget_dict['monto_disponible'] = float(p.monto_limite) - budget_dict['monto_gastado']
            budget_dict['porcentaje_usado'] = (budget_dict['monto_gastado'] / float(p.monto_limite) * 100) if p.monto_limite > 0 else 0
            result.append(budget_dict)
        
        return result
    
    def _calculate_spending(self, presupuesto: Presupuesto) -> float:
        """Calculate total spending for a budget"""
        query = self.db.query(func.sum(func.abs(Transaccion.monto_ars))).filter(
            and_(
                Transaccion.fecha_transaccion >= presupuesto.fecha_inicio,
                Transaccion.fecha_transaccion <= presupuesto.fecha_fin,
                Transaccion.tipo == 'gasto'
            )
        )
        
        # If budget has a category, filter by it
        if presupuesto.categoria_id:
            query = query.filter(Transaccion.categoria_id == presupuesto.categoria_id)
        
        # Filter by usuario if set
        if presupuesto.usuario_id:
            query = query.filter(Transaccion.usuario_id == presupuesto.usuario_id)
        
        result = query.scalar()
        return float(result) if result else 0.0
    
    def analyze_purchase(
        self, 
        monto: float, 
        categoria_id: Optional[UUID] = None, 
        fecha: Optional[date] = None,
        usuario_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """Analyze if a purchase fits within budget"""
        if not fecha:
            fecha = date.today()
        
        # Find relevant budget
        query = self.db.query(Presupuesto).options(
            joinedload(Presupuesto.categoria)
        ).filter(
            and_(
                Presupuesto.fecha_inicio <= fecha,
                Presupuesto.fecha_fin >= fecha,
                Presupuesto.estado == 'activo'
            )
        )
        
        if usuario_id:
            query = query.filter(Presupuesto.usuario_id == usuario_id)
        
        # Initialize presupuesto variable
        presupuesto = None
        
        # Try to find category-specific budget first
        if categoria_id:
            presupuesto = query.filter(Presupuesto.categoria_id == categoria_id).first()
        
        # If no category budget, try general budget (no category)
        if not presupuesto:
            presupuesto = query.filter(Presupuesto.categoria_id == None).first()
        
        if not presupuesto:
            return {
                "tiene_presupuesto": False,
                "puede_comprar": True,
                "mensaje": "No hay presupuesto activo para este período"
            }
        
        # Calculate current spending
        gasto_actual = self._calculate_spending(presupuesto)
        gasto_despues = gasto_actual + monto
        limite = float(presupuesto.monto_limite)
        disponible_antes = limite - gasto_actual
        disponible_despues = limite - gasto_despues
        porcentaje_antes = (gasto_actual / limite * 100) if limite > 0 else 0
        porcentaje_despues = (gasto_despues / limite * 100) if limite > 0 else 0
        
        # Days remaining in period
        dias_restantes = (presupuesto.fecha_fin - fecha).days
        
        # Recommendation logic
        puede_comprar = gasto_despues <= limite
        recomendacion = ""
        
        if puede_comprar:
            if porcentaje_despues >= 90:
                recomendacion = "⚠️ Puedes hacerlo, pero quedarías muy cerca del límite. Considera reducir otros gastos."
            elif porcentaje_despues >= 70:
                recomendacion = "⚡ Puedes hacerlo, pero ten cuidado con el resto del período."
            else:
                recomendacion = "✅ Puedes hacerlo sin problemas. Tienes margen suficiente."
        else:
            exceso = gasto_despues - limite
            recomendacion = f"❌ No es recomendable. Te excederías por ${exceso:,.0f}. Considera ajustar el monto o esperar al próximo período."
        
        return {
            "tiene_presupuesto": True,
            "puede_comprar": puede_comprar,
            "presupuesto": self._to_dict(presupuesto),
            "monto_compra": monto,
            "gasto_actual": gasto_actual,
            "gasto_despues": gasto_despues,
            "limite": limite,
            "disponible_antes": disponible_antes,
            "disponible_despues": disponible_despues,
            "porcentaje_antes": round(porcentaje_antes, 1),
            "porcentaje_despues": round(porcentaje_despues, 1),
            "dias_restantes": dias_restantes,
            "recomendacion": recomendacion
        }
    
    def _to_dict(self, presupuesto: Presupuesto) -> Dict[str, Any]:
        """Convert Presupuesto model to dictionary"""
        if not presupuesto:
            return {}
        
        return {
            "id": str(presupuesto.id),
            "nombre": presupuesto.nombre,
            "descripcion": presupuesto.descripcion,
            "monto_limite": float(presupuesto.monto_limite),
            "monto_gastado": float(presupuesto.monto_gastado) if presupuesto.monto_gastado else 0,
            "periodo": presupuesto.periodo,
            "fecha_inicio": presupuesto.fecha_inicio.isoformat() if presupuesto.fecha_inicio else None,
            "fecha_fin": presupuesto.fecha_fin.isoformat() if presupuesto.fecha_fin else None,
            "alerta_porcentaje": presupuesto.alerta_porcentaje,
            "estado": presupuesto.estado,
            "color": presupuesto.color,
            "categoria_id": str(presupuesto.categoria_id) if presupuesto.categoria_id else None,
            "usuario_id": str(presupuesto.usuario_id) if presupuesto.usuario_id else None,
            "fecha_creacion": presupuesto.fecha_creacion.isoformat() if presupuesto.fecha_creacion else None,
            "fecha_actualizacion": presupuesto.fecha_actualizacion.isoformat() if presupuesto.fecha_actualizacion else None,
            "categoria": self._categoria_to_dict(presupuesto.categoria) if presupuesto.categoria else None
        }
    
    def _categoria_to_dict(self, categoria: Optional[Categoria]) -> Optional[Dict[str, Any]]:
        """Convert Categoria to dict"""
        if not categoria:
            return None
        
        return {
            "id": str(categoria.id),
            "nombre": categoria.nombre,
            "tipo": categoria.tipo,
            "color": categoria.color,
            "icono": categoria.icono
        }

