import { test, expect } from '@playwright/test';

/**
 * TC002: Create transaction with positive amount and multi-currency support
 * 
 * Descripción: Verificar que un usuario puede crear una transacción con:
 * - Monto positivo
 * - Tipo válido (ingreso/gasto)
 * - Moneda seleccionada
 * - Conversión automática a ARS
 * 
 * Prioridad: Alta
 * Categoría: Functional
 */

test.describe('Transaction Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // TODO: Login automático
  });

  test('TC002-01: Create transaction with valid positive amount', async ({ page }) => {
    // Abrir modal de nueva transacción
    await page.click('[data-testid="new-transaction-button"]');
    
    // Esperar a que el modal esté visible
    const modal = page.locator('[data-testid="transaction-modal"]');
    await expect(modal).toBeVisible();
    
    // Llenar el formulario
    await page.fill('[data-testid="transaction-description"]', 'Compra de prueba E2E');
    await page.fill('[data-testid="transaction-amount"]', '5000');
    await page.selectOption('[data-testid="transaction-type"]', 'gasto');
    await page.selectOption('[data-testid="transaction-currency"]', 'ARS');
    
    // Seleccionar categoría (primera disponible)
    await page.selectOption('[data-testid="transaction-category"]', { index: 1 });
    
    // Enviar formulario
    await page.click('[data-testid="transaction-submit-button"]');
    
    // Verificar que el modal se cierra
    await expect(modal).not.toBeVisible({ timeout: 5000 });
    
    // Verificar que la transacción aparece en la lista
    const transactionsList = page.locator('[data-testid="recent-transactions-widget"]');
    await expect(transactionsList).toContainText('Compra de prueba E2E');
    
    console.log('✅ Transaction created successfully');
  });

  test('TC002-02: Multi-currency transaction with auto ARS conversion', async ({ page }) => {
    // Abrir modal
    await page.click('[data-testid="new-transaction-button"]');
    await expect(page.locator('[data-testid="transaction-modal"]')).toBeVisible();
    
    // Llenar formulario con USD
    await page.fill('[data-testid="transaction-description"]', 'Compra en USD');
    await page.fill('[data-testid="transaction-amount"]', '100');
    await page.selectOption('[data-testid="transaction-type"]', 'gasto');
    await page.selectOption('[data-testid="transaction-currency"]', 'USD');
    
    // Verificar que el campo de conversión ARS se calcula automáticamente
    const arsConversion = page.locator('[data-testid="transaction-ars-conversion"]');
    await expect(arsConversion).toBeVisible();
    
    // El valor convertido debe ser > 0
    const arsValue = await arsConversion.inputValue();
    expect(parseFloat(arsValue)).toBeGreaterThan(0);
    
    console.log(`✅ ARS conversion calculated: ${arsValue}`);
    
    // Seleccionar categoría
    await page.selectOption('[data-testid="transaction-category"]', { index: 1 });
    
    // Enviar
    await page.click('[data-testid="transaction-submit-button"]');
    
    // Verificar creación
    await expect(page.locator('[data-testid="transaction-modal"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="recent-transactions-widget"]')).toContainText('Compra en USD');
  });
});
