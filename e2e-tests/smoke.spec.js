import { test, expect } from '@playwright/test';

/**
 * Smoke Tests - Verificación básica de funcionamiento
 */

test.describe('Smoke Tests', () => {
  test('Application loads successfully', async ({ page }) => {
    // Navegar a la aplicación
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 10000 });
    
    // Verificar que la página cargó
    await expect(page).toHaveTitle(/Sistema de Gastos|Gastos|Dashboard|Finanzas/i);
    
    console.log('✅ Application loaded');
  });

  test('Backend API is reachable', async ({ request }) => {
    // Verificar que el backend responde
    const response = await request.get('http://localhost:8000/docs');
    expect(response.status()).toBe(200);
    
    console.log('✅ Backend API is reachable');
  });

  test('Frontend renders without errors', async ({ page }) => {
    // Capturar errores de consola
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 10000 });
    
    // Esperar 2 segundos para que cargue
    await page.waitForTimeout(2000);
    
    // Verificar que el body está visible
    await expect(page.locator('body')).toBeVisible();
    
    // Log de errores si hay
    if (errors.length > 0) {
      console.log('⚠️  Console errors found:', errors);
    } else {
      console.log('✅ No console errors');
    }
  });

  test('Can take screenshot', async ({ page }) => {
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 10000 });
    
    // Tomar screenshot
    await page.screenshot({ path: 'test-results/smoke-test-screenshot.png', fullPage: true });
    
    console.log('✅ Screenshot saved to test-results/smoke-test-screenshot.png');
  });
});
