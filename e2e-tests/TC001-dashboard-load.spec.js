import { test, expect } from '@playwright/test';

/**
 * TC001: Dashboard load performance and multi-currency balance display
 * 
 * Descripción: Validar que el dashboard carga en menos de 3 segundos
 * y muestra balances separados para cada moneda activa del usuario.
 * 
 * Prioridad: Alta
 * Categoría: Functional + Performance
 */

test.describe('Dashboard Performance and Multi-Currency', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Implementar login automático con usuario de prueba
    // Por ahora, asumimos que hay una sesión válida o mock
    await page.goto('/');
  });

  test('TC001-01: Dashboard loads within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    // Navegar al dashboard
    await page.goto('/');
    
    // Esperar a que el dashboard esté completamente cargado
    await page.waitForSelector('[data-testid="dashboard-loaded"]', { 
      timeout: 3000 
    });
    
    const loadTime = Date.now() - startTime;
    
    // Verificar que cargó en menos de 3 segundos
    expect(loadTime).toBeLessThan(3000);
    
    console.log(`✅ Dashboard loaded in ${loadTime}ms`);
  });

  test('TC001-02: Multi-currency balances are displayed separately', async ({ page }) => {
    await page.goto('/');
    
    // Esperar a que el widget de multi-currency esté visible
    const multiCurrencyWidget = page.locator('[data-testid="multi-currency-balance-widget"]');
    await expect(multiCurrencyWidget).toBeVisible();
    
    // Verificar que se muestran las monedas activas
    const currencyItems = page.locator('[data-testid="currency-balance-item"]');
    const count = await currencyItems.count();
    
    // Debe haber al menos 1 moneda (ARS es predeterminada)
    expect(count).toBeGreaterThan(0);
    
    // Verificar que cada moneda muestra su balance
    for (let i = 0; i < count; i++) {
      const item = currencyItems.nth(i);
      await expect(item.locator('[data-testid="currency-code"]')).toBeVisible();
      await expect(item.locator('[data-testid="currency-balance"]')).toBeVisible();
    }
    
    console.log(`✅ Found ${count} active currencies with balances`);
  });

  test('TC001-03: Dashboard widgets render correctly', async ({ page }) => {
    await page.goto('/');
    
    // Verificar widgets principales
    const widgets = [
      'multi-currency-balance-widget',
      'recent-transactions-widget',
      'categories-widget',
      'pending-payments-widget',
    ];
    
    for (const widget of widgets) {
      const element = page.locator(`[data-testid="${widget}"]`);
      await expect(element).toBeVisible({ timeout: 5000 });
    }
    
    console.log('✅ All core widgets are visible');
  });
});
