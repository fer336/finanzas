<div align="center">

# Sistema de Gastos Inteligente

### App de finanzas personales, un solo usuario, tema editorial "Papel"

[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-GitHub_Actions-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docs.docker.com/)

</div>

---

## Qué es esto

Finanzas personales de un solo usuario (uso propio, no multi-tenant): movimientos, vencimientos, préstamos, objetivos de ahorro, inversiones (CEDEARs, cotización dólar, monedas), todo multi-moneda (ARS/USD/EUR). Corre en producción en `finanzas.qeva.xyz`, expone su API vía JWT o API key para que un agente externo la use directamente.

---

## Quick path

1. **Backend**: `cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt`, configurar `backend/.env` (ver tabla abajo), luego `uvicorn main:app --reload --port 8000`.
2. **Frontend**: `cd frontend && npm install && npm run dev` → `http://localhost:5173`.
3. **Verificación**: loguearse con Google (el email debe estar en `AUTHORIZED_EMAILS` y existir en `usuarios` con `active = true`) y confirmar que carga el dashboard.

---

## Details

### Features (nav superior)

| Sección | Qué incluye |
|---|---|
| Inicio | Dashboard: balance neto, KPIs de ingresos/gastos, donut de gastos por categoría, evolución mensual |
| Movimientos | Transacciones multi-moneda, categorías, comprobantes (MinIO), carga masiva por CSV |
| Vencimientos | Pestañas: Pagos pendientes y Préstamos (monto prestado/a devolver, fuente, vencimiento) |
| Objetivos | Metas de ahorro con progreso visual y aportes |
| Inversiones | Pestañas: CEDEARs (Yahoo Finance), Cotización Dólar (oficial/blue/MEP/CCL), Monedas |
| Ajustes | General (acceso API externo), Categorías, Métodos de pago |

### Auth (dos formas, mismo `CurrentUser`)

| Mecanismo | Para qué | Duración | Cómo se obtiene |
|---|---|---|---|
| JWT (Google OAuth) | La web app | 24h, sin refresh token | Login con Google en el frontend |
| API key (`fk_live_...`) | Agentes/scripts externos | Sin expiración, revocable | Ajustes → General → "Acceso API externo" |

```bash
# Generar una key (con un JWT vigente)
curl -X POST https://finanzas.qeva.xyz/api/v1/api-keys/ \
  -H "Authorization: Bearer <TU_JWT>" -H "Content-Type: application/json" \
  -d '{"nombre": "Agente externo"}'
# → { "key": "fk_live_...", ... }  se muestra una sola vez, guardala

# Usarla contra cualquier endpoint protegido
curl https://finanzas.qeva.xyz/api/v1/categories/ -H "Authorization: Bearer fk_live_..."
```

Las keys se guardan hasheadas (SHA-256) en `api_keys` — la key en texto plano nunca queda persistida.

### API para agentes externos

El schema OpenAPI completo está expuesto en producción a propósito, para que un agente lo lea y se conecte solo:

- **`https://finanzas.qeva.xyz/openapi.json`** — schema crudo, esto es lo que le das a un agente
- **`https://finanzas.qeva.xyz/docs`** — Swagger UI interactivo, para uso humano

Endpoints CRUD (todos bajo `/api/v1/...`, todos protegidos, todos con `GET /`, `GET /{id}`, `POST /`, `PATCH /{id}`, `DELETE /{id}`):

| Recurso | Prefijo |
|---|---|
| Transacciones | `/api/v1/transacciones` *(+ `/ingresos`, `/gastos`, `/estadisticas`, `/bulk-create`, `/bulk-delete`)* |
| Carga masiva desde el agente | `POST /api/v1/transacciones/bulk-create` con `{ "transactions": [...] }` (hasta 1000 filas; responde `created_count`/`failed_count`/`created_ids`/`errors`) |
| Categorías | `/api/v1/categories` |
| Métodos de pago | `/api/v1/payment-methods` |
| Pagos pendientes | `/api/v1/pagos-pendientes` |
| Préstamos | `/api/v1/prestamos` |
| Objetivos de ahorro | `/api/v1/objetivos` |
| Presupuestos | `/api/v1/presupuestos` |
| Monedas del usuario | `/api/v1/monedas-usuario` |
| Balance neto | `/api/v1/balance-inicial` *(`GET /neto` para el cálculo)* |
| API keys | `/api/v1/api-keys` |

Marcar un pago pendiente o un préstamo como pagado usa el endpoint genérico `POST /api/v1/pagos/registrar` (`item_type: 'pending_payment' | 'prestamo'`) — crea el gasto real en `transacciones` y actualiza el estado del origen.

### Arquitectura

```
INTERNET (HTTPS) → Traefik (proxy + SSL)
                       ├─ Frontend: React 18 + Vite, servido por Nginx
                       └─ Backend:  FastAPI + Uvicorn
                                       ├─ PostgreSQL (SQLAlchemy, UUID PK)
                                       └─ MinIO (S3, comprobantes/facturas)
```

Patrón backend: `router` (FastAPI, valida `CurrentUser`) → `repository` (SQLAlchemy `Session`, scoping por `usuario_id`) — sin capa de service para CRUDs simples (ver `app/routers/categories.py` como referencia).

### Tech stack

| Capa | Stack |
|---|---|
| Frontend | React 18.2 + Vite 5, Tailwind CSS 3.4, `@tanstack/react-query`, Recharts, `reicon-react` + `lucide-react` |
| Backend | FastAPI 0.104+, Uvicorn, SQLAlchemy 2.x, Alembic, Pydantic v2 |
| Base de datos | PostgreSQL 16, UUID como PK en todas las tablas |
| Archivos | MinIO (S3-compatible) para comprobantes/facturas |
| Auth | Google OAuth2 (JWT) + API keys propias |
| Infra | Docker + Traefik, deploy vía GitHub Actions → Docker Hub → Portainer webhook |

### Base de datos

Tablas en `backend/app/models/db_models.py`, UUID PK, todas con FK a `usuarios` salvo donde se indica:

| Tabla | Contenido |
|---|---|
| `usuarios` | Cuenta, email autorizado, preferencias |
| `transacciones` | Movimientos — monto, moneda, tipo, categoría, método de pago, `es_credito` |
| `categorias` | Nombre, tipo (ingreso/gasto), color, ícono |
| `metodos_pago` | Nombre, tipo, color, ícono, activo |
| `pagospendientes` | Vencimientos — estado, prioridad, recurrencia, adjuntos |
| `prestamos` | Préstamos recibidos — monto prestado, monto a devolver, vencimiento, fuente |
| `objetivos_ahorro` / `aportes_objetivo` | Metas de ahorro y sus aportes |
| `objetivos_financieros` | Objetivos financieros generales |
| `presupuestos` | Límites por categoría |
| `monedas_usuario` | Monedas habilitadas por el usuario |
| `tipos_cambio` | Cotizaciones históricas |
| `balance_inicial_mes` | Ancla del Balance Neto — saldo inicial por mes/moneda |
| `api_keys` | Tokens de acceso externo — `key_hash` (SHA-256), nunca la key en texto plano |

Migraciones en `backend/alembic/`, pero **no se corren automáticamente** — no hay `alembic upgrade` en CI/deploy, los cambios de esquema se aplican a mano contra la instancia real.

### Variables de entorno

**`backend/.env`** (ver `app/core/config.py` para la lista completa):

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

### Deploy a producción

`.github/workflows/deploy.yml` se dispara **solo con un Release publicado** (`release: types: [published]`) o manualmente (`workflow_dispatch`) — un `push` a `main` por sí solo **no** despliega nada.

```bash
git tag vX.Y.Z && git push origin vX.Y.Z
gh release create vX.Y.Z --generate-notes
```

1. Build de imágenes backend + frontend, push a Docker Hub (`ferc33/finanzas-backend`, `ferc33/finanzas-frontend`), tag `vX.Y.Z` + `latest`.
2. Llama al webhook de Portainer para redeploy del stack.

No corre migraciones de base de datos — los cambios de esquema se aplican manualmente antes de cortar el release que los usa.

---

## Checklist para levantar el entorno local

- [ ] Node.js 18+, Python 3.11+, PostgreSQL 16 y una cuenta MinIO (o S3-compatible) instalados
- [ ] Credenciales OAuth de Google creadas (`GOOGLE_CLIENT_ID`/`SECRET`)
- [ ] `backend/.env` y `frontend/.env` completos
- [ ] Tu email agregado a `AUTHORIZED_EMAILS` y con una fila en `usuarios` (`active = true`)
- [ ] Backend corriendo (`uvicorn main:app --reload`) y `python -c "from main import app"` sin errores
- [ ] Frontend corriendo (`npm run dev`) y `npm run build` sin errores
- [ ] Login con Google funciona y el dashboard carga datos

---

## Next step

- [`DESIGN.md`](./DESIGN.md) — tokens de diseño del tema Papel (fuente de verdad, no duplicar acá)
- [`PRODUCT.md`](./PRODUCT.md) — visión de producto y principios de diseño
- [`AGENTS.md`](./AGENTS.md) — guía para agentes IA trabajando en este repo
- [`design_handoff_rediseno_papel/`](./design_handoff_rediseno_papel/) — handoff original del rediseño

**Convenciones de código**: componentes funcionales + Tailwind utility-first en frontend (`Modern*View.jsx` por sección), `router → repository` sin service intermedio en backend, Conventional Commits sin atribución de IA, ninguna UI nueva reintroduce dark mode/glassmorphism.

---

<div align="center">

**Fernando Ariel Cassera** (fer336) — [GitHub](https://github.com/fer336) · [LinkedIn](https://www.linkedin.com/in/fcassera) · fcassera@protonmail.com

Uso personal. Para uso comercial, contactar al autor.

</div>
