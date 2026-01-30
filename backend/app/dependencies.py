"""
Dependency Injection para FastAPI
"""
from functools import lru_cache
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .auth import AuthService
from .core.config import settings

# Security
security = HTTPBearer()

# Configuración
@lru_cache()
def get_settings_dependency():
    """Dependency para configuración"""
    return settings

@lru_cache()
def get_auth_service() -> AuthService:
    """Dependency para servicio de autenticación"""
    return AuthService()

# Authentication
async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)]
):
    """Dependency para obtener usuario actual autenticado"""
    token = credentials.credentials
    payload = auth_service.verify_jwt_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return payload

# Optional authentication (para endpoints públicos)
async def get_current_user_optional(
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Dependency para autenticación opcional"""
    if not credentials:
        return None
    
    token = credentials.credentials
    payload = auth_service.verify_jwt_token(token)
    return payload

# Type aliases para mejor legibilidad
SettingsDep = Annotated[object, Depends(get_settings_dependency)]
AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
CurrentUserDep = Annotated[dict, Depends(get_current_user)]
OptionalUserDep = Annotated[dict, Depends(get_current_user_optional)]
