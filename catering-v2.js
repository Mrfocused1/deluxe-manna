(() => {
  const form = document.querySelector('#event-form');
  if (!form) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const date = form.elements.date;
  const today = new Date();
  date.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  document.querySelectorAll('[data-event]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      event.preventDefault();
      form.elements.event.value = link.dataset.event;
      form.elements.event.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('#enquire').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
      form.elements.event.focus({ preventScroll: true });
    });
  });

  const result = document.querySelector('#enquiry-result');
  const draft = document.querySelector('#event-email-draft');
  const download = document.querySelector('#download-enquiry');
  let downloadUrl;
  form.addEventListener('input', () => { result.hidden = true; });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    const details = [
      'Hello Deluxe Manna,', '', 'I would like to enquire about an event.', '',
      `Name: ${values.get('name').trim()}`,
      `Email: ${values.get('email').trim()}`,
      `Occasion: ${values.get('event')}`,
      `Estimated guests: ${values.get('guests') || 'To be confirmed'}`,
      `Preferred date: ${values.get('date') || 'To be confirmed'}`,
      `Phone: ${values.get('phone').trim() || 'Not provided'}`, '',
      values.get('message').trim(), '', 'Thank you!'
    ].join('\n');
    draft.href = `mailto:hello@deluxemanna.com?subject=${encodeURIComponent(`Event enquiry — ${values.get('event')}`)}&body=${encodeURIComponent(details)}`;
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = URL.createObjectURL(new Blob([`DELUXE MANNA — EVENT ENQUIRY\nPrepared locally. Not sent.\n\n${details}`], { type: 'text/plain;charset=utf-8' }));
    download.href = downloadUrl;
    result.hidden = false;
    result.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'nearest' });
    draft.focus({ preventScroll: true });
  });
  const gallery = document.querySelector('.ev-gallery');
  const scrollButtons = [...document.querySelectorAll('[data-gallery-scroll]')];
  const updateScrollButtons = () => {
    const overflow = gallery.scrollWidth - gallery.clientWidth;
    document.querySelector('.ev-gallery-arrows').hidden = overflow < 2;
    scrollButtons.forEach(button => {
      button.disabled = Number(button.dataset.galleryScroll) < 0 ? gallery.scrollLeft < 2 : gallery.scrollLeft >= overflow - 2;
    });
  };
  scrollButtons.forEach(button => button.addEventListener('click', () => {
    const card = gallery.querySelector('.ev-gallery-card');
    const gap = parseFloat(getComputedStyle(gallery).gap) || 0;
    gallery.scrollBy({ left: Number(button.dataset.galleryScroll) * (card.getBoundingClientRect().width + gap), behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  }));
  gallery.addEventListener('scroll', updateScrollButtons, { passive: true });
  new ResizeObserver(updateScrollButtons).observe(gallery);
  updateScrollButtons();

  const dialog = document.querySelector('.ev-lightbox');
  const photos = [...document.querySelectorAll('.ev-gallery-open')].map(button => ({
    src: button.querySelector('img').getAttribute('src'),
    alt: button.querySelector('img').alt,
    caption: button.closest('figure').querySelector('figcaption span').textContent
  }));
  let activePhoto = 0;
  const showPhoto = index => {
    activePhoto = (index + photos.length) % photos.length;
    const photo = photos[activePhoto];
    dialog.querySelector('.ev-lightbox-image').src = photo.src;
    dialog.querySelector('.ev-lightbox-image').alt = photo.alt;
    dialog.querySelector('#ev-lightbox-title').textContent = photo.caption;
    dialog.querySelector('.ev-lightbox-count').textContent = `${activePhoto + 1} / ${photos.length}`;
  };
  document.querySelectorAll('[data-photo]').forEach(button => {
    button.setAttribute('aria-haspopup', 'dialog');
    button.addEventListener('click', () => {
      showPhoto(Number(button.dataset.photo));
      dialog.showModal();
      document.body.classList.add('ev-photo-open');
    });
  });
  dialog.querySelector('.ev-lightbox-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => document.body.classList.remove('ev-photo-open'));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.querySelectorAll('[data-photo-step]').forEach(button => button.addEventListener('click', () => showPhoto(activePhoto + Number(button.dataset.photoStep))));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      showPhoto(activePhoto + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
})();
