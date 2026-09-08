"""Render the redesigned menu partial from the captured menu catalogue."""
from pathlib import Path
import html
import json
import re

ROOT = Path(__file__).resolve().parent.parent
catalogue = json.loads((ROOT / 'menu-data.json').read_text())
e = lambda value: html.escape(str(value or ''), quote=True)
slug = lambda value: 'menu-' + re.sub(r'[^a-z0-9]+', '-', value.lower()).strip('-')
source = e(catalogue['source'])
category_links = []
sections = []
for number, category in enumerate(catalogue['categories'], 1):
    dishes = [dish for dish in catalogue['items'] if dish['category'] == category]
    current = ' aria-current="location"' if number == 1 else ''
    category_links.append(f'<a href="#{slug(category)}" class="mv2-category-link"{current}><span>{e(category)}</span><small>{len(dishes):02}</small></a>')
    cards = []
    for dish in dishes:
        image = f'<div class="mv2-dish-photo"><img src="{e(dish["image"])}" alt="{e(dish["name"])}" loading="lazy" decoding="async" width="800" height="600"><span aria-hidden="true">↗</span></div>' if dish['image'] else ''
        description = f'<p class="mv2-dish-description">{e(dish["description"])}</p>' if dish['description'] else '<p class="mv2-dish-description">Explore the meal choices on Deliveroo.</p>'
        tags = '<span class="mv2-dish-tag">A favourite</span>' if dish['popular'] else ''
        if not dish['available']:
            tags += '<span class="mv2-dish-unavailable">Unavailable in the source menu</span>'
        search = e(' '.join([dish['name'], dish['description'] or '', category]).lower())
        cards.append(f'''<article class="mv2-dish{' mv2-dish-no-photo' if not dish['image'] else ''}" id="dish-{e(dish['id'])}" data-menu-id="{e(dish['id'])}" data-search="{search}">
            <div class="mv2-dish-copy"><div class="mv2-dish-meta">{tags}</div><h3>{e(dish['name'])}</h3>{description}<span class="mv2-dish-price">£{dish['price'] / 100:.2f}</span></div>
            {image}<button class="mv2-dish-open" type="button" data-dish="{e(dish['id'])}" aria-haspopup="dialog" aria-label="View {e(dish['name'])} details"><span class="mv2-visually-hidden">View dish details</span></button>
        </article>''')
    sections.append(f'''<section class="mv2-category" id="{slug(category)}" aria-labelledby="mv2-title-{number}"><div class="mv2-category-heading" data-reveal><span>{number:02}</span><h2 id="mv2-title-{number}">{e(category)}</h2><small>{len(dishes):02} selections</small></div><div class="mv2-dish-grid">{''.join(cards)}</div></section>''')
json_data = json.dumps(catalogue, ensure_ascii=False).replace('<', '\\u003c')
partial = f'''<main id="main-content">
<section class="page-hero mv2-hero" aria-labelledby="menu-page-title">
    <div class="mv2-hero-photo mv2-hero-film"><video class="mv2-hero-video" muted loop playsinline preload="metadata" poster="assets/video/menu-hero-poster.jpg" width="480" height="848" aria-label="A look inside Deluxe Manna: our restaurant, food and drinks"><source src="assets/video/menu-hero.mp4" type="video/mp4"></video><div class="mv2-film-tools"><a href="https://www.instagram.com/reel/C244j16I4yI/" target="_blank" rel="noopener" class="mv2-reel-link">Watch the reel <span aria-hidden="true">↗</span></a><button class="mv2-video-toggle" type="button" aria-label="Play menu video" hidden><svg class="mv2-video-play" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 11 7-11 7z"/></svg><svg class="mv2-video-pause" viewBox="0 0 24 24" aria-hidden="true" hidden><path d="M8 5v14M16 5v14"/></svg></button></div><noscript><a class="mv2-video-fallback" href="assets/video/menu-hero.mp4">Play the restaurant film ↗</a></noscript></div>
    <div class="container mv2-hero-inner"><div class="mv2-hero-copy"><p class="eyebrow" data-hero-item>THE DELUXE MANNA MENU</p><h1 id="menu-page-title" data-hero-item>A taste<br>of <em>Congo.</em></h1><p class="mv2-hero-description" data-hero-item>Charcoal grills. Comforting classics.<br>Food made to bring us together.</p><a href="#menu-catalogue" class="button button-outline" data-hero-item>Explore the menu <span aria-hidden="true">↓</span></a></div><div class="mv2-hero-bottom" data-hero-item><span>GOOD FOOD. GREAT COMPANY.</span><span>01 — THE MENU</span></div></div>
</section>
<section class="mv2-catalogue" id="menu-catalogue" aria-label="Food and drinks menu">
    <div class="container">
        <div class="mv2-catalogue-intro" data-reveal><div><p class="eyebrow">FIND YOUR FAVOURITE</p><h2>Made for your <em>table.</em></h2></div><a href="{source}" target="_blank" rel="noopener" class="mv2-deliveroo">Order on Deliveroo <span aria-hidden="true">↗</span></a></div>
        <div class="mv2-toolbar"><div class="mv2-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg><input id="menu-search" type="search" placeholder="Search dishes or drinks…" aria-label="Search dishes, ingredients and drinks" autocomplete="off"><button type="button" class="mv2-clear-search" aria-label="Clear search" hidden>×</button></div><p id="menu-result-count" role="status" aria-live="polite">{len(catalogue['items'])} dishes &amp; drinks</p></div>
        <div class="mv2-menu-layout"><aside class="mv2-category-nav"><p class="eyebrow">ON THE MENU</p><nav aria-label="Menu categories">{''.join(category_links)}</nav><a class="mv2-sidebar-contact" href="contact.html">A dietary question? <span aria-hidden="true">↗</span></a></aside><div class="mv2-sections">{''.join(sections)}<div class="mv2-empty" hidden><span aria-hidden="true">⌕</span><h2>Nothing on the table yet.</h2><p>Try another dish, ingredient or drink.</p><button type="button" class="mv2-reset-search">Show the full menu <span aria-hidden="true">→</span></button></div></div></div>
        <div class="mv2-menu-note"><p>Please speak to us about allergies and dietary requirements before ordering.</p><p>Menu prices and availability are from <a href="{source}" target="_blank" rel="noopener">Deliveroo</a>, checked 8 September 2026. They may change and may differ from dining in.</p></div>
    </div>
</section>
<section class="mv2-table-invitation container" data-reveal><div><p class="eyebrow">MAKE AN EVENING OF IT</p><h2>There’s a seat<br><em>with your name on it.</em></h2></div><a class="button button-outline" href="index.html#booking">Book a table <span aria-hidden="true">↗</span></a></section>
<dialog class="mv2-dish-dialog" id="dish-dialog" aria-labelledby="dish-dialog-title"><button class="mv2-dialog-close" type="button" aria-label="Close dish details">×</button><div class="mv2-dialog-photo"><img id="dish-dialog-image" src="assets/logo.png" alt="" width="800" height="600"></div><div class="mv2-dialog-copy"><p class="eyebrow" id="dish-dialog-category"></p><div class="mv2-dialog-heading"><h2 id="dish-dialog-title"></h2><span id="dish-dialog-price"></span></div><p id="dish-dialog-description"></p><p class="mv2-dialog-availability" id="dish-dialog-availability" hidden>Unavailable in the source menu. Check Deliveroo for current availability.</p><p class="mv2-dialog-note">Please speak to us about allergies before ordering. Delivery prices may differ from dining in.</p><a href="{source}" target="_blank" rel="noopener" class="mv2-dialog-order">View on Deliveroo <span aria-hidden="true">↗</span></a></div></dialog>
<script id="menu-catalogue-data" type="application/json">{json_data}</script>
</main>'''
(ROOT / 'partials/menu-main.html').write_text(partial)
print(f'Rendered {len(catalogue["items"])} dishes and drinks in {len(sections)} categories.')
