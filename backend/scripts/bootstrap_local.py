"""Prepare the database of a local install (see install.sh).

Runs from scripts/entrypoint.sh before `alembic upgrade heads`, only when
LOCAL_AUTH_ENABLED is on. The Alembic history assumes an existing schema, so
on an empty database this creates every table from the models and stamps the
current heads. It then makes sure the demo account and the receipts bucket
exist. Every step is idempotent, so it is safe on each boot; production
never runs it.
"""
import json
import os
import sys
import time
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from minio import Minio  # noqa: E402
from sqlalchemy import inspect  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models.db_models import Usuario  # noqa: E402

def log(message: str) -> None:
    # print, not the logging module: Alembic's fileConfig disables it.
    print(f"[bootstrap_local] {message}", flush=True)


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


def ensure_receipts_bucket(attempts: int = 30, delay: float = 2.0) -> bool:
    """Create the receipts bucket with anonymous read, like production's.

    Receipts open straight from their public URL, so objects must be readable
    without credentials. Waits for the object store, which may still be
    starting. Returns True when the bucket was created.
    """
    bucket = settings.MINIO_BUCKET_NAME
    client = Minio(
        endpoint=settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_SECURE,
        region=settings.MINIO_REGION,
    )
    for attempt in range(1, attempts + 1):
        try:
            created = False
            if not client.bucket_exists(bucket):
                client.make_bucket(bucket, location=settings.MINIO_REGION)
                created = True
            client.set_bucket_policy(bucket, json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"AWS": ["*"]},
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{bucket}/*"],
                }],
            }))
            return created
        except Exception as error:  # the object store may still be starting
            if attempt == attempts:
                raise
            log(f"Waiting for the object store ({error.__class__.__name__})...")
            time.sleep(delay)
    return False


def main() -> int:
    if not settings.LOCAL_AUTH_ENABLED:
        log("LOCAL_AUTH_ENABLED is off; nothing to bootstrap.")
        return 0
    if not settings.LOCAL_AUTH_PASSWORD:
        log("LOCAL_AUTH_PASSWORD is empty; set it in the install .env.")
        return 1
    if create_schema_if_empty():
        log("Created the database schema and stamped Alembic heads.")
    if ensure_demo_user():
        log(f"Created the demo account {settings.LOCAL_AUTH_EMAIL}.")
    if ensure_receipts_bucket():
        log(f"Created the receipts bucket {settings.MINIO_BUCKET_NAME}.")
    return 0


if __name__ == "__main__":
    os.chdir(BACKEND_DIR)
    sys.exit(main())
