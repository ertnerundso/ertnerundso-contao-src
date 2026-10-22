import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const fixture = `<!doctype html><html><body>
  <a href="/kontakt/" id="contact">Kontakt</a>
  <a href="/kontakt?anliegen=storyboard" id="contact-native">Storyboard</a>
  <a href="/en/kontakt" id="contact-en">Contact</a>
  <a href="https://cal.ertnerundso.de/eunds/30min" id="booking">Termin</a>
  <button class="showreel-action" type="button">Video</button>
</body></html>`;

async function start(page, hostname, consent) {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/src/analytics.js') {
      return route.fulfill({
        contentType: 'text/javascript',
        body: await readFile(new URL('../src/analytics.js', import.meta.url), 'utf8'),
      });
    }
    if (url.pathname === '/src/config.js') {
      return route.fulfill({
        contentType: 'text/javascript',
        body: await readFile(new URL('../src/config.js', import.meta.url), 'utf8'),
      });
    }
    return route.fulfill({ contentType: 'text/html', body: fixture });
  });
  await page.goto(`https://${hostname}/`);
  await page.evaluate(async (accepted) => {
    document.querySelectorAll('a').forEach((link) =>
      link.addEventListener('click', (event) => event.preventDefault()),
    );
    window.CookieScript = {
      instance: {
        currentState: () => ({
          action: accepted ? 'accept' : 'reject',
          categories: accepted ? ['strict', 'performance'] : ['strict'],
        }),
      },
    };
    window.dataLayer = [];
    window.umamiEvents = [];
    window.umami = { track: (name) => window.umamiEvents.push(name) };
    const [{ config }, { initAnalytics }] = await Promise.all([
      import('/src/config.js'),
      import('/src/analytics.js'),
    ]);
    initAnalytics({
      config,
      listen: (target, type, callback) => target.addEventListener(type, callback),
    });
  }, consent);
}

test('consented live actions reach GTM and Umami without personal data', async ({ page }) => {
  await start(page, 'ertnerundso.de', true);
  await page.locator('#contact').click();
  await page.locator('#booking').click();
  await page.locator('.showreel-action').click();
  await page.evaluate(() => document.dispatchEvent(new Event('eo:contact-success')));
  const events = await page.evaluate(() => ({
    google: window.dataLayer.map((command) => Array.from(command)),
    umami: window.umamiEvents,
  }));
  expect(events.google).toEqual([
    ['event', 'contact_intent', { send_to: 'G-BFB4EHKRX2' }],
    ['event', 'booking_click', { send_to: 'G-BFB4EHKRX2' }],
    ['event', 'showreel_play', { send_to: 'G-BFB4EHKRX2' }],
    ['event', 'contact_submit_success', { send_to: 'G-BFB4EHKRX2' }],
  ]);
  expect(events.umami).toEqual(events.google.map(([, event]) => event));
});

test('rejected consent suppresses custom analytics events', async ({ page }) => {
  await start(page, 'ertnerundso.de', false);
  await page.locator('#contact').click();
  await page.evaluate(() => document.dispatchEvent(new Event('eo:contact-success')));
  expect(await page.evaluate(() => window.dataLayer)).toEqual([]);
  expect(await page.evaluate(() => window.umamiEvents)).toEqual([]);
});

test('staging never sends analytics events, even with a mock consent', async ({ page }) => {
  await start(page, 'staging.ertnerundso.de', true);
  await page.locator('#contact').click();
  await page.evaluate(() => document.dispatchEvent(new Event('eo:contact-success')));
  expect(await page.evaluate(() => window.dataLayer)).toEqual([]);
  expect(await page.evaluate(() => window.umamiEvents)).toEqual([]);
});


test('native slashless DE and EN contact paths count the same intent', async ({ page }) => {
  await start(page, 'ertnerundso.com', true);
  await page.locator('#contact-native').click();
  await page.locator('#contact-en').click();
  expect(await page.evaluate(() => window.umamiEvents)).toEqual(['contact_intent', 'contact_intent']);
});

test('withdrawal stops subsequent events without collecting field values', async ({ page }) => {
  await start(page, 'ertnerundso.com', true);
  await page.locator('#contact').click();
  await page.evaluate(() => {
    window.CookieScript.instance.currentState = () => ({ action: 'reject', categories: ['strict'] });
  });
  await page.locator('#booking').click();
  expect(await page.evaluate(() => window.umamiEvents)).toEqual(['contact_intent']);
});

// Echte Browsernavigation mit persistierter CMP-Nachbildung, ohne Drittanfragen.
async function startConsentLifecycle(page, initial, { preview = false, hostname = 'ertnerundso.com' } = {}) {
  await page.addInitScript((consent) => {
    if (!sessionStorage.getItem('cmp-fixture-initialized')) {
      sessionStorage.setItem('cmp-fixture-initialized', '1');
      sessionStorage.setItem('cmp-fixture-choice', JSON.stringify(consent));
    }
    const loads = Number(sessionStorage.getItem('cmp-fixture-loads') || 0) + 1;
    sessionStorage.setItem('cmp-fixture-loads', String(loads));
  }, initial);
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (['/src/analytics.js', '/src/config.js'].includes(url.pathname)) {
      return route.fulfill({ contentType: 'text/javascript', body: await readFile(new URL('..' + url.pathname, import.meta.url), 'utf8') });
    }
    expect(url.hostname).toBe(hostname);
    return route.fulfill({ contentType: 'text/html', body: `<!doctype html>
      <html${preview ? ' data-site-preview="true"' : ''}><body><script type="module">
        import { config } from '/src/config.js';
        import { initAnalytics } from '/src/analytics.js';
        window.fixtureState = JSON.parse(sessionStorage.getItem('cmp-fixture-choice'));
        window.fixtureReadError = false;
        window.CookieScript = { instance: { currentState() {
          if (window.fixtureReadError) throw new Error('CMP not ready');
          return window.fixtureState;
        } } };
        window.fixtureChoice = (state, events) => {
          // Wie eine CMP: Ereignis zuerst, danach Wahl schreiben, bevor Task endet.
          for (const name of events) window.dispatchEvent(new Event(name));
          window.fixtureState = state;
          sessionStorage.setItem('cmp-fixture-choice', JSON.stringify(state));
        };
        initAnalytics({ config, listen: (target, type, handler) => target.addEventListener(type, handler) });
        window.dispatchEvent(new Event('CookieScriptLoaded'));
        window.fixtureReady = true;
      </script></body></html>` });
  });
  await page.goto('https://' + hostname + '/');
  await expect.poll(() => page.evaluate(() => window.fixtureReady)).toBe(true);
}

const granted = (categories) => ({ action: 'accept', categories: ['strict', ...categories] });
const rejected = { action: 'reject', categories: ['strict'] };
async function loads(page) {
  return page.evaluate(() => Number(sessionStorage.getItem('cmp-fixture-loads')));
}
async function choice(page, state, events) {
  await page.evaluate(({ state, events }) => window.fixtureChoice(state, events), { state, events });
}
async function settle(page) {
  // Zwei nachgelagerte Tasks sichern den Negativfall ohne CMP-/Netzwerk-Timing.
  await page.evaluate(() => new Promise((resolve) => setTimeout(() => setTimeout(resolve, 0), 0)));
}

for (const category of ['performance', 'targeting']) {
  test(`${category} withdrawal reloads once after persistence and stays rejected on the new page`, async ({ page }) => {
    await startConsentLifecycle(page, granted([category]));
    await settle(page);
    expect(await loads(page)).toBe(1);
    await Promise.all([
      page.waitForEvent('load'),
      choice(page, rejected, ['CookieScriptReject', 'CookieScriptAccept', 'CookieScriptReject']),
    ]);
    await expect.poll(() => page.evaluate(() => window.fixtureReady)).toBe(true);
    expect(await loads(page)).toBe(2);
    expect(await page.evaluate(() => window.fixtureState)).toEqual(rejected);
    await choice(page, rejected, ['CookieScriptLoaded', 'CookieScriptReject', 'CookieScriptReject']);
    await settle(page);
    expect(await loads(page)).toBe(2);
  });
}

test('partial acceptance reloads on targeting withdrawal even when performance stays granted', async ({ page }) => {
  await startConsentLifecycle(page, granted(['performance', 'targeting']));
  await Promise.all([page.waitForEvent('load'), choice(page, granted(['performance']), ['CookieScriptAccept'])]);
  await expect.poll(() => page.evaluate(() => window.fixtureReady)).toBe(true);
  await settle(page);
  expect(await loads(page)).toBe(2);
  expect(await page.evaluate(() => window.fixtureState.categories)).toEqual(['strict', 'performance']);
});

test('initial unknown/rejected, grants and repeated official category events never reload', async ({ page }) => {
  await startConsentLifecycle(page, null);
  await settle(page);
  await choice(page, rejected, ['CookieScriptLoaded', 'CookieScriptReject']);
  await settle(page);
  await choice(page, granted(['performance', 'targeting']), ['CookieScriptAcceptAll', 'CookieScriptCategory-performance', 'CookieScriptCategory-targeting']);
  await settle(page);
  await choice(page, granted(['performance', 'targeting']), ['CookieScriptLoaded', 'CookieScriptAccept', 'CookieScriptCategory-targeting']);
  await settle(page);
  expect(await loads(page)).toBe(1);
});

test('CMP read errors neither reload nor forget the last valid granted choice', async ({ page }) => {
  await startConsentLifecycle(page, granted(['performance']));
  await page.evaluate(() => {
    window.fixtureReadError = true;
    window.dispatchEvent(new Event('CookieScriptReject'));
  });
  await settle(page);
  expect(await loads(page)).toBe(1);
  await page.evaluate(() => { window.fixtureReadError = false; });
  await Promise.all([page.waitForEvent('load'), choice(page, rejected, ['CookieScriptReject'])]);
  await expect.poll(() => page.evaluate(() => window.fixtureReady)).toBe(true);
  await settle(page);
  expect(await loads(page)).toBe(2);
});

for (const mode of [{ preview: true }, { hostname: 'staging.ertnerundso.de' }]) {
  test(`${mode.preview ? 'preview marker' : 'non-live hostname'} never reloads on consent withdrawal`, async ({ page }) => {
    await startConsentLifecycle(page, granted(['performance', 'targeting']), mode);
    await choice(page, rejected, ['CookieScriptReject']);
    await settle(page);
    expect(await loads(page)).toBe(1);
  });
}
