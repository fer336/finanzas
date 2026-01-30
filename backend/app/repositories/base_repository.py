"""
Base Repository - Funcionalidad común para todos los repositorios
Reduce duplicación de código y estandariza operaciones CRUD
"""
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from typing import List, Optional, Dict, Any, Type, TypeVar, Generic
from uuid import UUID
import logging

logger = logging.getLogger(__name__)

# Generic type for model
T = TypeVar('T')


class BaseRepository(Generic[T]):
    """Base repository with common CRUD operations"""
    
    def __init__(self, db: Session, model: Type[T]):
        self.db = db
        self.model = model
    
    def get_by_id(
        self, 
        id: UUID, 
        relationships: Optional[List[str]] = None
    ) -> Optional[Dict[str, Any]]:
        """Get a single record by ID
        
        Args:
            id: UUID of the record
            relationships: List of relationship names to eager load
            
        Returns:
            Dictionary representation of the record or None
        """
        query = self.db.query(self.model)
        
        # Apply eager loading if relationships specified
        if relationships:
            from sqlalchemy.orm import joinedload
            for rel in relationships:
                query = query.options(joinedload(getattr(self.model, rel)))
        
        record = query.filter(self.model.id == id).first()
        
        if not record:
            return None
        
        return self._to_dict(record)
    
    def get_all(
        self,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 100,
        offset: int = 0,
        order_by: Optional[str] = None,
        order_direction: str = 'desc',
        relationships: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Get all records with optional filters and pagination
        
        Args:
            filters: Dictionary of field:value pairs to filter by
            limit: Maximum number of records to return
            offset: Number of records to skip
            order_by: Field name to order by
            order_direction: 'asc' or 'desc'
            relationships: List of relationship names to eager load
            
        Returns:
            Dictionary with 'list' and 'pageInfo' keys
        """
        query = self.db.query(self.model)
        
        # Apply eager loading
        if relationships:
            from sqlalchemy.orm import joinedload
            for rel in relationships:
                query = query.options(joinedload(getattr(self.model, rel)))
        
        # Apply filters
        if filters:
            for field, value in filters.items():
                if value is not None:
                    if hasattr(self.model, field):
                        query = query.filter(getattr(self.model, field) == value)
        
        # Apply ordering
        if order_by and hasattr(self.model, order_by):
            order_field = getattr(self.model, order_by)
            if order_direction == 'asc':
                query = query.order_by(asc(order_field))
            else:
                query = query.order_by(desc(order_field))
        
        # Get total count before pagination
        total_count = query.count()
        
        # Apply pagination
        records = query.offset(offset).limit(limit).all()
        
        return {
            "list": [self._to_dict(record) for record in records],
            "pageInfo": {
                "totalRows": total_count,
                "limit": limit,
                "offset": offset
            }
        }
    
    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new record
        
        Args:
            data: Dictionary with field values
            
        Returns:
            Dictionary representation of created record
        """
        try:
            record = self.model(**data)
            self.db.add(record)
            self.db.commit()
            self.db.refresh(record)
            logger.info(f"✅ Created {self.model.__name__} with ID: {record.id}")
            return self._to_dict(record)
        except Exception as e:
            self.db.rollback()
            logger.error(f"❌ Error creating {self.model.__name__}: {e}")
            raise
    
    def update(
        self, 
        id: UUID, 
        data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update a record by ID
        
        Args:
            id: UUID of the record
            data: Dictionary with fields to update
            
        Returns:
            Dictionary representation of updated record or None
        """
        try:
            record = self.db.query(self.model).filter(self.model.id == id).first()
            
            if not record:
                logger.warning(f"⚠️  {self.model.__name__} with ID {id} not found")
                return None
            
            # Update fields
            for key, value in data.items():
                if hasattr(record, key):
                    setattr(record, key, value)
            
            self.db.commit()
            self.db.refresh(record)
            logger.info(f"✅ Updated {self.model.__name__} with ID: {id}")
            return self._to_dict(record)
        except Exception as e:
            self.db.rollback()
            logger.error(f"❌ Error updating {self.model.__name__}: {e}")
            raise
    
    def delete(self, id: UUID) -> bool:
        """Delete a record by ID
        
        Args:
            id: UUID of the record
            
        Returns:
            True if deleted, False if not found
        """
        try:
            record = self.db.query(self.model).filter(self.model.id == id).first()
            
            if not record:
                logger.warning(f"⚠️  {self.model.__name__} with ID {id} not found")
                return False
            
            self.db.delete(record)
            self.db.commit()
            logger.info(f"✅ Deleted {self.model.__name__} with ID: {id}")
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"❌ Error deleting {self.model.__name__}: {e}")
            raise
    
    def bulk_delete(self, ids: List[UUID]) -> Dict[str, Any]:
        """Delete multiple records by ID
        
        Args:
            ids: List of UUIDs to delete
            
        Returns:
            Dictionary with deleted_count and failed_ids
        """
        deleted_count = 0
        failed_ids = []
        
        for record_id in ids:
            try:
                if self.delete(record_id):
                    deleted_count += 1
                else:
                    failed_ids.append(str(record_id))
            except Exception as e:
                logger.error(f"Error deleting {record_id}: {e}")
                failed_ids.append(str(record_id))
        
        logger.info(f"✅ Bulk delete: {deleted_count} deleted, {len(failed_ids)} failed")
        return {
            "deleted_count": deleted_count,
            "failed_ids": failed_ids
        }
    
    def _to_dict(self, record: T) -> Dict[str, Any]:
        """Convert SQLAlchemy model to dictionary
        
        Override this method in subclasses for custom serialization
        
        Args:
            record: SQLAlchemy model instance
            
        Returns:
            Dictionary representation
        """
        if not record:
            return {}
        
        # Basic serialization
        result = {}
        for column in record.__table__.columns:
            value = getattr(record, column.name)
            
            # Handle special types
            if isinstance(value, UUID):
                result[column.name] = str(value)
            elif isinstance(value, (datetime, date)):
                result[column.name] = value.isoformat()
            elif hasattr(value, '__float__'):  # Decimal
                result[column.name] = float(value)
            else:
                result[column.name] = value
        
        return result

