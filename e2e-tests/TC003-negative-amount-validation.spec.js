import { test, expect } from '@playwright/test';

/**
 * TC003: Transaction creation with invalid amount (negative or zero)
 * 
 * Descripción: Verificar que el sistema previene la creación de transacciones
 * con montos negativos o cero, mostrando un error apropiado.
 * 
 * Prioridad: Alta
 * Categoría: Error Handling
 */

test.describe('Transaction Amount Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Abrir modal de nueva transacción
    await page.click('[data-testid="new-transaction-button"]');
    await expect(page.locator('[data-testid="transaction-modal"]')).toBeVisible();
  });

  test('TC003-01: Prevent transaction with zero amount', async ({ page }) => {
    // Llenar formulario con monto 0
    await page.fill('[data-testid="transaction-description"]', 'Test monto cero');
    await page.fill('[data-testid="transaction-amount"]', '0');
    await page.selectOption('[data-testid="transaction-type"]', 'gasto');
    await page.selectOption('[data-testid="transaction-currency"]', 'ARS');
    await page.selectOption('[data-testid="transaction-category"]', { index: 1 });
    
    // Intentar enviar
    await page.click('[data-testid="transaction-submit-button"]');
    
    // Verificar que aparece un error
    const errorMessage = page.locator('[data-testid="transaction-amount-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/debe ser positivo|must be positive|mayor a 0|greater than 0/i);
    
    // Verificar que el modal sigue abierto
    await expect(page.locator('[data-testid="transaction-modal"]')).toBeVisible();
    
    console.log('✅ Zero amount validation works correctly');
  });

  test('TC003-02: Prevent transaction with negative amount', async ({ page }) => {
    // Llenar formulario con monto negativo
    await page.fill('[data-testid="transaction-description"]', 'Test monto negativo');
    await page.fill('[data-testid="transaction-amount"]', '-100');
    await page.selectOption('[data-testid="transaction-type"]', 'gasto');
    await page.selectOption('[data-testid="transaction-currency"]', 'ARS');
    await page.selectOption('[data-testid="transaction-category"]', { index: 1 });
    
    // Intentar enviar
    await page.click('[data-testid="transaction-submit-button"]');
    
    // Verificar error
    const errorMessage = page.locator('[data-testid="transaction-amount-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/debe ser positivo|must be positive|mayor a 0|greater than 0/i);
    
    // Modal debe seguir abierto
    await expect(page.locator('[data-testid="transaction-modal"]')).toBeVisible();
    
    console.log('✅ Negative amount validation works correctly');
  });

  test('TC003-03: Accept valid positive amount after error', async ({ page }) => {
    // Primero intentar con 0
    await page.fill('[data-testid="transaction-description"]', 'Test corrección');
    await page.fill('[data-testid="transaction-amount"]', '0');
    await page.selectOption('[data-testid="transaction-type"]', 'gasto');
    await page.selectOption('[data-testid="transaction-currency"]', 'ARS');
    await page.selectOption('[data-testid="transaction-category"]', { index: 1 });
    await page.click('[data-testid="transaction-submit-button"]');
    
    // Verificar error
    await expect(page.locator('[data-testid="transaction-amount-error"]')).toBeVisible();
    
    // Corregir con monto positivo
    await page.fill('[data-testid="transaction-amount"]', '1000');
    
    // Enviar nuevamente
    await page.click('[data-testid="transaction-submit-button"]');
    
    // Ahora debe cerrar el modal (success)
    await expect(page.locator('[data-testid="transaction-modal"]')).not.toBeVisible({ timeout: 5000 });
    
    console.log('✅ Validation allows correction to valid amount');
  });
});
