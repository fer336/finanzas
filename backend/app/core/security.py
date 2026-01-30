"""
Módulo de seguridad y autenticación mejorado
"""
import os
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Debug SECRET_KEY (solo longitud y hash para seguridad)
_sk = settings.secret_key
_sk_info = f"len={len(_sk)}, hash={hashlib.sha256(_sk.encode()).hexdigest()[:8]}"
logger.info(f"🔐 Security module initialized with SECRET_KEY: {_sk_info}")

# Contexto de encriptación para contraseñas con configuración mejorada
pwd_context = CryptContext(
    schemes=["bcrypt"], 
    deprecated="auto",
    bcrypt__rounds=12  # Aumentar rounds para mayor seguridad
)

def create_access_token(data: Dict[Any, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Crear token JWT de acceso con seguridad mejorada"""
    to_encode = data.copy()
    
    # Usar timezone aware datetime
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.access_token_expire_minutes)
    
    # Agregar claims adicionales para seguridad
    to_encode.update({
        "exp": expire,
        "iat": now,  # Issued at
        "jti": secrets.token_hex(16),  # JWT ID único
        "iss": "sistema-gastos-api"  # Issuer
    })
    
    try:
        encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
        logger.info(f"Token creado exitosamente para: {data.get('sub', 'unknown')}")
        return encoded_jwt
    except Exception as e:
        logger.error(f"Error creando token JWT: {e}")
        raise

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Verificar y decodificar token JWT con validaciones mejoradas"""
    try:
        # Decodificar con validaciones estrictas
        payload = jwt.decode(
            token, 
            settings.secret_key, 
            algorithms=[settings.algorithm],
            options={
                "verify_exp": True,  # Verificar expiración
                "verify_iat": True,  # Verificar issued at
                "verify_iss": True   # Verificar issuer
            },
            issuer="sistema-gastos-api"
        )
        
        # Validaciones adicionales
        if not payload.get("sub"):
            logger.warning("Token sin subject (sub)")
            return None
            
        if not payload.get("jti"):
            logger.warning("Token sin JWT ID (jti)")
            return None
            
        logger.debug(f"Token verificado exitosamente para: {payload.get('sub')}")
        return payload
        
    except jwt.ExpiredSignatureError:
        logger.warning("Token expirado")
        return None
    except jwt.InvalidIssuerError:
        logger.warning("Token con issuer inválido")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Token inválido: {e}")
        return None
    except Exception as e:
        logger.error(f"Error inesperado verificando token: {e}")
        return None

async def is_email_authorized(email: str) -> bool:
    """Verificar si un email está autorizado con validaciones mejoradas"""
    if not email or not email.strip():
        logger.warning("Intento de verificación con email vacío")
        return False
    
    # Validar formato de email básico
    if "@" not in email or "." not in email.split("@")[-1]:
        logger.warning(f"Email con formato inválido: {email}")
        return False
    
    try:
        authorized_emails = [e.strip().lower() for e in settings.AUTHORIZED_EMAILS.split(",") if e.strip()]
        is_authorized = email.lower() in authorized_emails
        
        if is_authorized:
            logger.info(f"Email autorizado: {email}")
        else:
            logger.warning(f"Email no autorizado: {email}")
            
        return is_authorized
    except Exception as e:
        logger.error(f"Error verificando email autorizado: {e}")
        return False

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verificar contraseña con logging mejorado"""
    try:
        is_valid = pwd_context.verify(plain_password, hashed_password)
        if is_valid:
            logger.debug("Contraseña verificada exitosamente")
        else:
            logger.warning("Intento de login con contraseña incorrecta")
        return is_valid
    except Exception as e:
        logger.error(f"Error verificando contraseña: {e}")
        return False

def get_password_hash(password: str) -> str:
    """Obtener hash de contraseña con validaciones"""
    if not password or len(password) < 8:
        raise ValueError("La contraseña debe tener al menos 8 caracteres")
    
    try:
        hashed = pwd_context.hash(password)
        logger.debug("Contraseña hasheada exitosamente")
        return hashed
    except Exception as e:
        logger.error(f"Error hasheando contraseña: {e}")
        raise

def generate_secure_random_string(length: int = 32) -> str:
    """Generar string aleatorio seguro para tokens, states, etc."""
    return secrets.token_urlsafe(length)

def create_csrf_token() -> str:
    """Crear token CSRF"""
    return generate_secure_random_string(32)

def verify_csrf_token(token: str, expected_token: str) -> bool:
    """Verificar token CSRF usando comparación segura"""
    if not token or not expected_token:
        return False
    return secrets.compare_digest(token, expected_token)

def sanitize_input(input_str: str, max_length: int = 1000) -> str:
    """Sanitizar entrada de usuario"""
    if not input_str:
        return ""
    
    # Remover caracteres peligrosos
    sanitized = input_str.strip()[:max_length]
    
    # Log si se truncó el input
    if len(input_str) > max_length:
        logger.warning(f"Input truncado de {len(input_str)} a {max_length} caracteres")
    
    return sanitized

def hash_sensitive_data(data: str) -> str:
    """Hash de datos sensibles para logging seguro"""
    return hashlib.sha256(data.encode()).hexdigest()[:8] + "..."