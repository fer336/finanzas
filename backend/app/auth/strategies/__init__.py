"""Estrategias de autenticación"""

from .base import AuthStrategy, AuthUserInfo
from .google_strategy import GoogleAuthStrategy

__all__ = [
    "AuthStrategy",
    "AuthUserInfo",
    "GoogleAuthStrategy"
]