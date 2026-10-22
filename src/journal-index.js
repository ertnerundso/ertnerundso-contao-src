/* JOURNAL-ÜBERSICHT: Redaktionelle Themenfilter und schrittweises Nachladen.
   Ohne JavaScript bleiben alle Contao-Artikel direkt sichtbar. */
export function initJournalIndex(runtime) {
  const list = document.querySelector('.mod_newslist.news-grid');
  if (!list) return;
  const articles = [...list.querySelectorAll(':scope > .journal-index-item')];
  if (!articles.length) return;
  const featured = articles.find(article => article.dataset.journalFeatured === '1');
  const entries = articles.filter(article => article !== featured);
  const originalFeaturedSibling = featured?.nextSibling;
  if (featured) {
    featured.classList.add('is-journal-featured');
    list.prepend(featured);
  }

  const english = document.documentElement.lang === 'en';
  const labels = english
    ? { all: 'All', visuals: '3D & CGI', motion: 'Film & animation', assembly: 'Assembly', more: 'More articles', count: 'articles' }
    : { all: 'Alle', visuals: '3D & CGI', motion: 'Film & Animation', assembly: 'Montage', more: 'Weitere Artikel', count: 'Artikel' };
  const toolbar = document.createElement('div');
  toolbar.className = 'journal-index-toolbar';
  const filters = document.createElement('div');
  filters.className = 'journal-index-filters';
  filters.setAttribute('role', 'group');
  filters.setAttribute('aria-label', english ? 'Filter articles' : 'Artikel filtern');
  const status = document.createElement('span');
  status.className = 'micro journal-index-status';
  status.setAttribute('aria-live', 'polite');
  toolbar.append(filters, status);

  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'button btn--secondary journal-index-more';
  more.textContent = labels.more;

  let selected = 'all';
  let visibleCount = runtime.config.journalIndex.pageSize;
  const buttons = new Map();
  const render = () => {
    const matching = entries.filter((article) => selected === 'all' || article.dataset.journalTopic === selected);
    entries.forEach((article) => {
      article.hidden = !matching.includes(article) || matching.indexOf(article) >= visibleCount;
    });
    if (featured) featured.hidden = false;
    status.textContent = `${Math.min(visibleCount, matching.length)} / ${matching.length} ${labels.count}`;
    more.hidden = matching.length <= visibleCount;
    for (const [topic, button] of buttons) button.setAttribute('aria-pressed', String(topic === selected));
  };

  for (const topic of ['all', 'visuals', 'motion', 'assembly']) {
    if (topic !== 'all' && !entries.some((article) => article.dataset.journalTopic === topic)) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = labels[topic];
    buttons.set(topic, button);
    filters.append(button);
    runtime.listen(button, 'click', () => {
      selected = topic;
      visibleCount = runtime.config.journalIndex.pageSize;
      render();
    });
  }
  runtime.listen(more, 'click', () => {
    visibleCount += runtime.config.journalIndex.pageSize;
    render();
  });
  if (featured) featured.after(toolbar);
  else list.prepend(toolbar);
  list.after(more);
  render();
  runtime.cleanup(() => {
    toolbar.remove();
    more.remove();
    if (featured) {
      featured.classList.remove('is-journal-featured');
      list.insertBefore(featured, originalFeaturedSibling);
    }
    for (const article of articles) {
      article.hidden = false;
    }
  });
}
