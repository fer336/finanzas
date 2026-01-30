from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

class UserInfo(BaseModel):
    Email: str
    NombreCompleto: Optional[str] = None
    Activo: bool = True
    MonedaPreferida: Optional[str] = None
    Timezone: Optional[str] = None
    AvatarUrl: Optional[str] = None
    ConfiguracionNotificaciones: Optional[Dict[str, Any]] = None
    TemaPreferido: Optional[str] = None
    FechaCreacion: Optional[str] = None
    FechaActualizacion: Optional[str] = None
    UltimoLogin: Optional[str] = None

class CategoryBase(BaseModel):
    Nombre: str = Field(..., description="Nombre de la categoría")
    Tipo: str = Field(..., description="Tipo: 'ingreso' o 'gasto'")
    Color: str = Field(..., description="Color en formato hex")
    Icono: str = Field(..., description="Emoji o icono de la categoría")
    Activa: bool = Field(True, description="Si la categoría está activa")
    Descripcion: Optional[str] = Field(None, description="Descripción de la categoría")

class CategoryCreate(BaseModel):
    """Esquema para crear categoría - solo los campos requeridos por la API POST"""
    Nombre: str = Field(..., description="Nombre de la categoría")
    Tipo: str = Field(..., description="Tipo: 'ingreso' o 'gasto'")
    Color: str = Field(..., description="Color en formato hex")
    Icono: str = Field(..., description="Emoji o icono de la categoría")
    Activa: bool = Field(True, description="Si la categoría está activa")
    Descripcion: Optional[str] = Field("", description="Descripción de la categoría")
    FechaCreacion: Optional[str] = Field(None, description="Fecha de creación (ISO string)")
    FechaActualizacion: Optional[str] = Field(None, description="Fecha de actualización (ISO string)")

class CategoryCreateRequest(BaseModel):
    """Esquema simplificado para requests desde el frontend"""
    nombre: str = Field(..., description="Nombre de la categoría")
    tipo: str = Field(..., description="Tipo: 'ingreso' o 'gasto'")
    color: str = Field(..., description="Color en formato hex")
    icono: str = Field(..., description="Emoji o icono de la categoría")
    descripcion: Optional[str] = Field("", description="Descripción de la categoría")
    usuario_id: str = Field(..., description="ID del usuario propietario de la categoría")

class CategoryUpdate(BaseModel):
    Nombre: Optional[str] = None
    Tipo: Optional[str] = None
    Color: Optional[str] = None
    Icono: Optional[str] = None
    Activa: Optional[bool] = None
    Descripcion: Optional[str] = None
    FechaActualizacion: Optional[str] = None

class CategoryResponse(CategoryBase):
    Id: UUID
    FechaCreacion: str
    FechaActualizacion: str
    PresupuestoCategorias: int = Field(0, description="Número de presupuestos asociados")
    Transacciones: int = Field(0, description="Número de transacciones asociadas")
    TransaccionesRecurrentes: int = Field(0, description="Número de transacciones recurrentes")
    Usuarios: Optional[UserInfo] = None

    model_config = ConfigDict(from_attributes=True)

class CategoriesListResponse(BaseModel):
    list: List[CategoryResponse]
    pageInfo: dict = Field(..., description="Información de paginación")

# Esquemas para respuestas simplificadas (para el frontend)
class CategorySimple(BaseModel):
    id: UUID = Field(..., alias="Id")
    name: str = Field(..., alias="Nombre")
    type: str = Field(..., alias="Tipo")
    color: str = Field(..., alias="Color")
    icon: str = Field(..., alias="Icono")
    active: bool = Field(..., alias="Activa")
    description: Optional[str] = Field(None, alias="Descripcion")
    transaction_count: int = Field(0, alias="Transacciones")
    
    model_config = ConfigDict(populate_by_name=True)