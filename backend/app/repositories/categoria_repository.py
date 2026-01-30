"""
Categoria Repository - PostgreSQL with SQLAlchemy
Multi-Tenant: Cada usuario tiene sus propias categorías
"""
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import UUID
import logging

from app.models.db_models import Categoria

logger = logging.getLogger(__name__)


class CategoriaRepository:
    """Repository for Categoria using PostgreSQL with Multi-Tenancy support"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_all(
        self, 
        usuario_id: UUID,
        limit: int = 500, 
        offset: int = 0, 
        activa: Optional[bool] = None
    ) -> Dict[str, Any]:
        """
        Get all categories for a user
        
        Args:
            usuario_id: UUID del usuario autenticado
            limit: Límite de resultados
            offset: Offset para paginación
            activa: Filtrar por estado activo/inactivo
            
        Returns:
            Dict con lista de categorías y pageInfo
        """
        query = self.db.query(Categoria).filter(
            Categoria.usuario_id == usuario_id  # Solo categorías del usuario
        )
        
        if activa is not None:
            query = query.filter(Categoria.activa == activa)
        
        query = query.order_by(Categoria.nombre.asc())
        
        total = query.count()
        categorias = query.offset(offset).limit(limit).all()
        
        logger.info(f"📊 Usuario {usuario_id}: {total} categorías encontradas")
        
        return {
            "list": [self._to_dict(c) for c in categorias],
            "pageInfo": {
                "totalRows": total,
                "page": offset // limit + 1 if limit > 0 else 1,
                "pageSize": limit
            }
        }
    
    def get_by_id(self, categoria_id: UUID, usuario_id: UUID) -> Optional[Dict[str, Any]]:
        """
        Get category by ID (solo si es del usuario)
        
        Args:
            categoria_id: ID de la categoría
            usuario_id: UUID del usuario autenticado
            
        Returns:
            Dict con info de la categoría o None si no pertenece al usuario
        """
        categoria = self.db.query(Categoria).filter(
            Categoria.id == categoria_id,
            Categoria.usuario_id == usuario_id
        ).first()
        
        return self._to_dict(categoria) if categoria else None
    
    def create(self, data: Dict[str, Any], usuario_id: UUID) -> Dict[str, Any]:
        """
        Create new category for a user
        
        Args:
            data: Datos de la categoría
            usuario_id: UUID del usuario que crea la categoría
            
        Returns:
            Dict con la categoría creada
        """
        # Asegurar que la categoría pertenece al usuario
        data['usuario_id'] = usuario_id
        
        categoria = Categoria(**data)
        self.db.add(categoria)
        self.db.commit()
        self.db.refresh(categoria)
        
        logger.info(f"✅ Categoría creada: {categoria.id} para usuario {usuario_id}")
        return self._to_dict(categoria)
    
    def update(self, categoria_id: UUID, data: Dict[str, Any], usuario_id: UUID) -> Optional[Dict[str, Any]]:
        """
        Update category (solo si es del usuario)
        
        Args:
            categoria_id: ID de la categoría
            data: Datos a actualizar
            usuario_id: UUID del usuario autenticado
            
        Returns:
            Dict con la categoría actualizada o None si no tiene permiso
        """
        categoria = self.db.query(Categoria).filter(
            Categoria.id == categoria_id,
            Categoria.usuario_id == usuario_id  # Solo puede editar sus propias categorías
        ).first()
        
        if not categoria:
            logger.warning(f"⚠️ Usuario {usuario_id} intentó editar categoría {categoria_id} sin permiso")
            return None
        
        # No permitir cambiar usuario_id
        data.pop('usuario_id', None)
        
        for key, value in data.items():
            if hasattr(categoria, key) and value is not None:
                setattr(categoria, key, value)
        
        self.db.commit()
        self.db.refresh(categoria)
        
        logger.info(f"✅ Categoría actualizada: {categoria.id} por usuario {usuario_id}")
        return self._to_dict(categoria)
    
    def delete(self, categoria_id: UUID, usuario_id: UUID) -> bool:
        """
        Delete category (solo si es del usuario)
        
        Args:
            categoria_id: ID de la categoría
            usuario_id: UUID del usuario autenticado
            
        Returns:
            True si se eliminó, False si no existe o no tiene permiso
        """
        categoria = self.db.query(Categoria).filter(
            Categoria.id == categoria_id,
            Categoria.usuario_id == usuario_id  # Solo puede eliminar sus propias categorías
        ).first()
        
        if not categoria:
            logger.warning(f"⚠️ Usuario {usuario_id} intentó eliminar categoría {categoria_id} sin permiso")
            return False
        
        self.db.delete(categoria)
        self.db.commit()
        
        logger.info(f"✅ Categoría eliminada: {categoria_id} por usuario {usuario_id}")
        return True
    
    def _to_dict(self, categoria: Categoria) -> Dict[str, Any]:
        """Convert Categoria model to dictionary"""
        if not categoria:
            return {}
        
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
            "activa": categoria.activa,
            "Descripcion": categoria.descripcion,
            "descripcion": categoria.descripcion,
            "FechaCreacion": categoria.fecha_creacion.isoformat() if categoria.fecha_creacion else None,
            "fecha_creacion": categoria.fecha_creacion.isoformat() if categoria.fecha_creacion else None,
            # Multi-tenancy fields
            "usuario_id": str(categoria.usuario_id) if categoria.usuario_id else None,
            "es_editable": True  # Todas las categorías son editables por el usuario propietario
        }

