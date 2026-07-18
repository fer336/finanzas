"""
PagoPendiente Repository - PostgreSQL with SQLAlchemy
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from uuid import UUID
import logging

from app.models.db_models import PagoPendiente, Categoria, MetodoPago

logger = logging.getLogger(__name__)

NULLABLE_CLEAR_FIELDS = {"url_pdf", "comprobante", "segunda_fecha_vencimiento"}


class PagoPendienteRepositoryPG:
    """Repository for PagoPendiente using PostgreSQL"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_all(
        self,
        usuario_id: Optional[UUID] = None,
        limit: int = 100,
        offset: int = 0,
        estado: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get all pending payments with filters"""
        query = self.db.query(PagoPendiente).options(
            joinedload(PagoPendiente.categoria),
            joinedload(PagoPendiente.metodo_pago),
            joinedload(PagoPendiente.usuario)
        )
        
        # Filter by usuario_id
        if usuario_id:
            query = query.filter(PagoPendiente.usuario_id == usuario_id)
        
        # Filter by estado
        if estado:
            query = query.filter(PagoPendiente.estado == estado)
        
        # Order by fecha vencimiento ascending
        query = query.order_by(PagoPendiente.fechavencimiento.asc())
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        pagos = query.offset(offset).limit(limit).all()
        
        return {
            "list": [self._to_dict(p) for p in pagos],
            "pageInfo": {
                "totalRows": total,
                "page": offset // limit + 1 if limit > 0 else 1,
                "pageSize": limit,
                "isFirstPage": offset == 0,
                "isLastPage": offset + limit >= total
            }
        }
    
    def get_by_id(self, pago_id: UUID) -> Optional[Dict[str, Any]]:
        """Get pending payment by ID"""
        pago = self.db.query(PagoPendiente).options(
            joinedload(PagoPendiente.categoria),
            joinedload(PagoPendiente.metodo_pago),
            joinedload(PagoPendiente.usuario)
        ).filter(PagoPendiente.id == pago_id).first()
        
        return self._to_dict(pago) if pago else None
    
    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new pending payment"""
        pago = PagoPendiente(**data)
        self.db.add(pago)
        self.db.commit()
        self.db.refresh(pago)
        
        logger.info(f"✅ Pago pendiente creado: {pago.id}")
        return self._to_dict(pago)
    
    def update(self, pago_id: UUID, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update pending payment"""
        pago = self.db.query(PagoPendiente).filter(PagoPendiente.id == pago_id).first()
        
        if not pago:
            return None
        
        # Update fields
        for key, value in data.items():
            if hasattr(pago, key) and (value is not None or key in NULLABLE_CLEAR_FIELDS):
                setattr(pago, key, value)
        
        pago.fechaactualizacion = datetime.utcnow()
        self.db.commit()
        self.db.refresh(pago)
        
        logger.info(f"✅ Pago pendiente actualizado: {pago.id}")
        return self._to_dict(pago)
    
    def delete(self, pago_id: UUID) -> bool:
        """Delete pending payment"""
        pago = self.db.query(PagoPendiente).filter(PagoPendiente.id == pago_id).first()
        
        if not pago:
            return False
        
        self.db.delete(pago)
        self.db.commit()
        
        logger.info(f"✅ Pago pendiente eliminado: {pago_id}")
        return True
    
    def _to_dict(self, pago: PagoPendiente) -> Dict[str, Any]:
        """Convert PagoPendiente model to dictionary - SOLO MINÚSCULAS"""
        if not pago:
            return {}
        
        return {
            "id": str(pago.id),
            "nombre": pago.nombre,
            "descripcion": pago.descripcion,
            "monto": float(pago.monto) if pago.monto else 0,
            "moneda": pago.moneda,
            "fechavencimiento": pago.fechavencimiento.isoformat() if pago.fechavencimiento else None,
            "segunda_fecha_vencimiento": pago.segunda_fecha_vencimiento.isoformat() if pago.segunda_fecha_vencimiento else None,
            "fechacreacion": pago.fechacreacion.isoformat() if pago.fechacreacion else None,
            "fechaactualizacion": pago.fechaactualizacion.isoformat() if pago.fechaactualizacion else None,
            "prioridad": pago.prioridad,
            "tipo": pago.tipo,
            "proximovencimiento": pago.proximovencimiento.isoformat() if pago.proximovencimiento else None,
            "notas": pago.notas,
            "interes": float(pago.interes) if pago.interes else 0,
            "recargo": float(pago.recargo) if pago.recargo else 0,
            "fecha_emision": pago.fecha_emision,
            "liquidacion": pago.liquidacion,
            "periodo": pago.periodo,
            "deuda_registrada": pago.deuda_registrada,
            "url_pdf": pago.url_pdf,
            "num_factura": pago.num_factura,
            "incluirencuotaalimentaria": pago.incluirencuotaalimentaria,
            "gastocompartido": pago.gastocompartido,
            "estado": pago.estado,
            "fechapago": pago.fechapago.isoformat() if pago.fechapago else None,
            "comprobante": pago.comprobante,
            "recurrente": pago.recurrente or False,
            "frecuencia_recurrencia": pago.frecuencia_recurrencia,
            "categorias_id": str(pago.categorias_id) if pago.categorias_id else None,
            "metodos_pago_id": str(pago.metodos_pago_id) if pago.metodos_pago_id else None,
            "usuario_id": str(pago.usuario_id) if pago.usuario_id else None,
            # Related entities (optional)
            "categoria": self._categoria_to_dict(pago.categoria) if pago.categoria else None,
            "metodo_pago": self._metodo_pago_to_dict(pago.metodo_pago) if pago.metodo_pago else None,
        }
    
    def _categoria_to_dict(self, categoria: Optional[Categoria]) -> Optional[Dict[str, Any]]:
        """Convert Categoria to dict - SOLO MINÚSCULAS"""
        if not categoria:
            return None
        
        return {
            "id": str(categoria.id),
            "nombre": categoria.nombre,
            "tipo": categoria.tipo,
            "color": categoria.color,
            "icono": categoria.icono,
        }
    
    def _metodo_pago_to_dict(self, metodo: Optional[MetodoPago]) -> Optional[Dict[str, Any]]:
        """Convert MetodoPago to dict - SOLO MINÚSCULAS"""
        if not metodo:
            return None
        
        return {
            "id": str(metodo.id),
            "nombre": metodo.nombre,
            "tipo": metodo.tipo,
            "activo": metodo.activo,
            "color": metodo.color,
            "icono": metodo.icono,
        }
