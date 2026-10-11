/* ARTIKELVORSCHLÄGE: Dasselbe Journal-Raster und dieselbe Navigation wie auf der Startseite.
   Die native Contao-Nachrichtenliste bleibt ohne JavaScript horizontal erreichbar. */
import { initJournalSlider } from './journal.js';

export function initJournalRelated(runtime) {
  for (const section of document.querySelectorAll('[data-journal-related]')) {
    const list = section.querySelector('.mod_newslist');
    if (!list?.querySelector(':scope > .journal-row')) continue;
    const hadListClass = list.classList.contains('journal-list');
    list.classList.add('journal-list');
    initJournalSlider(runtime, list);
    runtime.cleanup(() => { if (!hadListClass) list.classList.remove('journal-list'); });
  }
}
