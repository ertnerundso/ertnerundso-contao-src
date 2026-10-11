/* JOURNAL: Ganze Karten statt angeschnittener Vorschau; seitenweise Klick-/Tastatur-/Wischbedienung.
   Kartengröße: layout.css, Gestaltung: Systemdateien; Wischschwelle: config.js. */
import { enhanceButton } from './buttons.js';

export function initJournal(runtime) {
  document.querySelectorAll('.journal .journal-list').forEach(list => {
    if (!list.closest('[data-journal-related]')) initJournalSlider(runtime, list);
  });
}

// Startseite und Artikelvorschläge verwenden dieselbe Bedienung und Karteneinteilung.
export function initJournalSlider(runtime, list) {
  const { config, listen, observer } = runtime;
  const originalAttributes = ['tabindex', 'role', 'aria-label'].map(name => [name, list.getAttribute(name)]);
  const cards = [...list.querySelectorAll(':scope > .journal-row')];
  if (!cards.length) return;
  const english = document.documentElement.lang === 'en';
  const controls = document.createElement('div');
  controls.className = 'journal-slider-controls';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', english ? 'Browse journal articles' : 'Journalbeiträge durchblättern');
  const status = document.createElement('span');
  status.className = 'journal-slider-status micro';
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  let columns = 1, page = 0, starts = [0];
  const buttons = [-1, 1].map(direction => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button btn--secondary btn--icon journal-page-button';
    button.textContent = direction < 0 ? (english ? 'Back' : 'Zurück') : (english ? 'Next' : 'Weiter');
    button.setAttribute('aria-label', direction < 0
      ? (english ? 'Previous articles' : 'Vorherige Beiträge')
      : (english ? 'Next articles' : 'Nächste Beiträge'));
    button.classList.toggle('journal-page-previous', direction < 0);
    enhanceButton(button);
    listen(button, 'click', () => show(page + direction));
    controls.append(button);
    return button;
  });
  controls.replaceChildren(buttons[0], status, buttons[1]);
  // Die Navigation gehört zum Abschnittskopf; native Contao-Links bleiben erhalten.
  const heading = list.closest('.journal').querySelector('.section-head');
  const journalLink = heading?.querySelector(':scope > .text-link');
  const actions = heading ? document.createElement('div') : undefined;
  const originalLinkSibling = journalLink?.nextSibling;
  if (actions) {
    actions.className = 'journal-heading-actions';
    if (journalLink) actions.append(journalLink);
    actions.append(controls);
    heading.append(actions);
  } else list.before(controls);
  list.tabIndex = 0;
  list.setAttribute('role', 'region');
  list.setAttribute('aria-label', english ? 'Journal articles' : 'Journalbeiträge');
  list.classList.add('is-journal-paged');
  const addedLinks = [];
  cards.forEach((card, index) => {
    const category = card.querySelector('.row-category');
    if (category) category.dataset.journalIndex = String(index + 1).padStart(2, '0');
    const headlineLink = card.querySelector('h3 a');
    if (!headlineLink) return;
    const link = headlineLink.cloneNode(false);
    link.removeAttribute('id');
    link.className = 'button btn--secondary journal-read-link';
    link.textContent = english ? 'Read article' : 'Artikel lesen';
    link.setAttribute('aria-label', `${link.textContent}: ${headlineLink.textContent.trim()}`);
    enhanceButton(link);
    card.append(link);
    addedLinks.push(link);
  });
  function show(nextPage) {
    page = Math.max(0, Math.min(starts.length - 1, nextPage));
    const start = starts[page], end = Math.min(cards.length, start + columns);
    const focused = document.activeElement;
    cards.forEach((card, index) => {
      card.hidden = index < start || index >= end;
      card.classList.toggle('is-journal-first', index === start);
    });
    // Ausgeblendete Links bleiben weder im Tab-Pfad noch im Fokus hängen.
    if (cards.some(card => card.hidden && card.contains(focused))) list.focus({ preventScroll: true });
    buttons[0].disabled = page === 0;
    buttons[1].disabled = page === starts.length - 1;
    controls.hidden = starts.length === 1;
    status.textContent = `${String(start + 1).padStart(2, '0')}–${String(end).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
    runtime.ScrollTrigger.refresh();
  }
  function resize() {
    const styles = getComputedStyle(document.documentElement);
    const minWidth = parseFloat(styles.getPropertyValue('--layout-journal-card-min')) * parseFloat(styles.fontSize);
    const maximum = parseInt(styles.getPropertyValue('--layout-journal-columns-max'), 10);
    const nextColumns = Math.min(cards.length, maximum, Math.max(1, Math.floor(list.clientWidth / minWidth)));
    if (nextColumns === columns && list.style.gridTemplateColumns) return;
    const previousStart = starts[page];
    columns = nextColumns;
    list.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
    const last = Math.max(0, cards.length - columns);
    starts = [0];
    while (starts.at(-1) < last) starts.push(Math.min(last, starts.at(-1) + columns));
    page = starts.findLastIndex(start => start <= previousStart);
    show(page);
  }
  listen(list, 'keydown', event => {
    if (event.target !== list) return;
    const keys = { ArrowLeft: page - 1, ArrowRight: page + 1, Home: 0, End: starts.length - 1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    show(keys[event.key]);
  });
  let touch;
  listen(list, 'touchstart', event => {
    touch = event.touches.length === 1 ? event.touches[0] : undefined;
  }, { passive: true });
  listen(list, 'touchend', event => {
    const end = event.changedTouches[0];
    if (!touch || !end) return;
    const dx = end.clientX - touch.clientX, dy = end.clientY - touch.clientY;
    if (Math.abs(dx) > config.sliders.journalSwipeThreshold && Math.abs(dx) > Math.abs(dy)) show(page + (dx < 0 ? 1 : -1));
    touch = undefined;
  }, { passive: true });
  listen(list, 'touchcancel', () => { touch = undefined; }, { passive: true });
  observer(new ResizeObserver(resize), list);
  resize();
  runtime.cleanup(() => {
    if (journalLink) heading.insertBefore(journalLink, originalLinkSibling);
    actions?.remove();
    controls.remove();
    addedLinks.forEach(link => link.remove());
    list.classList.remove('is-journal-paged');
    list.style.removeProperty('grid-template-columns');
    for (const [name, value] of originalAttributes) {
      if (value === null) list.removeAttribute(name);
      else list.setAttribute(name, value);
    }
    cards.forEach(card => {
      card.hidden = false;
      card.classList.remove('is-journal-first');
      const category = card.querySelector('.row-category');
      if (category) delete category.dataset.journalIndex;
    });
  });
}
