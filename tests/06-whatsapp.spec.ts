import { test, expect } from '@playwright/test';

test('whatsapp: la conversación se reproduce sola al entrar en viewport', async ({ page }) => {
  await page.goto('/web/');
  await page.locator('#whatsapp .wa-phone').scrollIntoViewIfNeeded();
  const last = page.locator('#whatsapp .wa-msg').last();
  await expect(last).toBeVisible({ timeout: 15000 });
  // Wait for animation to complete (timeline is ~5.05s, plus time for trigger to fire)
  await page.waitForTimeout(6000);
  const op = await last.evaluate((el) => Number(getComputedStyle(el).opacity));
  expect(op).toBeGreaterThan(0.9);
});

test('whatsapp: sin JS-animación (reduced motion) todo el chat es visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/web/');
  await page.locator('#whatsapp .wa-phone').scrollIntoViewIfNeeded();
  for (const msg of await page.locator('#whatsapp .wa-msg').all()) await expect(msg).toBeVisible();
});
