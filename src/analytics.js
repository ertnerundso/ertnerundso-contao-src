/* ANALYTICS: Nur anonyme Ereignisse nach CookieScript-Einwilligung.
   Der bestehende GTM-Container stellt Google Tag und Umami-Tracker bereit. */
export function hasAnalyticsConsent(hostname, cookieScript, config) {
  if (!config.hosts.includes(hostname)) return false;
  try {
    const state = cookieScript?.instance?.currentState?.();
    return state?.action === 'accept' &&
      state.categories?.includes(config.consentCategory) === true;
  } catch {
    return false;
  }
}

// Ungueltige/noch nicht geladene CMP-Zustaende sind unbekannt, keine Ablehnung.
function consentCategories(cookieScript, categories) {
  try {
    const state = cookieScript?.instance?.currentState?.();
    if (state?.action !== 'reject' &&
        (state?.action !== 'accept' || !Array.isArray(state.categories))) return null;
    return categories.map((category) =>
      state.action === 'accept' && state.categories.includes(category),
    );
  } catch {
    return null;
  }
}

function watchConsentWithdrawal(runtime, settings) {
  const { categories, events, settleDelay } = settings.withdrawal;
  let previous = consentCategories(window.CookieScript, categories);
  let pending = null;
  let reloading = false;
  let disposed = false;
  const update = () => {
    pending = null;
    if (disposed || reloading) return;
    const next = consentCategories(window.CookieScript, categories);
    if (!next) return;
    const withdrawn = previous?.some((granted, index) => granted && !next[index]);
    previous = next;
    if (!withdrawn) return;
    // Erst nach der CMP-Persistenz neu laden: bereits gestartete Tracker enden.
    reloading = true;
    window.location.reload();
  };
  for (const event of events) {
    runtime.listen(window, event, () => {
      if (!disposed && !reloading && pending === null) {
        pending = window.setTimeout(update, settleDelay);
      }
    });
  }
  runtime.cleanup?.(() => {
    disposed = true;
    window.clearTimeout(pending);
  });
}

export function initAnalytics(runtime) {
  const { config, listen } = runtime;
  const settings = config.analytics;
  if (document.querySelector(config.preview.selector) ||
      !settings.hosts.includes(window.location.hostname)) return;

  watchConsentWithdrawal(runtime, settings);

  const track = (name) => {
    if (!hasAnalyticsConsent(window.location.hostname, window.CookieScript, settings)) return;
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    gtag('event', name, { send_to: settings.googleMeasurementId });
    window.umami?.track?.(name);
  };

  listen(document, 'click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('.showreel-action')) {
      track(settings.events.showreelPlay);
      return;
    }
    const link = target.closest('a[href]');
    if (!link) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin === config.booking.origin) {
      track(settings.events.bookingClick);
    } else if (url.protocol === 'mailto:') {
      track(settings.events.emailClick);
    } else if (
      url.origin === window.location.origin &&
      (['/kontakt', '/en/kontakt'].includes(url.pathname.replace(/\/+$/, '')) ||
        url.hash === '#contact')
    ) {
      track(settings.events.contactIntent);
    }
  });

  listen(document, 'eo:contact-success', () => track(settings.events.contactSuccess));
}
