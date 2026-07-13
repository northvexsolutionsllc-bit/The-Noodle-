# assets

Drop the site's media here, then wire them into `index.html`.

## Hero video (ASMR loop)
- `hero.webm` and `hero.mp4` — bubbling ramen / soda pour loop (muted, ~10–20s, compressed).
- `hero-poster.jpg` — first-frame poster (shown before video loads / on reduced-motion).
- In `index.html`, uncomment the `<source>` lines inside `.hero__video` and set `poster="./assets/hero-poster.jpg"`.

## Photos to add
- `logo.svg` (+ `logo.png` fallback)
- ramen wall shots, topping close-ups (egg, cheese, kimchi, green onion, rice cakes)
- drinks — creamy Red Bulls, dirty sodas, **Berry Breeze**
- storefront / interior, board game corner, trinket trading post
- watch-party / event photos
- reels thumbnails for the "trending at the lounge" grid (`reel-01.jpg` … `reel-04.jpg`)

## Social / OG image
- `og.jpg` (1200×630) — set it in the `og:image` / `twitter:image` meta and the JSON-LD `image` field.

Recommended: serve `.webp`/`.avif` where possible and keep the hero video under ~3 MB for fast mobile load.
