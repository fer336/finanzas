from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from typing import Optional, Dict, Any
import secrets
import string

from app.config import settings
from app.auth.models import User, UserToken

# Configuración para hashing de passwords
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verificar una contraseña contra su hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generar hash de una contraseña"""
    return pwd_context.hash(password)

def create_access_token(user: User, expires_delta: Optional[timedelta] = None) -> UserToken:
    """
    Crear un token JWT para un usuario
    
    Args:
        user: Usuario para el que crear el token
        expires_delta: Tiempo de expiración personalizado
    
    Returns:
        UserToken con el token y datos del usuario
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    # Payload del JWT
    to_encode = {
        "sub": user.id,  # Subject (user ID)
        "email": user.email,
        "nombre_completo": user.nombre_completo,
        "moneda_preferida": user.moneda_preferida,
        "timezone": user.timezone,
        "activo": user.activo,
        "exp": expire,  # Expiration time
        "iat": datetime.utcnow(),  # Issued at
        "type": "access_token"
    }
    
    # Crear el token
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    
    # Calcular tiempo de expiración en segundos
    expires_in = int((expire - datetime.utcnow()).total_seconds())
    
    return UserToken(
        access_token=encoded_jwt,
        token_type="bearer",
        expires_in=expires_in,
        user=user
    )

def generate_random_password(length: int = 12) -> str:
    """Generar una contraseña aleatoria"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password

def validate_email(email: str) -> bool:
    """Validar formato de email básico"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def extract_tenant_from_email(email: str) -> str:
    """
    Extraer el tenant del email (opcional)
    
    Por ahora retorna el dominio del email como tenant
    En el futuro se puede personalizar según las necesidades
    """
    if "@" in email:
        return email.split("@")[1].lower()
    return "default"

def mask_sensitive_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Enmascarar datos sensibles para logs"""
    sensitive_fields = ["password", "token", "secret", "key"]
    masked_data = data.copy()
    
    for key, value in masked_data.items():
        if any(field in key.lower() for field in sensitive_fields):
            masked_data[key] = "***masked***"
    
    return masked_data