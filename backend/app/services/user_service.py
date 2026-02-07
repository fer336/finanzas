"""
Servicio de usuarios - PostgreSQL
"""
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from uuid import UUID
import logging

from app.models.user import User, UserCreate, UserUpdate, UserUpdateName, UserUpdatePais
from app.repositories.user_repository_pg import UserRepositoryPG
from app.repositories.moneda_usuario_repository import MonedaUsuarioRepository
from app.schemas.monedas import MONEDAS_PREDETERMINADAS

logger = logging.getLogger(__name__)

class UserService:
    """Servicio para manejo de usuarios"""
    
    def __init__(self, db: Session):
        self.user_repo = UserRepositoryPG(db)
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Obtener usuario por email"""
        user_obj = await self.user_repo.get_by_email(email)
        if user_obj:
            # Convert SQLAlchemy model to Pydantic model
            return User.model_validate(user_obj)
        return None
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Obtener usuario por ID"""
        user_obj = await self.user_repo.get_by_id(user_id)
        if user_obj:
            return User.model_validate(user_obj)
        return None
    
    async def create_user(self, user_create: UserCreate) -> Optional[User]:
        """Crear nuevo usuario e inicializar sus monedas predeterminadas"""
        user_data = user_create.model_dump()
        created_user = await self.user_repo.create(user_data)
        if created_user:
            # Inicializar monedas predeterminadas automáticamente
            try:
                await self._initialize_default_currencies(UUID(created_user.id))
                logger.info(f"✅ Monedas predeterminadas inicializadas para usuario {created_user.id}")
            except Exception as e:
                logger.error(f"⚠️ Error inicializando monedas para usuario {created_user.id}: {e}")
                # No fallar la creación del usuario si las monedas fallan
            
            return User.model_validate(created_user)
        return None
    
    async def _initialize_default_currencies(self, usuario_id: UUID) -> None:
        """Inicializar monedas predeterminadas para un usuario nuevo"""
        moneda_repo = MonedaUsuarioRepository(self.user_repo.db)
        
        for moneda_default in MONEDAS_PREDETERMINADAS:
            try:
                moneda_repo.create(moneda_default.copy(), usuario_id=usuario_id)
            except Exception as e:
                logger.error(f"❌ Error creando moneda {moneda_default.get('codigo')}: {e}")
                # Continuar con las demás monedas aunque una falle
    
    async def update_user(self, user_id: str, user_update: UserUpdate) -> Optional[User]:
        """Actualizar usuario"""
        update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}
        updated_user = await self.user_repo.update(user_id, update_data)
        if updated_user:
            return User.model_validate(updated_user)
        return None
    
    async def update_user_name(self, user_id: str, name_data: UserUpdateName) -> Optional[User]:
        """Actualizar nombre del usuario"""
        update_data = {"full_name": name_data.full_name}
        updated_user = await self.user_repo.update(user_id, update_data)
        if updated_user:
            return User.model_validate(updated_user)
        return None
    
    async def update_user_country(self, user_id: str, country_data: UserUpdatePais) -> Optional[User]:
        """Actualizar país del usuario"""
        update_data = {"pais": country_data.pais}
        updated_user = await self.user_repo.update(user_id, update_data)
        if updated_user:
            return User.model_validate(updated_user)
        return None
    
    async def deactivate_user(self, user_id: str) -> Optional[User]:
        """Desactivar usuario"""
        update_data = {"active": False}
        updated_user = await self.user_repo.update(user_id, update_data)
        if updated_user:
            return User.model_validate(updated_user)
        return None