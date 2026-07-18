import { test, expect } from '@playwright/test';

test('faq: 6 preguntas expandibles', async ({ page }) => {
  await page.goto('/web/');
  const qas = page.locator('#faq details.qa');
  await expect(qas).toHaveCount(6);
  const first = qas.first();
  await first.locator('summary').click();
  await expect(first).toHaveAttribute('open', '');
});
