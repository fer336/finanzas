from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, Optional, Union
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models.db_models import AIConfiguracion


class AIConfigRepository:
    def __init__(self, db: Session):
        self.db = db
        self._ensure_table_exists()

    def _ensure_table_exists(self) -> None:
        self.db.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS ai_configuraciones (
                    id UUID PRIMARY KEY,
                    usuario_id UUID NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
                    provider VARCHAR(50) NOT NULL DEFAULT 'openrouter',
                    auth_method VARCHAR(20) NOT NULL DEFAULT 'api_key',
                    api_key TEXT NULL,
                    access_token TEXT NULL,
                    refresh_token TEXT NULL,
                    modelo_preferido VARCHAR(150) NOT NULL DEFAULT 'google/gemini-3-flash-preview',
                    modelo_vision VARCHAR(150) NULL,
                    temperatura NUMERIC(3,2) NOT NULL DEFAULT 0.7,
                    max_tokens INTEGER NOT NULL DEFAULT 4000,
                    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )
        )
        self.db.commit()

    def get_by_user_id(self, usuario_id: Union[UUID, str]) -> Optional[Dict[str, Any]]:
        config = (
            self.db.query(AIConfiguracion)
            .filter(AIConfiguracion.usuario_id == usuario_id)
            .first()
        )
        return self._to_dict(config) if config else None

    def upsert(
        self, usuario_id: Union[UUID, str], data: Dict[str, Any]
    ) -> Dict[str, Any]:
        config = (
            self.db.query(AIConfiguracion)
            .filter(AIConfiguracion.usuario_id == usuario_id)
            .first()
        )

        if not config:
            config = AIConfiguracion(usuario_id=usuario_id)
            self.db.add(config)

        for key, value in data.items():
            if value is None:
                continue
            if hasattr(config, key):
                setattr(config, key, value)

        config.fecha_actualizacion = datetime.utcnow()

        self.db.commit()
        self.db.refresh(config)
        return self._to_dict(config)

    def delete(self, usuario_id: Union[UUID, str]) -> bool:
        config = (
            self.db.query(AIConfiguracion)
            .filter(AIConfiguracion.usuario_id == usuario_id)
            .first()
        )
        if not config:
            return False

        self.db.delete(config)
        self.db.commit()
        return True

    def _to_dict(self, config: AIConfiguracion) -> Dict[str, Any]:
        return {
            "id": str(config.id),
            "usuario_id": str(config.usuario_id),
            "provider": config.provider,
            "auth_method": config.auth_method,
            "api_key": config.api_key,
            "access_token": config.access_token,
            "refresh_token": config.refresh_token,
            "modelo_preferido": config.modelo_preferido,
            "modelo_vision": config.modelo_vision,
            "temperatura": float(config.temperatura)
            if isinstance(config.temperatura, Decimal)
            else config.temperatura,
            "max_tokens": config.max_tokens,
            "fecha_creacion": config.fecha_creacion.isoformat()
            if config.fecha_creacion
            else None,
            "fecha_actualizacion": config.fecha_actualizacion.isoformat()
            if config.fecha_actualizacion
            else None,
        }
