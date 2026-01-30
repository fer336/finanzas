"""
Dependencias de autenticación mejoradas con manejo de errores robusto
"""
from typing import Annotated, Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.models.user import User
from app.services.user_service import UserService
from app.core.security import verify_token, sanitize_input, hash_sensitive_data
from app.database import get_db
import logging
import time

logger = logging.getLogger(__name__)

# Configuración mejorada de seguridad HTTP Bearer
security = HTTPBearer(
    scheme_name="JWT Bearer Token",
    description="Token JWT de autenticación",
    auto_error=False  # Manejar errores manualmente para mejor control
)

async def get_current_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    """Obtener usuario actual desde el token JWT con validaciones mejoradas"""
    start_time = time.time()
    
    # Log de la solicitud de autenticación
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    logger.info(f"Intento de autenticación desde IP: {client_ip}")
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token de autenticación requerido o inválido",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Verificar que se proporcionaron credenciales
        if not credentials:
            logger.warning(f"❌ No se recibieron credenciales (Authorization header) desde IP: {client_ip}")
            # Log de todos los headers para depuración (sin mostrar el token completo)
            auth_header = request.headers.get("Authorization", "Missing")
            logger.info(f"   Authorization Header: {auth_header[:15]}..." if auth_header != "Missing" else "   Authorization Header: Missing")
            raise credentials_exception
            
        # Verificar token
        token = sanitize_input(credentials.credentials, max_length=2000)
        if not token:
            logger.warning(f"❌ Token vacío desde IP: {client_ip}")
            raise credentials_exception
            
        logger.info(f"🔑 Verificando token para IP: {client_ip} (Token hash: {hash_sensitive_data(token)})")
        payload = verify_token(token)
        if payload is None:
            logger.warning(f"❌ Token inválido o expirado desde IP: {client_ip}")
            raise credentials_exception
        
        # Obtener email del payload
        email: str = payload.get("sub")
        if not email:
            logger.warning(f"❌ Token sin subject (email) desde IP: {client_ip}")
            raise credentials_exception
        
        logger.info(f"👤 Token válido para email: {email}")
        
        # Sanitizar email
        email = sanitize_input(email, max_length=255)
        
        # Obtener usuario de la base de datos PostgreSQL
        logger.info(f"🔍 Buscando usuario en DB: {email}")
        user_service = UserService(db)
        user = await user_service.get_user_by_email(email)
        
        if user is None:
            logger.warning(f"❌ Usuario no encontrado en DB: {email} desde IP: {client_ip}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        # Verificar que el usuario esté activo
        if not user.is_active:
            logger.warning(f"❌ Usuario inactivo intentó acceder: {email} desde IP: {client_ip}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario inactivo"
            )
        
        # Log exitoso
        auth_time = time.time() - start_time
        logger.info(f"✅ Autenticación exitosa para {email} en {auth_time:.3f}s desde IP: {client_ip}")
        
        return user
    
    except HTTPException:
        # Re-lanzar HTTPExceptions tal como están
        raise
    except Exception as e:
        # Log de errores inesperados
        auth_time = time.time() - start_time
        logger.error(f"Error inesperado en autenticación después de {auth_time:.3f}s desde IP {client_ip}: {str(e)}")
        raise credentials_exception

# Tipo para inyección de dependencias
CurrentUser = Annotated[User, Depends(get_current_user)]