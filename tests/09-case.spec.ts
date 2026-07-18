import { test, expect } from '@playwright/test';

test('caso: muestra Protección Choferes con link al sitio real', async ({ page }) => {
  await page.goto('/web/');
  await expect(page.locator('#caso')).toContainText('Protección Choferes');
  const link = page.locator('#caso a[href="https://proteccionchoferes.org.uy"]');
  await expect(link).toBeAttached();
  await expect(link).toHaveAttribute('rel', /noopener/);
});
