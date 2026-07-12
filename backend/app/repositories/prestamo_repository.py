"""
Prestamo Repository - PostgreSQL with SQLAlchemy
"""
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID
import logging

from app.models.db_models import Prestamo

logger = logging.getLogger(__name__)


class PrestamoRepository:
    """Repository for Prestamo using PostgreSQL"""

    def __init__(self, db: Session):
        self.db = db

    def get_all(
        self,
        usuario_id: Optional[UUID] = None,
        limit: int = 100,
        offset: int = 0,
        estado: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get all préstamos with filters"""
        query = self.db.query(Prestamo)

        if usuario_id:
            query = query.filter(Prestamo.usuario_id == usuario_id)

        if estado:
            query = query.filter(Prestamo.estado == estado)

        query = query.order_by(Prestamo.fecha_vencimiento.asc())

        total = query.count()
        prestamos = query.offset(offset).limit(limit).all()

        return {
            "list": [self._to_dict(p) for p in prestamos],
            "pageInfo": {
                "totalRows": total,
                "page": offset // limit + 1 if limit > 0 else 1,
                "pageSize": limit,
                "isFirstPage": offset == 0,
                "isLastPage": offset + limit >= total
            }
        }

    def get_by_id(self, prestamo_id: UUID) -> Optional[Dict[str, Any]]:
        """Get préstamo by ID"""
        prestamo = self.db.query(Prestamo).filter(Prestamo.id == prestamo_id).first()
        return self._to_dict(prestamo) if prestamo else None

    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new préstamo"""
        prestamo = Prestamo(**data)
        self.db.add(prestamo)
        self.db.commit()
        self.db.refresh(prestamo)

        logger.info(f"✅ Préstamo creado: {prestamo.id}")
        return self._to_dict(prestamo)

    def update(self, prestamo_id: UUID, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update préstamo"""
        prestamo = self.db.query(Prestamo).filter(Prestamo.id == prestamo_id).first()

        if not prestamo:
            return None

        for key, value in data.items():
            if hasattr(prestamo, key) and value is not None:
                setattr(prestamo, key, value)

        prestamo.fecha_actualizacion = datetime.utcnow()
        self.db.commit()
        self.db.refresh(prestamo)

        logger.info(f"✅ Préstamo actualizado: {prestamo.id}")
        return self._to_dict(prestamo)

    def delete(self, prestamo_id: UUID) -> bool:
        """Delete préstamo"""
        prestamo = self.db.query(Prestamo).filter(Prestamo.id == prestamo_id).first()

        if not prestamo:
            return False

        self.db.delete(prestamo)
        self.db.commit()

        logger.info(f"✅ Préstamo eliminado: {prestamo_id}")
        return True

    def _to_dict(self, prestamo: Prestamo) -> Dict[str, Any]:
        """Convert Prestamo model to dictionary - SOLO MINÚSCULAS"""
        if not prestamo:
            return {}

        return {
            "id": str(prestamo.id),
            "nombre_fuente": prestamo.nombre_fuente,
            "monto_prestado": float(prestamo.monto_prestado) if prestamo.monto_prestado else 0,
            "monto_a_devolver": float(prestamo.monto_a_devolver) if prestamo.monto_a_devolver else 0,
            "moneda": prestamo.moneda,
            "fecha_prestamo": prestamo.fecha_prestamo.isoformat() if prestamo.fecha_prestamo else None,
            "fecha_vencimiento": prestamo.fecha_vencimiento.isoformat() if prestamo.fecha_vencimiento else None,
            "fecha_pago": prestamo.fecha_pago.isoformat() if prestamo.fecha_pago else None,
            "estado": prestamo.estado,
            "notas": prestamo.notas,
            "comprobante": prestamo.comprobante,
            "fecha_creacion": prestamo.fecha_creacion.isoformat() if prestamo.fecha_creacion else None,
            "fecha_actualizacion": prestamo.fecha_actualizacion.isoformat() if prestamo.fecha_actualizacion else None,
            "usuario_id": str(prestamo.usuario_id) if prestamo.usuario_id else None,
        }
