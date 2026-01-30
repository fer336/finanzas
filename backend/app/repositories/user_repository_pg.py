"""
PostgreSQL Repository for Users
"""
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import Optional, Dict, Any
from app.models.db_models import Usuario
from datetime import datetime
import uuid


class UserRepositoryPG:
    """Repository for user operations on PostgreSQL"""

    def __init__(self, db: Session):
        self.db = db

    async def get_by_email(self, email: str) -> Optional[Usuario]:
        """Get user by email"""
        try:
            stmt = select(Usuario).where(Usuario.email == email)
            result = self.db.execute(stmt)
            user = result.scalar_one_or_none()
            return user
        except Exception as e:
            print(f"❌ Error getting user by email: {e}")
            return None

    async def get_by_id(self, user_id: str) -> Optional[Usuario]:
        """Get user by ID"""
        try:
            stmt = select(Usuario).where(Usuario.id == uuid.UUID(user_id))
            result = self.db.execute(stmt)
            user = result.scalar_one_or_none()
            return user
        except Exception as e:
            print(f"❌ Error getting user by ID: {e}")
            return None

    async def create(self, user_data: Dict[str, Any]) -> Optional[Usuario]:
        """Create new user"""
        try:
            new_user = Usuario(
                id=uuid.uuid4(),
                email=user_data.get("email"),
                full_name=user_data.get("full_name", ""),
                picture=user_data.get("picture", ""),
                is_active=user_data.get("is_active", user_data.get("active", True)),
                google_id=user_data.get("google_id", ""),
                moneda_preferida=user_data.get("moneda_preferida", "ARS"),
                timezone=user_data.get("timezone", "America/Argentina/Buenos_Aires"),
                tema_preferido=user_data.get("tema_preferido", "dark"),
                fecha_creacion=datetime.utcnow(),
                fecha_actualizacion=datetime.utcnow(),
                ultimo_login=datetime.utcnow()
            )

            self.db.add(new_user)
            self.db.commit()
            self.db.refresh(new_user)

            print(f"✅ User created: {new_user.email}")
            return new_user

        except Exception as e:
            self.db.rollback()
            print(f"❌ Error creating user: {e}")
            import traceback
            traceback.print_exc()
            return None

    async def update(self, user_id: str, user_data: Dict[str, Any]) -> Optional[Usuario]:
        """Update user"""
        try:
            stmt = select(Usuario).where(Usuario.id == uuid.UUID(user_id))
            result = self.db.execute(stmt)
            user = result.scalar_one_or_none()

            if not user:
                print(f"❌ User not found: {user_id}")
                return None

            # Update allowed fields
            allowed_fields = [
                "email", "full_name", "is_active", "picture", 
                "google_id", "moneda_preferida", "timezone", 
                "avatar_url", "configuracion_notificaciones", 
                "tema_preferido", "ultimo_login"
            ]

            for key, value in user_data.items():
                if key in allowed_fields and hasattr(user, key):
                    setattr(user, key, value)

            user.fecha_actualizacion = datetime.utcnow()

            self.db.commit()
            self.db.refresh(user)

            print(f"✅ User updated: {user.email}")
            return user

        except Exception as e:
            self.db.rollback()
            print(f"❌ Error updating user: {e}")
            import traceback
            traceback.print_exc()
            return None

    async def delete(self, user_id: str) -> bool:
        """Delete user"""
        try:
            stmt = select(Usuario).where(Usuario.id == uuid.UUID(user_id))
            result = self.db.execute(stmt)
            user = result.scalar_one_or_none()

            if not user:
                return False

            self.db.delete(user)
            self.db.commit()
            return True

        except Exception as e:
            self.db.rollback()
            print(f"❌ Error deleting user: {e}")
            return False

