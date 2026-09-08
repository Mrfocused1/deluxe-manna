const drawer = document.querySelector('.drawer');
const menuButton = document.querySelector('.menu-btn');
const closeButton = document.querySelector('.close');
drawer.id ||= 'site-drawer';
drawer.inert = true;
menuButton.setAttribute('aria-controls', drawer.id);
menuButton.setAttribute('aria-expanded', 'false');
closeButton.setAttribute('aria-label', 'Close navigation');
function closeMenu() {
  drawer.classList.remove('open');
  document.body.classList.remove('menu-open');
  drawer.inert = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.focus();
}
menuButton.addEventListener('click', () => {
  drawer.inert = false;
  drawer.classList.add('open');
  document.body.classList.add('menu-open');
  menuButton.setAttribute('aria-expanded', 'true');
  closeButton.focus();
});
closeButton.addEventListener('click', closeMenu);
drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (!drawer.classList.contains('open')) return;
  if (event.key === 'Escape') closeMenu();
  if (event.key === 'Tab') {
    const links = [...drawer.querySelectorAll('button, a')];
    const first = links[0], last = links[links.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
document.querySelector('[data-scroll="booking"]')?.addEventListener('click', () => document.querySelector('#booking')?.scrollIntoView({behavior: 'smooth'}));
