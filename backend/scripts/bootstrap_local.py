"""Prepare the database of a local install (see install.sh).

Runs from scripts/entrypoint.sh before `alembic upgrade heads`, only when
LOCAL_AUTH_ENABLED is on. The Alembic history assumes an existing schema, so
on an empty database this creates every table from the models and stamps the
current heads. It then makes sure the demo account exists. Every step is
idempotent, so it is safe on each boot; production never runs it.
"""
import logging
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from sqlalchemy import inspect  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models.db_models import Usuario  # noqa: E402

logger = logging.getLogger("bootstrap_local")


def create_schema_if_empty() -> bool:
    """Create all tables and stamp Alembic when the database has no schema."""
    if inspect(engine).has_table(Usuario.__tablename__):
        return False
    Base.metadata.create_all(bind=engine)
    command.stamp(Config(str(BACKEND_DIR / "alembic.ini")), "heads")
    return True


def ensure_demo_user() -> bool:
    """Create the demo account, or reactivate it. Returns True when created."""
    email = settings.LOCAL_AUTH_EMAIL
    with SessionLocal() as db:
        user = db.query(Usuario).filter(Usuario.email == email).one_or_none()
        if user is None:
            db.add(Usuario(email=email, full_name=settings.LOCAL_AUTH_NAME, is_active=True))
            db.commit()
            return True
        if not user.is_active:
            user.is_active = True
            db.commit()
        return False


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    if not settings.LOCAL_AUTH_ENABLED:
        logger.info("LOCAL_AUTH_ENABLED is off; nothing to bootstrap.")
        return 0
    if not settings.LOCAL_AUTH_PASSWORD:
        logger.error("LOCAL_AUTH_PASSWORD is empty; set it in the install .env.")
        return 1
    if create_schema_if_empty():
        logger.info("Created the database schema and stamped Alembic heads.")
    if ensure_demo_user():
        logger.info("Created the demo account %s.", settings.LOCAL_AUTH_EMAIL)
    return 0


if __name__ == "__main__":
    os.chdir(BACKEND_DIR)
    sys.exit(main())
