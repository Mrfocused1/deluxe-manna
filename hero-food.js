const reel = document.querySelector('.food-reel-window');
const track = document.querySelector('.food-reel-track');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reduced.matches, hovering = false, touching = false, last = 0, remainder = 0;
// Repeat the photographs to make the horizontal movement seamless.
[...track.children].forEach(card => { const copy = card.cloneNode(true); copy.setAttribute('aria-hidden','true'); copy.tabIndex = -1; track.append(copy); });
reduced.addEventListener('change', () => { paused = reduced.matches; });
reel.addEventListener('pointerenter', () => { hovering = true; });
reel.addEventListener('pointerleave', () => { hovering = false; });
reel.addEventListener('touchstart', () => { touching = true; paused = true; }, {passive:true});
reel.addEventListener('touchend', () => { touching = false; }, {passive:true});
function tick(time) {
  const delta = last ? Math.min(time-last,50) : 0; last = time;
  if (!paused && !hovering && !touching && !reel.contains(document.activeElement) && !document.hidden) {
    remainder += delta * .025;
    const step = Math.floor(remainder);
    reel.scrollLeft += step;
    remainder -= step;
    const distance = track.children[6].offsetLeft - track.children[0].offsetLeft;
    if (reel.scrollLeft >= distance) reel.scrollLeft -= distance;
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
