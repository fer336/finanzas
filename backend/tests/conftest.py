"""
Pytest configuration and fixtures for Sistema de Gastos tests
"""
import pytest
import os
import tempfile
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from unittest.mock import Mock, MagicMock
import uuid
from datetime import datetime, date, timedelta

# Set test environment variables before importing app
os.environ["ENVIRONMENT"] = "test"
os.environ["SECRET_KEY"] = "test-secret-key-for-testing-only-min-32-chars-long"
os.environ["POSTGRES_HOST"] = "localhost"
os.environ["POSTGRES_PORT"] = "5432"
os.environ["POSTGRES_USER"] = "test_user"
os.environ["POSTGRES_PASSWORD"] = "test_password"
os.environ["POSTGRES_DB"] = "test_db"
os.environ["GOOGLE_CLIENT_ID"] = "test-client-id"
os.environ["GOOGLE_CLIENT_SECRET"] = "test-client-secret"
os.environ["MINIO_ENDPOINT"] = "localhost:9000"
os.environ["MINIO_ACCESS_KEY"] = "test-access"
os.environ["MINIO_SECRET_KEY"] = "test-secret"
os.environ["OPENROUTER_API_KEY"] = "test-openrouter-key"
os.environ["AUTHORIZED_EMAILS"] = "test@example.com,admin@example.com"

from app.database import Base, get_db
from app.models.db_models import (
    Usuario, Categoria, MetodoPago, Transaccion,
    PagoPendiente, ResumenBancario, ObjetivoAhorro
)
from main import app


# ============================================================================
# DATABASE FIXTURES
# ============================================================================

@pytest.fixture(scope="function")
def test_db_engine():
    """Create a test database engine using SQLite in-memory"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture(scope="function")
def test_db(test_db_engine) -> Generator[Session, None, None]:
    """Create a test database session"""
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_db_engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def client(test_db):
    """Create a test client with overridden database dependency"""
    def override_get_db():
        try:
            yield test_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# ============================================================================
# DATA FIXTURES
# ============================================================================

@pytest.fixture
def test_user(test_db) -> Usuario:
    """Create a test user"""
    user = Usuario(
        id=uuid.uuid4(),
        email="test@example.com",
        full_name="Test User",
        active=True,
        moneda_preferida="ARS",
        timezone="America/Argentina/Buenos_Aires"
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


@pytest.fixture
def test_admin_user(test_db) -> Usuario:
    """Create a test admin user"""
    user = Usuario(
        id=uuid.uuid4(),
        email="admin@example.com",
        full_name="Admin User",
        active=True,
        moneda_preferida="ARS",
        timezone="America/Argentina/Buenos_Aires"
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


@pytest.fixture
def test_categoria(test_db) -> Categoria:
    """Create a test category"""
    categoria = Categoria(
        id=uuid.uuid4(),
        nombre="Alimentación",
        tipo="gasto",
        color="#FF5722",
        icono="🍔",
        activa=True,
        descripcion="Gastos de comida y supermercado"
    )
    test_db.add(categoria)
    test_db.commit()
    test_db.refresh(categoria)
    return categoria


@pytest.fixture
def test_metodo_pago(test_db) -> MetodoPago:
    """Create a test payment method"""
    metodo = MetodoPago(
        id=uuid.uuid4(),
        nombre="Débito",
        tipo="tarjeta_debito",
        activo=True,
        color="#4CAF50",
        icono="💳"
    )
    test_db.add(metodo)
    test_db.commit()
    test_db.refresh(metodo)
    return metodo


@pytest.fixture
def test_transaccion(test_db, test_user, test_categoria, test_metodo_pago) -> Transaccion:
    """Create a test transaction"""
    transaccion = Transaccion(
        id=uuid.uuid4(),
        monto=-5000.0,
        moneda="ARS",
        monto_ars=-5000.0,
        tasa_cambio=1.0,
        descripcion="Test transaction",
        fecha_transaccion=date.today(),
        tipo="gasto",
        notas="Test notes",
        usuario_id=test_user.id,
        categoria_id=test_categoria.id,
        metodo_pago_id=test_metodo_pago.id,
        es_credito=False
    )
    test_db.add(transaccion)
    test_db.commit()
    test_db.refresh(transaccion)
    return transaccion


@pytest.fixture
def test_pago_pendiente(test_db, test_user, test_categoria) -> PagoPendiente:
    """Create a test pending payment"""
    pago = PagoPendiente(
        id=uuid.uuid4(),
        nombre="Test Payment",
        descripcion="Test payment description",
        monto=3000.0,
        moneda="ARS",
        fechavencimiento=date.today() + timedelta(days=7),
        fechacreacion=datetime.utcnow(),
        prioridad="alta",
        tipo="servicio",
        estado="pendiente",
        usuario_id=test_user.id,
        categorias_id=test_categoria.id
    )
    test_db.add(pago)
    test_db.commit()
    test_db.refresh(pago)
    return pago


@pytest.fixture
def test_objetivo_ahorro(test_db, test_user, test_categoria) -> ObjetivoAhorro:
    """Create a test savings goal"""
    objetivo = ObjetivoAhorro(
        id=uuid.uuid4(),
        nombre="Viaje a Europa",
        descripcion="Ahorrar para vacaciones",
        monto_objetivo=500000.0,
        moneda="ARS",
        monto_actual=0.0,
        porcentaje_completado=0.0,
        fecha_inicio=date.today(),
        fecha_objetivo=date.today() + timedelta(days=365),
        estado="en_progreso",
        prioridad="alta",
        tipo="viaje",
        usuario_id=test_user.id,
        categoria_id=test_categoria.id
    )
    test_db.add(objetivo)
    test_db.commit()
    test_db.refresh(objetivo)
    return objetivo


# ============================================================================
# AUTHENTICATION FIXTURES
# ============================================================================

@pytest.fixture
def valid_token(test_user) -> str:
    """Generate a valid JWT token for testing"""
    from app.core.security import create_access_token
    from datetime import timedelta

    token_data = {
        "sub": test_user.email,
        "user_id": str(test_user.id),
        "email": test_user.email
    }
    return create_access_token(token_data, expires_delta=timedelta(hours=1))


@pytest.fixture
def expired_token(test_user) -> str:
    """Generate an expired JWT token for testing"""
    from app.core.security import create_access_token
    from datetime import timedelta

    token_data = {
        "sub": test_user.email,
        "user_id": str(test_user.id),
        "email": test_user.email
    }
    return create_access_token(token_data, expires_delta=timedelta(seconds=-1))


@pytest.fixture
def auth_headers(valid_token) -> dict:
    """Generate authorization headers with valid token"""
    return {"Authorization": f"Bearer {valid_token}"}


# ============================================================================
# MOCK FIXTURES
# ============================================================================

@pytest.fixture
def mock_minio_service():
    """Mock MinIO service"""
    mock = MagicMock()
    mock.upload_file.return_value = {
        "file_name": "test-file.pdf",
        "file_url": "https://minio.example.com/facturas/test-file.pdf",
        "bucket": "facturas",
        "size": 1024
    }
    mock.delete_file.return_value = {"message": "File deleted"}
    mock.file_exists.return_value = True
    return mock


@pytest.fixture
def mock_openrouter_client():
    """Mock OpenRouter API client"""
    mock = MagicMock()
    mock.post.return_value.status_code = 200
    mock.post.return_value.json.return_value = {
        "choices": [{
            "message": {
                "content": "Mock AI response"
            }
        }],
        "usage": {
            "prompt_tokens": 100,
            "completion_tokens": 50,
            "total_tokens": 150
        }
    }
    return mock


# ============================================================================
# PERFORMANCE FIXTURES
# ============================================================================

@pytest.fixture
def performance_timer():
    """Timer for performance testing"""
    import time

    class Timer:
        def __init__(self):
            self.start_time = None
            self.end_time = None

        def start(self):
            self.start_time = time.perf_counter()

        def stop(self):
            self.end_time = time.perf_counter()

        def elapsed(self):
            if self.start_time and self.end_time:
                return self.end_time - self.start_time
            return None

        def __enter__(self):
            self.start()
            return self

        def __exit__(self, *args):
            self.stop()

    return Timer()


@pytest.fixture
def bulk_transacciones(test_db, test_user, test_categoria, test_metodo_pago):
    """Create bulk transactions for performance testing"""
    transacciones = []
    for i in range(100):
        t = Transaccion(
            id=uuid.uuid4(),
            monto=-float(1000 + i * 10),
            moneda="ARS",
            monto_ars=-float(1000 + i * 10),
            tasa_cambio=1.0,
            descripcion=f"Bulk transaction {i}",
            fecha_transaccion=date.today() - timedelta(days=i),
            tipo="gasto",
            usuario_id=test_user.id,
            categoria_id=test_categoria.id,
            metodo_pago_id=test_metodo_pago.id,
            es_credito=False
        )
        transacciones.append(t)

    test_db.bulk_save_objects(transacciones)
    test_db.commit()
    return transacciones


# ============================================================================
# SQL INJECTION TEST DATA
# ============================================================================

@pytest.fixture
def sql_injection_payloads():
    """Common SQL injection payloads for security testing"""
    return [
        "' OR '1'='1",
        "'; DROP TABLE usuarios; --",
        "' UNION SELECT * FROM usuarios --",
        "admin'--",
        "' OR 1=1--",
        "1' AND '1'='1",
        "'; DELETE FROM transacciones WHERE '1'='1",
        "' OR EXISTS(SELECT * FROM usuarios) --",
        "%'; DROP TABLE categorias; --",
        "1; UPDATE usuarios SET email='hacked@example.com' WHERE 1=1; --"
    ]


@pytest.fixture
def xss_payloads():
    """Common XSS payloads for security testing"""
    return [
        "<script>alert('XSS')</script>",
        "<img src=x onerror=alert('XSS')>",
        "<svg/onload=alert('XSS')>",
        "javascript:alert('XSS')",
        "<iframe src='javascript:alert(\"XSS\")'></iframe>",
        "<body onload=alert('XSS')>",
        "<<SCRIPT>alert('XSS');//<</SCRIPT>",
        "<INPUT TYPE=\"IMAGE\" SRC=\"javascript:alert('XSS');\">",
    ]


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

@pytest.fixture
def assert_response_time():
    """Helper to assert response time is within acceptable limits"""
    def _assert(elapsed_time: float, max_seconds: float = 1.0):
        assert elapsed_time < max_seconds, \
            f"Response time {elapsed_time:.3f}s exceeded limit of {max_seconds}s"
    return _assert
