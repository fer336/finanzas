import { test, expect } from '@playwright/test';

/**
 * TC010: Transactions flagged as credit card expenses do not affect balance
 * 
 * Descripción: Verificar que las transacciones marcadas con es_credito=true
 * NO modifican el balance del usuario hasta que se pague el resumen de la tarjeta.
 * 
 * Prioridad: Alta
 * Categoría: Functional
 */

test.describe('Credit Card Balance Impact', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC010-01: Credit card transaction does not affect immediate balance', async ({ page }) => {
    // Obtener balance actual
    const balanceWidget = page.locator('[data-testid="balance-card-ars"]');
    const initialBalance = await balanceWidget.locator('[data-testid="balance-amount"]').textContent();
    const initialBalanceNum = parseFloat(initialBalance.replace(/[^0-9.-]/g, ''));
    
    console.log(`Initial balance: ${initialBalanceNum}`);
    
    // Crear transacción con tarjeta de crédito
    await page.click('[data-testid="new-transaction-button"]');
    await expect(page.locator('[data-testid="transaction-modal"]')).toBeVisible();
    
    await page.fill('[data-testid="transaction-description"]', 'Compra con tarjeta de crédito');
    await page.fill('[data-testid="transaction-amount"]', '10000');
    await page.selectOption('[data-testid="transaction-type"]', 'gasto');
    await page.selectOption('[data-testid="transaction-currency"]', 'ARS');
    await page.selectOption('[data-testid="transaction-category"]', { index: 1 });
    
    // Marcar como crédito
    await page.check('[data-testid="transaction-is-credit"]');
    
    // Seleccionar método de pago (tarjeta de crédito)
    await page.selectOption('[data-testid="transaction-payment-method"]', { index: 1 }); // Asume primera es tarjeta
    
    // Enviar
    await page.click('[data-testid="transaction-submit-button"]');
    await expect(page.locator('[data-testid="transaction-modal"]')).not.toBeVisible();
    
    // Esperar un momento para actualización
    await page.waitForTimeout(1000);
    
    // Recargar página para asegurar datos frescos
    await page.reload();
    
    // Verificar que el balance NO cambió
    const newBalance = await balanceWidget.locator('[data-testid="balance-amount"]').textContent();
    const newBalanceNum = parseFloat(newBalance.replace(/[^0-9.-]/g, ''));
    
    console.log(`New balance after credit transaction: ${newBalanceNum}`);
    
    expect(newBalanceNum).toBe(initialBalanceNum);
    
    console.log('✅ Credit card transaction did not affect immediate balance');
  });

  test('TC010-02: Credit card debt is tracked separately', async ({ page }) => {
    // Verificar que existe un widget o sección de deuda de tarjetas
    const debtWidget = page.locator('[data-testid="credit-card-debt-widget"]');
    await expect(debtWidget).toBeVisible();
    
    // Debe mostrar la deuda total
    const debtAmount = page.locator('[data-testid="total-credit-debt"]');
    await expect(debtAmount).toBeVisible();
    
    // El valor debe ser >= 0
    const debtText = await debtAmount.textContent();
    const debtNum = parseFloat(debtText.replace(/[^0-9.-]/g, ''));
    expect(debtNum).toBeGreaterThanOrEqual(0);
    
    console.log(`✅ Credit card debt tracked: ${debtNum}`);
  });

  test('TC010-03: Paying credit card statement affects balance', async ({ page }) => {
    // Este test requiere tener un resumen de tarjeta pendiente
    
    // Navegar a resúmenes bancarios
    await page.click('[data-testid="bank-summaries-widget"]');
    
    // Verificar que hay al menos un resumen pendiente
    const pendingSummaries = page.locator('[data-testid="bank-summary-item"][data-paid="false"]');
    const count = await pendingSummaries.count();
    
    if (count === 0) {
      console.log('⚠️ No pending bank summaries to test payment');
      test.skip();
      return;
    }
    
    // Obtener balance actual
    await page.goto('/');
    const balanceWidget = page.locator('[data-testid="balance-card-ars"]');
    const initialBalance = await balanceWidget.locator('[data-testid="balance-amount"]').textContent();
    const initialBalanceNum = parseFloat(initialBalance.replace(/[^0-9.-]/g, ''));
    
    // Pagar el primer resumen
    await page.click('[data-testid="bank-summaries-widget"]');
    const firstSummary = pendingSummaries.first();
    const summaryAmount = await firstSummary.locator('[data-testid="summary-amount"]').textContent();
    const summaryAmountNum = parseFloat(summaryAmount.replace(/[^0-9.-]/g, ''));
    
    await firstSummary.locator('[data-testid="pay-summary-button"]').click();
    
    // Confirmar pago en modal
    const payModal = page.locator('[data-testid="pay-summary-modal"]');
    await expect(payModal).toBeVisible();
    
    await page.selectOption('[data-testid="payment-method"]', { index: 1 });
    await page.click('[data-testid="confirm-payment-button"]');
    
    await expect(payModal).not.toBeVisible();
    
    // Volver al dashboard y verificar balance
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    const newBalance = await balanceWidget.locator('[data-testid="balance-amount"]').textContent();
    const newBalanceNum = parseFloat(newBalance.replace(/[^0-9.-]/g, ''));
    
    // El balance debe haber disminuido por el monto del pago
    const expectedBalance = initialBalanceNum - summaryAmountNum;
    expect(Math.abs(newBalanceNum - expectedBalance)).toBeLessThan(1); // Margen de error de 1 peso
    
    console.log(`✅ Balance updated correctly after payment: ${initialBalanceNum} - ${summaryAmountNum} = ${newBalanceNum}`);
  });
});
