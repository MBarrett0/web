import { test, expect } from '@playwright/test';

test('antes/después: los mensajes pasan a resueltos con el scroll', async ({ page }) => {
  await page.goto('/web/');
  await page.locator('#automatizacion').scrollIntoViewIfNeeded();
  await expect(page.locator('.ba-msg').first()).toBeVisible();
  await expect(page.locator('.ba-msg.ok')).toHaveCount(0);
  await page.evaluate(() => {
    const wrap = document.querySelector<HTMLElement>('.ba-wrap')!;
    window.scrollTo(0, wrap.offsetTop + wrap.offsetHeight - window.innerHeight);
  });
  await expect(page.locator('.ba-msg.ok')).toHaveCount(4, { timeout: 8000 });
});

test('antes/después: con reduced motion se ve el estado final', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/web/');
  await page.locator('#automatizacion').scrollIntoViewIfNeeded();
  await expect(page.locator('.ba-msg.ok')).toHaveCount(4);
});
