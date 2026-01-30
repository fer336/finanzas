"""
Servicio de autenticación que utiliza Strategy Pattern
"""
import secrets
from typing import Dict, Optional
from datetime import datetime, timedelta
import jwt

from .strategies import AuthStrategy, AuthUserInfo, GoogleAuthStrategy
from ..core.config import settings


class AuthService:
    """Servicio de autenticación con múltiples estrategias"""
    
    def __init__(self):
        self.settings = settings
        self.strategies: Dict[str, AuthStrategy] = {
            "google": GoogleAuthStrategy()
        }
        self.active_states: Dict[str, Dict] = {}
    
    def get_strategy(self, provider: str) -> Optional[AuthStrategy]:
        """Obtener estrategia de autenticación por proveedor"""
        return self.strategies.get(provider)
    
    async def initiate_oauth(self, provider: str) -> Dict[str, str]:
        """Iniciar proceso OAuth2"""
        strategy = self.get_strategy(provider)
        if not strategy:
            raise ValueError(f"Proveedor {provider} no soportado")
        
        # Generar estado único para CSRF protection
        state = secrets.token_urlsafe(32)
        self.active_states[state] = {
            "provider": provider,
            "created_at": datetime.now(),
            "expires_at": datetime.now() + timedelta(minutes=10)
        }
        
        auth_url = await strategy.get_authorization_url(state)
        
        return {
            "auth_url": auth_url,
            "state": state
        }
    
    async def handle_oauth_callback(
        self, 
        provider: str, 
        code: str, 
        state: str
    ) -> Dict[str, str]:
        """Manejar callback de OAuth2"""
        # Validar estado
        if state not in self.active_states:
            raise ValueError("Estado inválido o expirado")
        
        state_data = self.active_states[state]
        if datetime.now() > state_data["expires_at"]:
            del self.active_states[state]
            raise ValueError("Estado expirado")
        
        if state_data["provider"] != provider:
            raise ValueError("Proveedor no coincide")
        
        strategy = self.get_strategy(provider)
        if not strategy:
            raise ValueError(f"Proveedor {provider} no soportado")
        
        # Intercambiar código por token
        access_token = await strategy.exchange_code_for_token(code, state)
        
        # Obtener información del usuario
        user_info = await strategy.get_user_info(access_token)
        
        # Generar JWT token interno
        jwt_token = self._generate_jwt_token(user_info)
        
        # Limpiar estado usado
        del self.active_states[state]
        
        return {
            "access_token": jwt_token,
            "user": user_info.dict(),
            "provider": provider
        }
    
    def _generate_jwt_token(self, user_info: AuthUserInfo) -> str:
        """Generar token JWT interno"""
        payload = {
            "user_id": user_info.id,
            "email": user_info.email,
            "name": user_info.name,
            "provider": user_info.provider,
            "exp": datetime.utcnow() + timedelta(
                minutes=self.settings.access_token_expire_minutes
            ),
            "iat": datetime.utcnow()
        }
        
        return jwt.encode(
            payload,
            self.settings.secret_key,
            algorithm=self.settings.algorithm
        )
    
    def verify_jwt_token(self, token: str) -> Optional[Dict]:
        """Verificar y decodificar token JWT"""
        try:
            payload = jwt.decode(
                token,
                self.settings.secret_key,
                algorithms=[self.settings.algorithm]
            )
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    async def cleanup_expired_states(self):
        """Limpiar estados expirados"""
        now = datetime.now()
        expired_states = [
            state for state, data in self.active_states.items()
            if now > data["expires_at"]
        ]
        
        for state in expired_states:
            del self.active_states[state]
    
    async def close(self):
        """Cerrar recursos"""
        for strategy in self.strategies.values():
            if hasattr(strategy, 'close'):
                await strategy.close()