import { test, expect } from '@playwright/test';

test('laptop 3d: el canvas WebGL monta al llegar a la sección', async ({ page }) => {
  await page.goto('/web/');
  await page.locator('#web').scrollIntoViewIfNeeded();
  await expect(page.locator('#web canvas')).toBeVisible({ timeout: 20000 });
});

test('laptop 3d: sin WebGL se muestra el fallback estático', async ({ page }) => {
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    // @ts-expect-error override para el test
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      if (String(type).startsWith('webgl')) return null;
      return orig.call(this, type, ...args);
    };
  });
  await page.goto('/web/');
  await page.locator('#web').scrollIntoViewIfNeeded();
  await expect(page.locator('#web .l3d-fallback')).toBeVisible({ timeout: 15000 });
});
