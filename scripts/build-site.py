"""Assemble the static site; only Python's standard library is needed."""
from pathlib import Path
import html
ROOT = Path(__file__).resolve().parents[1]
ICONS = {
    'arrow':'<path d="M5 19 19 5M5 5h14v14"/>',
    'home':'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-8H9v8H4a1 1 0 0 1-1-1z"/>',
    'menu':'<path d="M5 3v7a3 3 0 0 0 6 0V3M8 3v18M19 21V3c-4 3-4 10 0 10"/>',
    'events':'<path d="m7 3-2 7a4 4 0 0 0 8 0l-2-7zM9 14v7M5 21h8M16 3l3 4M19 2v1M19 10h2"/>',
    'contact':'<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2V11.5a9.5 9.5 0 0 1 19 0Z"/><path d="M7 11h.01M12 11h.01M17 11h.01"/>',
    'up':'<path d="M12 20V4m-6 6 6-6 6 6"/>'
}
def icon(name): return '<svg viewBox="0 0 24 24" aria-hidden="true">'+ICONS[name]+'</svg>'
def brand(): return '<span class="brand-symbol"><img src="assets/logo.png" alt="" width="1890" height="1417"></span><span class="brand-name">Deluxe Manna<small>CONGOLESE CUISINE</small></span>'
pages = [('home','index','Home','Congolese cuisine, made for sharing.'),('menu','menu','Our menu','Explore authentic Congolese dishes, grills, sides and drinks.'),('events','catering','Catering & events','Good food and great company for every occasion.'),('contact','contact','Contact','Get in touch with the Deluxe Manna team.')]
for key,filename,title,description in pages:
    partial=ROOT/'partials'/f'{filename if key != "home" else "home"}-main.html'
    if not partial.exists(): continue
    def nav(mobile=False):
        return ''.join(f'<a href="{f}.html"'+(' aria-current="page"' if k==key else '')+'>'+ (icon(k) if mobile else '')+f'<span>{({"home":"Home","menu":"Menu","events":"Events","contact":"Contact"}[k]) if mobile else t}</span></a>' for k,f,t,_ in pages)
    header=f'''<a class="skip-link" href="#main-content">Skip to content</a>
<header class="site-header"><a class="brand-lockup" href="index.html" aria-label="Deluxe Manna home">{brand()}</a><nav class="desktop-nav" aria-label="Main navigation">{nav()}</nav><button class="cart-trigger" type="button" aria-label="View basket"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12l-1 11H7L6 7"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/><circle cx="10" cy="19" r="1.2"/><circle cx="16" cy="19" r="1.2"/></svg><span class="cart-count"></span></button><a class="button button-outline header-book" href="index.html#booking">Book a table {icon('arrow')}</a><div class="reading-progress" aria-hidden="true"></div></header>
<nav class="mobile-tabs" aria-label="Main navigation">{nav(True)}</nav>'''
    footer=f'''<footer class="site-footer"><div class="container"><div class="footer-top"><div class="footer-brand"><a class="brand-lockup" href="index.html" aria-label="Deluxe Manna home">{brand()}</a><p>Congolese roots.<br>A table for everyone.</p></div><nav class="footer-nav" aria-label="Footer navigation"><a href="index.html">Home</a><a href="menu.html">Our menu</a><a href="catering.html">Catering & events</a><a href="index.html#story">Our story</a><a href="contact.html">Contact</a><a href="index.html#booking">Book a table</a></nav><div class="footer-contact"><p class="eyebrow">LET’S TALK</p><a href="mailto:hello@deluxemanna.com">hello@deluxemanna.com</a><p>For your next meal.<br>For your next celebration.</p></div></div><div class="footer-base"><span class="footer-culture">Food &nbsp; · &nbsp; Culture &nbsp; · &nbsp; People</span><span class="footer-copyright">© 2026 Deluxe Manna</span><button type="button" class="replay-intro">Replay intro</button><a href="#top">Back to top {icon('up')}</a></div></div></footer>'''
    overlays='''<div class="brand-intro" hidden role="dialog" aria-modal="true" aria-label="Welcome to Deluxe Manna"><div class="intro-center"><span class="brand-symbol intro-symbol"><img src="assets/logo.png" alt="" width="1890" height="1417"></span><p class="intro-name">Deluxe Manna</p><div class="intro-line"></div><div class="intro-caption"><span>Food</span><span>Culture</span><span>People</span></div></div><button class="intro-skip" type="button">Skip intro <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg></button></div><div class="route-transition" hidden aria-hidden="true"><div class="route-panel route-panel-a"></div><div class="route-panel route-panel-b"></div><div class="route-label"><span>Deluxe Manna</span><span class="route-destination"></span></div></div><div class="cart-backdrop" data-close-cart aria-hidden="true"></div><div class="cart-drawer" role="dialog" aria-modal="true" aria-label="Your basket"><div class="cart-drawer-head"><h2>Your <em>basket</em></h2><button class="cart-close" type="button" data-close-cart aria-label="Close basket"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div><div class="cart-drawer-body"><div class="cart-empty"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12l-1 11H7L6 7"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/><circle cx="10" cy="19" r="1.2"/><circle cx="16" cy="19" r="1.2"/></svg><p>Your basket is empty</p><p style="font-size:12px; color:var(--muted); margin-top:6px">Tap + beside any dish to add it.</p></div><div class="cart-items"></div></div><div class="cart-drawer-foot"><div class="cart-totals"><div><span>Subtotal</span><span data-cart-subtotal>£0.00</span></div><div><span>Delivery</span><span data-cart-fee>—</span></div><div><strong>Total</strong><strong data-cart-total>£0.00</strong></div></div><a class="button cart-checkout" href="checkout.html">Go to checkout <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg></a><p class="cart-note">Pay on delivery or card at checkout. No Deliveroo needed.</p></div></div>'''
    css='home-v2' if key=='home' else filename+'-v2'
    cart_suffix='<link rel="stylesheet" href="cart.css?v=6">'
    output=f'''<!doctype html>
<html lang="en" id="top"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="theme-color" content="#111410"><meta name="description" content="{html.escape(description)}"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><title>Deluxe Manna — {title if key!='home' else 'Congolese Cuisine'}</title><link rel="icon" type="image/png" href="assets/logo.png"><link rel="apple-touch-icon" href="assets/logo.png"><link rel="stylesheet" href="site.css?v=6"><link rel="stylesheet" href="{css}.css?v=6">{cart_suffix}<script src="assets/vendor/gsap.min.js" defer></script><script src="assets/vendor/ScrollTrigger.min.js" defer></script><script src="site.js?v=6" defer></script><script src="{css}.js?v=6" defer></script><script src="cart.js?v=6" defer></script><script src="supabase-content.js?v=6" defer></script><script src="supabase-menu.js?v=6" defer></script></head><body class="{key}-page" data-page="{key}">
{header}
{partial.read_text()}
{footer}
{overlays}
</body></html>'''
    (ROOT/(filename+'.html')).write_text(output)
    print('Built',filename+'.html')
