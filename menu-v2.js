/* Static catalogue enhancement: search, categories and an accessible dish sheet. */
(() => {
  const search = document.getElementById('menu-search');
  const catalogueElement = document.getElementById('menu-catalogue-data');
  if (!search || !catalogueElement) return;
  const catalogue = JSON.parse(catalogueElement.textContent);
  const items = new Map(catalogue.items.map(item => [item.id, item]));
  const cards = [...document.querySelectorAll('.mv2-dish')];
  const sections = [...document.querySelectorAll('.mv2-category')];
  const links = [...document.querySelectorAll('.mv2-category-link')];
  const nav = document.querySelector('.mv2-category-nav nav');
  const resultCount = document.getElementById('menu-result-count');
  const clear = document.querySelector('.mv2-clear-search');
  const empty = document.querySelector('.mv2-empty');
  const dialog = document.getElementById('dish-dialog');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fold = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
  let selectedLink;
  let lastDialogTrigger;
  let savedOverflow;
  let frameRequested = false;

  function setActive(link, reveal = false) {
    if (!link) return;
    if (link !== selectedLink) {
      selectedLink = link;
      links.forEach(item => item === link ? item.setAttribute('aria-current', 'location') : item.removeAttribute('aria-current'));
    }
    if (reveal && window.innerWidth <= 760) {
      const left = link.offsetLeft - nav.offsetLeft - (nav.clientWidth - link.clientWidth) / 2;
      nav.scrollTo({ left, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    }
  }
  function updateCategory() {
    frameRequested = false;
    const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height || 80;
    const threshold = headerHeight + (window.innerWidth <= 760 ? nav.parentElement.getBoundingClientRect().height : 0) + 24;
    const visible = sections.filter(section => !section.hidden);
    const current = visible.find(section => section.getBoundingClientRect().bottom > threshold);
    if (current) setActive(links.find(link => link.hash === `#${current.id}`));
  }
  function requestCategoryUpdate() {
    if (!frameRequested) {
      frameRequested = true;
      requestAnimationFrame(updateCategory);
    }
  }
  function filterMenu() {
    const terms = fold(search.value.trim()).split(/\s+/).filter(Boolean);
    let count = 0;
    cards.forEach(card => {
      card.hidden = !terms.every(term => fold(card.dataset.search).includes(term));
      if (!card.hidden) count++;
    });
    sections.forEach(section => { section.hidden = !section.querySelector('.mv2-dish:not([hidden])'); });
    links.forEach(link => { link.hidden = document.getElementById(link.hash.slice(1)).hidden; });
    resultCount.textContent = `${count} ${terms.length ? 'matching dishes & drinks' : 'dishes & drinks'}`;
    clear.hidden = terms.length === 0;
    empty.hidden = count > 0;
    updateCategory();
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }
  function resetSearch() {
    search.value = '';
    filterMenu();
    search.focus({ preventScroll: true });
  }
  search.addEventListener('input', filterMenu);
  clear.addEventListener('click', resetSearch);
  document.querySelector('.mv2-reset-search').addEventListener('click', resetSearch);
  links.forEach(link => link.addEventListener('click', () => setActive(link, true)));
  window.addEventListener('scroll', requestCategoryUpdate, { passive: true });
  window.addEventListener('resize', requestCategoryUpdate, { passive: true });
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !dialog.open && !document.activeElement.isContentEditable && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      event.preventDefault();
      search.focus();
      search.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'center' });
    }
  });

  function closeDialog() { if (dialog.open) dialog.close(); }
  document.querySelectorAll('[data-dish]').forEach(button => button.addEventListener('click', () => {
    const item = items.get(button.dataset.dish);
    if (!item) return;
    lastDialogTrigger = button;
    const image = document.getElementById('dish-dialog-image');
    image.parentElement.hidden = !item.image;
    if (item.image) { image.src = item.image; image.alt = item.name; }
    document.getElementById('dish-dialog-category').textContent = item.category;
    document.getElementById('dish-dialog-title').textContent = item.name;
    document.getElementById('dish-dialog-price').textContent = `£${(item.price / 100).toFixed(2)}`;
    document.getElementById('dish-dialog-description').textContent = item.description || 'Freshly prepared to order.';
    document.getElementById('dish-dialog-availability').hidden = item.available;
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    dialog.scrollTop = 0;
    document.querySelector('.mv2-dialog-close').focus({ preventScroll: true });
  }));
  document.querySelector('.mv2-dialog-close').addEventListener('click', closeDialog);
  let pressedBackdrop = false;
  dialog.addEventListener('pointerdown', event => { pressedBackdrop = event.target === dialog && isOutside(event); });
  dialog.addEventListener('click', event => {
    if (pressedBackdrop && event.target === dialog && isOutside(event)) closeDialog();
    pressedBackdrop = false;
  });
  function isOutside(event) {
    const bounds = dialog.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  }
  dialog.addEventListener('close', () => {
    document.body.style.overflow = savedOverflow || '';
    if (lastDialogTrigger?.isConnected && !lastDialogTrigger.closest('[hidden]')) lastDialogTrigger.focus({ preventScroll: true });
  });
  function revealLinkedDish() {
    if (!/^#dish-\d+$/.test(location.hash)) return;
    const target = document.getElementById(location.hash.slice(1));
    if (!target?.matches('.mv2-dish')) return;
    if (search.value || target.hidden) {
      search.value = '';
      filterMenu();
    }
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'instant', block: 'start' });
      updateCategory();
      const link = links.find(link => link.hash === `#${target.closest('.mv2-category').id}`);
      setActive(link, true);
    });
  }
  window.addEventListener('hashchange', revealLinkedDish);
  // The static IDs work without JavaScript; once fonts load, correct any layout
  // shift so a direct link from the home carousel lands below the sticky bars.
  if (/^#dish-\d+$/.test(location.hash)) {
    const originalHash = location.hash;
    const ready = document.fonts?.ready || Promise.resolve();
    ready.then(() => { if (location.hash === originalHash) revealLinkedDish(); });
  }
  updateCategory();
})();

/* Muted, inline background video with accessible manual playback and safe fallbacks. */
(() => {
  const video = document.querySelector('.mv2-hero-video');
  const toggle = document.querySelector('.mv2-video-toggle');
  if (!video || !toggle) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let manuallyPaused = false;
  let requestedPlay = false;
  video.muted = true;
  toggle.hidden = false;
  function updateControl() {
    toggle.setAttribute('aria-label', video.paused ? 'Play menu video' : 'Pause menu video');
    toggle.querySelector('.mv2-video-play').toggleAttribute('hidden', !video.paused);
    toggle.querySelector('.mv2-video-pause').toggleAttribute('hidden', video.paused);
  }
  function syncPlayback() {
    const allowed = visible && !document.hidden && !manuallyPaused && (!motion.matches || requestedPlay);
    if (!allowed) { video.pause(); return; }
    const attempt = video.play();
    if (attempt) attempt.catch(() => { updateControl(); });
  }
  toggle.addEventListener('click', () => {
    if (video.paused) { manuallyPaused = false; requestedPlay = true; syncPlayback(); }
    else { manuallyPaused = true; requestedPlay = false; video.pause(); }
  });
  ['play', 'pause', 'ended'].forEach(name => video.addEventListener(name, updateControl));
  video.addEventListener('error', () => { toggle.hidden = true; });
  video.addEventListener('loadeddata', syncPlayback, { once: true });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; syncPlayback(); }, { threshold: .05 }).observe(video);
  document.addEventListener('visibilitychange', syncPlayback);
  motion.addEventListener('change', () => { requestedPlay = false; syncPlayback(); });
  updateControl();
})();
