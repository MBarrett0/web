import { test, expect } from '@playwright/test';

test('whatsapp: la conversación se reproduce sola al entrar en viewport', async ({ page }) => {
  await page.goto('/web/');
  await page.locator('#whatsapp .wa-phone').scrollIntoViewIfNeeded();
  const last = page.locator('#whatsapp .wa-chat .wa-msg').last();
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
  for (const msg of await page.locator('#whatsapp .wa-chat .wa-msg').all()) await expect(msg).toBeVisible();
});

test('whatsapp: el calendario existe con mes de 31 días y jueves 9 objetivo', async ({ page }) => {
  await page.goto('/web/');
  const cal = page.locator('#whatsapp .wa-cal');
  await expect(cal).toHaveCount(1);
  await expect(page.locator('#whatsapp .wa-cal-month .d')).toHaveCount(31);
  await expect(page.locator('#whatsapp .wa-cal-month .d.target')).toHaveText('9');
  await expect(page.locator('#whatsapp .wa-slot.free')).toHaveCount(3);
  await expect(page.locator('#whatsapp .wa-slot.busy')).toHaveCount(2);
});

test('whatsapp: con reduced motion el calendario muestra el día con la reserva puesta', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/web/');
  await page.locator('#whatsapp .wa-cal').scrollIntoViewIfNeeded();
  await expect(page.locator('#whatsapp .wa-cal-day')).toBeVisible();
  await expect(page.locator('#whatsapp .wa-booking')).toBeVisible();
  await expect(page.locator('#whatsapp .wa-cal-month')).toBeHidden();
  // el tag "libre" del slot 15:00 queda oculto cuando está reservado
  await expect(page.locator('#whatsapp .wa-slot.target .tag')).toBeHidden();
});
