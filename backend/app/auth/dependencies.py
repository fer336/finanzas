from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from typing import Optional
import logging

from app.config import settings
from app.auth.models import CurrentUser

logger = logging.getLogger(__name__)
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> CurrentUser:
    """
    Dependency para obtener el usuario actual desde el token JWT
    
    Esta función:
    1. Extrae el token del header Authorization
    2. Valida y decodifica el token JWT
    3. Extrae los datos del usuario
    4. Retorna el usuario actual
    
    Se usa en todos los endpoints que requieren autenticación
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decodificar el token JWT
        payload = jwt.decode(
            credentials.credentials, 
            settings.secret_key, 
            algorithms=[settings.algorithm]
        )
        
        # Extraer datos del usuario del payload
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        
        if user_id is None or email is None:
            logger.warning("Token missing user_id or email")
            raise credentials_exception
            
    except JWTError as e:
        logger.warning(f"JWT decode error: {str(e)}")
        raise credentials_exception
    
    # Crear el usuario actual
    current_user = CurrentUser(
        id=user_id,
        email=email,
        nombre_completo=payload.get("nombre_completo"),
        moneda_preferida=payload.get("moneda_preferida", "ARS"),
        timezone=payload.get("timezone", "America/Argentina/Buenos_Aires"),
        activo=payload.get("activo", True)
    )
    
    # Verificar que el usuario esté activo
    if not current_user.activo:
        logger.warning(f"Inactive user attempted access: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user"
        )
    
    logger.info(f"Authenticated user: {user_id} ({email})")
    return current_user

async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[CurrentUser]:
    """
    Dependency opcional para obtener el usuario actual
    
    Retorna None si no hay token o si el token es inválido
    Útil para endpoints que pueden funcionar con o sin autenticación
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None

# Alias para facilitar el uso
CurrentUserDep = Depends(get_current_user)
OptionalCurrentUserDep = Depends(get_optional_current_user)