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

export function initAnalytics(runtime) {
  const { config, listen } = runtime;
  const settings = config.analytics;
  if (document.querySelector(config.preview.selector) ||
      !settings.hosts.includes(window.location.hostname)) return;

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
