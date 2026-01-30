"""
Estrategia de autenticación Google OAuth2
"""
import httpx
from urllib.parse import urlencode
from typing import Dict, Any

from .base import AuthStrategy, AuthUserInfo
from ...core.config import settings


class GoogleAuthStrategy(AuthStrategy):
    """Estrategia de autenticación con Google OAuth2"""
    
    def __init__(self):
        self.auth_settings = settings
        # Crear configuración OAuth desde settings
        self.config = {
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'redirect_uri': f"{settings.DEV_BACKEND_URL}/auth/google/callback",
            'scope': settings.GOOGLE_SCOPES
        }
        self.client = httpx.AsyncClient()
    
    @property
    def provider_name(self) -> str:
        return "google"
    
    async def get_authorization_url(self, state: str) -> str:
        """Generar URL de autorización de Google"""
        params = {
            "client_id": self.config["client_id"],
            "redirect_uri": self.config["redirect_uri"],
            "scope": " ".join(self.config["scope"]),
            "response_type": "code",
            "state": state,
            "access_type": "offline",
            "prompt": "consent"
        }
        
        return f"{self.config['authorization_url']}?{urlencode(params)}"
    
    async def exchange_code_for_token(self, code: str, state: str) -> str:
        """Intercambiar código por token de acceso"""
        data = {
            "client_id": self.config["client_id"],
            "client_secret": self.config["client_secret"],
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": self.config["redirect_uri"]
        }
        
        response = await self.client.post(
            self.config["token_url"],
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        response.raise_for_status()
        
        token_data = response.json()
        return token_data["access_token"]
    
    async def get_user_info(self, access_token: str) -> AuthUserInfo:
        """Obtener información del usuario desde Google"""
        headers = {"Authorization": f"Bearer {access_token}"}
        
        response = await self.client.get(
            self.config["userinfo_url"],
            headers=headers
        )
        response.raise_for_status()
        
        user_data = response.json()
        
        return AuthUserInfo(
            id=user_data["id"],
            email=user_data["email"],
            name=user_data.get("name", ""),
            picture=user_data.get("picture"),
            provider=self.provider_name,
            raw_data=user_data
        )
    
    async def refresh_token(self, refresh_token: str) -> str:
        """Refrescar token de acceso con Google"""
        data = {
            "client_id": self.config["client_id"],
            "client_secret": self.config["client_secret"],
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }
        
        response = await self.client.post(
            self.config["token_url"],
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        response.raise_for_status()
        
        token_data = response.json()
        return token_data["access_token"]
    
    async def close(self):
        """Cerrar cliente HTTP"""
        await self.client.aclose()