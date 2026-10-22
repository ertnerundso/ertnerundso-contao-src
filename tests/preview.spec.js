import { test, expect } from '@playwright/test';

test('isolated preview validates locally without outbound services or live success events', async ({ page }) => {
  const outgoing = [];
  page.on('request', request => {
    if (new URL(request.url()).hostname !== '127.0.0.1') outgoing.push(request.url());
  });
  await page.goto('/tests/fixtures/preview.html');
  await page.waitForFunction(() => window.previewReady);
  await expect(page.locator('[data-cal-inline]')).toContainText('deaktiviert');
  await page.locator('[name="email"]').fill('preview@example.invalid');
  await page.locator('[name="message"]').fill('Nur eine lokale Simulation.');
  await page.locator('[name="consent"]').check();
  await page.getByRole('button', { name: 'Absenden' }).click();
  await expect(page.getByRole('status')).toContainText('keine Anfrage versendet');
  await page.getByRole('link', { name: 'Buchen' }).click();
  expect(page.url()).toContain('preview.html');
  expect(outgoing).toEqual([]);
  expect(await page.evaluate(() => window.liveSuccess)).toBeUndefined();
  expect(await page.locator('script[src*="turnstile"], iframe').count()).toBe(0);
});


test('storyboard context reaches the editable message without overwriting an existing draft', async ({ page }) => {
  await page.goto('/tests/fixtures/preview.html?anliegen=storyboard');
  await page.waitForFunction(() => window.previewReady);
  await expect(page.locator('[name="message"]')).toHaveValue(/kostenloses Storyboard/);
  await page.locator('[name="message"]').fill('Mein eigener Entwurf.');
  await page.evaluate(async () => {
    const [{ config }, { initForms }] = await Promise.all([import('/src/config.js'), import('/src/forms.js')]);
    initForms({ config, listen: (node, event, callback, options) => node.addEventListener(event, callback, options) });
  });
  await expect(page.locator('[name="message"]')).toHaveValue('Mein eigener Entwurf.');
});
