"""
ApiKey Repository - PostgreSQL with SQLAlchemy
Multi-Tenant: Cada usuario tiene sus propias API keys
"""
from sqlalchemy.orm import Session
from typing import List, Optional, Tuple
from uuid import UUID
from datetime import datetime
import hashlib
import secrets
import logging

from app.models.db_models import ApiKey

logger = logging.getLogger(__name__)


class ApiKeyRepository:
    """Repository for ApiKey using PostgreSQL with Multi-Tenancy support"""

    def __init__(self, db: Session):
        self.db = db

    def create(self, usuario_id: UUID, nombre: str) -> Tuple[ApiKey, str]:
        """
        Crear una nueva API key para el usuario

        Args:
            usuario_id: UUID del usuario propietario
            nombre: Nombre descriptivo de la key

        Returns:
            Tupla (ApiKey, raw_key). El raw_key NUNCA se persiste.
        """
        raw_key = "fk_live_" + secrets.token_urlsafe(32)
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        key_prefix = raw_key[:16]

        api_key = ApiKey(
            usuario_id=usuario_id,
            nombre=nombre,
            key_hash=key_hash,
            key_prefix=key_prefix,
        )
        self.db.add(api_key)
        self.db.commit()
        self.db.refresh(api_key)

        logger.info(f"✅ API key creada: {api_key.id} para usuario {usuario_id}")
        return api_key, raw_key

    def list_by_user(self, usuario_id: UUID) -> List[ApiKey]:
        """Obtener todas las API keys del usuario, más recientes primero"""
        return (
            self.db.query(ApiKey)
            .filter(ApiKey.usuario_id == usuario_id)
            .order_by(ApiKey.creado_en.desc())
            .all()
        )

    def revoke(self, key_id: UUID, usuario_id: UUID) -> bool:
        """
        Revocar una API key (solo si es del usuario y no está ya revocada)

        Returns:
            True si se revocó, False si no existe, ya está revocada o no es del usuario
        """
        api_key = (
            self.db.query(ApiKey)
            .filter(
                ApiKey.id == key_id,
                ApiKey.usuario_id == usuario_id,
                ApiKey.revocado_en.is_(None),
            )
            .first()
        )

        if not api_key:
            return False

        api_key.revocado_en = datetime.utcnow()
        self.db.commit()

        logger.info(f"✅ API key revocada: {key_id} por usuario {usuario_id}")
        return True

    def find_active_by_hash(self, key_hash: str) -> Optional[ApiKey]:
        """Buscar una API key activa (no revocada) por su hash"""
        return (
            self.db.query(ApiKey)
            .filter(ApiKey.key_hash == key_hash, ApiKey.revocado_en.is_(None))
            .first()
        )

    def touch_last_used(self, key_id: UUID) -> None:
        """Actualizar la marca de último uso de la API key"""
        self.db.query(ApiKey).filter(ApiKey.id == key_id).update(
            {"ultimo_uso": datetime.utcnow()}
        )
        self.db.commit()
