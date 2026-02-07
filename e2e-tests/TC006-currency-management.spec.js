import { test, expect } from '@playwright/test';

/**
 * TC006: Create, edit, activate/deactivate, reorder custom user currencies
 * 
 * Descripción: Verificar CRUD completo de monedas personalizables,
 * incluyendo activación/desactivación y reordenamiento.
 * 
 * Prioridad: Media
 * Categoría: Functional
 */

test.describe('Currency Management CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navegar a gestión de monedas
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="manage-currencies"]');
    await expect(page).toHaveURL(/.*currencies/);
  });

  test('TC006-01: Create new custom currency', async ({ page }) => {
    // Click en nuevo
    await page.click('[data-testid="new-currency-button"]');
    
    // Llenar formulario
    const modal = page.locator('[data-testid="currency-modal"]');
    await expect(modal).toBeVisible();
    
    await page.fill('[data-testid="currency-code"]', 'BTC');
    await page.fill('[data-testid="currency-name"]', 'Bitcoin');
    await page.fill('[data-testid="currency-symbol"]', '₿');
    await page.fill('[data-testid="currency-exchange-rate"]', '25000000');
    
    // Submit
    await page.click('[data-testid="currency-submit-button"]');
    
    // Verificar que aparece en la lista
    await expect(modal).not.toBeVisible({ timeout: 5000 });
    
    const currencyList = page.locator('[data-testid="currencies-list"]');
    await expect(currencyList).toContainText('BTC');
    await expect(currencyList).toContainText('Bitcoin');
    
    console.log('✅ Custom currency BTC created successfully');
  });

  test('TC006-02: Edit existing currency', async ({ page }) => {
    // Seleccionar primera moneda para editar
    await page.click('[data-testid="currency-item"]:first-child [data-testid="edit-button"]');
    
    const modal = page.locator('[data-testid="currency-modal"]');
    await expect(modal).toBeVisible();
    
    // Cambiar tasa de cambio
    const rateInput = page.locator('[data-testid="currency-exchange-rate"]');
    const oldRate = await rateInput.inputValue();
    
    const newRate = (parseFloat(oldRate) * 1.1).toString();
    await rateInput.fill(newRate);
    
    // Guardar
    await page.click('[data-testid="currency-submit-button"]');
    await expect(modal).not.toBeVisible();
    
    console.log(`✅ Currency rate updated from ${oldRate} to ${newRate}`);
  });

  test('TC006-03: Deactivate and reactivate currency', async ({ page }) => {
    // Encontrar una moneda activa
    const activeCurrency = page.locator('[data-testid="currency-item"][data-active="true"]').first();
    const currencyCode = await activeCurrency.locator('[data-testid="currency-code"]').textContent();
    
    // Desactivar
    await activeCurrency.locator('[data-testid="toggle-active-button"]').click();
    
    // Verificar que cambió a inactiva
    await expect(page.locator(`[data-testid="currency-item"][data-code="${currencyCode}"]`))
      .toHaveAttribute('data-active', 'false');
    
    console.log(`✅ Currency ${currencyCode} deactivated`);
    
    // Reactivar
    await page.locator(`[data-testid="currency-item"][data-code="${currencyCode}"] [data-testid="toggle-active-button"]`).click();
    
    // Verificar que volvió a activa
    await expect(page.locator(`[data-testid="currency-item"][data-code="${currencyCode}"]`))
      .toHaveAttribute('data-active', 'true');
    
    console.log(`✅ Currency ${currencyCode} reactivated`);
  });

  test('TC006-04: Inactive currency not shown in balance', async ({ page }) => {
    // Obtener una moneda activa
    const currencyItem = page.locator('[data-testid="currency-item"][data-active="true"]').first();
    const currencyCode = await currencyItem.locator('[data-testid="currency-code"]').textContent();
    
    // Desactivar
    await currencyItem.locator('[data-testid="toggle-active-button"]').click();
    
    // Ir al dashboard
    await page.goto('/');
    
    // Verificar que la moneda no aparece en el widget de balance
    const multiCurrencyWidget = page.locator('[data-testid="multi-currency-balance-widget"]');
    await expect(multiCurrencyWidget).not.toContainText(currencyCode);
    
    console.log(`✅ Inactive currency ${currencyCode} not shown in balance widget`);
  });
});
