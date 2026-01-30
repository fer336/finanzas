# 🎯 Sistema de Agentes y Skills - Implementación Completa

## 📋 Resumen

Se ha implementado un **Sistema de Agentes Especializados** inspirado en [Prowler Cloud](https://github.com/prowler-cloud/prowler), donde cada agente tiene un dominio específico y no se sale de su contexto.

---

## 🤖 Agentes Disponibles

| Agente | Dominio | Archivos | Responsabilidad |
|--------|---------|----------|-----------------|
| **Frontend Agent** | React UI/UX | `frontend/AGENTS.md` | Componentes, estilos, navegación |
| **Backend Agent** | FastAPI Logic | `backend/AGENTS.md` | Servicios, repositorios, validaciones |
| **API Agent** | REST Endpoints | `backend/AGENTS.md` (sección) | Endpoints, schemas, OpenAPI |
| **Database Agent** | PostgreSQL | `backend/AGENTS.md` (sección) | Esquemas, migraciones, índices |
| **AI Agent** | NLP/Tools | `skills/ai-agent-tools.md` | Procesamiento, function calling |

---

## 📁 Estructura Creada

```
sistema-gastos/
├── AGENTS.md                        # 🎯 Master Ruleset (NUEVO)
│   ├── Visión general
│   ├── 5 agentes especializados
│   ├── Auto-invocación de skills
│   ├── Reglas críticas
│   ├── Decision trees
│   └── Ejemplos de colaboración
│
├── frontend/
│   └── AGENTS.md                    # ✨ Frontend Agent Ruleset (NUEVO)
│       ├── Contexto crítico
│       ├── Skills requeridos
│       ├── Reglas no negociables
│       ├── Patrones obligatorios
│       └── Scope del agente
│
├── backend/
│   └── AGENTS.md                    # ⚙️ Backend Agent Ruleset (NUEVO)
│       ├── Contexto crítico
│       ├── Skills requeridos
│       ├── Repository Pattern
│       ├── Pydantic validation
│       └── Scope del agente
│
└── skills/
    ├── setup.sh                     # 🛠️ Setup script (NUEVO, ejecutable)
    └── README.md                    # 📚 Índice de skills (PRÓXIMAMENTE)
```

---

## 🎓 Sistema de Skills

### Skills Genéricos (Próximamente)

- `react-19.md` - React 19, compiler
- `tailwind-css.md` - Tailwind utility-first
- `fastapi.md` - FastAPI async
- `sqlalchemy.md` - ORM patterns
- `pydantic.md` - Validation
- `postgresql.md` - DB patterns

### Skills Específicos del Proyecto

- `frontend-react.md` - Frontend patterns
- `backend-fastapi.md` - Backend patterns
- `api-design.md` - API design
- `database-postgresql.md` - DB schema
- `ai-agent-tools.md` - AI tools
- `react-modern-ui.md` - Modern UI
- `modal-system.md` - Modal patterns
- `repository-pattern.md` - Repository

---

## 🚀 Cómo Usar

### 1. Setup Inicial

```bash
# Ejecutar script de setup
cd skills
./setup.sh

# Esto crea symlinks para:
# - .claude/skills/ (Claude Desktop/Code)
# - .github/skills/ (GitHub Copilot)
# - .opencode/skills/ (OpenCode)
# - .codex/skills/ (Codex/OpenAI)
# - .gemini/skills/ (Gemini CLI)
```

### 2. Trabajar con un Agente

**Ejemplo: Frontend Agent**

```bash
# 1. Leer el AGENTS.md del dominio
cat frontend/AGENTS.md

# 2. Dar instrucción a la IA
"Frontend Agent: Crea un widget de presupuestos con glass-morphism"

# 3. La IA automáticamente:
#    - Lee frontend/AGENTS.md
#    - Lee skills/frontend-react.md
#    - Lee skills/react-modern-ui.md
#    - Crea el componente siguiendo patrones
```

**Ejemplo: Backend Agent**

```bash
# 1. Leer el AGENTS.md
cat backend/AGENTS.md

# 2. Dar instrucción
"Backend Agent: Implementa servicio de presupuestos con Repository Pattern"

# 3. La IA automáticamente:
#    - Lee backend/AGENTS.md
#    - Lee skills/backend-fastapi.md
#    - Lee skills/repository-pattern.md
#    - Crea servicio + repositorio
```

### 3. Features Multi-Agente

**Ejemplo: Agregar "Presupuestos"**

```bash
# Database Agent: Crea tabla
"Database Agent: Crea tabla presupuestos con categoria_id y monto_limite"

# Backend Agent: Crea servicio
"Backend Agent: Crea PresupuestoService con Repository Pattern"

# API Agent: Crea endpoint
"API Agent: Crea GET /api/presupuestos con paginación"

# Frontend Agent: Crea UI
"Frontend Agent: Crea PresupuestoWidget con glass-morphism"
```

---

## 🔒 Reglas Críticas

### Separación de Contextos (ABSOLUTA)

```
❌ Frontend Agent NO puede:
- Crear migraciones SQL
- Modificar lógica de backend
- Definir schemas de API

✅ Frontend Agent SÍ puede:
- Crear componentes React
- Manejar estado (Context API)
- Aplicar estilos Tailwind
- Llamar APIs (HTTP only)
```

### Comunicación entre Agentes

```python
# ✅ BIEN - Frontend llama API
const data = await apiServices.categoriasApi.getAll();

# ❌ MAL - Frontend implementa lógica backend
const categories = await db.query("SELECT * FROM categorias");
```

---

## 📊 Comparación: Antes vs Después

### Antes

```
# Sin estructura de agentes
"Agrega presupuestos al sistema"
→ IA modifica frontend, backend, DB mezclado
→ Inconsistencias en patrones
→ Código difícil de mantener
```

### Después

```
# Con estructura de agentes
"Database Agent: Crea tabla presupuestos"
→ IA solo modifica migrations/

"Backend Agent: Crea servicio de presupuestos"
→ IA solo modifica services/ y repositories/

"Frontend Agent: Crea widget de presupuestos"
→ IA solo modifica components/

✅ Código consistente
✅ Patrones respetados
✅ Fácil de mantener
```

---

## 🎯 Decision Tree

```
┌─────────────────────────────────────────┐
│ ¿Qué tipo de tarea es?                  │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
    UI/Visual?    Lógica?
        │             │
        ↓             ↓
  Frontend      Backend Agent
    Agent            │
                     │
              ┌──────┴──────┐
              │             │
          Endpoint?     DB Schema?
              │             │
              ↓             ↓
          API Agent   Database Agent
```

---

## ✅ Ventajas del Sistema

### 1. **Consistencia de Código**
- Cada agente sigue sus propios patrones
- Skills documentan las mejores prácticas
- IA no se confunde mezclando dominios

### 2. **Mantenibilidad**
- Código organizado por responsabilidades
- Fácil encontrar dónde está cada cosa
- Cambios localizados a un dominio

### 3. **Escalabilidad**
- Agregar nuevos agentes fácilmente
- Skills reutilizables entre proyectos
- Estructura clara para onboarding

### 4. **Colaboración IA Mejorada**
- IA entiende el contexto del agente
- No hace cambios fuera de scope
- Sigue patrones automáticamente

---

## 📚 Próximos Pasos

### Fase 1: Completar Skills (Pendiente)
```bash
# Crear skills genéricos
skills/react-19.md
skills/tailwind-css.md
skills/fastapi.md
skills/sqlalchemy.md
skills/postgresql.md
skills/pydantic.md

# Crear skills específicos
skills/frontend-react.md
skills/backend-fastapi.md
skills/api-design.md
skills/database-postgresql.md
skills/ai-agent-tools.md
skills/react-modern-ui.md
skills/modal-system.md
skills/repository-pattern.md
```

### Fase 2: Documentación por Agente
```bash
# Crear docs/ por dominio
docs/frontend/
docs/backend/
docs/api/
docs/database/
docs/agent/
```

### Fase 3: Testing
```bash
# Crear tests siguiendo skills
# Frontend: Playwright E2E
# Backend: pytest unit tests
# API: pytest integration tests
# Database: migration tests
```

---

## 🔗 Referencias

- [Prowler Cloud - AI Skills](https://github.com/prowler-cloud/prowler/tree/master/skills)
- [agentskills.io Standard](https://agentskills.io)
- [AGENTS.md](./AGENTS.md) - Master Ruleset
- [Frontend AGENTS.md](./frontend/AGENTS.md) - Frontend Agent
- [Backend AGENTS.md](./backend/AGENTS.md) - Backend Agent

---

## 💡 Ejemplo Real de Uso

### Tarea: "Mejorar formulario de creación de categorías"

**Proceso Automático:**

1. IA lee `AGENTS.md` → Identifica que es tarea del **Frontend Agent**
2. IA lee `frontend/AGENTS.md` → Entiende el contexto
3. IA lee `skills/frontend-react.md` → Aprende patrones
4. IA lee `skills/react-modern-ui.md` → Aprende estilos
5. IA implementa:
   - ✅ Componente con glass-morphism
   - ✅ Animaciones suaves
   - ✅ Responsive design
   - ✅ Z-index correcto
   - ✅ Validaciones frontend
6. IA NO implementa:
   - ❌ Lógica de validación backend (eso es del Backend Agent)
   - ❌ Endpoint de creación (eso es del API Agent)
   - ❌ Migración de tabla (eso es del Database Agent)

---

**Fecha**: 2026-01-24  
**Versión**: v1.0  
**Estado**: ✅ Implementado (Skills pendientes)  
**Inspirado por**: Prowler Cloud AI Skills System

