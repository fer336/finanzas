"""
Pydantic schemas for MonedaUsuario (User Currencies)
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class MonedaUsuarioBase(BaseModel):
    """Base schema for MonedaUsuario"""
    codigo: str = Field(..., min_length=1, max_length=10, description="Código ISO: USD, EUR, BTC, etc.")
    nombre: str = Field(..., min_length=1, max_length=100, description="Nombre completo: Dólar Estadounidense")
    simbolo: str = Field(..., min_length=1, max_length=10, description="Símbolo: $, €, £, ₿")
    icono: Optional[str] = Field("DollarSign", max_length=50, description="Lucide icon name")
    color: Optional[str] = Field("from-blue-500 to-cyan-500", max_length=50, description="Tailwind gradient classes")
    
    @validator('codigo')
    def codigo_uppercase(cls, v):
        """Normalizar código a mayúsculas"""
        return v.upper() if v else v


class MonedaUsuarioCreate(MonedaUsuarioBase):
    """Schema for creating a new currency"""
    orden: Optional[int] = Field(0, ge=0, description="Orden de visualización")
    activa: Optional[bool] = Field(True, description="Si la moneda está activa")
    tasa_cambio_a_ars: Optional[float] = Field(None, gt=0, description="Tasa de conversión a ARS")
    
    @validator('codigo')
    def validate_codigo(cls, v):
        """Validar que el código no esté vacío y sea alfanumérico"""
        if not v or not v.strip():
            raise ValueError("El código de moneda no puede estar vacío")
        if not v.replace('-', '').replace('_', '').isalnum():
            raise ValueError("El código debe ser alfanumérico (puede incluir - y _)")
        return v.upper()
    
    @validator('nombre')
    def validate_nombre(cls, v):
        """Validar que el nombre no esté vacío"""
        if not v or not v.strip():
            raise ValueError("El nombre de la moneda no puede estar vacío")
        return v.strip()
    
    @validator('simbolo')
    def validate_simbolo(cls, v):
        """Validar que el símbolo no esté vacío"""
        if not v or not v.strip():
            raise ValueError("El símbolo de la moneda no puede estar vacío")
        return v.strip()


class MonedaUsuarioUpdate(BaseModel):
    """Schema for updating a currency"""
    codigo: Optional[str] = Field(None, min_length=1, max_length=10)
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    simbolo: Optional[str] = Field(None, min_length=1, max_length=10)
    icono: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=50)
    orden: Optional[int] = Field(None, ge=0)
    activa: Optional[bool] = None
    tasa_cambio_a_ars: Optional[float] = Field(None, gt=0)
    
    @validator('codigo')
    def codigo_uppercase(cls, v):
        """Normalizar código a mayúsculas"""
        return v.upper() if v else v


class MonedaUsuarioResponse(MonedaUsuarioBase):
    """Schema for currency responses"""
    id: UUID
    es_predeterminada: bool = Field(..., description="Si es una moneda del sistema")
    activa: bool = Field(..., description="Si la moneda está activa")
    orden: int = Field(..., description="Orden de visualización")
    tasa_cambio_a_ars: Optional[float] = Field(None, description="Tasa de conversión a ARS")
    ultima_actualizacion_tasa: Optional[datetime] = None
    usuario_id: UUID
    fecha_creacion: datetime
    fecha_actualizacion: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class MonedaUsuarioListResponse(BaseModel):
    """Schema for list of currencies"""
    monedas: List[MonedaUsuarioResponse]
    total: int = Field(..., description="Total de monedas")


class MonedaUsuarioReorderRequest(BaseModel):
    """Schema for reordering currencies"""
    monedas: List[dict] = Field(..., description="Lista de {id: UUID, orden: int}")
    
    @validator('monedas')
    def validate_monedas(cls, v):
        """Validar que cada item tenga id y orden"""
        for item in v:
            if 'id' not in item or 'orden' not in item:
                raise ValueError("Cada moneda debe tener 'id' y 'orden'")
            if not isinstance(item['orden'], int) or item['orden'] < 0:
                raise ValueError("El orden debe ser un entero no negativo")
        return v


class MonedaUsuarioToggleRequest(BaseModel):
    """Schema for toggling currency active status"""
    activa: bool = Field(..., description="Nuevo estado activo/inactivo")


# Monedas predeterminadas del sistema
MONEDAS_PREDETERMINADAS = [
    {
        "codigo": "ARS",
        "nombre": "Peso Argentino",
        "simbolo": "$",
        "icono": "DollarSign",
        "color": "from-blue-500 to-cyan-500",
        "orden": 0,
        "es_predeterminada": True,
        "activa": True
    },
    {
        "codigo": "USD",
        "nombre": "Dólar Estadounidense",
        "simbolo": "U$D",
        "icono": "DollarSign",
        "color": "from-emerald-500 to-green-500",
        "orden": 1,
        "es_predeterminada": True,
        "activa": True
    },
    {
        "codigo": "EUR",
        "nombre": "Euro",
        "simbolo": "€",
        "icono": "Euro",
        "color": "from-violet-500 to-purple-500",
        "orden": 2,
        "es_predeterminada": True,
        "activa": True
    },
    {
        "codigo": "BRL",
        "nombre": "Real Brasileño",
        "simbolo": "R$",
        "icono": "Banknote",
        "color": "from-amber-500 to-yellow-500",
        "orden": 3,
        "es_predeterminada": True,
        "activa": True
    },
    {
        "codigo": "GBP",
        "nombre": "Libra Esterlina",
        "simbolo": "£",
        "icono": "PoundSterling",
        "color": "from-indigo-500 to-violet-500",
        "orden": 4,
        "es_predeterminada": True,
        "activa": True
    }
]

