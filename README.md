# The Noodle Lounge — website

Premium, mobile-first single-page site for **The Noodle Lounge** — Long Beach's
DIY Korean instant-ramen lounge & creamy soda bar.
712 Cherry Ave, Long Beach, CA 90813 · slurp, sip & snack.

## Design system
- **Palette:** warm cream `#FAF6EF` / ivory / sage, deep emerald `#123528`,
  accents in butter `#E2A23B` and berry — inspired by the shop's kawaii cream
  branding, matcha drinks, and the owner's design references.
- **Type:** Fraunces (luxury display serif) + Outfit (geometric sans), lowercase styling.
- **Motion:** scroll-reveal system (fade/mask/stagger/pop), Ken Burns hero slideshow,
  rotated marquee ticker, magnetic buttons, 3D tilt cards, drag-to-scroll drink rail,
  masonry gallery with lightbox — all vanilla JS, `prefers-reduced-motion` respected.

## Stack
Zero-build static site — plain **HTML + CSS + vanilla JS**. No framework, no bundler.

```
index.html      # home: panel-carousel hero, intro, three paths, bento preview,
                # events band, drinks rail
menu.html       # ramen wall recipe cards (spice levels, expandable) + toppings
build.html      # build-your-bowl steps (verified HAUSCOOK 'press start')
drinks.html     # signature drinks recipe cards + collab credits
events.html     # watch parties / board games / trinket post
about.html      # story, press quotes, platform cards
visit.html      # address, hours, live status, lazy map, contact
styles.css      # design system v3 + motion engine (reveals, tsplit, parallax)
main.js         # carousel, split-text, parallax, tilt, expandable cards,
                # live status, lightbox, lazy map
assets/img/     # real restaurant photos, favicons (favicon-32.png is 64px), logo
robots.txt      # crawler policy, points at sitemap.xml
sitemap.xml     # 7 clean URLs (cleanUrls:true on Vercel)
assets/reference/  # owner's design refs + receipt (not shipped on page)
RESEARCH.md     # research dossier & verified facts
```

## Run locally
```bash
python3 -m http.server 8000   # open http://localhost:8000
```

## Deploy (Vercel)
Static — import the repo, framework preset **Other**, no build command, output `./`.
Every push to `main` auto-deploys once the Vercel↔GitHub account link is verified.

**Image cache rule:** images are served `max-age=31536000, immutable` with no
version stamps — never overwrite an image file in place; rename it (as with
`*-real.webp`) and update references, or returning visitors keep the old pixels
for up to a year. CSS/JS changes instead bump the `?v=NN` stamp in all 7 pages.

## Verified business facts used on the page
- Phone **(714) 600-7684** (from in-store receipt — supersedes older listings)
- Hours: Mon–Sat 10:00a–10:30p · Sun 12:00p–10:30p
- $15 combo (ramen + topping + drink) · ramen only ~$8 · +$1 per topping
- HAUSCOOK **automated** cooking stations ("press start" is real)
- Watch parties, board game corner, trinket trading post

## Ordering
"Order ahead" buttons (nav, pricing, visit, footer) currently dial the verified
phone number. When the owner confirms a public online-ordering URL, set
`ORDER_URL` at the top of `main.js` — every order button switches to
"order online" automatically. (The Clover link printed on receipts is a
receipt viewer, not an ordering page — do not publish it.)

## Hero video
Off by default: `HERO_VIDEO` at the top of `main.js` is an empty string, so no
`<video>` element is created and no network request is made. To enable, drop a
muted portrait loop (≤3 MB) into `assets/video/` and set `HERO_VIDEO` to its
path (e.g. `"./assets/video/hero-loop.mp4"`); it fades in over the slideshow
once it can play through. See `assets/README.md`.

## Still pending from the owner
- Public online-ordering URL (see Ordering above)
- Exact drink menu names/prices (Berry Breeze etc.) for a full menu page
