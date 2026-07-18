import { test, expect } from '@playwright/test';

test('contacto: validación nativa bloquea el envío vacío', async ({ page }) => {
  await page.goto('/web/');
  await page.locator('#contacto button[type=submit]').click();
  await expect(page.locator('#contact-form input[name=name]:invalid')).toBeAttached();
});

test('contacto: el CTA de un plan precarga el servicio', async ({ page }) => {
  await page.goto('/web/');
  const planLink = page.locator('#planes a[data-plan]').first();
  const planValue = await planLink.getAttribute('data-plan');
  await planLink.click();
  await expect(page.locator('#contact-form select[name=service]')).toHaveValue(planValue!);
});

test('contacto: error de red muestra mensaje sin perder lo tipeado', async ({ page }) => {
  await page.route('**/api.web3forms.com/**', (r) => r.abort());
  await page.goto('/web/');
  await page.fill('#contact-form input[name=name]', 'Ana');
  await page.fill('#contact-form input[name=business]', 'Peluquería Test');
  await page.selectOption('#contact-form select[name=service]', { index: 1 });
  await page.fill('#contact-form textarea[name=message]', 'Quiero automatizar mis reservas.');
  await page.locator('#contacto button[type=submit]').click();
  await expect(page.locator('#form-status')).toContainText(/no se pudo/i, { timeout: 10000 });
  await expect(page.locator('#contact-form input[name=name]')).toHaveValue('Ana');
});
