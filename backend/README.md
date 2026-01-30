# Sistema de Gastos - Backend

Backend del sistema de gestión de gastos personales implementado con **FastAPI** y **patrones de diseño** para una arquitectura limpia y mantenible.

## 🏗️ Arquitectura

El proyecto implementa los siguientes patrones de diseño:

### 1. **Repository Pattern**
- **Ubicación**: `app/repositories/`
- **Propósito**: Abstrae el acceso a datos de NocoDB
- **Implementación**: 
  - `BaseRepository`: Clase base abstracta
  - `PagoPendienteRepository`: Repository específico para pagos pendientes

### 2. **Service Layer Pattern**
- **Ubicación**: `app/services/`
- **Propósito**: Contiene la lógica de negocio
- **Implementación**:
  - `BaseService`: Service base
  - `PagoPendienteService`: Lógica de negocio para pagos pendientes

### 3. **DTO Pattern**
- **Ubicación**: `app/models/dto/`
- **Propósito**: Modelos Pydantic para transferencia de datos
- **Implementación**:
  - `BaseDTO`: DTO base con configuraciones comunes
  - `PagoPendienteCreateDTO`, `PagoPendienteUpdateDTO`, `PagoPendienteResponseDTO`

### 4. **Factory Pattern**
- **Ubicación**: `app/config/`
- **Propósito**: Configuración centralizada
- **Implementación**:
  - `Settings`: Configuración principal
  - `DatabaseSettings`: Configuración de base de datos
  - `AuthSettings`: Configuración de autenticación

### 5. **Strategy Pattern**
- **Ubicación**: `app/auth/strategies/`
- **Propósito**: Múltiples proveedores de autenticación OAuth2
- **Implementación**:
  - `AuthStrategy`: Estrategia base
  - `GoogleAuthStrategy`: Implementación para Google OAuth2

### 6. **Dependency Injection**
- **Ubicación**: `app/dependencies.py`
- **Propósito**: Inyección de dependencias para servicios
- **Implementación**: Funciones de dependencia para FastAPI

## 📁 Estructura del Proyecto

```
backend/
├── app/
│   ├── __init__.py
│   ├── api/
│   │   └── v1/
│   │       ├── __init__.py
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           ├── auth.py
│   │           └── pagos_pendientes.py
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   └── strategies/
│   │       ├── __init__.py
│   │       ├── base.py
│   │       └── google_strategy.py
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── dto/
│   │       ├── __init__.py
│   │       ├── base.py
│   │       └── pago_pendiente.py
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   └── pago_pendiente_repository.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   └── pago_pendiente_service.py
│   └── dependencies.py
├── main.py
├── requirements.txt
└── README.md
```

## 🚀 Instalación y Configuración

### 1. Instalar Dependencias

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # En Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configuración

Crear archivo `.env` en la raíz del backend con las siguientes variables:

```env
# Database Configuration
DATABASE_URL=https://db.qeva.xyz/api/v2
NOCODB_TOKEN=your-nocodb-token

# Table IDs
TABLE_PAGOS_PENDIENTES=mwvd0vbbxupxwj9
TABLE_TRANSACCIONES=your-table-id
TABLE_CATEGORIAS=your-table-id
TABLE_METODOS_PAGO=your-table-id

# Authentication
SECRET_KEY=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Application Settings
DEBUG=True
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 3. Ejecutar la Aplicación

```bash
# Desarrollo
python main.py

# O usando uvicorn directamente
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 📚 API Documentation

Una vez ejecutando la aplicación, la documentación estará disponible en:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔐 Autenticación

El sistema implementa OAuth2 con Google usando el Strategy Pattern:

### Endpoints de Autenticación:

- `GET /api/v1/auth/providers` - Obtener proveedores disponibles
- `GET /api/v1/auth/google` - Iniciar autenticación con Google
- `GET /api/v1/auth/google/callback` - Callback de Google OAuth2
- `GET /api/v1/auth/me` - Información del usuario actual
- `POST /api/v1/auth/logout` - Cerrar sesión

## 📊 Endpoints de Pagos Pendientes

- `GET /api/v1/pagos-pendientes/` - Listar pagos con filtros
- `GET /api/v1/pagos-pendientes/{id}` - Obtener pago por ID
- `POST /api/v1/pagos-pendientes/` - Crear nuevo pago
- `PATCH /api/v1/pagos-pendientes/{id}` - Actualizar pago
- `DELETE /api/v1/pagos-pendientes/{id}` - Eliminar pago
- `POST /api/v1/pagos-pendientes/{id}/mark-paid` - Marcar como pagado
- `GET /api/v1/pagos-pendientes/vencidos/` - Obtener pagos vencidos
- `GET /api/v1/pagos-pendientes/proximos-vencer/` - Pagos próximos a vencer
- `GET /api/v1/pagos-pendientes/estadisticas/` - Estadísticas de pagos

## 🔧 Características Técnicas

- **Async/Await**: Toda la aplicación es asíncrona
- **Validación**: Pydantic para validación de datos
- **Error Handling**: Manejo centralizado de errores
- **Logging**: Sistema de logging configurado
- **CORS**: Configurado para desarrollo y producción
- **Type Hints**: Tipado completo en Python
- **Clean Architecture**: Separación clara de responsabilidades

## 🧪 Patrones de Diseño Implementados

### Repository Pattern
```python
# Abstrae el acceso a datos
repository = PagoPendienteRepository()
pagos = await repository.get_all()
```

### Service Layer
```python
# Contiene lógica de negocio
service = PagoPendienteService(repository)
pago = await service.create_pago(pago_data)
```

### Dependency Injection
```python
# FastAPI maneja la inyección automáticamente
@app.post("/pagos-pendientes/")
async def create_pago(
    pago_data: PagoPendienteCreateDTO,
    service: PagoPendienteServiceDep
):
    return await service.create_pago(pago_data)
```

### Strategy Pattern
```python
# Múltiples proveedores de autenticación
auth_service = AuthService()
strategy = auth_service.get_strategy("google")
user_info = await strategy.get_user_info(token)
```

## 🛠️ Desarrollo

### Agregar Nuevo Endpoint

1. Crear DTO en `app/models/dto/`
2. Implementar Repository en `app/repositories/`
3. Crear Service en `app/services/`
4. Agregar endpoint en `app/api/v1/endpoints/`
5. Registrar en el router principal

### Agregar Nuevo Proveedor OAuth

1. Implementar `AuthStrategy` en `app/auth/strategies/`
2. Registrar en `AuthService`
3. Configurar en `settings.py`

## 📝 Notas de Implementación

- Todas las operaciones son asíncronas
- Los DTOs manejan alias para compatibilidad con NocoDB
- La configuración es centralizada y extensible
- Los errores se manejan de forma consistente
- El código está tipado completamente