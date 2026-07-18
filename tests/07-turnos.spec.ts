import { test, expect } from '@playwright/test';

test('turnos: la agenda se llena sola y reasigna una cancelación', async ({ page }) => {
  await page.goto('/web/');
  await page.locator('#turnos .tn-board').scrollIntoViewIfNeeded();
  await expect(page.locator('#turnos .tn-chip').last()).toBeVisible({ timeout: 15000 });
  await expect(page.locator('#turnos .tn-toast')).toBeVisible({ timeout: 15000 });
});

test('turnos: con reduced motion la agenda se ve completa', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/web/');
  await page.locator('#turnos .tn-board').scrollIntoViewIfNeeded();
  for (const chip of await page.locator('#turnos .tn-chip').all()) await expect(chip).toBeVisible();
});
