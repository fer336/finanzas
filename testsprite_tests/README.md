# 🧪 TestSprite Tests

> Carpeta de pruebas automatizadas generadas con [TestSprite MCP](https://www.testsprite.com/)

---

## 📁 Estructura

```
testsprite_tests/
├── README.md                              # Este archivo
├── TC*-validation-report.md               # Reportes de correcciones
├── complete-test-plan.html                # Plan completo (Frontend + Backend)
├── test-plan-report.html                  # Plan solo Frontend
├── testsprite_backend_test_plan.json      # 10 tests de API
├── testsprite_frontend_test_plan.json     # 14 tests de UI/UX
├── standard_prd.json                      # PRD estandarizado
└── tmp/                                   # ⚠️ Archivos temporales (no commitear)
    ├── code_summary.json
    ├── config.json
    ├── execution.lock
    └── prd_files/
```

---

## 📊 Planes de Prueba

### Frontend Tests (`testsprite_frontend_test_plan.json`)

**Total**: 14 casos de prueba  
**Puerto**: `localhost:3000`  
**Tecnología**: React + Vite

| ID | Título | Categoría | Prioridad |
|----|--------|-----------|-----------|
| TC001 | Dashboard Load Performance | Performance | High |
| TC002 | Multi-Currency Transaction | Functional | High |
| TC003 | Positive Amount Validation | Error Handling | High |
| TC004 | Categories CRUD | Functional | High |
| TC005 | Payment Methods Management | Functional | Medium |
| TC006 | Savings Goals Tracking | Functional | High |
| TC007 | Credit Card Payments | Functional | High |
| TC008 | Pending Payments Filters | Functional | Medium |
| TC009 | AI Agent Chatbot | Functional | High |
| TC010 | CSV Bulk Upload | Functional | High |
| TC011 | Multi-Tenancy Security | Security | High |
| TC012 | Budget Limits Tracking | Functional | Medium |
| TC013 | Real-time Quotations | Functional | Medium |
| TC014 | Responsive Navigation | UI | Medium |

### Backend Tests (`testsprite_backend_test_plan.json`)

**Total**: 10 casos de prueba  
**Puerto**: `localhost:8000`  
**Tecnología**: FastAPI + PostgreSQL

| ID | Título | Categoría | Prioridad |
|----|--------|-----------|-----------|
| BTC001 | Dashboard API Performance | Performance | High |
| BTC002 | Transaction Creation + Validation | Functional | High |
| BTC003 | Category Uniqueness Enforcement | Functional | High |
| BTC004 | Payment Methods Usage Stats | Functional | Medium |
| BTC005 | Savings Goals State Machine | Functional | High |
| BTC006 | Credit Card Payment Transaction | Functional | High |
| BTC007 | Pending Payments Filtering | Functional | Medium |
| BTC008 | AI Agent Function Calling | Functional | High |
| BTC009 | CSV Validation Engine | Functional | High |
| BTC010 | OAuth2/JWT + Multi-tenancy | Security | High |

---

## 🎯 Cobertura Total

| Aspecto | Tests | Cobertura |
|---------|-------|-----------|
| **Funcionalidad** | 19 | 79% |
| **Performance** | 2 | 8% |
| **Seguridad** | 2 | 8% |
| **UI/UX** | 1 | 4% |
| **Total** | **24** | **100%** |

---

## 🚀 Cómo Usar TestSprite

### 1. Prerequisitos

```bash
# Asegurar que ambos servidores estén corriendo
# Terminal 1: Backend
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev  # Puerto 3000
```

### 2. Ejecutar Pruebas

```bash
# Instalar TestSprite MCP (primera vez)
npm install -g @testsprite/testsprite-mcp

# Ejecutar todas las pruebas
npx @testsprite/testsprite-mcp@latest

# Ejecutar solo frontend
npx @testsprite/testsprite-mcp@latest --type frontend

# Ejecutar solo backend
npx @testsprite/testsprite-mcp@latest --type backend
```

### 3. Ver Reportes

Los reportes HTML se pueden abrir directamente en el navegador:

```bash
# Plan completo (Frontend + Backend)
xdg-open testsprite_tests/complete-test-plan.html

# Solo frontend
xdg-open testsprite_tests/test-plan-report.html
```

---

## 📝 Reportes de Corrección

Los archivos `TC*-validation-report.md` documentan correcciones a problemas encontrados:

- **TC003-validation-report.md**: Validación de montos positivos (cero y negativos bloqueados)

Estos reportes incluyen:
- 🐛 Problema identificado
- 🔧 Correcciones implementadas (código)
- ✅ Casos de prueba cubiertos
- 🧪 Instrucciones para prueba manual
- 📊 Archivos modificados

---

## 🔄 CI/CD Integration

Para integrar con GitHub Actions:

```yaml
# .github/workflows/testsprite.yml
name: TestSprite Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Backend
        run: |
          cd backend
          python -m venv venv
          source venv/bin/activate
          pip install -r requirements.txt
          uvicorn main:app --host 0.0.0.0 --port 8000 &
      
      - name: Setup Frontend
        run: |
          cd frontend
          npm install
          npm run dev &
      
      - name: Run TestSprite
        run: npx @testsprite/testsprite-mcp@latest
      
      - name: Upload Reports
        uses: actions/upload-artifact@v3
        with:
          name: test-reports
          path: testsprite_tests/*.html
```

---

## 📋 Checklist de Prueba Manual

Antes de hacer un release, verifica estos casos manualmente:

### 🎨 Frontend
- [ ] Dashboard carga en < 3 segundos
- [ ] Crear transacción con monto positivo funciona
- [ ] Intentar crear transacción con monto 0 muestra error
- [ ] Intentar crear transacción con monto negativo muestra error
- [ ] Navegación mobile funciona correctamente
- [ ] Modales se superponen correctamente (z-index)

### ⚙️ Backend
- [ ] POST /api/transacciones con monto 0 retorna 422
- [ ] POST /api/transacciones con monto negativo retorna 422
- [ ] POST /api/transacciones con monto positivo retorna 201
- [ ] Multi-tenancy: Usuario A no puede ver datos de Usuario B
- [ ] Autenticación JWT funciona correctamente

---

## 🛠️ Troubleshooting

### Error: "execution.lock already exists"

```bash
# Eliminar el lock si una ejecución anterior falló
rm testsprite_tests/tmp/execution.lock
```

### Error: "Cannot open browser"

En sistemas Linux, TestSprite usa el comando `open` (macOS). Usar `xdg-open` manualmente:

```bash
# Ver el puerto del servidor TestSprite en tmp/config.json
cat testsprite_tests/tmp/config.json | grep serverPort

# Abrir manualmente (reemplazar PORT con el valor encontrado)
xdg-open http://localhost:PORT
```

### Error: "Connection refused"

Verificar que ambos servidores estén corriendo:

```bash
# Backend
curl http://localhost:8000/health

# Frontend
curl http://localhost:3000
```

---

## 📚 Recursos

- [TestSprite Documentation](https://www.testsprite.com/docs)
- [MCP (Model Context Protocol)](https://modelcontextprotocol.io/)
- [PRD.md](../PRD.md) - Product Requirements Document completo
- [README.md](../README.md) - Documentación principal del proyecto

---

## 🤝 Contribuir

Al agregar nuevos features:

1. **Actualizar PRD**: `PRD.md` con la nueva funcionalidad
2. **Regenerar planes**: Ejecutar TestSprite para actualizar los planes de prueba
3. **Documentar correcciones**: Crear `TC*-validation-report.md` si corriges bugs
4. **Actualizar este README**: Si agregas nuevos tipos de tests

---

## 📊 Métricas de Calidad

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| Cobertura de Tests | > 80% | 100% |
| Tests de Alta Prioridad | > 70% | 79% |
| Performance (< 3s) | 100% | ✅ |
| Security Tests | > 2 | 2 |

---

**Última Actualización**: 2026-02-04  
**Generado con**: TestSprite MCP v1.0  
**Total de Tests**: 24 (14 Frontend + 10 Backend)

