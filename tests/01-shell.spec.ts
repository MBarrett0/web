import { test, expect } from '@playwright/test';

const SECTIONS = ['inicio','servicios','automatizacion','whatsapp','turnos','web','caso','proceso','planes','faq','contacto'];

test('shell: carga bajo /web/ con las 11 secciones, header sticky y CTA', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/web/');
  await expect(page).toHaveTitle(/negocio/i);
  for (const id of SECTIONS) await expect(page.locator(`#${id}`)).toBeAttached();
  await expect(page.locator('header .btn-primary')).toBeVisible();
  await expect(page.locator('footer')).toBeAttached();
  expect(errors).toEqual([]);
});
