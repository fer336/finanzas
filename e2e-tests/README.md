# 🧪 E2E Tests - Sistema de Gastos Inteligente

Tests end-to-end automatizados usando **Playwright** para Arch Linux.

## 📋 Tests Disponibles

### ✅ Críticos (Prioridad Alta)

| Test ID | Archivo | Descripción | Estado |
|---------|---------|-------------|--------|
| TC001 | `TC001-dashboard-load.spec.js` | Dashboard load < 3s + multi-currency | ✅ |
| TC002 | `TC002-transaction-creation.spec.js` | Crear transacción con monto positivo | ✅ |
| TC003 | `TC003-negative-amount-validation.spec.js` | Validación de montos negativos/cero | ✅ |
| TC006 | `TC006-currency-management.spec.js` | CRUD de monedas personalizables | ✅ |
| TC010 | `TC010-credit-card-balance.spec.js` | Tarjetas de crédito no afectan balance | ✅ |

## 🚀 Ejecución

### Pre-requisitos

1. **Servicios corriendo**:
   ```bash
   # Backend en http://localhost:8000
   cd backend && uvicorn app.main:app --reload
   
   # Frontend en http://localhost:5173
   cd frontend && npm run dev
   ```

2. **Playwright instalado**:
   ```bash
   npm install -D @playwright/test playwright
   npx playwright install chromium
   ```

### Comandos

```bash
# Ejecutar todos los tests
npx playwright test

# Ejecutar un test específico
npx playwright test TC001-dashboard-load

# Ejecutar en modo UI (interactivo)
npx playwright test --ui

# Ejecutar con navegador visible (headed mode)
npx playwright test --headed

# Ejecutar solo en Chromium
npx playwright test --project=chromium

# Ver reporte HTML
npx playwright show-report
```

### Debugging

```bash
# Modo debug (paso a paso)
npx playwright test --debug

# Con inspector de Playwright
PWDEBUG=1 npx playwright test

# Generar trace para análisis
npx playwright test --trace on
```

## 📊 Estructura de Tests

Cada test sigue este patrón:

```javascript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup común
    await page.goto('/');
  });

  test('TC###-##: Specific test case', async ({ page }) => {
    // Arrange
    // Act
    // Assert
    
    console.log('✅ Test passed');
  });
});
```

## 🎯 Data Test IDs

Los tests usan `data-testid` para seleccionar elementos. Asegúrate de que los componentes tengan estos atributos:

### Dashboard
- `dashboard-loaded`: Indicador de carga completa
- `multi-currency-balance-widget`: Widget de balance multi-moneda
- `recent-transactions-widget`: Widget de transacciones recientes
- `categories-widget`: Widget de categorías
- `pending-payments-widget`: Widget de pagos pendientes

### Transacciones
- `new-transaction-button`: Botón para nueva transacción
- `transaction-modal`: Modal de formulario
- `transaction-description`: Campo descripción
- `transaction-amount`: Campo monto
- `transaction-type`: Select tipo (ingreso/gasto)
- `transaction-currency`: Select moneda
- `transaction-category`: Select categoría
- `transaction-is-credit`: Checkbox tarjeta de crédito
- `transaction-submit-button`: Botón enviar
- `transaction-amount-error`: Mensaje de error de validación

### Monedas
- `manage-currencies`: Link a gestión de monedas
- `new-currency-button`: Botón nueva moneda
- `currency-modal`: Modal de formulario
- `currency-code`: Campo código (USD, EUR, etc)
- `currency-name`: Campo nombre
- `currency-symbol`: Campo símbolo
- `currency-exchange-rate`: Campo tasa de cambio
- `currencies-list`: Lista de monedas
- `currency-item`: Item individual
- `toggle-active-button`: Botón activar/desactivar

## ⚠️ Notas Importantes

### Autenticación
Actualmente los tests asumen una sesión válida. Para implementar login automático:

1. Crear un usuario de prueba en el backend
2. Agregar helper `loginTestUser()` en `e2e-tests/helpers/auth.js`
3. Usarlo en `beforeEach` de cada suite

### Datos de Prueba
- Los tests deben poder ejecutarse en cualquier entorno
- Usar datos aleatorios o únicos (timestamps)
- Limpiar datos después de cada test (opcional)

### CI/CD
Para ejecutar en GitHub Actions u otro CI:

```yaml
- name: Install Playwright
  run: |
    npm ci
    npx playwright install --with-deps chromium

- name: Run E2E tests
  run: npx playwright test
  
- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## 📈 Cobertura

| Módulo | Tests | Cobertura |
|--------|-------|-----------|
| Dashboard | 3 | 90% |
| Transacciones | 4 | 85% |
| Monedas | 4 | 90% |
| Tarjetas | 3 | 70% |

## 🐛 Troubleshooting

### Error: "Browser not found"
```bash
npx playwright install chromium
```

### Error: "Page timeout"
Aumentar timeout en `playwright.config.js`:
```javascript
use: {
  navigationTimeout: 30000,
  actionTimeout: 15000,
}
```

### Error: "Element not found"
Verificar que el componente tiene el `data-testid` correcto.

## 📚 Recursos

- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Test Assertions](https://playwright.dev/docs/test-assertions)

---

**Última actualización**: 2026-02-07
