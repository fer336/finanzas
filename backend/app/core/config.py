"""
Configuración central del sistema
Usa os.getenv() directamente sin Pydantic BaseSettings
"""

import os
from typing import List
from dotenv import load_dotenv

# Cargar variables de entorno
if not os.getenv("SECRET_KEY"):
    load_dotenv()


class Settings:
    """Configuración principal del sistema usando os.getenv directamente"""

    # Información de la aplicación
    app_name: str = "Sistema de Gastos API"
    app_version: str = "2.1.0"
    debug: bool = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    environment: str = os.getenv("ENVIRONMENT", "development")

    # PostgreSQL Database Configuration
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", "5432"))
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "sistema_financiero")

    @property
    def DATABASE_URL(self) -> str:
        """PostgreSQL connection URL.

        Si DATABASE_URL viene seteada por env, se usa tal cual — salvo que
        pida el driver asyncpg: el motor de la app es síncrono (SQLAlchemy
        create_engine + Session, sin asyncpg instalado), así que se
        normaliza a psycopg2 para no romper el arranque.
        """
        raw = os.getenv("DATABASE_URL", "").strip()
        if raw:
            if "+asyncpg" in raw:
                raw = raw.replace("+asyncpg", "+psycopg2", 1)
            return raw
        return f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Configuración de autenticación
    secret_key: str = os.getenv("SECRET_KEY", "changeme")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
    )

    # Rate limiting
    rate_limit_per_minute: int = 300
    rate_limit_per_hour: int = 5000
    rate_limit_burst: int = (
        50  # Aumentado para soportar carga inicial del dashboard y OAuth
    )

    # Google OAuth2
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_CONF_URL: str = (
        "https://accounts.google.com/.well-known/openid-configuration"
    )
    GOOGLE_SCOPES: str = "openid email profile"

    # URLs del sistema
    DEV_FRONTEND_URL: str = os.getenv("DEV_FRONTEND_URL", "http://localhost:3000")
    PRODUCTION_FRONTEND_URL: str = os.getenv(
        "PRODUCTION_FRONTEND_URL", "https://finanzas.qeva.xyz"
    )
    DEV_BACKEND_URL: str = os.getenv("DEV_BACKEND_URL", "http://localhost:8000")
    PRODUCTION_BACKEND_URL: str = os.getenv(
        "PRODUCTION_BACKEND_URL", "https://finanzas.qeva.xyz"
    )

    # Emails autorizados
    AUTHORIZED_EMAILS: str = os.getenv("AUTHORIZED_EMAILS", "your-email@example.com")
    SESSION_SECRET_KEY: str = os.getenv("SESSION_SECRET_KEY", "default-session-secret")
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
    CORS_CREDENTIALS: bool = os.getenv("CORS_CREDENTIALS", "true").lower() == "true"

    # CORS
    cors_origins: List[str] = ["http://localhost:3000", "https://finanzas.qeva.xyz"]

    def __init__(self):
        # Override cors_origins from environment if provided
        cors_env = os.getenv("CORS_ORIGINS")
        if cors_env:
            try:
                import json

                self.cors_origins = json.loads(cors_env)
            except:
                # Fallback to comma-separated values
                self.cors_origins = [origin.strip() for origin in cors_env.split(",")]

    # API
    api_v1_str: str = "/api/v1"

    # MinIO Configuration (S3-compatible object storage)
    MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "s3.qeva.xyz")
    MINIO_ACCESS_KEY: str = os.getenv("MINIO_ACCESS_KEY", "admin")
    MINIO_SECRET_KEY: str = os.getenv("MINIO_SECRET_KEY", "")
    MINIO_BUCKET_NAME: str = os.getenv("MINIO_BUCKET_NAME", "facturas")
    MINIO_SECURE: bool = os.getenv("MINIO_SECURE", "true").lower() in (
        "true",
        "1",
        "yes",
    )
    MINIO_REGION: str = os.getenv("MINIO_REGION", "us-east-1")

    # Configuración de archivos
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_FILE_EXTENSIONS: List[str] = [
        ".jpg",
        ".jpeg",
        ".png",
        ".pdf",
        ".webp",
        ".gif",
    ]


# Instancia global de configuración
settings = Settings()
