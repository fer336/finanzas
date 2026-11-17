<div align="center">

# Sistema de Gastos Inteligente

Finanzas personales, un solo usuario, tema editorial "Papel"

</div>

---

## Arquitectura

![Arquitectura del sistema](./docs/architecture/diagrama-arquitectura.gif)

```
Internet (HTTPS)
      │
   Traefik  (reverse proxy + TLS)
      │
      ├── Frontend — React 18 + Vite (Nginx)
      │        │
      │        └── llama a ↓
      │
      └── Backend — FastAPI + Uvicorn
               │
               ├── PostgreSQL 16 (SQLAlchemy)
               └── MinIO / S3 (comprobantes)
```

---

## Capturas

| Inicio | Movimientos |
|---|---|
| ![Inicio](./docs/screenshots/inicio.png) | ![Movimientos](./docs/screenshots/movimientos.png) |

| Vencimientos | Préstamos |
|---|---|
| ![Vencimientos](./docs/screenshots/vencimientos.png) | ![Préstamos](./docs/screenshots/prestamos.png) |

| Objetivos | Inversiones |
|---|---|
| ![Objetivos](./docs/screenshots/objetivos.png) | ![Inversiones](./docs/screenshots/inversiones.png) |

| Categorías | Métodos de pago |
|---|---|
| ![Categorías](./docs/screenshots/categorias.png) | ![Métodos de pago](./docs/screenshots/metodospago.png) |

---

## Instalación local en un comando (demo)

Solo necesitás [Docker](https://docs.docker.com/get-docker/) con Docker Compose:

```bash
curl -fsSL https://raw.githubusercontent.com/fer336/finanzas/main/install.sh | bash
```

El instalador deja todo en `~/finanzas` (Postgres, almacenamiento de comprobantes, API, app web y un proxy) y lo sirve en **http://localhost:8080**. Al terminar muestra el usuario de demo:

| Usuario | Contraseña |
|---|---|
| `demo@example.com` | `demo1234` |

- Las contraseñas internas se generan al azar en `~/finanzas/.env`.
- Volver a correr el comando actualiza la instalación y conserva los datos.
- Variables opcionales: `FINANZAS_PORT=9090`, `FINANZAS_DIR=/otra/ruta`, `FINANZAS_VERSION=v1.0.40`, y `DEMO_EMAIL` / `DEMO_PASSWORD` (solo en la primera instalación). Por ejemplo: `curl -fsSL …/install.sh | FINANZAS_PORT=9090 bash`.
- Desde `~/finanzas`: `docker compose stop` la detiene, `docker compose up -d` la vuelve a iniciar y `docker compose down -v` borra todo, incluidos los datos.

El login con usuario y contraseña existe **solo** en instalaciones locales: lo activa `LOCAL_AUTH_ENABLED`, que pone el instalador. Producción no lo define y sigue entrando solo con Google.

## Instalación para desarrollo

### Requisitos

Node.js 18+, Python 3.11+, PostgreSQL 16, una cuenta MinIO (o S3-compatible), credenciales OAuth de Google.

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

### Verificación

Login con Google (el email debe estar en `AUTHORIZED_EMAILS` y existir en la tabla `usuarios` con `active = true`) y confirmar que el dashboard carga datos.

---

## Variables de entorno

**`backend/.env`** (lista completa en `app/core/config.py`):

```env
SECRET_KEY=...
ACCESS_TOKEN_EXPIRE_MINUTES=1440
POSTGRES_HOST=...
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=...
POSTGRES_DB=sistema_financiero
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
AUTHORIZED_EMAILS=tu-email@ejemplo.com
SESSION_SECRET_KEY=...
DEV_FRONTEND_URL=http://localhost:3000
DEV_BACKEND_URL=http://localhost:8000
```

**`frontend/.env`**:

```env
VITE_API_URL=http://localhost:8000
```

---

## Documentación relacionada

- [`DESIGN.md`](./DESIGN.md) — tokens de diseño del tema Papel
- [`API_AGENTS.md`](./API_AGENTS.md) — guía de la API para agentes externos

---

<div align="center">

**Fernando Ariel Cassera** (fer336) — [GitHub](https://github.com/fer336) · fcassera@protonmail.com

</div>
