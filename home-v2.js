(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const meals = document.querySelector('.meal-carousel');
  const prev = document.querySelector('.meal-prev');
  const next = document.querySelector('.meal-next');
  const count = document.querySelector('.meal-count');
  const bar = document.querySelector('.meal-progress span');
  const step = () => meals.querySelector('.meal-slide').getBoundingClientRect().width + parseFloat(getComputedStyle(meals).gap);
  function updateMeals() {
    const max = meals.scrollWidth - meals.clientWidth;
    prev.disabled = meals.scrollLeft <= 2;
    next.disabled = meals.scrollLeft >= max - 2;
    const first = Math.min(6, Math.round(meals.scrollLeft / step()) + 1);
    if (count.dataset.index !== String(first)) {
      count.dataset.index = String(first);
      count.innerHTML = `${String(first).padStart(2, '0')} <span>/ 06</span>`;
    }
    bar.style.transform = `scaleX(${Math.min(1, (meals.scrollLeft + meals.clientWidth) / meals.scrollWidth)})`;
  }
  const move = direction => meals.scrollBy({ left: step() * direction, behavior: reduced.matches ? 'instant' : 'smooth' });
  prev.addEventListener('click', () => move(-1)); next.addEventListener('click', () => move(1));
  meals.addEventListener('scroll', updateMeals, { passive: true });
  window.addEventListener('resize', updateMeals, { passive: true });
  meals.addEventListener('keydown', event => {
    if (event.target !== meals || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1);
  });
  updateMeals();

  // The low-contrast image reel moves only when visible and is touch-scrollable.
  const reel = document.querySelector('.food-reel-window');
  const track = reel.querySelector('.food-reel-track');
  const originals = [...track.children];
  function extendReel() {
    const gap = parseFloat(getComputedStyle(track).gap);
    const cycle = originals.reduce((width, card) => width + card.getBoundingClientRect().width + gap, 0);
    const copies = Math.max(2, Math.ceil(reel.clientWidth / cycle) + 1);
    while (track.children.length < originals.length * copies) {
      const clone = originals[track.children.length % originals.length].cloneNode(true);
      clone.setAttribute('aria-hidden', 'true'); clone.tabIndex = -1;
      track.append(clone);
    }
  }
  extendReel();
  window.addEventListener('resize', extendReel, { passive: true });
  let visible = false, interacting = false, hovered = false, focused = false, frame = 0, last = 0, fraction = 0;
  function cycleWidth() { return track.children[originals.length].offsetLeft - track.children[0].offsetLeft; }
  function tick(now) {
    frame = 0;
    if (!visible || document.hidden || reduced.matches || interacting || hovered || focused) { last = 0; return; }
    if (last) {
      fraction += Math.min(now - last, 50) * .022;
      if (fraction >= 1) { const pixels = Math.floor(fraction); reel.scrollLeft += pixels; fraction -= pixels; }
      const width = cycleWidth();
      if (width > 0 && reel.scrollLeft >= width) reel.scrollLeft -= width;
    }
    last = now; frame = requestAnimationFrame(tick);
  }
  function syncReel() { if (frame) cancelAnimationFrame(frame); frame = 0; last = 0; if (visible && !document.hidden && !reduced.matches && !interacting && !hovered && !focused) frame = requestAnimationFrame(tick); }
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; syncReel(); }).observe(reel);
  reel.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovered = true; syncReel(); } });
  reel.addEventListener('pointerleave', () => { hovered = false; syncReel(); });
  reel.addEventListener('pointerdown', () => { interacting = true; syncReel(); }, { passive: true });
  reel.addEventListener('wheel', () => { interacting = true; syncReel(); }, { passive: true });
  reel.addEventListener('focusin', () => { focused = true; syncReel(); });
  reel.addEventListener('focusout', () => { focused = false; syncReel(); });
  document.addEventListener('visibilitychange', syncReel);
  reduced.addEventListener('change', syncReel);

  const start = document.querySelector('#reservation-start');
  const dialog = document.querySelector('#reservation-dialog');
  const details = document.querySelector('#reservation-details');
  const date = document.querySelector('#reserve-date');
  const now = new Date(); date.min = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  let reservation;
  start.addEventListener('submit', event => {
    event.preventDefault(); if (!start.reportValidity()) return;
    reservation = new FormData(start);
    const readableDate = new Date(`${reservation.get('date')}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' });
    document.querySelector('.reservation-summary').textContent = `${readableDate} · ${reservation.get('time')} · ${reservation.get('guests')} guests`;
    details.querySelector('.form-result').hidden = true;
    dialog.showModal();
    if (window.gsap && !reduced.matches) gsap.fromTo(dialog, { y: 45, opacity: 0 }, { y: 0, opacity: 1, duration: .45, ease: 'power3.out', clearProps: 'transform,opacity' });
  });
  dialog.querySelector('.reservation-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  details.addEventListener('submit', event => {
    event.preventDefault(); if (!details.reportValidity() || !reservation) return;
    const d = new FormData(details);
    const subject = `Table enquiry — ${reservation.get('date')}, ${reservation.get('guests')} guests`;
    const body = `Hello Deluxe Manna,\n\nI'd like to enquire about a table.\n\nName: ${d.get('name')}\nEmail: ${d.get('email')}\nPreferred date: ${reservation.get('date')}\nPreferred time: ${reservation.get('time')}\nGuests: ${reservation.get('guests')}\n\n${d.get('message') || ''}\n\nPlease let me know if this is available. Thank you.`;
    details.querySelector('.form-result').hidden = false;
    location.href = `mailto:hello@deluxemanna.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
  details.addEventListener('input', () => { details.querySelector('.form-result').hidden = true; });
})();
