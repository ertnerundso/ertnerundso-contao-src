/* WEBSITE-START: Startet die Funktionsmodule.
   Einstellungen in config.js; Gestaltung in den CSS-Systemdateien.
   Fehler eines optionalen Bereichs dürfen die übrige Seite nicht stoppen. */
import { createRuntime } from './runtime.js';
import { initScroll, initSkipLink } from './scroll.js';
import { initHeader } from './header.js';
import { initNavigation } from './navigation.js';
import { initJournal } from './journal.js';
import { initJournalIndex } from './journal-index.js';
import { initJournalRelated } from './journal-related.js';
import { initVideo } from './video.js';
import { initShowreel } from './showreel.js';
import { initBenefits } from './benefits.js';
import { initConfigurator } from './configurator.js';
import { initAnimations } from './animations.js';
import { initWork } from './work.js';
import { initPointer } from './pointer.js';
import { initScene } from './scene-loader.js';
import { initForms } from './forms.js';
import { initBooking } from './booking.js';
import { initTestimonials } from './testimonials.js';
import { initAnalytics } from './analytics.js';
import { initButtons } from './buttons.js';

const runtime = createRuntime();
const motionModules = new Set([
  initScroll,
  initBenefits,
  initConfigurator,
  initAnimations,
  initPointer,
]);
for (const initialize of [
  initSkipLink,
  initScroll,
  initHeader,
  initNavigation,
  initJournal,
  initJournalIndex,
  initJournalRelated,
  initVideo,
  initShowreel,
  initBenefits,
  initConfigurator,
  initAnimations,
  initWork,
  initPointer,
  initScene,
  initButtons,
  initForms,
  initBooking,
  initTestimonials,
  initAnalytics,
]) {
  try {
    if (motionModules.has(initialize)) runtime.runResponsive(initialize);
    else runtime.run(initialize);
  } catch (error) {
    console.error(`Frontend-Modul ${initialize.name} konnte nicht starten.`, error);
  }
}
