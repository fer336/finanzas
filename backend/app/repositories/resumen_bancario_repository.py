from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from uuid import UUID
import logging

from app.models.db_models import ResumenBancario

logger = logging.getLogger(__name__)


class ResumenBancarioRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_all(
        self, 
        limit: int = 100, 
        offset: int = 0,
        usuario_id: Optional[UUID] = None,
        fecha_desde: Optional[str] = None,
        fecha_hasta: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get all bank summaries with pagination"""
        try:
            query = self.db.query(ResumenBancario)
            
            # Filter by usuario_id if provided
            if usuario_id:
                query = query.filter(ResumenBancario.usuario_id == usuario_id)
            
            # Filter by date range if provided (if column exists)
            try:
                if fecha_desde:
                    query = query.filter(ResumenBancario.fecha >= fecha_desde)
                if fecha_hasta:
                    query = query.filter(ResumenBancario.fecha <= fecha_hasta)
                
                # Order by date descending (most recent first)
                query = query.order_by(desc(ResumenBancario.fecha))
            except Exception as e:
                logger.warning(f"Date filtering not available: {str(e)}")
                # Order by id instead
                query = query.order_by(desc(ResumenBancario.id))
            
            # Count total
            total = query.count()
            
            # Apply pagination
            resumenes = query.offset(offset).limit(limit).all()
            
            return {
                "list": [self._to_dict(r) for r in resumenes],
                "pageInfo": {
                    "totalRows": total,
                    "pageSize": limit,
                    "page": offset // limit if limit > 0 else 0,
                    "isFirstPage": offset == 0,
                    "isLastPage": (offset + limit) >= total
                }
            }
        except Exception as e:
            logger.error(f"Error getting bank summaries: {str(e)}")
            # Return empty list if table doesn't exist or has issues
            return {
                "list": [],
                "pageInfo": {
                    "totalRows": 0,
                    "pageSize": limit,
                    "page": 0,
                    "isFirstPage": True,
                    "isLastPage": True
                }
            }
    
    def get_by_id(self, resumen_id: UUID) -> Optional[ResumenBancario]:
        """Get a bank summary by ID"""
        return self.db.query(ResumenBancario).filter(ResumenBancario.id == resumen_id).first()
    
    def create(self, data: Dict[str, Any]) -> ResumenBancario:
        """Create a new bank summary"""
        resumen = ResumenBancario(**data)
        self.db.add(resumen)
        self.db.commit()
        self.db.refresh(resumen)
        logger.info(f"✅ Created bank summary: {resumen.id}")
        return resumen
    
    def update(self, resumen_id: UUID, data: Dict[str, Any]) -> Optional[ResumenBancario]:
        """Update a bank summary"""
        resumen = self.get_by_id(resumen_id)
        if not resumen:
            return None
        
        for key, value in data.items():
            if hasattr(resumen, key):
                setattr(resumen, key, value)
        
        self.db.commit()
        self.db.refresh(resumen)
        logger.info(f"✅ Updated bank summary: {resumen_id}")
        return resumen
    
    def delete(self, resumen_id: UUID) -> bool:
        """Delete a bank summary"""
        resumen = self.get_by_id(resumen_id)
        if not resumen:
            return False
        
        self.db.delete(resumen)
        self.db.commit()
        logger.info(f"✅ Deleted bank summary: {resumen_id}")
        return True
    
    def _to_dict(self, resumen: ResumenBancario) -> Dict[str, Any]:
        """Convert ResumenBancario to dictionary"""
        try:
            # Calculate total paid from payment history table
            from app.repositories.pago_resumen_bancario_repository import PagoResumenBancarioRepository
            pago_repo = PagoResumenBancarioRepository(self.db)
            totales_pagados = pago_repo.get_total_paid(resumen.id)
            
            # Get current totales and add paid amounts
            totales = resumen.totales if resumen.totales else {}
            if isinstance(totales, str):
                import json
                totales = json.loads(totales)
            
            # Add paid amounts to totales dict for frontend consumption
            totales['monto_pagado_pesos'] = float(totales_pagados['pesos'])
            totales['monto_pagado_dolares'] = float(totales_pagados['usd'])
            
            return {
                "id": str(resumen.id),
                
                # Información básica
                "banco": resumen.banco,
                "tipo_tarjeta": resumen.tipo_tarjeta,
                "numero_resumen": resumen.numero_resumen,
                "numero_cuenta": resumen.numero_cuenta,
                "url_factura": resumen.url_factura,
                
                # Objetos JSON estructurados (totales now includes paid amounts)
                "titular": resumen.titular,
                "ciclo_facturacion": resumen.ciclo_facturacion,
                "totales": totales,
                "limites": resumen.limites,
                "tasas": resumen.tasas,
                "movimientos": resumen.movimientos,
                "cargos": resumen.cargos,
                
                # Estado de pago
                "minimo_pagado": resumen.minimo_pagado,
                "total_pagado": resumen.total_pagado,
                "fecha_pago_minimo": resumen.fecha_pago_minimo.isoformat() if resumen.fecha_pago_minimo else None,
                "fecha_pago_total": resumen.fecha_pago_total.isoformat() if resumen.fecha_pago_total else None,
                
                # Fechas de control
                "fecha_carga": resumen.fecha_carga.isoformat() if resumen.fecha_carga else None,
                "created_at": resumen.created_at.isoformat() if resumen.created_at else None,
                "updated_at": resumen.updated_at.isoformat() if resumen.updated_at else None,
                
                "usuario_id": str(resumen.usuario_id) if resumen.usuario_id else None
            }
        except Exception as e:
            logger.error(f"Error converting ResumenBancario to dict: {str(e)}")
            logger.exception(e)
            # Fallback con valores mínimos
            return {
                "id": str(resumen.id) if hasattr(resumen, 'id') else None,
                "banco": getattr(resumen, 'banco', "Unknown"),
                "tipo_tarjeta": getattr(resumen, 'tipo_tarjeta', None),
                "numero_resumen": getattr(resumen, 'numero_resumen', None),
                "numero_cuenta": getattr(resumen, 'numero_cuenta', None),
                "url_factura": getattr(resumen, 'url_factura', None),
                "titular": getattr(resumen, 'titular', None),
                "ciclo_facturacion": getattr(resumen, 'ciclo_facturacion', None),
                "totales": getattr(resumen, 'totales', None),
                "limites": getattr(resumen, 'limites', None),
                "tasas": getattr(resumen, 'tasas', None),
                "movimientos": getattr(resumen, 'movimientos', None),
                "cargos": getattr(resumen, 'cargos', None),
                "minimo_pagado": getattr(resumen, 'minimo_pagado', False),
                "total_pagado": getattr(resumen, 'total_pagado', False),
                "fecha_pago_minimo": None,
                "fecha_pago_total": None,
                "fecha_carga": None,
                "created_at": None,
                "updated_at": None,
                "usuario_id": None
            }

