import { test, expect } from '@playwright/test';

test('gsap inicializa y marca el documento', async ({ page }) => {
  await page.goto('/web/');
  await expect(page.locator('html')).toHaveAttribute('data-gsap', 'ready');
});

test('con reduced motion el contenido queda visible sin animar', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/web/');
  await expect(page.locator('html')).toHaveAttribute('data-gsap', 'ready');
  // nada debe quedar con opacity 0 (los estados ocultos solo los setea GSAP al animar)
  const hidden = await page.locator('[data-reveal]').evaluateAll(
    (els) => els.filter((el) => getComputedStyle(el).opacity === '0').length,
  );
  expect(hidden).toBe(0);
});
