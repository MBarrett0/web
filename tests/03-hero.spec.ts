import { test, expect } from '@playwright/test';

test('hero: titular spliteado, CTAs correctos y visible tras la intro', async ({ page }) => {
  await page.goto('/web/');
  const h1 = page.locator('#inicio h1');
  await expect(h1).toBeAttached();
  expect(await page.locator('#inicio .w').count()).toBeGreaterThan(3);
  await expect(page.locator('#inicio a[href="#contacto"]')).toBeVisible();
  await expect(page.locator('#inicio a[href="#automatizacion"]')).toBeVisible();
  // tras la intro las palabras quedan en su lugar (yPercent 0)
  await page.waitForTimeout(2600);
  const y = await page.locator('#inicio .w').first().evaluate((el) => getComputedStyle(el).transform);
  expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(y);
});
