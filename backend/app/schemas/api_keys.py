from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID


class ApiKeyCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100, description="Nombre descriptivo de la API key")


class ApiKeyCreated(BaseModel):
    id: UUID
    nombre: str
    key: str
    key_prefix: str
    creado_en: datetime

    model_config = ConfigDict(from_attributes=True)


class ApiKeyPublic(BaseModel):
    id: UUID
    nombre: str
    key_prefix: str
    creado_en: datetime
    ultimo_uso: Optional[datetime] = None
    revocado_en: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
