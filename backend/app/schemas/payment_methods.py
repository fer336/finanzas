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

class PaymentMethodBase(BaseModel):
    Nombre: str = Field(..., description="Nombre del método de pago")
    Tipo: str = Field(..., description="Tipo de método de pago")
    Activo: bool = Field(True, description="Si el método está activo")
    Color: str = Field(..., description="Color en formato hex")
    Icono: str = Field(..., description="Emoji o icono del método")
    Descripcion: Optional[str] = Field(None, description="Descripción del método")

class PaymentMethodCreate(BaseModel):
    """Esquema para crear método de pago - campos requeridos por la API POST"""
    Nombre: str = Field(..., description="Nombre del método de pago")
    Tipo: str = Field(..., description="Tipo de método de pago")
    Activo: bool = Field(True, description="Si el método está activo")
    Color: str = Field(..., description="Color en formato hex")
    Icono: str = Field(..., description="Emoji o icono del método")
    Descripcion: Optional[str] = Field("", description="Descripción del método")
    FechaCreacion: Optional[str] = Field(None, description="Fecha de creación (ISO string)")

class PaymentMethodCreateRequest(BaseModel):
    """Esquema simplificado para requests desde el frontend"""
    nombre: str = Field(..., description="Nombre del método de pago")
    tipo: str = Field(..., description="Tipo de método de pago")
    color: str = Field(..., description="Color en formato hex")
    icono: str = Field(..., description="Emoji o icono del método")
    descripcion: Optional[str] = Field("", description="Descripción del método")
    usuario_id: str = Field(..., description="ID del usuario propietario del método de pago")

class PaymentMethodUpdate(BaseModel):
    Nombre: Optional[str] = None
    Tipo: Optional[str] = None
    Activo: Optional[bool] = None
    Color: Optional[str] = None
    Icono: Optional[str] = None
    Descripcion: Optional[str] = None

class PaymentMethodResponse(PaymentMethodBase):
    Id: UUID
    FechaCreacion: str
    Transacciones: int = Field(0, description="Número de transacciones asociadas")
    TransaccionesRecurrentes: int = Field(0, description="Número de transacciones recurrentes")
    Usuarios: Optional[UserInfo] = None

    model_config = ConfigDict(from_attributes=True)

class PaymentMethodsListResponse(BaseModel):
    list: List[PaymentMethodResponse]
    pageInfo: dict = Field(..., description="Información de paginación")

# Esquemas para respuestas simplificadas (para el frontend)
class PaymentMethodSimple(BaseModel):
    id: UUID = Field(..., alias="Id")
    name: str = Field(..., alias="Nombre")
    type: str = Field(..., alias="Tipo")
    active: bool = Field(..., alias="Activo")
    color: str = Field(..., alias="Color")
    icon: str = Field(..., alias="Icono")
    description: Optional[str] = Field(None, alias="Descripcion")
    transaction_count: int = Field(0, alias="Transacciones")
    
    model_config = ConfigDict(populate_by_name=True)