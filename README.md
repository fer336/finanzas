<div align="center">

# 💰 Sistema de Gastos Inteligente

### Finanzas personales full-stack, con agente IA y tema editorial "Papel"

[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-GitHub_Actions-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docs.docker.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-AI-FF6B6B?style=for-the-badge&logo=openai&logoColor=white)](https://openrouter.ai/)

[Quick start](#-quick-start) • [Tema Papel](#-tema-visual-papel) • [Autenticación y acceso externo](#-autenticación-y-acceso-externo) • [Arquitectura](#️-arquitectura) • [Base de datos](#-base-de-datos) • [Deploy](#-deploy-a-producción)

</div>

---

## 📖 Qué es

**Sistema de Gastos Inteligente** es una app de finanzas personales de un solo usuario (uso propio, no multi-tenant público): movimientos, vencimientos, objetivos de ahorro, inversiones (CEDEARs, cotización dólar, monedas) y un agente IA conversacional, todo con soporte multi-moneda (ARS/USD/EUR).

La interfaz sigue el tema editorial **"Papel"** — libreta contable clara, sin glassmorphism ni dark mode — documentado en [`DESIGN.md`](./DESIGN.md) (tokens: color, tipografía, spacing, componentes) y [`PRODUCT.md`](./PRODUCT.md) (visión de producto y principios de diseño).

---

## 🚀 Quick start

1. **Backend**: `cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt`, configurar `.env` (ver [Variables de entorno](#variables-de-entorno)), luego `uvicorn main:app --reload --port 8000`.
2. **Frontend**: `cd frontend && npm install && npm run dev` → `http://localhost:5173`.
3. **Verificación**: abrir el frontend, loguearse con Google (email debe estar en `AUTHORIZED_EMAILS` y existir en la tabla `usuarios` con `active = true`), confirmar que carga el dashboard.

---

## ✨ Características principales

| Sección (nav superior) | Qué incluye |
|---|---|
| **Inicio** | Dashboard con balance en tiempo real, KPIs ingresos/gastos, widgets configurables |
| **Movimientos** | Transacciones multi-moneda, categorías, comprobantes (MinIO), filtros y búsqueda |
| **Vencimientos** | Pagos pendientes con estado/prioridad/recurrencia, adjuntar factura y comprobante de pago |
| **Objetivos** | Metas de ahorro con progreso visual y aportes |
| **Inversiones** | Tabs: CEDEARs (Yahoo Finance), Cotización Dólar (oficial/blue/MEP/CCL), Monedas |
| **Ajustes** | Tabs: General (widgets, modo de balance, proveedor IA, uso de Lucy, **acceso API externo**), Categorías, Métodos de pago |
| **Agente IA ("Lucy")** | Panel lateral conversacional con function calling sobre el sistema financiero |

Reportes de bugs vía Linear (que vivía en Ajustes) se dio de baja — ya no es parte del producto.

---

## 🎨 Tema visual "Papel"

Editorial, calmo, "libreta contable" — reemplaza por completo el tema oscuro/glassmorphism anterior. Fondo página `#f4f0e6`, cards `#faf7ef`, texto principal `#20242c`, todos los valores numéricos en IBM Plex Mono, títulos en Fraunces, sin sombras decorativas.

No se documenta la paleta acá para evitar que quede desincronizada — la fuente de verdad es **[`DESIGN.md`](./DESIGN.md)** (tokens completos) y **[`PRODUCT.md`](./PRODUCT.md)** (por qué se eligió este approach). Iconografía: [`reicon-react`](https://github.com/dqev/reicon) para el picker de categorías, `lucide-react` para el resto de la UI.

---

## 🔐 Autenticación y acceso externo

Hay dos formas de autenticarse contra la API — ambas resuelven al mismo `CurrentUser` en el backend (`app/core/dependencies.py`), así que cualquier endpoint funciona igual con cualquiera de las dos:

| Mecanismo | Para qué | Duración | Cómo se obtiene |
|---|---|---|---|
| **JWT (Google OAuth)** | La web app | 24h (`ACCESS_TOKEN_EXPIRE_MINUTES`), sin refresh token | Login con Google en el frontend (`/auth/google`) |
| **API key** (`fk_live_...`) | Agentes/scripts externos | Sin expiración, revocable individualmente | Ajustes → General → "Acceso API externo" → Generar token |

Las API keys se guardan **hasheadas** (SHA-256) en la tabla `api_keys` — la key en texto plano se muestra una única vez al crearla y no queda persistida en ningún lado.

**Generar una key** (Ajustes → General, o por curl con un JWT vigente):

```bash
curl -X POST https://finanzas.qeva.xyz/api/v1/api-keys/ \
  -H "Authorization: Bearer <TU_JWT>" -H "Content-Type: application/json" \
  -d '{"nombre": "Agente externo"}'
# → { "key": "fk_live_...", ... }  (se muestra una sola vez, guardala)
```

**Usarla** contra cualquier endpoint protegido:

```bash
curl https://finanzas.qeva.xyz/api/v1/categories/ -H "Authorization: Bearer fk_live_..."
```

**Revocar**: mismo panel de Ajustes, botón "Revocar" junto a la key — o `DELETE /api/v1/api-keys/{id}` con el JWT del dueño.

### Endpoints CRUD disponibles

Todos bajo `/api/v1/...`, todos protegidos, todos con `GET /`, `GET /{id}`, `POST /`, `PATCH /{id}`, `DELETE /{id}`:

| Recurso | Prefijo |
|---|---|
| Transacciones (gastos/ingresos) | `/api/v1/transacciones` *(también expone `/ingresos`, `/gastos`, `/estadisticas`, bulk ops y deuda de tarjetas)* |
| Categorías | `/api/v1/categories` |
| Métodos de pago | `/api/v1/payment-methods` |
| Pagos pendientes | `/api/v1/pagos-pendientes` |
| API keys | `/api/v1/api-keys` |

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET (HTTPS)                        │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  TRAEFIK (Reverse Proxy + SSL)                  │
└────────┬─────────────────────────┬──────────────────────────────┘
         ▼                         ▼
┌─────────────────┐      ┌──────────────────────┐
│   FRONTEND      │      │      BACKEND         │
│ React 18 + Vite │◄────►│  FastAPI + Uvicorn    │
│ Nginx (build)   │      │  Router → Repository  │
└─────────────────┘      └──────┬───────────────┘
                                ▼          ▼          ▼
                        ┌────────────┐ ┌──────────┐ ┌───────────┐
                        │ PostgreSQL │ │  MinIO   │ │ OpenRouter│
                        │ (SQLAlchemy)│ │  (S3)   │ │   (LLMs)  │
                        └────────────┘ └──────────┘ └───────────┘
```

Patrón backend: `router` (FastAPI, valida `CurrentUser`) → `repository` (SQLAlchemy `Session`, scoping por `usuario_id`) — sin capa de service intermedia para los CRUDs simples (ver `app/routers/categories.py` como referencia del patrón).

### Tech stack

| Capa | Stack |
|---|---|
| Frontend | React 18.2 + Vite, Tailwind CSS 3.4, `@tanstack/react-query`, `reicon-react` + `lucide-react`, Recharts |
| Backend | FastAPI + Uvicorn, SQLAlchemy 2.x (ORM), Alembic (migraciones), Pydantic v2 |
| Base de datos | PostgreSQL 16, UUID como PK en todas las tablas |
| Archivos | MinIO (S3-compatible) para comprobantes/facturas |
| IA | OpenRouter (Claude/GPT/Gemini intercambiables) |
| Auth | Google OAuth2 (JWT) + API keys propias (`fk_live_...`) |
| Infra | Docker + Traefik, deploy vía GitHub Actions → Docker Hub → Portainer webhook |

---

## 💾 Base de datos

Tablas reales (`backend/app/models/db_models.py`), UUID PK en todas, todas con FK a `usuarios` salvo donde se indica:

| Tabla | Contenido |
|---|---|
| `usuarios` | Cuenta, email autorizado, preferencias (moneda, timezone, tema) |
| `transacciones` | Movimientos — monto, moneda, tipo, categoría, método de pago, `es_credito` |
| `categorias` | Nombre, tipo (ingreso/gasto), color, ícono |
| `metodos_pago` | Nombre, tipo, color, ícono, activo |
| `pagospendientes` | Vencimientos — estado, prioridad, recurrencia, adjuntos (factura/comprobante) |
| `objetivos_ahorro` / `aportes_objetivo` | Metas de ahorro y sus aportes |
| `objetivos_financieros` | Objetivos financieros generales |
| `presupuestos` | Límites por categoría |
| `resumen_bancario` / `pagos_resumen_bancario` | Resúmenes de tarjeta y sus pagos |
| `monedas_usuario` | Monedas habilitadas por el usuario |
| `tipos_cambio` | Cotizaciones históricas |
| `ai_configuraciones` | Config del proveedor/modelo IA por usuario |
| `api_keys` | Tokens de acceso externo — `key_hash` (SHA-256), nunca la key en texto plano |

Migraciones en `backend/alembic/`, pero **no se corren automáticamente** (no hay paso de `alembic upgrade` en CI/deploy) — cambios de esquema se aplican a mano contra la instancia real.

---

## ⚙️ Instalación

### Prerrequisitos

Node.js 18+, Python 3.11+, PostgreSQL 16, cuenta de MinIO (o compatible S3), credenciales OAuth de Google.

### Variables de entorno

**Backend** (`backend/.env`) — ver `app/core/config.py` para la lista completa; las claves principales:

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

**Frontend** (`frontend/.env`):

```env
VITE_API_URL=http://localhost:8000
```

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

---

## 🚀 Deploy a producción

`.github/workflows/deploy.yml` — se dispara con `push` a `main` o manualmente (`workflow_dispatch`):

1. Build de imágenes backend + frontend, push a Docker Hub (`ferc33/finanzas-backend`, `ferc33/finanzas-frontend`), tag `vYYYYMMDD-<sha>` + `latest`.
2. Llama al webhook de Portainer para redeploy del stack.

No corre migraciones de base de datos — cambios de esquema (como la tabla `api_keys`) se aplican manualmente antes de mergear el código que los usa.

---

## 🗺️ Roadmap

- [x] Dashboard, transacciones multi-moneda, objetivos, vencimientos, deuda de tarjetas
- [x] Agente IA con function calling
- [x] Autenticación con Google OAuth
- [x] Migraciones con Alembic
- [x] Tema "Papel" (rediseño completo, reemplaza el tema oscuro)
- [x] API keys de larga duración para acceso externo
- [ ] Notificaciones push de vencimientos
- [ ] Exportación de reportes en PDF
- [ ] Modo offline con sync

---

## 🤝 Convenciones de código

- **Frontend**: componentes funcionales, Tailwind utility-first, patrón `Modern*View.jsx` para vistas de sección
- **Backend**: `router` → `repository` (SQLAlchemy `Session`), sin capa de service para CRUDs simples
- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, etc.), sin atribución de IA
- **Diseño**: cualquier UI nueva sigue [`DESIGN.md`](./DESIGN.md) — no reintroducir dark mode/glassmorphism

---

## 📚 Documentación relacionada

- [`DESIGN.md`](./DESIGN.md) — tokens de diseño del tema Papel
- [`PRODUCT.md`](./PRODUCT.md) — visión de producto y principios
- [`AGENTS.md`](./AGENTS.md) — guía para agentes IA trabajando en este repo
- [`design_handoff_rediseno_papel/`](./design_handoff_rediseno_papel/) — handoff original del rediseño

---

## 👨‍💻 Autor

**Fernando Ariel Cassera** (fer336) — [GitHub](https://github.com/fer336) · [LinkedIn](https://www.linkedin.com/in/fcassera) · fcassera@protonmail.com

Uso personal. Para uso comercial, contactar al autor.
