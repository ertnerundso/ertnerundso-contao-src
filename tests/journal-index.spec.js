import { test, expect } from '@playwright/test';

async function startJournal(page) {
  await page.addScriptTag({ type: 'module', content: `
    import { initJournalIndex } from '/src/journal-index.js';
    window.journalCleanup = [];
    initJournalIndex({
      config: { journalIndex: { pageSize: 6 } },
      listen: (element, event, listener) => element.addEventListener(event, listener),
      cleanup: callback => window.journalCleanup.push(callback),
    });
  ` });
}

for (const width of [390, 760, 1440, 1920]) {
  test(`editorial journal index fits ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tests/fixtures/journal-index.html');
    await startJournal(page);

    await expect(page.locator('.journal-index-item')).toHaveCount(8);
    await expect(page.locator('.journal-index-item:visible')).toHaveCount(7);
    await expect(page.locator('.journal-index-toolbar')).toBeVisible();
    await expect(page.locator('.journal-index-item:first-child + .journal-index-toolbar')).toHaveCount(1);
    await expect(page.locator('.journal-index-item h1')).toHaveCount(0);
    await expect(page.locator('.journal-index-item h3')).toHaveCount(8);
    await expect(page.locator('.inner-hero h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);

    await page.locator('.journal-index-more').click();
    await expect(page.locator('.journal-index-item:visible')).toHaveCount(8);
    await page.getByRole('button', { name: 'Montage' }).click();
    await expect(page.locator('.journal-index-item:visible')).toHaveCount(2);
    await expect(page.locator('.journal-index-item:first-child')).toBeVisible();
    await expect(page.locator('.journal-index-status')).toHaveText('1 / 1 Artikel');
    await page.getByRole('button', { name: 'Alle', exact: true }).click();
    await expect(page.locator('.journal-index-item:visible')).toHaveCount(7);
  });
}

test('journal remains complete without JavaScript', async ({ page }) => {
  await page.goto('/tests/fixtures/journal-index.html');
  await expect(page.locator('.journal-index-item:visible')).toHaveCount(8);
  await expect(page.locator('.journal-index-toolbar')).toHaveCount(0);
  await expect(page.locator('.journal-index-item:first-child h3 a')).toHaveAttribute('href', '/tests/fixtures/journal-article.html');
});


test('explicit CMS topic survives title changes and highlighting follows the native flag', async ({ page }) => {
  await page.goto('/tests/fixtures/journal-index.html');
  await page.locator('.journal-index-item').evaluateAll(cards => {
    cards[0].dataset.journalFeatured = '0';
    cards[2].dataset.journalFeatured = '1';
    cards[3].querySelector('h3 a').textContent = 'Ein ganz anderer Titel';
    window.originalJournalOrder = cards.map(card => card.querySelector('h3').textContent);
  });
  await startJournal(page);
  await expect(page.locator('.journal-index-item:first-child h3')).toHaveText('Technische Animationen für Industrie');
  await expect(page.locator('.is-journal-featured')).toHaveCount(1);
  await page.getByRole('button', { name: 'Montage', exact: true }).click();
  await expect(page.locator('.journal-index-item:visible h3')).toHaveText(['Technische Animationen für Industrie', 'Ein ganz anderer Titel']);
  await page.evaluate(() => window.journalCleanup.forEach(cleanup => cleanup()));
  await expect(page.locator('.is-journal-featured')).toHaveCount(0);
  await expect(page.locator('.journal-index-item:visible')).toHaveCount(8);
  expect(await page.locator('.journal-index-item h3').allTextContents()).toEqual(await page.evaluate(() => window.originalJournalOrder));
  await expect(page.locator('[data-journal-topic="assembly"]')).toHaveCount(1);
});

test('no highlighted record uses normal paging and no arbitrary first-card promotion', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/tests/fixtures/journal-index.html');
  await page.locator('.journal-index-item').evaluateAll(cards => cards.forEach(card => { card.dataset.journalFeatured = '0'; }));
  await startJournal(page);
  await expect(page.locator('.is-journal-featured')).toHaveCount(0);
  const normalMinimum = await page.locator('.journal-index-item').nth(1).evaluate(card => getComputedStyle(card).minHeight);
  await expect(page.locator('.journal-index-item').first()).toHaveCSS('min-height', normalMinimum);
  await expect(page.locator('.journal-index-item').first().locator('.journal-index-media')).toHaveCSS('grid-column-start', '2');
  await expect(page.locator('.journal-index-item').first().locator('.journal-index-read')).toBeHidden();
  await expect(page.locator('.journal-index-item:visible')).toHaveCount(6);
  await page.getByRole('button', { name: 'Montage', exact: true }).click();
  await expect(page.locator('.journal-index-item:visible')).toHaveCount(1);
  await expect(page.locator('.journal-index-status')).toHaveText('1 / 1 Artikel');
});
