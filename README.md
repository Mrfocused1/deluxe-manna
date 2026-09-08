# Deluxe Manna

A responsive, static restaurant website with a dark olive, cream and gold visual identity, supplied food and event photography, and an app-like mobile navigation. The four pages are Home, Our Menu, Catering & Events, and Contact.

## Run locally

The generated HTML is included, so no build or package installation is required to preview the site. From the project directory, run:

```bash
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080). Use a local server when developing; the included photography, fonts and animation libraries are all served from this project. Stop the server with `Ctrl+C`.

## Edit and rebuild

The editable page content lives in `partials/`. The four HTML files in the project root are generated output.

```bash
# After changing a page partial or the shared shell:
python3 scripts/build-site.py

# After changing menu-data.json:
python3 scripts/build-menu.py
```

`build-menu.py` is a compatibility entry point: it runs `build-menu-v2.py` to regenerate `partials/menu-main.html`, then runs `build-site.py` to assemble the site. Its previous implementation no longer restores the old page design. The scripts use only Python's standard library and resolve paths relative to the project, so they also work when invoked from another directory.

| File | Purpose |
| --- | --- |
| `scripts/build-site.py` | Shared document head, desktop header, mobile tabs, footer, intro and page-transition overlays; assembles all four HTML pages. |
| `partials/home-main.html` | Homepage hero, food reel, six-meal carousel, booking enquiry and story. |
| `partials/menu-main.html` | Generated catalogue and dish-details dialog; edit `menu-data.json` or `scripts/build-menu-v2.py` to change it. |
| `partials/catering-main.html` | Catering and events page content. |
| `partials/contact-main.html` | Contact page content. |
| `site.css`, `site.js` | Shared responsive visual system, GSAP intro, page transitions, scroll reveals, image parallax and micro interactions. |
| `home-v2.css`, `home-v2.js` | Homepage layout, interactive meal carousel, food reel and booking enquiry dialog. |
| `menu-v2.css`, `menu-v2.js` | Menu layout, search, sticky categories, dish sheets and direct dish links. |
| `catering-v2.css`, `catering-v2.js` | Events layout and enquiry interactions. |
| `contact-v2.css`, `contact-v2.js` | Contact layout and message interactions. |
| `assets/` | All photography, logo, local fonts and vendor animation libraries. |

Earlier CSS and JavaScript files remain in the project for reference. The generated pages load `site.css`/`site.js` and their corresponding `*-v2` files; the legacy `styles.css`, `desktop.css`, `script.js`, and previous page styles/scripts are not loaded. `design-reference.png` is a design reference, not a live page asset.

## Menu catalogue

`menu-data.json` contains **62 dishes and drinks in 11 categories**, captured from the [Deluxe Manna Seven Sisters listing on Deliveroo](https://deliveroo.co.uk/menu/london/seven-sisters/deluxe-manna) on **8 September 2026**. Prices are GBP stored as integer pence. Names, descriptions, prices and source availability are preserved in the catalogue; they are a snapshot, not live inventory. Delivery prices and availability may change and may differ from dining in.

There are **58 local menu images** in `assets/menu/`. Meal for One, Meal for Two, Tonic Water and Flemish have no source image. The two meal deals have no source description, so the page directs visitors to Deliveroo for their choices. Repeated promotional placements are not duplicated, and modifier-only choices are not counted as standalone dishes.

Menu search matches names, descriptions and categories. Each dish has a stable `menu.html#dish-{id}` link. Selecting a dish opens a native dialog with its full description and image, presented as a bottom sheet on mobile. The ordering link leads to Deliveroo; there is no cart or checkout in this project.

## Assets and dependencies

The `assets/` directory includes **74 images in total**, including the logo: 58 menu images, six event photographs, the contact-table photograph, the original brand/site imagery, the supplied homepage hero photograph, and a video poster frame. All are local and included in the project.

- **GSAP 3.15.0** and **ScrollTrigger 3.15.0** are included in `assets/vendor/`. Keep their embedded license notices intact; their headers link to the [GSAP standard license](https://gsap.com/standard-license).
- **Cinzel**, **Cormorant Garamond** and **DM Sans** are served from `assets/fonts/`, with face definitions in `assets/fonts/fonts.css`. Their SIL Open Font License files are included alongside the fonts as `cinzel-OFL.txt`, `cormorantgaramond-OFL.txt` and `dmsans-OFL.txt`.
- There is no npm dependency or framework build step. The live pages do not require a remote font service or animation CDN.

The supplied photography and logo remain Deluxe Manna project assets. The menu image source URLs are retained in `menu-data.json` for provenance.

## Interactions and accessibility

The shared intro plays once per browser-tab session, can be skipped, and can be replayed from the footer. Each destination page has its own transition. Scroll reveals, desktop image parallax and hover/touch feedback enhance the layout; `prefers-reduced-motion` suppresses the intro, transitions and motion effects. The homepage food reel stops when off-screen or when the visitor interacts with it.

The layout includes mobile safe-area spacing, persistent bottom navigation, native form validation, keyboard-operable controls, visible focus states and native dialogs with Escape-to-close behavior. Dish links and ordinary page links remain standard URLs.

## Enquiries and external services

Booking, catering and contact forms validate the visitor's details and open an **email draft to `hello@deluxemanna.com`**. Visitors must send that draft using their own email app. These forms do not transmit messages themselves, create confirmed reservations, or store submissions on a server. Catering provides a downloadable enquiry copy, and Contact offers a copy-message fallback.

No booking provider, email backend, payment system or database is configured. Connect an approved service before adding live confirmation or delivery behavior. No unverified phone number, street address or opening hours have been invented.

## Verification

The redesign was checked in the browser at 320, 390, 768, 1024, 1440 and 1920px widths with no page or form overflow. Checks covered menu search and empty results, dish sheets, event gallery controls, event type preselection, a neutral local enquiry draft (not sent), reservation details, required-field validation, intro replay/recovery and direct section links. All four documents, local asset references and menu dish anchors were checked; all 72 supplied images are used.

## Updated hero media

The homepage uses the supplied `homepage image.jpg`, copied unchanged to `assets/homepage-hero.jpg`. The menu hero uses the [supplied Deluxe Manna Instagram reel](https://www.instagram.com/reel/C244j16I4yI/), saved locally in `assets/video/`. The full reel and a 2.4 MB silent web copy are included. It plays muted and inline, loops, pauses when off-screen, and has a play/pause control. Reduced-motion settings leave it paused until explicitly played. The poster comes from the reel; see `assets/video/README.md` for source details. Both crops and video controls were checked on mobile and desktop.
