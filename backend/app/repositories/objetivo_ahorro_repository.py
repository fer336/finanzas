"""
Repository for ObjetivoAhorro (Savings Goals)
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Optional, Any
from uuid import UUID
from decimal import Decimal
from datetime import datetime, date

from app.models.db_models import ObjetivoAhorro, AporteObjetivo


class ObjetivoAhorroRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, objetivo_data: Dict[str, Any]) -> ObjetivoAhorro:
        """Create a new savings goal"""
        objetivo = ObjetivoAhorro(**objetivo_data)
        self.db.add(objetivo)
        self.db.commit()
        self.db.refresh(objetivo)
        return objetivo
    
    def get_by_id(self, objetivo_id: UUID) -> Optional[ObjetivoAhorro]:
        """Get savings goal by ID"""
        return self.db.query(ObjetivoAhorro).filter(ObjetivoAhorro.id == objetivo_id).first()
    
    def get_all(self, usuario_id: Optional[UUID] = None, estado: Optional[str] = None) -> List[ObjetivoAhorro]:
        """Get all savings goals with optional filters"""
        query = self.db.query(ObjetivoAhorro)
        
        if usuario_id:
            query = query.filter(ObjetivoAhorro.usuario_id == usuario_id)
        
        if estado:
            query = query.filter(ObjetivoAhorro.estado == estado)
        
        return query.order_by(ObjetivoAhorro.fecha_inicio.desc()).all()
    
    def get_active(self, usuario_id: Optional[UUID] = None) -> List[ObjetivoAhorro]:
        """Get only active savings goals (en_progreso)"""
        return self.get_all(usuario_id=usuario_id, estado='en_progreso')

    def get_total_apartado_disponible(self, usuario_id: UUID, moneda: str = "ARS") -> Decimal:
        """Total saved in open goals that still needs to be removed from availability.

        Transaction-backed goal contributions already affect ``balance_neto`` as
        expenses, so subtracting them again would double-count the reservation.
        Only positive, non-transaction contributions represent money moved out of
        available balance without an accounting transaction.

        No currency conversion is performed: only contributions in the requested
        currency are summed.
        """
        total = self.db.query(func.sum(AporteObjetivo.monto)).join(
            ObjetivoAhorro,
            AporteObjetivo.objetivo_id == ObjetivoAhorro.id,
        ).filter(
            ObjetivoAhorro.usuario_id == usuario_id,
            ObjetivoAhorro.estado.in_(("pendiente", "en_progreso")),
            func.upper(AporteObjetivo.moneda) == moneda.upper(),
            AporteObjetivo.monto > 0,
            AporteObjetivo.tipo_referencia.is_(None),
        ).scalar()
        return total or Decimal('0')
    
    def update(self, objetivo_id: UUID, objetivo_data: Dict[str, Any]) -> Optional[ObjetivoAhorro]:
        """Update a savings goal"""
        objetivo = self.get_by_id(objetivo_id)
        if not objetivo:
            return None
        
        for key, value in objetivo_data.items():
            if hasattr(objetivo, key):
                setattr(objetivo, key, value)
        
        objetivo.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(objetivo)
        return objetivo
    
    def delete(self, objetivo_id: UUID) -> bool:
        """Delete a savings goal"""
        objetivo = self.get_by_id(objetivo_id)
        if not objetivo:
            return False
        
        self.db.delete(objetivo)
        self.db.commit()
        return True
    
    def add_contribution(self, aporte_data: Dict[str, Any]) -> AporteObjetivo:
        """Add a contribution to a savings goal"""
        aporte = AporteObjetivo(**aporte_data)
        self.db.add(aporte)
        self.db.commit()
        
        # Update objetivo's monto_actual and porcentaje_completado
        objetivo = self.get_by_id(aporte.objetivo_id)
        if objetivo:
            self._recalculate_progress(objetivo.id)
        
        self.db.refresh(aporte)
        return aporte
    
    def get_contributions(self, objetivo_id: UUID) -> List[AporteObjetivo]:
        """Get all contributions for a savings goal"""
        return self.db.query(AporteObjetivo).filter(
            AporteObjetivo.objetivo_id == objetivo_id
        ).order_by(AporteObjetivo.fecha.desc()).all()
    
    def get_contribution(self, aporte_id: int) -> Optional[AporteObjetivo]:
        """Get a contribution by id."""
        return self.db.query(AporteObjetivo).filter(AporteObjetivo.id == aporte_id).first()

    def update_contribution(
        self,
        aporte_id: int,
        aporte_data: Dict[str, Any],
        usuario_id: UUID,
    ) -> Optional[AporteObjetivo]:
        """Update a contribution belonging to one of the user's goals."""
        aporte = self.get_contribution(aporte_id)
        if not aporte:
            return None

        if not aporte.objetivo or str(aporte.objetivo.usuario_id) != str(usuario_id):
            return None

        for key, value in aporte_data.items():
            if key not in {"objetivo_id", "referencia_id", "tipo_referencia"} and hasattr(aporte, key):
                setattr(aporte, key, value)

        self.db.commit()
        self._recalculate_progress(aporte.objetivo_id)
        self.db.refresh(aporte)
        return aporte

    def delete_contribution(self, aporte_id: int, usuario_id: UUID) -> Optional[Decimal]:
        """Delete a contribution and return its amount to available balance.

        Manual contributions are reservations, not expenses. Removing one
        removes that reservation, so the balance available to the user
        increases by the deleted amount without creating a duplicate income
        transaction. Transaction-backed contributions remain tied to their
        original transaction and are handled by that transaction separately.
        """
        aporte = self.get_contribution(aporte_id)
        if not aporte or not aporte.objetivo or str(aporte.objetivo.usuario_id) != str(usuario_id):
            return None
        
        objetivo_id = aporte.objetivo_id
        monto = Decimal(aporte.monto)
        self.db.delete(aporte)
        self.db.commit()
        
        # Recalculate progress after deletion
        self._recalculate_progress(objetivo_id)
        return monto
    
    def _recalculate_progress(self, objetivo_id: UUID) -> None:
        """Recalculate monto_actual and porcentaje_completado for a savings goal"""
        objetivo = self.get_by_id(objetivo_id)
        if not objetivo:
            return
        
        # Sum all contributions
        total_aportes = self.db.query(func.sum(AporteObjetivo.monto)).filter(
            AporteObjetivo.objetivo_id == objetivo_id
        ).scalar() or Decimal('0')
        
        objetivo.monto_actual = total_aportes
        
        # Calculate percentage
        if objetivo.monto_objetivo > 0:
            porcentaje = (total_aportes / objetivo.monto_objetivo) * 100
            objetivo.porcentaje_completado = min(porcentaje, Decimal('100'))
        else:
            objetivo.porcentaje_completado = Decimal('0')
        
        # Update estado if completed
        if objetivo.porcentaje_completado >= 100:
            objetivo.estado = 'completado'
        elif objetivo.estado == 'completado' and objetivo.porcentaje_completado < 100:
            objetivo.estado = 'en_progreso'
        
        objetivo.updated_at = datetime.utcnow()
        self.db.commit()
    
    def get_stats(self, usuario_id: Optional[UUID] = None) -> Dict[str, Any]:
        """Get statistics about savings goals"""
        query = self.db.query(ObjetivoAhorro)
        
        if usuario_id:
            query = query.filter(ObjetivoAhorro.usuario_id == usuario_id)
        
        total = query.count()
        activos = query.filter(ObjetivoAhorro.estado == 'en_progreso').count()
        completados = query.filter(ObjetivoAhorro.estado == 'completado').count()
        
        # Sum all active goals
        total_objetivo = query.filter(
            ObjetivoAhorro.estado == 'en_progreso'
        ).with_entities(func.sum(ObjetivoAhorro.monto_objetivo)).scalar() or Decimal('0')
        
        total_ahorrado = query.filter(
            ObjetivoAhorro.estado == 'en_progreso'
        ).with_entities(func.sum(ObjetivoAhorro.monto_actual)).scalar() or Decimal('0')
        
        return {
            'total': total,
            'activos': activos,
            'completados': completados,
            'total_objetivo': float(total_objetivo),
            'total_ahorrado': float(total_ahorrado),
            'porcentaje_global': float((total_ahorrado / total_objetivo * 100) if total_objetivo > 0 else 0)
        }
    
    def _to_dict(self, objetivo: ObjetivoAhorro) -> Dict[str, Any]:
        """Convert ObjetivoAhorro to dictionary"""
        return {
            'id': str(objetivo.id),
            'nombre': objetivo.nombre,
            'descripcion': objetivo.descripcion,
            'monto_objetivo': float(objetivo.monto_objetivo),
            'monto_actual': float(objetivo.monto_actual),
            'moneda': objetivo.moneda,
            'porcentaje_completado': float(objetivo.porcentaje_completado),
            'fecha_inicio': objetivo.fecha_inicio.isoformat() if objetivo.fecha_inicio else None,
            'fecha_objetivo': objetivo.fecha_objetivo.isoformat() if objetivo.fecha_objetivo else None,
            'estado': objetivo.estado,
            'icono': objetivo.icono,
            'notas': objetivo.notas,
            'prioridad': objetivo.prioridad,
            'tipo': objetivo.tipo,
            'categoria_id': str(objetivo.categoria_id) if objetivo.categoria_id else None,
            'categoria': {
                'id': str(objetivo.categoria.id),
                'nombre': objetivo.categoria.nombre,
                'icono': objetivo.categoria.icono
            } if objetivo.categoria else None,
            'created_at': objetivo.created_at.isoformat() if objetivo.created_at else None,
            'updated_at': objetivo.updated_at.isoformat() if objetivo.updated_at else None,
            'aportes': [self._aporte_to_dict(aporte) for aporte in objetivo.aportes],
        }

    @staticmethod
    def _aporte_to_dict(aporte: AporteObjetivo) -> Dict[str, Any]:
        return {
            'id': aporte.id,
            'objetivo_id': str(aporte.objetivo_id),
            'monto': float(aporte.monto),
            'moneda': aporte.moneda,
            'fecha': aporte.fecha.isoformat() if aporte.fecha else None,
            'descripcion': aporte.descripcion,
            'tipo': aporte.tipo,
            'referencia_id': str(aporte.referencia_id) if aporte.referencia_id else None,
            'tipo_referencia': aporte.tipo_referencia,
            'notas': aporte.notas,
            'created_at': aporte.created_at.isoformat() if aporte.created_at else None,
        }
