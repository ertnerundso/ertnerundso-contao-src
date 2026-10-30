/* Nur Portal-Bedienung; keine Analyse, kein externer Dienst und kein Website-Motion-Bundle. */
const search = document.querySelector('#portal-search');
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && search) {
    event.preventDefault();
    const section = search.closest('details');
    if (section) section.open = true;
    search.focus();
  }
});
const menu = document.querySelector('.portal-menu');
if (menu) {
  const viewport = window.matchMedia('(max-width: 1000px)');
  const update = () => { menu.open = !viewport.matches; };
  viewport.addEventListener('change', update);
  update();
}
