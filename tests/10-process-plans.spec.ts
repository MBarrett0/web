import { test, expect } from '@playwright/test';

test('proceso: 4 pasos con qué hace cada parte', async ({ page }) => {
  await page.goto('/web/');
  await expect(page.locator('#proceso .step')).toHaveCount(4);
  await expect(page.locator('#proceso .step').first()).toContainText('Vos');
});

test('planes: 3 planes sin montos, con CTA data-plan válido', async ({ page }) => {
  await page.goto('/web/');
  const plans = page.locator('#planes .plan');
  await expect(plans).toHaveCount(3);
  await expect(page.locator('#planes')).not.toContainText('$');
  const dataPlans = await page.locator('#planes a[data-plan]').evaluateAll(
    (as) => as.map((a) => a.getAttribute('data-plan')),
  );
  expect(dataPlans).toHaveLength(3);
  dataPlans.forEach((p) => expect(p).toBeTruthy());
});
