"""
Transaccion Repository - PostgreSQL with SQLAlchemy
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, extract, func
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from uuid import UUID
import logging

from app.models.db_models import Transaccion, Categoria, MetodoPago, Usuario

logger = logging.getLogger(__name__)


class TransaccionRepository:
    """Repository for Transaccion using PostgreSQL"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_all(
        self,
        usuario_id: Optional[UUID] = None,
        limit: int = 100,
        offset: int = 0,
        fecha_desde: Optional[str] = None,
        fecha_hasta: Optional[str] = None,
        tipo: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get all transactions with filters"""
        query = self.db.query(Transaccion).options(
            joinedload(Transaccion.categoria),
            joinedload(Transaccion.metodo_pago),
            joinedload(Transaccion.usuario)
        )
        
        # Filter by usuario_id
        if usuario_id:
            query = query.filter(Transaccion.usuario_id == usuario_id)
        
        # Filter by date range
        if fecha_desde:
            query = query.filter(Transaccion.fecha_transaccion >= fecha_desde)
        if fecha_hasta:
            query = query.filter(Transaccion.fecha_transaccion <= fecha_hasta)
        
        # Filter by tipo
        if tipo:
            query = query.filter(Transaccion.tipo == tipo)
        
        # Order by date descending
        query = query.order_by(Transaccion.fecha_transaccion.desc())
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        transacciones = query.offset(offset).limit(limit).all()
        
        return {
            "list": [self._to_dict(t) for t in transacciones],
            "pageInfo": {
                "totalRows": total,
                "page": offset // limit + 1 if limit > 0 else 1,
                "pageSize": limit,
                "isFirstPage": offset == 0,
                "isLastPage": offset + limit >= total
            }
        }
    
    def get_by_id(self, transaccion_id: UUID) -> Optional[Dict[str, Any]]:
        """Get transaction by ID"""
        transaccion = self.db.query(Transaccion).options(
            joinedload(Transaccion.categoria),
            joinedload(Transaccion.metodo_pago),
            joinedload(Transaccion.usuario)
        ).filter(Transaccion.id == transaccion_id).first()
        
        return self._to_dict(transaccion) if transaccion else None
    
    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new transaction"""
        transaccion = Transaccion(**data)
        self.db.add(transaccion)
        self.db.commit()
        self.db.refresh(transaccion)
        
        logger.info(f"✅ Transacción creada: {transaccion.id}")
        return self._to_dict(transaccion)
    
    def update(self, transaccion_id: UUID, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update transaction"""
        transaccion = self.db.query(Transaccion).filter(Transaccion.id == transaccion_id).first()
        
        if not transaccion:
            return None
        
        # Update fields
        for key, value in data.items():
            if hasattr(transaccion, key) and value is not None:
                setattr(transaccion, key, value)
        
        transaccion.fecha_actualizacion = datetime.utcnow()
        self.db.commit()
        self.db.refresh(transaccion)
        
        logger.info(f"✅ Transacción actualizada: {transaccion.id}")
        return self._to_dict(transaccion)
    
    def delete(self, transaccion_id: UUID) -> bool:
        """Delete transaction"""
        transaccion = self.db.query(Transaccion).filter(Transaccion.id == transaccion_id).first()
        
        if not transaccion:
            return False
        
        self.db.delete(transaccion)
        self.db.commit()
        
        logger.info(f"✅ Transacción eliminada: {transaccion_id}")
        return True
    
    def get_estadisticas(
        self,
        fecha_desde: str,
        fecha_hasta: str,
        usuario_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """Get transaction statistics for a period"""
        query = self.db.query(Transaccion)
        
        # Filter by usuario_id
        if usuario_id:
            query = query.filter(Transaccion.usuario_id == usuario_id)
        
        # Filter by date range
        query = query.filter(
            and_(
                Transaccion.fecha_transaccion >= fecha_desde,
                Transaccion.fecha_transaccion <= fecha_hasta
            )
        )
        
        transacciones = query.all()
        
        logger.info(f"📊 Calculando estadísticas para {len(transacciones)} transacciones")
        
        # Calculate statistics - LOG cada transacción
        ingresos_list = []
        gastos_list = []
        
        for t in transacciones:
            if t.tipo == 'ingreso':
                ingresos_list.append(t)
                logger.info(f"  ✅ INGRESO: {t.descripcion} = ${t.monto_ars}")
            elif t.tipo == 'gasto':
                gastos_list.append(t)
                logger.info(f"  ❌ GASTO: {t.descripcion} = ${t.monto_ars}")
            else:
                logger.warning(f"  ⚠️ TIPO DESCONOCIDO: {t.descripcion} = ${t.monto_ars} (tipo: {t.tipo})")
        
        # IMPORTANTE: Usar ABS() para gastos porque se guardan negativos
        total_ingresos = sum(abs(t.monto_ars) for t in ingresos_list)
        total_gastos = sum(abs(t.monto_ars) for t in gastos_list)
        balance = total_ingresos - total_gastos
        
        logger.info(f"💰 TOTAL INGRESOS: ${total_ingresos}")
        logger.info(f"💸 TOTAL GASTOS: ${total_gastos}")
        logger.info(f"💵 BALANCE: ${balance}")
        
        return {
            "periodo": f"{fecha_desde} - {fecha_hasta}",
            "total_ingresos": float(total_ingresos),
            "total_gastos": float(total_gastos),
            "balance_neto": float(balance),
            "numero_transacciones": len(transacciones),
            "numero_ingresos": len(ingresos_list),
            "numero_gastos": len(gastos_list),
            "promedio_ingreso": float(total_ingresos / len(ingresos_list)) if ingresos_list else 0,
            "promedio_gasto": float(total_gastos / len(gastos_list)) if gastos_list else 0
        }
    
    def _to_dict(self, transaccion: Transaccion) -> Dict[str, Any]:
        """Convert Transaccion model to dictionary"""
        if not transaccion:
            return {}
        
        return {
            "Id": str(transaccion.id),
            "id": str(transaccion.id),
            "Monto": float(transaccion.monto) if transaccion.monto else 0,
            "monto": float(transaccion.monto) if transaccion.monto else 0,
            "Moneda": transaccion.moneda,
            "moneda": transaccion.moneda,
            "MontoArs": float(transaccion.monto_ars),
            "monto_ars": float(transaccion.monto_ars),
            "TasaCambio": float(transaccion.tasa_cambio) if transaccion.tasa_cambio else 1.0,
            "tasa_cambio": float(transaccion.tasa_cambio) if transaccion.tasa_cambio else 1.0,
            "Descripcion": transaccion.descripcion,
            "descripcion": transaccion.descripcion,
            "FechaTransaccion": transaccion.fecha_transaccion.isoformat() if transaccion.fecha_transaccion else None,
            "fecha_transaccion": transaccion.fecha_transaccion.isoformat() if transaccion.fecha_transaccion else None,
            "Tipo": transaccion.tipo,
            "tipo": transaccion.tipo,
            "Notas": transaccion.notas,
            "notas": transaccion.notas,
            "ArchivoAdjunto": transaccion.archivo_adjunto,
            "archivo_adjunto": transaccion.archivo_adjunto,
            "Comprobante": transaccion.comprobante,
            "comprobante": transaccion.comprobante,
            "FechaCreacion": transaccion.fecha_creacion.isoformat() if transaccion.fecha_creacion else None,
            "fecha_creacion": transaccion.fecha_creacion.isoformat() if transaccion.fecha_creacion else None,
            "FechaActualizacion": transaccion.fecha_actualizacion.isoformat() if transaccion.fecha_actualizacion else None,
            "fecha_actualizacion": transaccion.fecha_actualizacion.isoformat() if transaccion.fecha_actualizacion else None,
            "categoria_id": str(transaccion.categoria_id) if transaccion.categoria_id else None,
            "categorias_id": str(transaccion.categoria_id) if transaccion.categoria_id else None,
            "metodo_pago_id": str(transaccion.metodo_pago_id) if transaccion.metodo_pago_id else None,
            "metodos_pago_id": str(transaccion.metodo_pago_id) if transaccion.metodo_pago_id else None,
            "usuario_id": str(transaccion.usuario_id) if transaccion.usuario_id else None,
            "objetivo_id": str(transaccion.objetivo_id) if transaccion.objetivo_id else None,
            # 💳 Tarjetas de Crédito
            "es_credito": transaccion.es_credito if hasattr(transaccion, 'es_credito') else False,
            "fecha_pago_real": transaccion.fecha_pago_real.isoformat() if hasattr(transaccion, 'fecha_pago_real') and transaccion.fecha_pago_real else None,
            "resumen_tarjeta_id": str(transaccion.resumen_tarjeta_id) if hasattr(transaccion, 'resumen_tarjeta_id') and transaccion.resumen_tarjeta_id else None,
            # 🎯 Objetivos de Ahorro
            "es_aporte_objetivo": transaccion.es_aporte_objetivo if hasattr(transaccion, 'es_aporte_objetivo') else True,
            # Related entities
            "Categorias": self._categoria_to_dict(transaccion.categoria) if transaccion.categoria else None,
            "categorias1": self._categoria_to_dict(transaccion.categoria) if transaccion.categoria else None,
            "MetodosPago": self._metodo_pago_to_dict(transaccion.metodo_pago) if transaccion.metodo_pago else None,
            "metodos_pago1": self._metodo_pago_to_dict(transaccion.metodo_pago) if transaccion.metodo_pago else None,
        }
    
    def _categoria_to_dict(self, categoria: Optional[Categoria]) -> Optional[Dict[str, Any]]:
        """Convert Categoria to dict"""
        if not categoria:
            return None
        
        return {
            "Id": str(categoria.id),
            "id": str(categoria.id),
            "Nombre": categoria.nombre,
            "nombre": categoria.nombre,
            "Tipo": categoria.tipo,
            "tipo": categoria.tipo,
            "Color": categoria.color,
            "color": categoria.color,
            "Icono": categoria.icono,
            "icono": categoria.icono,
            "Activa": categoria.activa,
            "activa": categoria.activa
        }
    
    def _metodo_pago_to_dict(self, metodo: Optional[MetodoPago]) -> Optional[Dict[str, Any]]:
        """Convert MetodoPago to dict"""
        if not metodo:
            return None
        
        return {
            "Id": str(metodo.id),
            "id": str(metodo.id),
            "Nombre": metodo.nombre,
            "nombre": metodo.nombre,
            "Tipo": metodo.tipo,
            "tipo": metodo.tipo,
            "Activo": metodo.activo,
            "activo": metodo.activo,
            "Color": metodo.color,
            "color": metodo.color,
            "Icono": metodo.icono,
            "icono": metodo.icono
        }
    
