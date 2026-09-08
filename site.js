(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const gsap = window.gsap;
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.reading-progress');
  const overlay = document.querySelector('.route-transition');
  let navigating = false;
  let finishIntro = () => {};
  let routeTimeline;
  function updateHeader() {
    header?.classList.toggle('is-scrolled', window.scrollY > 24);
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${distance > 0 ? window.scrollY / distance : 0})`;
  }
  window.addEventListener('scroll', updateHeader, { passive: true });
  window.addEventListener('resize', updateHeader, { passive: true });
  updateHeader();

  function enterPage() {
    if (!gsap || reduced.matches) return;
    const page = document.body.dataset.page;
    const hero = document.querySelector('.page-hero');
    if (!hero || window.scrollY > hero.offsetHeight * .65) return;
    const items = hero.querySelectorAll('[data-hero-item]');
    const timeline = gsap.timeline({ defaults: { ease: 'power3.out', duration: .9 } });
    const from = {
      home: { y: 34, autoAlpha: 0, clipPath: 'inset(0 0 100% 0)' },
      menu: { y: 26, autoAlpha: 0 },
      events: { y: 42, rotate: 1.2, autoAlpha: 0 },
      contact: { x: 28, autoAlpha: 0 }
    }[page] || { y: 24, autoAlpha: 0 };
    timeline.from(items, { ...from, stagger: .09, clearProps: 'all' }, .05);
    if (page === 'home') timeline.from('.home-hero-image', { scale: 1.045, duration: 1.8, clearProps: 'transform' }, 0);
  }
  function introduce(force = false) {
    const intro = document.querySelector('.brand-intro');
    let seen = false;
    try { seen = sessionStorage.getItem('dm-intro-v3') === 'seen'; } catch (_) {}
    if (!intro || (seen && !force) || !gsap || reduced.matches) { enterPage(); return; }
    try { sessionStorage.setItem('dm-intro-v3', 'seen'); } catch (_) {}
    gsap.set([intro, ...intro.querySelectorAll('*')], { clearProps: 'all' });
    intro.hidden = false;
    const previousFocus = document.activeElement;
    const background = [...document.body.children].filter(el => el !== intro && el.tagName !== 'SCRIPT');
    const previousInert = background.map(el => el.inert);
    background.forEach(el => { el.inert = true; });
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const skip = intro.querySelector('.intro-skip');
    skip.focus({ preventScroll: true });
    let complete = false;
    let timeline;
    const handleKey = event => {
      if (event.key === 'Escape') finishIntro();
      if (event.key === 'Tab') { event.preventDefault(); skip.focus(); }
    };
    finishIntro = () => {
      if (complete) return;
      complete = true;
      clearTimeout(safety);
      timeline?.kill();
      intro.hidden = true;
      background.forEach((el, i) => { el.inert = previousInert[i]; });
      document.body.style.overflow = oldOverflow;
      document.removeEventListener('keydown', handleKey);
      if (previousFocus && previousFocus !== document.body) previousFocus.focus({ preventScroll: true });
      else skip.blur();
      enterPage();
    };
    const safety = setTimeout(finishIntro, 3200);
    skip.addEventListener('click', finishIntro, { once: true });
    document.addEventListener('keydown', handleKey);
    timeline = gsap.timeline({ onComplete: finishIntro });
    timeline.from('.intro-symbol', { autoAlpha: 0, y: 15, scale: .8, duration: .65, ease: 'power3.out' })
      .from('.intro-name', { autoAlpha: 0, y: 15, duration: .55, ease: 'power3.out' }, .16)
      .from('.intro-line', { scaleX: 0, duration: .7, ease: 'power2.inOut' }, .15)
      .from('.intro-caption span', { autoAlpha: 0, y: 10, duration: .4, stagger: .09 }, .45)
      .to('.intro-center', { autoAlpha: 0, y: -25, duration: .35, ease: 'power2.in' }, 1.25)
      .to(intro, { yPercent: -100, duration: .65, ease: 'power3.inOut' }, 1.35);
  }

  function setupMotion() {
    if (!gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(window.ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add({ desktop: '(min-width: 761px)', motion: '(prefers-reduced-motion: no-preference)', fine: '(pointer: fine)' }, context => {
      if (!context.conditions.motion) return;
      gsap.utils.toArray('[data-reveal]').forEach(element => {
        gsap.from(element, {
          y: element.id ? 0 : (context.conditions.desktop ? 45 : 22),
          opacity: 0, duration: .9, ease: 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 93%', once: true },
          clearProps: 'transform,opacity,visibility'
        });
      });
      if (context.conditions.desktop) {
        gsap.utils.toArray('[data-parallax]').forEach(img => {
          gsap.fromTo(img, { yPercent: -4, scale: 1.1 }, {
            yPercent: 4, ease: 'none',
            scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: 1 }
          });
        });
        if (document.querySelector('.home-hero-image')) {
          gsap.to('.home-hero-image img', { yPercent: 10, scale: 1.16, ease: 'none', scrollTrigger: { trigger: '.home-hero', start: 'top top', end: 'bottom top', scrub: 1 } });
          gsap.to('.hero-photo-note', { y: -45, autoAlpha: .3, ease: 'none', scrollTrigger: { trigger: '.home-hero', start: 'top top', end: 'bottom top', scrub: 1 } });
        }
      }
      const cleanups = [];
      if (context.conditions.fine) {
        // Small magnetic movement adds feedback without shifting the click target.
        document.querySelectorAll('.button,.icon-button').forEach(button => {
          const target = button.querySelector('svg');
          if (!target) return;
          const xTo = gsap.quickTo(target, 'x', { duration: .35, ease: 'power3.out' });
          const yTo = gsap.quickTo(target, 'y', { duration: .35, ease: 'power3.out' });
          const move = e => { const r = button.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * .06); yTo((e.clientY - r.top - r.height / 2) * .12); };
          const leave = () => { xTo(0); yTo(0); };
          button.addEventListener('pointermove', move); button.addEventListener('pointerleave', leave);
          cleanups.push(() => { button.removeEventListener('pointermove', move); button.removeEventListener('pointerleave', leave); });
        });
      }
      return () => cleanups.forEach(fn => fn());
    });
    document.addEventListener('focusin', event => {
      const group = event.target.closest('[data-reveal]');
      if (!group) return;
      gsap.killTweensOf(group);
      gsap.set(group, { clearProps: 'transform,opacity,visibility' });
    });
    document.fonts?.ready.then(() => window.ScrollTrigger.refresh());
    window.addEventListener('load', () => window.ScrollTrigger.refresh(), { once: true });
    // Images reserve their dimensions in CSS; lazy loads must not interrupt native smooth scrolling.
  }

  const routeNames = { 'index.html': ['home', 'Welcome home'], 'menu.html': ['menu', 'A taste of Congo'], 'catering.html': ['events', 'Better together'], 'contact.html': ['contact', 'Say hello'] };
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
    const file = url.pathname.split('/').pop() || 'index.html';
    const current = location.pathname.split('/').pop() || 'index.html';
    if (file === current && url.hash) {
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      const group = target?.closest('[data-reveal]');
      if (group && gsap) { gsap.killTweensOf(group); gsap.set(group, { clearProps: 'transform,opacity,visibility' }); }
      return;
    }
    if (!routeNames[file] || file === current || !gsap || reduced.matches || !overlay) return;
    event.preventDefault();
    if (navigating) return;
    navigating = true;
    const [page, label] = routeNames[file];
    overlay.querySelector('.route-destination').textContent = label;
    overlay.hidden = false;
    overlay.classList.add('is-transitioning');
    const panels = overlay.querySelectorAll('.route-panel');
    const text = overlay.querySelector('.route-label');
    gsap.set(panels, { clearProps: 'all' });
    gsap.set(text, { autoAlpha: 0, y: 15 });
    const go = () => location.assign(url.href);
    const fallback = setTimeout(go, 1300);
    routeTimeline = gsap.timeline({ onComplete: () => { clearTimeout(fallback); go(); } });
    if (page === 'home') {
      gsap.set(panels[1], { display: 'none' });
      routeTimeline.fromTo(panels[0], { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', duration: .52, ease: 'power3.inOut' });
    } else if (page === 'menu') {
      gsap.set(panels, { width: '50%' }); gsap.set(panels[1], { left: '50%' });
      routeTimeline.fromTo(panels[0], { yPercent: -100 }, { yPercent: 0, duration: .48, ease: 'power3.inOut' }, 0)
        .fromTo(panels[1], { yPercent: 100 }, { yPercent: 0, duration: .48, ease: 'power3.inOut' }, .045);
    } else if (page === 'events') {
      gsap.set(panels[1], { display: 'none' });
      routeTimeline.fromTo(panels[0], { clipPath: 'polygon(0 100%,100% 100%,100% 100%,0 100%)' }, { clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%)', duration: .5, ease: 'power3.inOut' });
    } else {
      gsap.set(panels, { height: '50%' }); gsap.set(panels[1], { top: '50%' });
      routeTimeline.fromTo(panels[0], { xPercent: -100 }, { xPercent: 0, duration: .48, ease: 'power3.inOut' }, 0)
        .fromTo(panels[1], { xPercent: 100 }, { xPercent: 0, duration: .48, ease: 'power3.inOut' }, .04);
    }
    routeTimeline.to(text, { autoAlpha: 1, y: 0, duration: .23 }, .28).to({}, { duration: .08 });
  });
  // Restore normal interaction when the browser returns a page from its back/forward cache.
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    navigating = false;
    routeTimeline?.kill();
    if (overlay) { overlay.hidden = true; overlay.classList.remove('is-transitioning'); }
    finishIntro(); updateHeader();
    window.ScrollTrigger?.refresh();
  });
  document.querySelector('.replay-intro')?.addEventListener('click', () => introduce(true));
  if (reduced.matches) document.querySelector('.replay-intro')?.setAttribute('hidden', '');
  reduced.addEventListener('change', event => {
    const replay = document.querySelector('.replay-intro');
    if (replay) replay.hidden = event.matches;
    if (event.matches) finishIntro();
  });
  // Settle deep links after fonts and ScrollTrigger have measured the initial layout.
  const initialHash = location.hash;
  const pageReady = document.readyState === 'complete' ? Promise.resolve() : new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
  let userMoved = false;
  window.addEventListener('wheel', () => { userMoved = true; }, { passive: true, once: true });
  window.addEventListener('touchstart', () => { userMoved = true; }, { passive: true, once: true });
  Promise.all([pageReady, document.fonts?.ready || Promise.resolve()]).then(() => {
    if (!initialHash || initialHash !== location.hash || userMoved) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const target = document.getElementById(decodeURIComponent(initialHash.slice(1)));
      const group = target?.closest('[data-reveal]');
      if (group && gsap) { gsap.killTweensOf(group); gsap.set(group, { clearProps: 'transform,opacity,visibility' }); }
      target?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }));
  });
  try { setupMotion(); introduce(); } catch (error) {
    finishIntro();
    document.querySelectorAll('[data-reveal],[data-hero-item]').forEach(el => { el.style.opacity = '1'; el.style.visibility = 'visible'; el.style.transform = 'none'; });
    console.error('Motion enhancement unavailable:', error);
  }
})();
