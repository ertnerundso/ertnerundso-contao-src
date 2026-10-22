/* SCROLLEN: Lenis und interne Sprunglinks. Verhalten in config.js; Zeit in motion.css. */
import Lenis from 'lenis';

// Der Tastatur-Sprung gehört nicht zur Bewegungsinitialisierung: Er funktioniert auch ohne Lenis.
export function initSkipLink(runtime) {
  const skip = document.querySelector('.skip-link');
  const main = document.getElementById('main');
  if (!skip || !main) return;
  const originalHref = skip.getAttribute('href');
  const localHref = `${window.location.pathname}${window.location.search}#main`;
  skip.setAttribute('href', localHref);
  let temporaryTabindex = false;
  const restoreTabindex = () => {
    if (temporaryTabindex && main.getAttribute('tabindex') === '-1') main.removeAttribute('tabindex');
    temporaryTabindex = false;
  };
  runtime.listen(main, 'blur', restoreTabindex);
  runtime.listen(skip, 'click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (!main.hasAttribute('tabindex')) {
      main.setAttribute('tabindex', '-1');
      temporaryTabindex = true;
    }
    main.focus({ preventScroll: true });
    if (runtime.lenis) runtime.lenis.scrollTo(main, { offset: -runtime.headerHeight });
    else main.scrollIntoView({ block: 'start', behavior: 'auto' });
  });
  runtime.cleanup(() => {
    restoreTabindex();
    if (originalHref === null) skip.removeAttribute('href');
    else skip.setAttribute('href', originalHref);
  });
}

export function initScroll(runtime) {
  const { gsap, ScrollTrigger, config, motion, listen } = runtime;
  if (runtime.reduceMotion || runtime.coarsePointer) return;
  const lenis = new Lenis({
    duration: motion.number('motion-smooth-scroll-duration'),
    smoothWheel: config.scroll.smoothWheel,
    wheelMultiplier: config.scroll.wheelMultiplier,
  });
  runtime.lenis = lenis;
  // Ein Präferenzwechsel darf das Scrollen hinter einem offenen Menü nicht wieder starten.
  if (document.body.classList.contains('menu-open')) lenis.stop();
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  runtime.cleanup(() => {
    gsap.ticker.remove(tick);
    lenis.destroy();
    if (runtime.lenis === lenis) runtime.lenis = null;
  });
  document.querySelectorAll('a[href^="#"]:not(.skip-link)').forEach((anchor) =>
    listen(anchor, 'click', (event) => {
      let id;
      try {
        id = decodeURIComponent(anchor.getAttribute('href').slice(1));
      } catch {
        return;
      }
      const target = id && document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target, {
        offset: target.classList.contains('work') ? 0 : -runtime.headerHeight,
      });
    }),
  );
}
