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
index.html      # single page: hero, story, drinks rail, build-your-own, gallery,
                # pricing, hangout/events, press + platforms, visit, footer
styles.css      # cream + emerald design system
main.js         # live open/closed status, slideshow, reveals, nav, carousel,
                # lightbox, lazy map facade
favicon.svg     # bowl-and-steam mark
assets/img/     # 23 real restaurant photos (clean names)
assets/reference/  # owner's design-reference videos + receipt (not shipped on page)
RESEARCH.md     # research dossier & verified facts
```

## Run locally
```bash
python3 -m http.server 8000   # open http://localhost:8000
```

## Deploy (Vercel)
Static — import the repo, framework preset **Other**, no build command, output `./`.
Every push to `main` auto-deploys once the Vercel↔GitHub account link is verified.

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
Drop `assets/video/hero-loop.mp4` (muted portrait loop, ≤3 MB) into the repo and
the hero auto-detects it and fades it in over the slideshow. See `assets/README.md`.

## Still pending from the owner
- Public online-ordering URL (see Ordering above)
- Exact drink menu names/prices (Berry Breeze etc.) for a full menu page
