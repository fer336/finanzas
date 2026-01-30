"""
MetodoPago Repository - PostgreSQL with SQLAlchemy
Multi-Tenant: Cada usuario tiene sus propios métodos de pago
"""
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import UUID
import logging

from app.models.db_models import MetodoPago

logger = logging.getLogger(__name__)


class MetodoPagoRepository:
    """Repository for MetodoPago using PostgreSQL with Multi-Tenancy support"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_all(
        self, 
        usuario_id: UUID,
        limit: int = 500, 
        offset: int = 0, 
        activo: Optional[bool] = None
    ) -> Dict[str, Any]:
        """
        Get all payment methods for a user
        
        Args:
            usuario_id: UUID del usuario autenticado
            limit: Límite de resultados
            offset: Offset para paginación
            activo: Filtrar por estado activo/inactivo
            
        Returns:
            Dict con lista de métodos de pago y pageInfo
        """
        query = self.db.query(MetodoPago).filter(
            MetodoPago.usuario_id == usuario_id  # Solo métodos del usuario
        )
        
        if activo is not None:
            query = query.filter(MetodoPago.activo == activo)
        
        query = query.order_by(MetodoPago.nombre.asc())
        
        total = query.count()
        metodos = query.offset(offset).limit(limit).all()
        
        logger.info(f"📊 Usuario {usuario_id}: {total} métodos de pago encontrados")
        
        return {
            "list": [self._to_dict(m) for m in metodos],
            "pageInfo": {
                "totalRows": total,
                "page": offset // limit + 1 if limit > 0 else 1,
                "pageSize": limit
            }
        }
    
    def get_by_id(self, metodo_id: UUID, usuario_id: UUID) -> Optional[Dict[str, Any]]:
        """
        Get payment method by ID (solo si es del usuario)
        
        Args:
            metodo_id: ID del método de pago
            usuario_id: UUID del usuario autenticado
            
        Returns:
            Dict con info del método o None si no pertenece al usuario
        """
        metodo = self.db.query(MetodoPago).filter(
            MetodoPago.id == metodo_id,
            MetodoPago.usuario_id == usuario_id
        ).first()
        
        return self._to_dict(metodo) if metodo else None
    
    def create(self, data: Dict[str, Any], usuario_id: UUID) -> Dict[str, Any]:
        """
        Create new payment method for a user
        
        Args:
            data: Datos del método de pago
            usuario_id: UUID del usuario que crea el método
            
        Returns:
            Dict con el método creado
        """
        # Asegurar que el método pertenece al usuario
        data['usuario_id'] = usuario_id
        
        metodo = MetodoPago(**data)
        self.db.add(metodo)
        self.db.commit()
        self.db.refresh(metodo)
        
        logger.info(f"✅ Método de pago creado: {metodo.id} para usuario {usuario_id}")
        return self._to_dict(metodo)
    
    def update(self, metodo_id: UUID, data: Dict[str, Any], usuario_id: UUID) -> Optional[Dict[str, Any]]:
        """
        Update payment method (solo si es del usuario)
        
        Args:
            metodo_id: ID del método de pago
            data: Datos a actualizar
            usuario_id: UUID del usuario autenticado
            
        Returns:
            Dict con el método actualizado o None si no tiene permiso
        """
        metodo = self.db.query(MetodoPago).filter(
            MetodoPago.id == metodo_id,
            MetodoPago.usuario_id == usuario_id  # Solo puede editar sus propios métodos
        ).first()
        
        if not metodo:
            logger.warning(f"⚠️ Usuario {usuario_id} intentó editar método de pago {metodo_id} sin permiso")
            return None
        
        # No permitir cambiar usuario_id
        data.pop('usuario_id', None)
        
        for key, value in data.items():
            if hasattr(metodo, key) and value is not None:
                setattr(metodo, key, value)
        
        self.db.commit()
        self.db.refresh(metodo)
        
        logger.info(f"✅ Método de pago actualizado: {metodo.id} por usuario {usuario_id}")
        return self._to_dict(metodo)
    
    def delete(self, metodo_id: UUID, usuario_id: UUID) -> bool:
        """
        Delete payment method (solo si es del usuario)
        
        Args:
            metodo_id: ID del método de pago
            usuario_id: UUID del usuario autenticado
            
        Returns:
            True si se eliminó, False si no existe o no tiene permiso
        """
        metodo = self.db.query(MetodoPago).filter(
            MetodoPago.id == metodo_id,
            MetodoPago.usuario_id == usuario_id  # Solo puede eliminar sus propios métodos
        ).first()
        
        if not metodo:
            logger.warning(f"⚠️ Usuario {usuario_id} intentó eliminar método de pago {metodo_id} sin permiso")
            return False
        
        self.db.delete(metodo)
        self.db.commit()
        
        logger.info(f"✅ Método de pago eliminado: {metodo_id} por usuario {usuario_id}")
        return True
    
    def _to_dict(self, metodo: MetodoPago) -> Dict[str, Any]:
        """Convert MetodoPago model to dictionary"""
        if not metodo:
            return {}
        
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
            "icono": metodo.icono,
            "Descripcion": metodo.descripcion,
            "descripcion": metodo.descripcion,
            "FechaCreacion": metodo.fecha_creacion.isoformat() if metodo.fecha_creacion else None,
            "fecha_creacion": metodo.fecha_creacion.isoformat() if metodo.fecha_creacion else None,
            # Multi-tenancy fields
            "usuario_id": str(metodo.usuario_id) if metodo.usuario_id else None,
            "es_editable": True  # Todos los métodos son editables por el usuario propietario
        }

