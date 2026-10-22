import { test, expect } from '@playwright/test';

async function openFixture(page, { legacyHref = false, temporaryTabindex = false } = {}) {
  await page.route('**/*', (route) =>
    new URL(route.request().url()).hostname === '127.0.0.1'
      ? route.continue()
      : route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
  );
  await page.goto('/tests/fixtures/skip-link.html?preview=1#top');
  // Die neue unabhängige Initialisierung muss auch außerhalb der Lenis-Betriebsarten laufen.
  await expect(page.locator('.skip-link')).toHaveAttribute('href', '/tests/fixtures/skip-link.html?preview=1#main');
  if (legacyHref) await page.locator('.skip-link').evaluate((el) => el.setAttribute('href', '#main'));
  if (temporaryTabindex) await page.locator('main').evaluate((el) => el.removeAttribute('tabindex'));
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
}

async function expectContentFocus(page) {
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  expect(new URL(page.url()).pathname).toBe('/tests/fixtures/skip-link.html');
  await page.keyboard.press('Tab');
  await expect(page.locator('#content-link')).toBeFocused();
  await expect(page.locator('#header-link')).not.toBeFocused();
}

test('normal motion skips header navigation and preserves a same-page URL despite base href', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await openFixture(page);
  await expectContentFocus(page);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});

test('reduced motion keeps a functional skiplink and cleans up a temporary target tabindex', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openFixture(page, { legacyHref: true, temporaryTabindex: true });
  await expectContentFocus(page);
  await expect(page.locator('main')).not.toHaveAttribute('tabindex');
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});

test.describe('coarse pointer', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test('keyboard activation focuses content without the smooth-scroll module', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openFixture(page);
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
    await expectContentFocus(page);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('the template-style same-page link bypasses the base URL and skips the header natively', async ({ page }) => {
    await page.goto('/tests/fixtures/skip-link.html');
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
    await expectContentFocus(page);
    expect(new URL(page.url()).hash).toBe('#main');
  });
});
