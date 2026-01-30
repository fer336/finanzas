"""
Strategy Pattern para autenticación
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from pydantic import BaseModel


class AuthUserInfo(BaseModel):
    """Información del usuario autenticado"""
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    provider: str
    raw_data: Dict[str, Any] = {}


class AuthStrategy(ABC):
    """Estrategia base para autenticación"""
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Nombre del proveedor de autenticación"""
        pass
    
    @abstractmethod
    async def get_authorization_url(self, state: str) -> str:
        """Obtener URL de autorización"""
        pass
    
    @abstractmethod
    async def exchange_code_for_token(self, code: str, state: str) -> str:
        """Intercambiar código por token de acceso"""
        pass
    
    @abstractmethod
    async def get_user_info(self, access_token: str) -> AuthUserInfo:
        """Obtener información del usuario con el token"""
        pass
    
    @abstractmethod
    async def refresh_token(self, refresh_token: str) -> str:
        """Refrescar token de acceso"""
        pass