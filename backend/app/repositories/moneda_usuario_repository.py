"""
MonedaUsuario Repository - PostgreSQL with SQLAlchemy
Multi-Tenant: Cada usuario tiene sus propias monedas personalizadas
"""
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import UUID
import logging

from app.models.db_models import MonedaUsuario

logger = logging.getLogger(__name__)


class MonedaUsuarioRepository:
    """Repository for MonedaUsuario using PostgreSQL with Multi-Tenancy support"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_all(
        self, 
        usuario_id: UUID,
        activa: Optional[bool] = None,
        orden_by: str = "orden"
    ) -> List[Dict[str, Any]]:
        """
        Get all currencies for a user
        
        Args:
            usuario_id: UUID del usuario autenticado
            activa: Filtrar por estado activo/inactivo
            orden_by: Campo para ordenar (orden, codigo, nombre)
            
        Returns:
            Lista de monedas del usuario
        """
        query = self.db.query(MonedaUsuario).filter(
            MonedaUsuario.usuario_id == usuario_id
        )
        
        if activa is not None:
            query = query.filter(MonedaUsuario.activa == activa)
        
        # Ordenar por el campo especificado
        if orden_by == "orden":
            query = query.order_by(MonedaUsuario.orden.asc(), MonedaUsuario.codigo.asc())
        elif orden_by == "codigo":
            query = query.order_by(MonedaUsuario.codigo.asc())
        elif orden_by == "nombre":
            query = query.order_by(MonedaUsuario.nombre.asc())
        else:
            query = query.order_by(MonedaUsuario.orden.asc())
        
        monedas = query.all()
        
        logger.info(f"💱 Usuario {usuario_id}: {len(monedas)} monedas encontradas")
        
        return [self._to_dict(m) for m in monedas]
    
    def get_by_id(self, moneda_id: UUID, usuario_id: UUID) -> Optional[Dict[str, Any]]:
        """
        Get currency by ID (solo si es del usuario)
        
        Args:
            moneda_id: ID de la moneda
            usuario_id: UUID del usuario autenticado
            
        Returns:
            Dict con info de la moneda o None si no pertenece al usuario
        """
        moneda = self.db.query(MonedaUsuario).filter(
            MonedaUsuario.id == moneda_id,
            MonedaUsuario.usuario_id == usuario_id
        ).first()
        
        return self._to_dict(moneda) if moneda else None
    
    def get_by_codigo(self, codigo: str, usuario_id: UUID) -> Optional[Dict[str, Any]]:
        """
        Get currency by code (USD, EUR, etc.)
        
        Args:
            codigo: Código de la moneda (USD, EUR, BTC, etc.)
            usuario_id: UUID del usuario autenticado
            
        Returns:
            Dict con info de la moneda o None si no existe
        """
        moneda = self.db.query(MonedaUsuario).filter(
            MonedaUsuario.codigo == codigo.upper(),
            MonedaUsuario.usuario_id == usuario_id
        ).first()
        
        return self._to_dict(moneda) if moneda else None
    
    def create(self, data: Dict[str, Any], usuario_id: UUID) -> Dict[str, Any]:
        """
        Create new currency for a user
        
        Args:
            data: Datos de la moneda
            usuario_id: UUID del usuario que crea la moneda
            
        Returns:
            Dict con la moneda creada
        """
        # Asegurar que la moneda pertenece al usuario
        data['usuario_id'] = usuario_id
        
        # Normalizar código a mayúsculas
        if 'codigo' in data:
            data['codigo'] = data['codigo'].upper()
        
        moneda = MonedaUsuario(**data)
        self.db.add(moneda)
        self.db.commit()
        self.db.refresh(moneda)
        
        logger.info(f"✅ Moneda creada: {moneda.codigo} ({moneda.id}) para usuario {usuario_id}")
        return self._to_dict(moneda)
    
    def update(self, moneda_id: UUID, data: Dict[str, Any], usuario_id: UUID) -> Optional[Dict[str, Any]]:
        """
        Update currency (solo si es del usuario)
        
        Args:
            moneda_id: ID de la moneda
            data: Datos a actualizar
            usuario_id: UUID del usuario autenticado
            
        Returns:
            Dict con la moneda actualizada o None si no tiene permiso
        """
        moneda = self.db.query(MonedaUsuario).filter(
            MonedaUsuario.id == moneda_id,
            MonedaUsuario.usuario_id == usuario_id
        ).first()
        
        if not moneda:
            logger.warning(f"⚠️ Usuario {usuario_id} intentó editar moneda {moneda_id} sin permiso")
            return None
        
        # No permitir cambiar usuario_id
        data.pop('usuario_id', None)
        
        # Normalizar código si viene en el update
        if 'codigo' in data:
            data['codigo'] = data['codigo'].upper()
        
        for key, value in data.items():
            if hasattr(moneda, key) and value is not None:
                setattr(moneda, key, value)
        
        self.db.commit()
        self.db.refresh(moneda)
        
        logger.info(f"✅ Moneda actualizada: {moneda.codigo} ({moneda.id}) por usuario {usuario_id}")
        return self._to_dict(moneda)
    
    def delete(self, moneda_id: UUID, usuario_id: UUID) -> bool:
        """
        Delete currency (solo si es del usuario)
        
        Args:
            moneda_id: ID de la moneda
            usuario_id: UUID del usuario autenticado
            
        Returns:
            True si se eliminó, False si no existe o no tiene permiso
        """
        moneda = self.db.query(MonedaUsuario).filter(
            MonedaUsuario.id == moneda_id,
            MonedaUsuario.usuario_id == usuario_id
        ).first()
        
        if not moneda:
            logger.warning(f"⚠️ Usuario {usuario_id} intentó eliminar moneda {moneda_id} sin permiso")
            return False
        
        # PERMITIR eliminar cualquier moneda (incluso predeterminadas)
        codigo = moneda.codigo
        es_predeterminada = moneda.es_predeterminada
        
        self.db.delete(moneda)
        self.db.commit()
        
        tipo = "predeterminada" if es_predeterminada else "personalizada"
        logger.info(f"✅ Moneda eliminada: {codigo} ({tipo}) por usuario {usuario_id}")
        return True
    
    def toggle_active(self, moneda_id: UUID, usuario_id: UUID) -> Optional[Dict[str, Any]]:
        """
        Toggle currency active status
        
        Args:
            moneda_id: ID de la moneda
            usuario_id: UUID del usuario autenticado
            
        Returns:
            Dict con la moneda actualizada o None si no tiene permiso
        """
        moneda = self.db.query(MonedaUsuario).filter(
            MonedaUsuario.id == moneda_id,
            MonedaUsuario.usuario_id == usuario_id
        ).first()
        
        if not moneda:
            logger.warning(f"⚠️ Usuario {usuario_id} intentó cambiar estado de moneda {moneda_id} sin permiso")
            return None
        
        # PERMITIR activar/desactivar cualquier moneda (incluso predeterminadas)
        moneda.activa = not moneda.activa
        self.db.commit()
        self.db.refresh(moneda)
        
        logger.info(f"✅ Moneda {moneda.codigo} estado cambiado a {'activa' if moneda.activa else 'inactiva'}")
        return self._to_dict(moneda)
    
    def reorder(self, usuario_id: UUID, monedas_orden: List[Dict[str, Any]]) -> bool:
        """
        Reorder currencies for a user
        
        Args:
            usuario_id: UUID del usuario autenticado
            monedas_orden: Lista de {id: UUID, orden: int}
            
        Returns:
            True si se reordenó exitosamente
        """
        try:
            for item in monedas_orden:
                moneda_id = item.get('id')
                nuevo_orden = item.get('orden')
                
                if moneda_id and nuevo_orden is not None:
                    moneda = self.db.query(MonedaUsuario).filter(
                        MonedaUsuario.id == moneda_id,
                        MonedaUsuario.usuario_id == usuario_id
                    ).first()
                    
                    if moneda:
                        moneda.orden = nuevo_orden
            
            self.db.commit()
            logger.info(f"✅ Monedas reordenadas para usuario {usuario_id}")
            return True
        except Exception as e:
            logger.error(f"❌ Error al reordenar monedas: {e}")
            self.db.rollback()
            return False
    
    def exists_by_codigo(self, codigo: str, usuario_id: UUID) -> bool:
        """
        Check if currency code already exists for user
        
        Args:
            codigo: Código de la moneda (USD, EUR, etc.)
            usuario_id: UUID del usuario
            
        Returns:
            True si el código ya existe para el usuario
        """
        exists = self.db.query(MonedaUsuario).filter(
            MonedaUsuario.codigo == codigo.upper(),
            MonedaUsuario.usuario_id == usuario_id
        ).first() is not None
        
        return exists
    
    def _to_dict(self, moneda: MonedaUsuario) -> Dict[str, Any]:
        """Convert MonedaUsuario model to dictionary"""
        if not moneda:
            return {}
        
        return {
            "id": str(moneda.id),
            "codigo": moneda.codigo,
            "nombre": moneda.nombre,
            "simbolo": moneda.simbolo,
            "icono": moneda.icono,
            "color": moneda.color,
            "es_predeterminada": moneda.es_predeterminada,
            "activa": moneda.activa,
            "orden": moneda.orden,
            "tasa_cambio_a_ars": float(moneda.tasa_cambio_a_ars) if moneda.tasa_cambio_a_ars else None,
            "ultima_actualizacion_tasa": moneda.ultima_actualizacion_tasa.isoformat() if moneda.ultima_actualizacion_tasa else None,
            "usuario_id": str(moneda.usuario_id),
            "fecha_creacion": moneda.fecha_creacion.isoformat() if moneda.fecha_creacion else None,
            "fecha_actualizacion": moneda.fecha_actualizacion.isoformat() if moneda.fecha_actualizacion else None,
        }

