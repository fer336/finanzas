"""
Modelos base para DTOs
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID


class BaseDTO(BaseModel):
    """Modelo base para todos los DTOs"""
    
    model_config = ConfigDict(
        from_attributes=True,
        use_enum_values=True,
        validate_assignment=True,
        populate_by_name=True
    )


class TimestampMixin(BaseModel):
    """Mixin para campos de timestamp"""
    fechacreacion: Optional[datetime] = Field(None, alias="FechaCreacion")
    fechaactualizacion: Optional[datetime] = Field(None, alias="FechaActualizacion")


class ActiveMixin(BaseModel):
    """Mixin para campos de estado activo"""
    activo: bool = Field(True, alias="Activo")