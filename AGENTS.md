# Sistema de Gastos - AI Agent Ruleset

> **Master Prompt** - Orquestador de Agentes para el Sistema Financiero Personal

---

## 🎯 Visión General

Este proyecto utiliza un sistema de **Agentes Especializados** donde cada agente tiene un dominio específico y no debe salirse de su contexto. Los agentes colaboran entre sí pero mantienen sus responsabilidades bien definidas.

---

## 📋 Agentes Disponibles

| Agente | Dominio | Skills Principales | Responsabilidad |
|--------|---------|-------------------|-----------------|
| **Frontend Agent** | UI/UX React | `frontend-react`, `react-modern-ui`, `modal-system` | Componentes, estilos, navegación |
| **Backend Agent** | FastAPI | `backend-fastapi`, `repository-pattern`, `sqlalchemy` | Lógica de negocio, validaciones |
| **API Agent** | REST APIs | `api-design`, `openapi`, `fastapi-routes` | Endpoints, schemas, documentación |
| **Database Agent** | PostgreSQL | `database-postgresql`, `migrations`, `indexes` | Esquemas, queries, optimizaciones |
| **AI Agent** | Agente IA | `ai-agent-tools`, `openrouter`, `function-calling` | Procesamiento NLP, herramientas |

---

## 🔄 Auto-Invocación de Skills

Cuando realices una acción, **SIEMPRE invoca el skill correspondiente PRIMERO**:

### Frontend Agent

| Acción | Skill | Prioridad |
|--------|-------|-----------|
| Crear componente UI | `frontend-react` | 🔴 CRÍTICO |
| Crear/modificar modal | `modal-system` | 🔴 CRÍTICO |
| Agregar gráfico | `recharts-data-viz` | 🟠 ALTO |
| Modificar estilos | `react-modern-ui` | 🟠 ALTO |

### Backend Agent

| Acción | Skill | Prioridad |
|--------|-------|-----------|
| Crear servicio/lógica | `backend-fastapi` | 🔴 CRÍTICO |
| Crear repositorio | `repository-pattern` | 🔴 CRÍTICO |
| Validar datos | `pydantic-schemas` | 🟠 ALTO |
| Manejar errores | `error-handling` | 🟠 ALTO |

### API Agent

| Acción | Skill | Prioridad |
|--------|-------|-----------|
| Crear endpoint | `api-design` | 🔴 CRÍTICO |
| Documentar API | `openapi` | 🟠 ALTO |
| Versionado | `api-versioning` | 🟡 MEDIO |

### Database Agent

| Acción | Skill | Prioridad |
|--------|-------|-----------|
| Crear tabla | `database-postgresql` | 🔴 CRÍTICO |
| Crear migración | `migrations` | 🔴 CRÍTICO |
| Optimizar query | `query-optimization` | 🟠 ALTO |
| Crear índice | `indexes` | 🟠 ALTO |

### AI Agent

| Acción | Skill | Prioridad |
|--------|-------|-----------|
| Crear herramienta | `ai-agent-tools` | 🔴 CRÍTICO |
| Procesar NLP | `openrouter` | 🟠 ALTO |
| Function calling | `function-calling` | 🟠 ALTO |

---

## 🚨 REGLAS CRÍTICAS - NON-NEGOTIABLE

### 1. Separación de Contextos (ABSOLUTA)

```
❌ Frontend Agent NO debe:
- Crear migraciones de base de datos
- Modificar lógica de backend
- Diseñar schemas de API

✅ Frontend Agent SÍ debe:
- Crear/modificar componentes React
- Gestionar estado (Context API)
- Aplicar estilos con Tailwind
- Manejar navegación
```

```
❌ Backend Agent NO debe:
- Crear componentes de UI
- Modificar estilos CSS
- Manejar routing de React

✅ Backend Agent SÍ debe:
- Implementar lógica de negocio
- Crear servicios y repositorios
- Validar datos con Pydantic
- Manejar transacciones DB
```

```
❌ Database Agent NO debe:
- Crear componentes React
- Implementar endpoints
- Modificar lógica de negocio

✅ Database Agent SÍ debe:
- Diseñar esquemas
- Crear/modificar migraciones
- Optimizar queries
- Crear índices
```

---

### 2. Comunicación entre Agentes

Cuando un agente necesita algo de otro dominio:

```python
# ❌ MAL - Frontend Agent modificando backend
# frontend/src/services/api.js
async function createCategory(data) {
    # Modifying backend logic directly
    await database.insert(...)  # PROHIBIDO
}

# ✅ BIEN - Frontend Agent usando API
# frontend/src/services/api.js
async function createCategory(data) {
    return await apiServices.categoriasApi.create(data);  # OK
}
```

---

### 3. Scope de Cada Agente

```
Frontend Agent (React)
├── src/components/     # Componentes UI
├── src/contexts/       # Estado global
├── src/hooks/          # Custom hooks
├── src/services/       # API clients (solo llamadas)
└── src/utils/          # Utilidades del cliente

Backend Agent (FastAPI)
├── app/services/       # Lógica de negocio
├── app/repositories/   # Acceso a datos
├── app/models/         # Modelos Pydantic
└── app/utils/          # Utilidades del servidor

API Agent
├── app/routers/        # Endpoints
├── app/schemas/        # Pydantic schemas
└── docs/api/           # Documentación OpenAPI

Database Agent
├── app/models/db_models.py  # SQLAlchemy models
├── migrations/              # Alembic migrations
└── docs/database/           # Diagramas ER

AI Agent
├── app/services/agent.py       # Lógica del agente
├── app/services/agent_tools.py # Herramientas
└── docs/agent/                 # Documentación
```

---

## 🎯 Ejemplos de Colaboración

### Ejemplo 1: Crear Nueva Funcionalidad "Presupuestos"

**1. Database Agent crea la tabla:**
```sql
-- migrations/add_presupuestos.sql
CREATE TABLE presupuestos (
    id UUID PRIMARY KEY,
    categoria_id UUID REFERENCES categorias(id),
    monto_limite DECIMAL(15,2),
    periodo VARCHAR(20)
);
```

**2. Backend Agent crea el servicio:**
```python
# app/services/presupuesto_service.py
class PresupuestoService:
    def __init__(self, repo: PresupuestoRepository):
        self.repo = repo
    
    def crear_presupuesto(self, data: PresupuestoCreate):
        # Lógica de negocio
        return self.repo.create(data)
```

**3. API Agent crea el endpoint:**
```python
# app/routers/presupuestos.py
@router.post("/")
async def create_presupuesto(data: PresupuestoCreate):
    service = PresupuestoService(repo)
    return service.crear_presupuesto(data)
```

**4. Frontend Agent crea el componente:**
```jsx
// src/components/PresupuestoWidget.jsx
export const PresupuestoWidget = () => {
    const [presupuestos, setPresupuestos] = useState([]);
    
    useEffect(() => {
        apiServices.presupuestosApi.getAll()
            .then(setPresupuestos);
    }, []);
    
    return <div>...</div>;
};
```

---

## 📁 Estructura del Proyecto

```
sistema-gastos/
├── skills/                          # 🎓 Skills directory
│   ├── frontend-react.md            # Skill para Frontend
│   ├── backend-fastapi.md           # Skill para Backend
│   ├── api-design.md                # Skill para APIs
│   ├── database-postgresql.md       # Skill para Database
│   ├── ai-agent-tools.md            # Skill para AI Agent
│   ├── react-modern-ui.md           # Skill genérico
│   ├── modal-system.md              # Skill genérico
│   ├── repository-pattern.md        # Skill genérico
│   └── README.md                    # Índice de skills
│
├── frontend/                        # 🎨 Frontend Agent Domain
│   ├── AGENTS.md                    # Ruleset del Frontend Agent
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   └── services/
│   └── package.json
│
├── backend/                         # ⚙️ Backend Agent Domain
│   ├── AGENTS.md                    # Ruleset del Backend Agent
│   ├── app/
│   │   ├── services/                # Backend Agent aquí
│   │   ├── repositories/            # Backend Agent aquí
│   │   ├── routers/                 # API Agent aquí
│   │   ├── models/                  # Database Agent aquí
│   │   └── utils/
│   └── requirements.txt
│
├── docs/                            # 📚 Documentación
│   ├── frontend/                    # Frontend Agent docs
│   ├── backend/                     # Backend Agent docs
│   ├── api/                         # API Agent docs
│   ├── database/                    # Database Agent docs
│   └── agent/                       # AI Agent docs
│
├── AGENTS.md                        # 🎯 Este archivo (Master)
└── README.md
```

---

## 🔍 Identificación de Agente

Cuando la IA recibe una tarea, debe identificar qué agente es responsable:

### Decision Tree

```
¿La tarea involucra UI/componentes visuales?
  ├─ Sí → Frontend Agent
  └─ No → ¿Involucra lógica de negocio?
          ├─ Sí → Backend Agent
          └─ No → ¿Involucra endpoints HTTP?
                  ├─ Sí → API Agent
                  └─ No → ¿Involucra esquemas/migraciones?
                          ├─ Sí → Database Agent
                          └─ No → ¿Involucra procesamiento NLP?
                                  ├─ Sí → AI Agent
                                  └─ No → Revisar contexto
```

---

## 📝 Protocolo de Trabajo

### Para la IA

1. **Identificar el Agente responsable** usando el Decision Tree
2. **Leer el skill correspondiente** de la carpeta `skills/`
3. **Seguir las reglas del agente** definidas en su `AGENTS.md`
4. **No salirse del contexto** del agente activo
5. **Documentar cambios** en la carpeta `docs/` del agente

### Para el Usuario

Cuando des una instrucción, especifica el agente si es ambiguo:

```bash
# ✅ Claro
"Frontend Agent: Crea un widget de presupuestos"
"Backend Agent: Implementa lógica de cálculo de presupuestos"
"Database Agent: Crea tabla de presupuestos"

# ⚠️ Ambiguo (pero manejable)
"Agrega presupuestos al sistema"
# La IA identificará los 3 agentes necesarios
```

---

## 🛠️ Comandos de Setup

```bash
# Crear la estructura de skills (similar a Prowler)
./skills/setup.sh

# Este script creará:
# - skills/ con todos los SKILL.md
# - Symlinks para diferentes AI tools (.claude/, .github/, etc)
# - README.md en skills/
```

---

## 🎓 Skills Disponibles

### Skills Genéricos

| Skill | Descripción | Usado por |
|-------|-------------|-----------|
| `react-19` | React 19, no useMemo/useCallback | Frontend Agent |
| `tailwind-css` | Tailwind CSS, glass-morphism | Frontend Agent |
| `fastapi` | FastAPI, async, Pydantic | Backend Agent, API Agent |
| `sqlalchemy` | SQLAlchemy ORM, relationships | Backend Agent, Database Agent |
| `pydantic` | Schemas, validación | Backend Agent, API Agent |
| `postgresql` | PostgreSQL, queries, índices | Database Agent |

### Skills Específicos del Proyecto

| Skill | Descripción | Usado por |
|-------|-------------|-----------|
| `frontend-react` | Patrones del frontend | Frontend Agent |
| `backend-fastapi` | Patrones del backend | Backend Agent |
| `api-design` | Diseño de endpoints | API Agent |
| `database-postgresql` | Esquemas y migraciones | Database Agent |
| `ai-agent-tools` | Herramientas del agente IA | AI Agent |
| `react-modern-ui` | UI moderna con glass-morphism | Frontend Agent |
| `modal-system` | Sistema de modales | Frontend Agent |
| `repository-pattern` | Patrón Repository | Backend Agent |

---

## 📊 Diagrama de Comunicación

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Agent                        │
│  (React, Tailwind, Components)                          │
└────────────────┬────────────────────────────────────────┘
                 │ HTTP Requests
                 ↓
┌─────────────────────────────────────────────────────────┐
│                      API Agent                           │
│  (FastAPI Routers, OpenAPI, Schemas)                    │
└────────────┬──────────────────────────┬─────────────────┘
             │                          │
             ↓                          ↓
┌────────────────────────┐   ┌──────────────────────────┐
│    Backend Agent       │   │     AI Agent             │
│  (Services, Business)  │   │  (NLP, Tools, OpenRouter)│
└────────┬───────────────┘   └──────────────────────────┘
         │                              │
         ↓                              ↓
┌────────────────────────────────────────────────────────┐
│                    Database Agent                       │
│  (PostgreSQL, Migrations, Indexes)                     │
└────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist para Nuevas Features

Cuando agregues una feature, verifica que cada agente haya hecho su parte:

- [ ] **Database Agent**: Tabla creada, migración ejecutada
- [ ] **Backend Agent**: Servicio implementado, repositorio creado
- [ ] **API Agent**: Endpoint documentado, schema definido
- [ ] **Frontend Agent**: Componente creado, integrado al dashboard
- [ ] **AI Agent**: (Si aplica) Tool agregado, prompt actualizado

---

## 🚀 Próximos Pasos

1. Ejecutar `./skills/setup.sh` para crear la estructura
2. Leer los skills relevantes antes de cada tarea
3. Mantener la separación de contextos
4. Documentar en `docs/` correspondiente
5. Revisar este `AGENTS.md` periódicamente

---

**Última Actualización**: 2026-01-24  
**Versión**: v2.0  
**Inspirado por**: [Prowler Cloud - AI Skills](https://github.com/prowler-cloud/prowler)

