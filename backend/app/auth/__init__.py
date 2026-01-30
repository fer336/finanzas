"""Módulo de autenticación"""

from .auth_service import AuthService
from .strategies import AuthStrategy, AuthUserInfo, GoogleAuthStrategy

__all__ = [
    "AuthService",
    "AuthStrategy",
    "AuthUserInfo", 
    "GoogleAuthStrategy"
]