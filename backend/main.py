"""
Sistema de Gastos - Backend Principal
Aplicación FastAPI con arquitectura mejorada y seguridad robusta
"""

import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware
import uvicorn
from dotenv import load_dotenv

# --- Lógica de Carga de Configuración Inteligente ---
# En producción (Docker Swarm), las variables se cargan desde un secret.
# En desarrollo, se cargan desde un archivo .env.
SECRET_PATH = "/run/secrets/backend.env"

# Configuración inicial de logging para el arranque
logging.basicConfig(level=logging.INFO)
startup_logger = logging.getLogger("startup")

startup_logger.info(f"\n{'=' * 100}")
startup_logger.info(f"🔧 INICIALIZANDO BACKEND - CARGA DE CONFIGURACIÓN")
startup_logger.info(f"{'=' * 100}")

if os.path.exists(SECRET_PATH):
    startup_logger.info(f"🚀 Cargando configuración desde Docker secret: {SECRET_PATH}")
    load_dotenv(dotenv_path=SECRET_PATH)
    startup_logger.info(f"✅ Secret cargado correctamente")
else:
    startup_logger.info(f"👨‍💻 Cargando configuración desde archivo .env local")
    load_dotenv(override=True)  # FORZAR recarga para sobrescribir variables viejas
    startup_logger.info(f"✅ .env local cargado")

# Verificar variables críticas (de forma segura)
startup_logger.info(f"")
startup_logger.info(f"🔍 VERIFICACIÓN DE VARIABLES CRÍTICAS:")
client_id = os.getenv("GOOGLE_CLIENT_ID", "NOT SET")
startup_logger.info(
    f"   GOOGLE_CLIENT_ID: {client_id[:15]}...{client_id[-5:] if len(client_id) > 20 else ''}"
)
startup_logger.info(
    f"   GOOGLE_CLIENT_SECRET: {'✅ SET' if os.getenv('GOOGLE_CLIENT_SECRET') else '❌ NOT SET'}"
)
startup_logger.info(f"   POSTGRES_HOST: {os.getenv('POSTGRES_HOST', 'NOT SET')}")
startup_logger.info(f"   POSTGRES_DB: {os.getenv('POSTGRES_DB', 'NOT SET')}")
startup_logger.info(f"   MINIO_ENDPOINT: {os.getenv('MINIO_ENDPOINT', 'NOT SET')}")
startup_logger.info(f"   MINIO_ACCESS_KEY: {os.getenv('MINIO_ACCESS_KEY', 'NOT SET')}")
startup_logger.info(
    f"   MINIO_SECRET_KEY: {'✅ SET' if os.getenv('MINIO_SECRET_KEY') else '❌ NOT SET'}"
)
startup_logger.info(
    f"   SECRET_KEY: {'✅ SET' if os.getenv('SECRET_KEY') else '❌ NOT SET'}"
)
# Verificar OpenRouter Key
openrouter_key = os.getenv("OPENROUTER_API_KEY")
startup_logger.info(
    f"   OPENROUTER_API_KEY: {'✅ SET' if openrouter_key else '⚠️  NOT SET (Usando default hardcoded)'}"
)
startup_logger.info(f"   ENVIRONMENT: {os.getenv('ENVIRONMENT', 'NOT SET')}")
startup_logger.info(f"{'=' * 100}\n")
# ----------------------------------------------------

from app.core.config import settings as get_settings
from app.dependencies import get_auth_service
from app.routers.auth import router as auth_router
from app.routers.yfinance_router import router as yfinance_router
from app.routers.files import router as files_router
from app.routers.pagos_pendientes import router as pagos_pendientes_router
from app.routers.transacciones import router as transacciones_router
from app.routers.categories import router as categories_router
from app.routers.api_keys import router as api_keys_router
from app.routers.payment_methods import router as payment_methods_router
from app.routers.resumenes_bancarios import router as resumenes_bancarios_router
from app.routers.pagos import router as pagos_router
from app.routers.ai_usage import router as ai_usage_router
from app.routers.ai_config import router as ai_config_router
from app.routers.presupuestos import router as presupuestos_router
from app.routers.objetivos import router as objetivos_router
from app.routers.monedas_usuario import router as monedas_usuario_router
from app.routers.balance_inicial import router as balance_inicial_router
from app.middleware.rate_limiting import RateLimitingMiddleware
from app.middleware.security import (
    SecurityHeadersMiddleware,
    RequestValidationMiddleware,
    RequestLoggingMiddleware,
)


# Configurar logging mejorado para la aplicación
logging.basicConfig(
    level=getattr(logging, get_settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("app.log")
        if not get_settings.debug
        else logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)

# Obtener configuración
settings = get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestión del ciclo de vida de la aplicación"""
    # Startup
    logger.info("🚀 Iniciando Sistema de Gastos API con nueva arquitectura...")

    # Asegurar que existan directorios necesarios
    try:
        data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
        os.makedirs(data_dir, exist_ok=True)
        logger.info(f"✅ Directorio de datos verificado: {data_dir}")
    except Exception as e:
        logger.error(f"❌ Error creando directorio de datos: {e}")

    # Limpiar estados expirados de autenticación periódicamente
    auth_service = get_auth_service()
    await auth_service.cleanup_expired_states()

    yield

    # Shutdown
    logger.info("🛑 Cerrando Sistema de Gastos API...")

    # Cerrar recursos
    await auth_service.close()


# Crear aplicación FastAPI con configuración mejorada
app = FastAPI(
    title=settings.app_name,
    description="API para el sistema de gestión de gastos personales con arquitectura robusta y seguridad mejorada",
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
    # Swagger UI queda expuesto a propósito (ver /docs) para que un agente
    # externo pueda leer el esquema OpenAPI y conectarse — los endpoints en
    # sí siguen exigiendo Bearer (JWT o fk_live_...), esto solo expone la
    # forma de la API, no datos.
    swagger_ui_parameters={
        "persistAuthorization": True,
        "displayRequestDuration": True,
    },
)


# Manejador global de excepciones
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Manejador personalizado de excepciones HTTP"""
    logger.warning(
        f"HTTP {exc.status_code} en {request.method} {request.url.path}: {exc.detail}"
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "status_code": exc.status_code,
            "message": exc.detail,
            "path": str(request.url.path),
            "method": request.method,
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Manejador de excepciones generales"""
    logger.error(
        f"Error inesperado en {request.method} {request.url.path}: {str(exc)}",
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "status_code": 500,
            "message": "Error interno del servidor" if not settings.debug else str(exc),
            "path": str(request.url.path),
            "method": request.method,
        },
    )


# Agregar middleware de seguridad (en orden de prioridad)
# 0. Gzip Compression (Para reducir tamaño de respuestas)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 1. Request logging (primero para capturar todo)
app.add_middleware(RequestLoggingMiddleware)

# 2. Security headers
app.add_middleware(SecurityHeadersMiddleware)

# 3. Request validation (antes de rate limiting para bloquear ataques rápido)
app.add_middleware(RequestValidationMiddleware)

# 4. Rate limiting (desactivado en desarrollo)
if not settings.debug:
    app.add_middleware(
        RateLimitingMiddleware,
        requests_per_minute=settings.rate_limit_per_minute,
        requests_per_hour=settings.rate_limit_per_hour,
        burst_requests=settings.rate_limit_burst,
    )

# 5. CORS (después de rate limiting)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://finanzas.qeva.xyz",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-Process-Time"],
)

# 6. Session middleware (último para que funcione con CORS)
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.secret_key,
    max_age=3600,  # 1 hora de duración de sesión
    same_site="lax",
    https_only=not settings.debug,  # HTTPS en producción
)

# Incluir router de autenticación
app.include_router(auth_router, prefix="")

# Incluir router de Yahoo Finance (CEDEARs)
app.include_router(yfinance_router, prefix="/api")

# Incluir router de archivos (MinIO/S3)
app.include_router(files_router, prefix="/api/files", tags=["Files"])

# Incluir routers de PostgreSQL (nuevos)
app.include_router(
    pagos_pendientes_router,
    prefix="/api/v1/pagos-pendientes",
    tags=["Pagos Pendientes"],
)

app.include_router(
    transacciones_router, prefix="/api/v1/transacciones", tags=["Transacciones"]
)

app.include_router(categories_router, prefix="/api/v1/categories", tags=["Categorias"])

app.include_router(api_keys_router, prefix="/api/v1/api-keys", tags=["API Keys"])

app.include_router(
    payment_methods_router, prefix="/api/v1/payment-methods", tags=["Métodos de Pago"]
)

app.include_router(
    resumenes_bancarios_router,
    prefix="/api/v1/resumenes-bancarios",
    tags=["Resúmenes Bancarios"],
)

# Router for payment operations
app.include_router(pagos_router, tags=["Pagos"])

# Router for budgets
app.include_router(
    presupuestos_router, prefix="/api/v1/presupuestos", tags=["Presupuestos"]
)

# Router for savings goals (objetivos de ahorro)
app.include_router(
    objetivos_router, prefix="/api/v1/objetivos", tags=["Objetivos de Ahorro"]
)

# Router for AI Usage
app.include_router(ai_usage_router, prefix="/api/ai", tags=["AI Usage"])

# Router for AI Config (provider + keys por usuario)
app.include_router(ai_config_router, prefix="/api/v1/ai-config", tags=["AI Config"])

# Router for User Currencies (Monedas Personalizadas)
app.include_router(
    monedas_usuario_router, prefix="/api/v1/monedas-usuario", tags=["Monedas Usuario"]
)

# Router for Balance Inicial / Balance Neto
app.include_router(
    balance_inicial_router, prefix="/api/v1/balance-inicial", tags=["Balance Neto"]
)


@app.get("/")
async def root():
    """Endpoint raíz"""
    return {
        "message": f"{settings.app_name} API",
        "version": settings.app_version,
        "status": "running",
        "docs_url": "/docs" if settings.debug else "disabled",
        "architecture": "Clean Architecture with Design Patterns",
    }


@app.get("/health")
async def health_check():
    """Verificación de salud del servicio con métricas de seguridad"""
    import time
    import psutil

    return {
        "status": "healthy",
        "service": "sistema-gastos-api",
        "version": settings.app_version,
        "environment": settings.environment,
        "timestamp": time.time(),
        "security_features": {
            "rate_limiting": True,
            "request_validation": True,
            "security_headers": True,
            "jwt_authentication": True,
            "cors_enabled": True,
            "https_only": not settings.debug,
        },
        "system_info": {
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
        }
        if settings.debug
        else None,
    }


@app.get("/config")
async def get_config():
    """
    Endpoint de configuración runtime para el frontend
    Expone variables de configuración necesarias sin exponer secretos
    """
    backend_url = (
        settings.PRODUCTION_BACKEND_URL
        if settings.environment == "production"
        else settings.DEV_BACKEND_URL
    )

    return {
        "oauth": {
            "google_client_id": settings.GOOGLE_CLIENT_ID,
            "auth_url": f"{backend_url}/auth/google",
        },
        "api": {
            "base_url": backend_url,
            "version": settings.app_version,
            "environment": settings.environment,
        },
        "app": {"name": settings.app_name, "version": settings.app_version},
        "features": {
            "minio_enabled": bool(
                settings.MINIO_ENDPOINT and settings.MINIO_ACCESS_KEY
            ),
        },
    }


@app.get("/info")
async def app_info():
    """Información de la aplicación y patrones implementados"""
    return {
        "app_name": settings.app_name,
        "version": settings.app_version,
        "debug": settings.debug,
        "patterns_implemented": [
            "Repository Pattern - Abstracción del acceso a datos",
            "Service Layer Pattern - Separación de lógica de negocio",
            "DTO Pattern - Modelos Pydantic para transferencia de datos",
            "Factory Pattern - Configuración centralizada de settings",
            "Strategy Pattern - Múltiples proveedores OAuth2",
            "Dependency Injection - Inyección de dependencias para servicios",
        ],
        "features": [
            "OAuth2 Authentication (Google)",
            "Pagos Pendientes Management",
            "RESTful API",
            "Async/Await Support",
            "Comprehensive Error Handling",
            "Configuration Management",
            "Centralized Logging",
            "CORS Support",
            "Session Management",
        ],
        "database": {"type": "NocoDB", "base_url": settings.database_url},
        "auth_providers": ["google"],
    }


if __name__ == "__main__":
    import os

    port = int(os.getenv("PORT", 8000))

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
        access_log=True,
        use_colors=True,
        server_header=False,
        date_header=False,
    )
