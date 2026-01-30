"""
Servicio de usuarios - PostgreSQL
"""
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.user import User, UserCreate, UserUpdate, UserUpdateName, UserUpdatePais
from app.repositories.user_repository_pg import UserRepositoryPG

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
        """Crear nuevo usuario"""
        user_data = user_create.model_dump()
        created_user = await self.user_repo.create(user_data)
        if created_user:
            return User.model_validate(created_user)
        return None
    
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