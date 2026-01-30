from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class User(BaseModel):
    """Modelo de usuario para multi-tenant"""
    id: str = Field(..., description="ID único del usuario")
    email: str = Field(..., description="Email del usuario")
    nombre_completo: Optional[str] = Field(None, description="Nombre completo")
    activo: bool = Field(default=True, description="Si el usuario está activo")
    moneda_preferida: str = Field(default="ARS", description="Moneda preferida")
    timezone: str = Field(default="America/Argentina/Buenos_Aires", description="Zona horaria")
    avatar_url: Optional[str] = Field(None, description="URL del avatar")
    configuracion_notificaciones: Optional[Dict[str, Any]] = Field(None, description="Configuración de notificaciones")
    tema_preferido: str = Field(default="light", description="Tema preferido")
    fecha_creacion: Optional[str] = Field(None, description="Fecha de creación")
    fecha_actualizacion: Optional[str] = Field(None, description="Fecha de actualización")
    ultimo_login: Optional[str] = Field(None, description="Último login")

class UserToken(BaseModel):
    """Token de usuario para autenticación"""
    access_token: str = Field(..., description="Token de acceso")
    token_type: str = Field(default="bearer", description="Tipo de token")
    expires_in: int = Field(..., description="Tiempo de expiración en segundos")
    user: User = Field(..., description="Datos del usuario")

class LoginRequest(BaseModel):
    """Request para login"""
    email: str = Field(..., description="Email del usuario")
    password: str = Field(..., description="Contraseña")

class RegisterRequest(BaseModel):
    """Request para registro"""
    email: str = Field(..., description="Email del usuario")
    password: str = Field(..., description="Contraseña")
    nombre_completo: str = Field(..., description="Nombre completo")
    moneda_preferida: str = Field(default="ARS", description="Moneda preferida")
    timezone: str = Field(default="America/Argentina/Buenos_Aires", description="Zona horaria")

class CurrentUser(BaseModel):
    """Usuario actual en el contexto de la request"""
    id: str
    email: str
    nombre_completo: Optional[str] = None
    moneda_preferida: str = "ARS"
    timezone: str = "America/Argentina/Buenos_Aires"
    activo: bool = True