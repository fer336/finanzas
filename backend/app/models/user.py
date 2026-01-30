"""
Modelos de usuario mejorados con validaciones de seguridad
"""
from typing import Optional, Union
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime
from .validators import ValidationMixin, SecurityValidationMixin

class UserBase(BaseModel, ValidationMixin, SecurityValidationMixin):
    """Modelo base de usuario con validaciones mejoradas"""
    email: EmailStr = Field(
        ...,
        description="Email del usuario",
        example="usuario@example.com"
    )
    full_name: Optional[str] = Field(
        None,
        min_length=2,
        max_length=100,
        description="Nombre completo del usuario",
        example="Juan Pérez"
    )
    is_active: bool = Field(
        default=True,
        description="Estado activo del usuario"
    )
    
    @validator('is_active', pre=True, always=True)
    def map_active_to_is_active(cls, v, values, **kwargs):
        # Si v es None y tenemos 'active' en el objeto original (vía from_orm)
        return v if v is not None else True
    
    @validator('email')
    def validate_email_format(cls, v):
        return cls.validate_email(v)
    
    @validator('full_name')
    def validate_full_name(cls, v):
        if v is None:
            return v
        return cls.validate_name(v, "Nombre completo")

class UserCreate(UserBase):
    """Modelo para crear usuario con validaciones mejoradas"""
    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        description="Nombre de usuario único",
        example="juanperez"
    )
    provider: str = Field(
        default="google",
        description="Proveedor de autenticación"
    )
    picture: Optional[str] = Field(
        None,
        description="URL de la foto de perfil",
        example="https://example.com/avatar.jpg"
    )
    google_id: Optional[str] = Field(
        None,
        description="ID único de Google"
    )
    
    @validator('username')
    def validate_username(cls, v):
        if not v:
            raise ValueError("Username es requerido")
        
        v = v.strip().lower()
        
        # Solo letras, números y guiones bajos
        import re
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError("Username solo puede contener letras, números y guiones bajos")
        
        return v
    
    @validator('picture')
    def validate_picture_url(cls, v):
        if v is None:
            return v
        return cls.validate_url(v)
    
    @validator('provider')
    def validate_provider(cls, v):
        valid_providers = ['google', 'github', 'microsoft']
        if v not in valid_providers:
            raise ValueError(f"Proveedor debe ser uno de: {', '.join(valid_providers)}")
        return v

class UserUpdate(BaseModel, ValidationMixin):
    """Modelo para actualizar usuario con validaciones"""
    full_name: Optional[str] = Field(
        None,
        min_length=2,
        max_length=100,
        description="Nombre completo del usuario"
    )
    picture: Optional[str] = Field(
        None,
        description="URL de la foto de perfil"
    )
    is_active: Optional[bool] = Field(
        None,
        description="Estado activo del usuario"
    )
    
    @validator('full_name')
    def validate_full_name(cls, v):
        if v is None:
            return v
        return cls.validate_name(v, "Nombre completo")
    
    @validator('picture')
    def validate_picture_url(cls, v):
        if v is None:
            return v
        return cls.validate_url(v)

class UserUpdateName(BaseModel, ValidationMixin):
    """Modelo para actualizar nombre con validación mejorada"""
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Nombre completo del usuario",
        example="Juan Carlos Pérez"
    )
    
    @validator('full_name')
    def validate_full_name(cls, v):
        return cls.validate_name(v, "Nombre completo")

class UserUpdatePais(BaseModel, ValidationMixin):
    """Modelo para actualizar país con validación mejorada"""
    pais: str = Field(
        ...,
        min_length=2,
        max_length=50,
        description="País del usuario",
        example="Argentina"
    )
    
    @validator('pais')
    def validate_country(cls, v):
        return cls.validate_name(v, "País")

class User(UserBase):
    """Modelo completo de usuario con metadatos adicionales"""
    id: Union[UUID, str] = Field(
        ...,
        alias="id",
        description="ID único del usuario en la base de datos"
    )
    
    @validator('id', pre=True)
    def convert_uuid_to_str(cls, v):
        """Convertir UUID a string si es necesario"""
        if isinstance(v, UUID):
            return str(v)
        return v
    picture: Optional[str] = Field(
        None,
        alias="avatar_url",
        description="URL de la foto de perfil"
    )
    moneda_preferida: Optional[str] = Field(
        default="ARS",
        description="Moneda preferida del usuario"
    )
    timezone: Optional[str] = Field(
        default="America/Argentina/Buenos_Aires",
        description="Zona horaria del usuario"
    )
    tema_preferido: Optional[str] = Field(
        default="claro",
        description="Tema preferido del usuario"
    )
    fecha_creacion: Optional[datetime] = Field(
        None,
        description="Fecha de creación del usuario"
    )
    fecha_actualizacion: Optional[datetime] = Field(
        None,
        description="Fecha de última actualización"
    )
    ultimo_login: Optional[datetime] = Field(
        None,
        description="Fecha del último login"
    )
    
    class Config:
        from_attributes = True
        populate_by_name = True  # Permite usar tanto el nombre como el alias
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "email": "usuario@example.com",
                "full_name": "Juan Pérez",
                "picture": "https://example.com/avatar.jpg",
                "is_active": True,
                "moneda_preferida": "ARS",
                "timezone": "America/Argentina/Buenos_Aires",
                "fecha_creacion": "2024-01-01T00:00:00"
            }
        }