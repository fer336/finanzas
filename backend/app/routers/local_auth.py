"""Email and password login for local installs only.

Production signs in with Google. A local install (see install.sh) sets
LOCAL_AUTH_ENABLED and one demo account through LOCAL_AUTH_EMAIL and
LOCAL_AUTH_PASSWORD; without that flag these routes answer 404.
"""
import hmac
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token
from app.database import get_db
from app.services.user_service import UserService

router = APIRouter(prefix="/auth/local", tags=["Auth"])

INVALID_CREDENTIALS = "Email o contraseña incorrectos"


class LocalLoginRequest(BaseModel):
    email: str = Field(..., max_length=255)
    password: str = Field(..., max_length=255)


async def find_user_by_email(db: Session, email: str):
    return await UserService(db).get_user_by_email(email)


def _matches(given: str, expected: str) -> bool:
    return hmac.compare_digest(given.encode("utf-8"), expected.encode("utf-8"))


@router.get("/status")
def local_auth_status():
    """Tell the login screen whether to offer the password form."""
    return {"enabled": settings.LOCAL_AUTH_ENABLED}


@router.post("/login")
async def local_login(body: LocalLoginRequest, db: Session = Depends(get_db)):
    if not settings.LOCAL_AUTH_ENABLED:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not Found")

    invalid = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=INVALID_CREDENTIALS)
    email = body.email.strip().lower()
    expected_password = settings.LOCAL_AUTH_PASSWORD
    # Compare both fields every time so a wrong email costs the same as a wrong password.
    email_ok = _matches(email, settings.LOCAL_AUTH_EMAIL)
    password_ok = _matches(body.password, expected_password)
    if not expected_password or not (email_ok and password_ok):
        raise invalid

    user = await find_user_by_email(db, email)
    if user is None or not user.is_active:
        raise invalid

    token = create_access_token(
        data={"sub": user.email, "name": user.full_name},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"email": user.email, "name": user.full_name},
    }
