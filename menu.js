const search = document.querySelector('#menu-search');
const cards = [...document.querySelectorAll('.food-card')];
const sections = [...document.querySelectorAll('.menu-category')];
const clear = document.querySelector('.clear-search');
const categoryLinks = [...document.querySelectorAll('.category-sidebar nav a')];
function filterMenu() {
  const query = search.value.trim().toLocaleLowerCase();
  let count = 0;
  cards.forEach(card => { card.hidden = !card.dataset.search.includes(query); if (!card.hidden) count++; });
  sections.forEach(section => { section.hidden = !section.querySelector('.food-card:not([hidden])'); });
  categoryLinks.forEach(link => { link.hidden = document.querySelector(link.getAttribute('href')).hidden; });
  document.querySelector('#result-count').textContent = `${count} ${query ? 'matching dishes & drinks' : 'dishes & drinks'}`;
  document.querySelector('.empty-state').hidden = count !== 0;
  clear.hidden = !query;
}
search.addEventListener('input', filterMenu);
function resetSearch() { search.value = ''; filterMenu(); search.focus(); }
clear.addEventListener('click', resetSearch);
document.querySelector('.reset-search').addEventListener('click', resetSearch);
document.addEventListener('keydown', event => {
  if (event.key === '/' && !event.metaKey && !event.ctrlKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) { event.preventDefault(); search.focus(); }
});
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) categoryLinks.forEach(link => {
    const active = link.hash === `#${entry.target.id}`;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  }); });
}, {rootMargin: '-180px 0px -55% 0px', threshold: 0});
sections.forEach(section => observer.observe(section));
