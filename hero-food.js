const reel = document.querySelector('.food-reel-window');
const track = document.querySelector('.food-reel-track');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let last = 0, remainder = 0;
// Repeat the photographs to make the horizontal movement seamless.
[...track.children].forEach(card => { const copy = card.cloneNode(true); copy.setAttribute('aria-hidden','true'); copy.tabIndex = -1; track.append(copy); });
function tick(time) {
  const delta = last ? Math.min(time-last,50) : 0; last = time;
  if (!reduced.matches && !document.hidden) {
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
