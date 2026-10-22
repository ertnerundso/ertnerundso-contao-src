/* VERHALTEN: Technische Einstellungen aller Module.
   Farben und Animationswerte stehen in base.css bzw. motion.css.
   Vor Änderungen Umfang abstimmen; Erklärung: CSS-ANLEITUNG.md. */
export const config = {
  media: {
    mobile: '(max-width: 760px)',
    desktop: '(min-width: 761px)',
    reducedMotion: '(prefers-reduced-motion: reduce)',
    motionAllowed: '(prefers-reduced-motion: no-preference)',
    coarsePointer: '(pointer: coarse)',
  },
  header: { hideAfter: 160, directionThreshold: 8 },
  scroll: { wheelMultiplier: 0.9, smoothWheel: true },
  sliders: { edgeTolerance: 2, workScrollPadding: 0.25, minimumProgress: 0.06, journalSwipeThreshold: 50 },
  journalIndex: { pageSize: 6 },
  video: {
    frameRate: 24,
    visibilityThreshold: 0.45,
    preloadMargin: '250px 0px',
  },
  // Rechte Scroll-Skala: Anzahl der Striche; Gestaltung in CSS.
  scrollProgress: { ticks: 52 },
  // Kundenstimmen: Lesezeit pro Stimme in Millisekunden, nur im sichtbaren Bereich.
  testimonials: { autoplayDelay: 8000, visibilityThreshold: 0.25 },
  showreel: {
    scrollRange: 5.3,
    scrollRangeWithoutBenefits: 2.8,
  },
  configurator: {
    videoProgress: 0.68,
    revealProgress: 0.27,
    scaleProgress: 0.3,
    headingProgress: 0.54,
    frameTolerance: 0.04,
    endMargin: 0.05,
  },
  scene: {
    maxPixelRatio: 1.5,
    cameraFieldOfView: 35,
    cameraNear: 0.1,
    cameraFar: 100,
    cameraDistance: 14,
    pointCount: 48,
    pointRange: [11, 6, 3],
    ringRadius: 3.7,
    ringTube: 0.006,
    ringSegments: [3, 110],
    ringPosition: [2.8, 0, -2],
    ringTilt: 0.45,
  },
  // ScrollTrigger-Grenzen der bestehenden Effekte.
  triggers: {
    showreel: {
      start: 'top top',
    },
    benefits: {
      impactStart: 'top 85%',
      columnsStart: 'top 86%',
    },
    configurator: {
      end: 'bottom bottom',
      refreshPriority: -1,
    },
    animations: {
      revealStart: 'top 88%',
      imageStart: 'top 85%',
      servicesStart: 'top 82%',
      dataStart: 'top 90%',
      splitStart: 'top 88%',
      parallaxStart: 'top bottom',
      parallaxEnd: 'bottom top',
    },
  },
  // Feste Frontend-Dateien kommen aus dem Repository. CMS-Medien bleiben bei Contao.
  assets: {
    manualBookPoster: '/files/site/montage-book-poster.jpg',
  },
  preview: { selector: 'html[data-site-preview="true"]' },
  contact: {
    endpoint: 'https://forms.ertnerundso.de/api/contact',
    turnstileScript: 'https://challenges.cloudflare.com/turnstile/v0/api.js',
    turnstileSiteKey: '0x4AAAAAADqKNDGl_9CgNW_W',
    privacyPath: '/datenschutz/',
    intentParameter: 'anliegen',
    storyboardIntent: 'storyboard',
  },
  booking: {
    origin: 'https://cal.ertnerundso.de',
    link: 'eunds/30min',
    namespace: 'ertner',
    selector: '[data-cal-inline]',
  },
  // Analytics-Ereignisse nur auf Live-Domains und nach Performance-Einwilligung.
  analytics: {
    hosts: ['ertnerundso.de', 'ertnerundso.com'],
    googleMeasurementId: 'G-BFB4EHKRX2',
    consentCategory: 'performance',
    // Offizielle Window-Ereignisse; die naechste Task liest die gespeicherte Wahl.
    withdrawal: {
      categories: ['performance', 'targeting'],
      events: [
        'CookieScriptLoaded', 'CookieScriptAccept', 'CookieScriptAcceptAll',
        'CookieScriptReject', 'CookieScriptCategory-performance', 'CookieScriptCategory-targeting',
      ],
      settleDelay: 0,
    },
    events: {
      contactIntent: 'contact_intent',
      contactSuccess: 'contact_submit_success',
      bookingClick: 'booking_click',
      emailClick: 'email_click',
      showreelPlay: 'showreel_play',
    },
  },
};
