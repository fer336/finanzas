<div align="center">

# 💰 Sistema de Gastos Inteligente

### Plataforma Full-Stack de Gestión Financiera Personal con IA

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Swarm-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docs.docker.com/engine/swarm/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-AI-FF6B6B?style=for-the-badge&logo=openai&logoColor=white)](https://openrouter.ai/)

[Características](#-características-principales) • [Tecnologías](#-tech-stack) • [Instalación](#-instalación) • [Agentes IA](#-sistema-de-agentes-y-skills) • [Base de Datos](#-base-de-datos)

</div>

---

## 📖 Descripción

**Sistema de Gastos Inteligente** es una plataforma moderna de gestión financiera personal que combina una arquitectura full-stack robusta con inteligencia artificial. Diseñado para personas que buscan tener control total sobre sus finanzas con visualizaciones interactivas, análisis predictivo y un agente IA que responde preguntas en lenguaje natural.

### 🎯 Problema que Resuelve

- ❌ Apps financieras genéricas sin personalización
- ❌ Falta de visibilidad sobre gastos recurrentes y tarjetas de crédito
- ❌ Sin análisis predictivo ni recomendaciones
- ❌ Interfaces complejas y poco intuitivas
- ❌ Sin soporte para múltiples monedas (ARS, USD, EUR)

### ✅ Nuestra Solución

- ✅ **Dashboard personalizable** con widgets interactivos
- ✅ **Gestión de deudas** de tarjetas de crédito con tracking en tiempo real
- ✅ **Agente IA financiero** con function calling y análisis conversacional
- ✅ **Objetivos de ahorro** con progreso visual y aportes automáticos
- ✅ **Multi-moneda** con cotizaciones en vivo (dólar oficial, blue, MEP, CCL)
- ✅ **Arquitectura escalable** con Docker Swarm y reverse proxy

---

## ✨ Características Principales

### 💼 Gestión Financiera

<table>
  <tr>
    <td width="50%">
      
#### 📊 Dashboard Inteligente
- Balance en tiempo real (ARS/USD)
- Gráficos interactivos con Recharts
- Widgets arrastrables y personalizables
- Indicadores KPI de ingresos vs gastos
- Resumen de tarjetas de crédito
      
    </td>
    <td width="50%">
      
#### 💳 Transacciones Multi-Moneda
- Soporte para ARS, USD, EUR
- Categorías personalizables
- Etiquetas y notas enriquecidas
- Adjuntar comprobantes (PDF/Imágenes)
- Filtros avanzados y búsqueda
      
    </td>
  </tr>
  <tr>
    <td width="50%">
      
#### 🎯 Objetivos de Ahorro
- Metas con fechas límite
- Tracking de progreso visual
- Aportes automáticos desde transacciones
- Gráficos de evolución temporal
      
    </td>
    <td width="50%">
      
#### 💰 Gestión de Deudas
- Control de gastos con tarjeta de crédito
- Resúmenes mensuales automatizados
- Modal de pago con actualización de balance
- Alertas de vencimientos próximos
      
    </td>
  </tr>
</table>

### 🤖 Inteligencia Artificial

- **Agente Conversacional**: Consultas en lenguaje natural sobre finanzas
- **Function Calling**: Ejecuta acciones (crear transacciones, consultar balances)
- **Análisis Predictivo**: Proyecciones de gastos futuros
- **Recomendaciones**: Sugerencias basadas en patrones de gasto
- **Historial de Conversaciones**: Context-aware responses

### 📈 Análisis y Reportes

- **Gráficos Interactivos**: LineChart, BarChart, PieChart (Recharts)
- **CEDEARs y Bolsa**: Integración con Yahoo Finance API
- **Cotizaciones en Vivo**: Dólar oficial, blue, MEP, CCL, cripto
- **Exportación de Datos**: CSV, Excel, PDF
- **Presupuestos**: Tracking de límites por categoría

---

## 🛠️ Tech Stack

### Frontend

```
React 19 + Vite              │ Framework principal
├─ Tailwind CSS 3.4          │ Styling utility-first
├─ shadcn/ui                 │ Sistema de componentes
├─ Recharts                  │ Gráficos interactivos
├─ Lucide React              │ Iconos modernos
├─ React Router DOM          │ Navegación SPA
└─ Context API               │ Gestión de estado global
```

### Backend

```
FastAPI + Uvicorn            │ Web framework async
├─ SQLAlchemy ORM            │ ORM para PostgreSQL
├─ Pydantic v2               │ Validación de datos
├─ Alembic                   │ Migraciones (planeado)
├─ Python-dotenv             │ Variables de entorno
├─ HTTPX                     │ Cliente HTTP async
└─ CORS Middleware           │ Seguridad API
```

### Base de Datos

```
PostgreSQL 16                │ Base de datos relacional
├─ UUID Primary Keys         │ IDs únicos globales
├─ Timestamps automáticos    │ created_at, updated_at
├─ Relaciones complejas      │ Foreign Keys + Índices
└─ JSON Fields               │ Datos semi-estructurados
```

### Infraestructura

```
Docker Swarm                 │ Orquestación de contenedores
├─ Traefik                   │ Reverse proxy + SSL (Let's Encrypt)
├─ MinIO                     │ Almacenamiento de archivos S3-compatible
├─ n8n (planeado)            │ Automatización de workflows
└─ DuckDNS                   │ DNS dinámico gratuito
```

### Servicios Externos

```
OpenRouter API               │ LLMs (Claude, GPT, Gemini)
├─ Yahoo Finance API         │ Cotizaciones de CEDEARs
├─ Dólar API Argentina       │ Tipos de cambio en tiempo real
└─ Google OAuth              │ Autenticación (planeado)
```

---

## 🏗️ Arquitectura del Sistema

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                │
│                    (HTTPS Port 443)                             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  TRAEFIK (Reverse Proxy)                        │
│  • SSL/TLS Termination (Let's Encrypt)                         │
│  • Load Balancing                                               │
│  • Health Checks                                                │
└────────┬─────────────────────────┬──────────────────────────────┘
         │                         │
         ▼                         ▼
┌─────────────────┐      ┌──────────────────────┐
│   FRONTEND      │      │      BACKEND         │
│   (React 19)    │◄────►│    (FastAPI)         │
│                 │      │                      │
│ • Vite Build    │      │ • Uvicorn Server     │
│ • Nginx Server  │      │ • Repository Pattern │
│ • Port 80       │      │ • Port 8000          │
└─────────────────┘      └──────┬───────────────┘
                                │
                     ┌──────────┼──────────┐
                     ▼          ▼          ▼
            ┌────────────┐ ┌──────────┐ ┌──────────┐
            │ PostgreSQL │ │  MinIO   │ │ OpenRouter│
            │    (DB)    │ │  (S3)    │ │   (AI)   │
            └────────────┘ └──────────┘ └──────────┘
```

### Flujo de Datos

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend (React)
    participant B as Backend (FastAPI)
    participant DB as PostgreSQL
    participant AI as OpenRouter API
    
    U->>F: Interacción (click, form)
    F->>B: API Request (REST)
    B->>DB: Query (SQLAlchemy)
    DB-->>B: Data Response
    B-->>F: JSON Response
    F-->>U: UI Update (React State)
    
    Note over U,AI: Flujo con Agente IA
    U->>F: Pregunta al agente
    F->>B: POST /api/agent/chat
    B->>AI: LLM Request + Tools
    AI-->>B: Response + Tool Calls
    B->>DB: Execute Tool (create transaction)
    DB-->>B: Success
    B-->>F: Conversational Response
    F-->>U: Chat Message + UI Update
```

---

## 🤖 Sistema de Agentes y Skills

### Filosofía de Diseño

Este proyecto implementa una **arquitectura de agentes y skills** inspirada en herramientas enterprise como Prowler (AWS Security). Cada tarea tiene un **agente responsable** y un conjunto de **skills documentadas**.

### 📁 Estructura de Documentación

```
proyecto/
├── AGENTS.md                    # 🎯 Prompt maestro para la IA
├── skills/                      # 📚 Biblioteca de habilidades
│   ├── react-modern-ui.md       # 🎨 Componentes UI con Tailwind
│   ├── fastapi-repository-pattern.md  # 🔧 Patrón Repository
│   ├── sqlalchemy-models.md     # 💾 Modelos ORM
│   ├── ai-agent-tools.md        # 🤖 Function calling para agentes
│   ├── docker-swarm-deploy.md   # 🐳 Deployment en producción
│   └── modal-system.md          # 🪟 Sistema de modales con z-index
└── README.md                    # 📖 Este archivo
```

### Tabla de Auto-Invocación

| Acción del Desarrollador | Skill a Invocar | Descripción |
|--------------------------|----------------|-------------|
| Crear componente UI | `react-modern-ui` | Aplica glass-panel, animaciones, responsive |
| Agregar endpoint API | `fastapi-repository-pattern` | Usa router → service → repository |
| Crear tabla en DB | `sqlalchemy-models` | Define modelo con UUID, timestamps |
| Añadir función al agente | `ai-agent-tools` | Implementa tool con schema Pydantic |
| Desplegar a producción | `docker-swarm-deploy` | Actualiza imagen, verifica health checks |
| Implementar modal | `modal-system` | Asegura z-index > 9998, backdrop blur |

### Ejemplo de Skill: `react-modern-ui.md`

```markdown
# Skill: React Modern UI

## 🎯 Propósito
Estandarizar el diseño de componentes UI con Tailwind CSS y glass-morphism.

## 📐 Patrón de Diseño
```jsx
<div className="glass-panel p-6 rounded-xl animate-in fade-in">
  <h2 className="text-xl font-bold text-white">Título</h2>
  <p className="text-white/70">Contenido</p>
</div>
```

## ✅ Checklist Pre-Commit
- [ ] Usa `glass-panel` para cards principales
- [ ] Colores: `text-white`, `text-white/70`, `text-white/50`
- [ ] z-index: Menu (40-50) < Modales (9998-9999)
```

### Agente IA Financiero

El sistema incluye un agente conversacional con las siguientes capacidades:

#### 🛠️ Tools Disponibles

| Tool | Descripción | Parámetros |
|------|-------------|------------|
| `get_account_balance` | Consulta balance total | `currency: ARS|USD|EUR` |
| `get_recent_transactions` | Lista últimas transacciones | `limit: int`, `days: int` |
| `create_transaction` | Crea nueva transacción | `amount`, `description`, `category_id` |
| `get_monthly_summary` | Resumen mensual de gastos | `month: int`, `year: int` |
| `get_credit_card_expenses` | Gastos de tarjeta pendientes | - |
| `search_transactions` | Busca transacciones | `query: str`, `date_from`, `date_to` |

#### 💬 Ejemplos de Uso

```
Usuario: ¿Cuánto gasté en comida este mes?
Agente:  🔍 [usa get_monthly_summary]
         📊 En noviembre gastaste $45,320 ARS en Alimentos y Bebidas.
         Eso representa el 32% de tus gastos totales del mes.

Usuario: Crea un gasto de $5000 en supermercado
Agente:  ✅ [usa create_transaction]
         Listo! Registré un gasto de $5,000 en la categoría Supermercado.
         Tu balance actual es $23,450 ARS.
```

---

## 💾 Base de Datos

### Esquema Relacional (PostgreSQL)

```sql
-- 👤 Usuarios y Autenticación
usuarios
  ├─ id: UUID (PK)
  ├─ email: VARCHAR (UNIQUE)
  ├─ full_name: VARCHAR
  ├─ moneda_preferida: VARCHAR
  └─ fecha_creacion: TIMESTAMP

-- 💰 Transacciones Financieras
transacciones
  ├─ id: UUID (PK)
  ├─ monto: DECIMAL(15,2)
  ├─ moneda: VARCHAR (ARS, USD, EUR)
  ├─ tipo: VARCHAR (ingreso, gasto)
  ├─ descripcion: TEXT
  ├─ fecha_transaccion: DATE
  ├─ categoria_id: UUID (FK → categorias)
  ├─ metodo_pago_id: UUID (FK → metodos_pago)
  ├─ objetivo_id: UUID (FK → objetivos_ahorro) [NULLABLE]
  ├─ es_credito: BOOLEAN (gasto con tarjeta)
  ├─ fecha_pago_real: DATE [NULLABLE]
  └─ resumen_tarjeta_id: UUID (FK → resumenes_bancarios) [NULLABLE]

-- 🎯 Objetivos de Ahorro
objetivos_ahorro
  ├─ id: UUID (PK)
  ├─ nombre: VARCHAR
  ├─ monto_objetivo: DECIMAL(15,2)
  ├─ monto_actual: DECIMAL(15,2)
  ├─ fecha_limite: DATE
  ├─ icono: VARCHAR
  └─ color: VARCHAR

-- 🏷️ Categorías
categorias
  ├─ id: UUID (PK)
  ├─ nombre: VARCHAR (UNIQUE)
  ├─ tipo: VARCHAR (ingreso, gasto)
  ├─ color: VARCHAR (hex)
  ├─ icono: VARCHAR (Lucide icon name)
  └─ activa: BOOLEAN

-- 💳 Métodos de Pago
metodos_pago
  ├─ id: UUID (PK)
  ├─ nombre: VARCHAR
  ├─ tipo: VARCHAR (efectivo, debito, credito, transferencia)
  ├─ activo: BOOLEAN
  └─ color: VARCHAR

-- 📊 Resúmenes Bancarios (Tarjetas de Crédito)
resumenes_bancarios
  ├─ id: UUID (PK)
  ├─ banco: VARCHAR
  ├─ tipo_tarjeta: VARCHAR (Visa, Mastercard, Amex)
  ├─ numero_resumen: VARCHAR
  ├─ fecha_emision: DATE
  ├─ fecha_vencimiento: DATE
  ├─ totales: JSONB {
  │     saldo_actual_pesos: float,
  │     saldo_actual_dolares: float,
  │     pago_minimo_pesos: float,
  │     pago_minimo_dolares: float
  │   }
  ├─ pagado: BOOLEAN
  └─ pagado_ars: BOOLEAN
  └─ pagado_usd: BOOLEAN

-- 🤖 Actividad del Agente IA
ai_activity
  ├─ id: UUID (PK)
  ├─ user_query: TEXT
  ├─ model: VARCHAR (claude-3-5-sonnet)
  ├─ tokens_prompt: INTEGER
  ├─ tokens_completion: INTEGER
  ├─ cost_usd: DECIMAL(10,6)
  ├─ response_time_ms: INTEGER
  ├─ tools_used: JSONB
  └─ created_at: TIMESTAMP
```

### Índices y Optimizaciones

```sql
-- Índices para búsquedas rápidas
CREATE INDEX idx_transacciones_fecha ON transacciones(fecha_transaccion);
CREATE INDEX idx_transacciones_categoria ON transacciones(categoria_id);
CREATE INDEX idx_transacciones_usuario ON transacciones(usuario_id);
CREATE INDEX idx_transacciones_tipo ON transacciones(tipo);
CREATE INDEX idx_transacciones_moneda ON transacciones(moneda);

-- Índice compuesto para consultas complejas
CREATE INDEX idx_trans_usuario_fecha_tipo 
  ON transacciones(usuario_id, fecha_transaccion, tipo);

-- Índice para objetivos activos
CREATE INDEX idx_objetivos_activos 
  ON objetivos_ahorro(activo) WHERE activo = true;
```

### Relaciones Clave

```
usuarios (1) ─────────► (N) transacciones
usuarios (1) ─────────► (N) objetivos_ahorro
usuarios (1) ─────────► (N) resumenes_bancarios

categorias (1) ───────► (N) transacciones
metodos_pago (1) ─────► (N) transacciones
objetivos_ahorro (1) ─► (N) transacciones [opcional]
resumenes_bancarios (1) ► (N) transacciones [credito]
```

---

## 🚀 Instalación

### Prerrequisitos

- **Node.js** 18+ y npm
- **Python** 3.11+
- **PostgreSQL** 14+
- **Docker** y Docker Compose (para producción)

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tuusuario/sistema-de-gastos.git
cd sistema-de-gastos
```

### 2. Configurar Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
nano .env  # Editar con tus credenciales
```

**Configuración `.env` del Backend:**

```env
# Base de Datos
DATABASE_URL=postgresql://usuario:password@localhost:5432/sistema_gastos

# OpenRouter API (Agente IA)
OPENROUTER_API_KEY=tu_api_key_aqui

# MinIO (Almacenamiento de Archivos)
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=comprobantes

# CORS (Frontend URL)
FRONTEND_URL=http://localhost:5173
```

### 3. Configurar Base de Datos

```bash
# Crear base de datos
createdb sistema_gastos

# Ejecutar migraciones (scripts SQL manuales)
psql sistema_gastos < migrations/001_initial_schema.sql
psql sistema_gastos < migrations/002_add_credit_card_fields.sql
```

### 4. Ejecutar Backend

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 5. Configurar Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
nano .env
```

**Configuración `.env` del Frontend:**

```env
VITE_API_URL=http://localhost:8000
VITE_MINIO_URL=http://localhost:9000
```

### 6. Ejecutar Frontend

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173` 🎉

---

## 🐳 Deployment con Docker Swarm

### Arquitectura de Producción

```bash
# 1. Inicializar Docker Swarm
docker swarm init

# 2. Crear networks
docker network create --driver overlay traefik-public
docker network create --driver overlay backend-network

# 3. Deploy del stack completo
docker stack deploy -c docker-compose.yml financiero

# 4. Verificar servicios
docker service ls
docker service logs financiero_backend -f
```

### Actualización de Servicios

```bash
# Script automático de deployment
./deploy-production.sh

# O manual:
docker service update --image ferc33/sistema-gastos-backend:latest financiero_backend
docker service update --force financiero_frontend
```

### Health Checks

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

---

## 📸 Screenshots

### Dashboard Principal

> Vista principal con balance, gráficos y widgets interactivos

### Gestión de Transacciones

> Tabla con filtros avanzados, búsqueda y exportación

### Agente IA en Acción

> Conversación natural para consultas financieras y creación de gastos

### Objetivos de Ahorro

> Tracking visual de metas con progreso en tiempo real

---

## 🗺️ Roadmap

### ✅ Versión 1.0 (Actual)

- [x] Dashboard interactivo con widgets
- [x] Gestión de transacciones multi-moneda
- [x] Objetivos de ahorro
- [x] Agente IA con function calling
- [x] Gestión de deudas de tarjeta
- [x] Deployment con Docker Swarm

### 🚧 Versión 1.5 (En Progreso)

- [ ] Google OAuth para autenticación
- [ ] Notificaciones push (vencimientos)
- [ ] Exportación de reportes en PDF
- [ ] Mobile app (React Native)
- [ ] Modo offline con sync

### 🔮 Versión 2.0 (Planeado)

- [ ] Machine Learning para predicción de gastos
- [ ] Integración con bancos (Open Banking)
- [ ] Compartir presupuestos (multi-usuario)
- [ ] Marketplace de categorías y presupuestos
- [ ] API pública para developers

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor, sigue estos pasos:

1. **Fork** el repositorio
2. Crea una **branch** para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add: nueva funcionalidad increíble'`)
4. **Push** a la branch (`git push origin feature/AmazingFeature`)
5. Abre un **Pull Request**

### Convenciones de Código

- **Frontend**: Prettier + ESLint (Airbnb style guide)
- **Backend**: Black + Flake8 + isort
- **Commits**: Conventional Commits (feat:, fix:, docs:, etc.)
- **Skills**: Antes de codificar, consulta o crea una Skill en `skills/`

---

## 📄 Licencia

Este proyecto es de uso personal. Para uso comercial, contactar al autor.

---

## 👨‍💻 Autor

**Fernando Ariel Cassera** (fer336)

- GitHub: [@fer336](https://github.com/fer336)
- LinkedIn: [Fernando Ariel Cassera](https://www.linkedin.com/in/fcassera)
- Email: fcassera@protonmail.com

---

## 🙏 Agradecimientos


- **Recharts** - Gráficos interactivos sencillos
- **FastAPI** - Framework backend moderno y rápido
- **Tailwind CSS** - Utility-first CSS que amamos
- **OpenRouter** - Acceso unificado a múltiples LLMs

---

## 📚 Recursos Adicionales

- [Documentación de Agentes y Skills](./AGENTS.md)
- [Reporte de Limpieza de Código](./frontend/CLEANUP_REPORT.md)
- [Documentación de Compresión de Imágenes](./docs/IMAGE_COMPRESSION.md)
- [Guía de Skills](./skills/README.md)

---

<div align="center">

### ⭐ Si te gusta el proyecto, dale una estrella en GitHub!

**Hecho con ❤️ usando React, FastAPI y mucho ☕**

[⬆ Volver arriba](#-sistema-de-gastos-inteligente)

</div>
