import { test, expect } from '@playwright/test';

test('servicios: 4 filas con anclas a sus demos', async ({ page }) => {
  await page.goto('/web/');
  const rows = page.locator('#servicios .svc');
  await expect(rows).toHaveCount(4);
  for (const anchor of ['#automatizacion', '#whatsapp', '#turnos', '#web'])
    await expect(page.locator(`#servicios a[href="${anchor}"]`)).toBeAttached();
});
