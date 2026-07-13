# The Noodle Lounge — website

Mobile-first, dark-mode "link-in-bio" hub for **The Noodle Lounge** — Long Beach's
DIY Korean instant-ramen lounge & dirty-soda bar.
📍 712 Cherry Ave, Long Beach, CA 90813 · slurp. sip. chill.

## Stack
Zero-build static site — plain **HTML + CSS + vanilla JS**. Loads instantly on mobile,
no framework, no bundler.

```
index.html      # single-page site (hero, how-to, menu, social, events, footer)
styles.css      # dark-mode + neon-yellow design system
main.js         # live "open now / closed" badge (America/Los_Angeles) + year
vercel.json     # static hosting config (clean URLs + asset caching)
assets/         # drop logo, hero video, photos here (see assets/README.md)
RESEARCH.md     # full research dossier & content blueprint
```

## Run locally
```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Deploy to Vercel
This is a static site — **no build step**.

1. Push to GitHub (done — branch/`main`).
2. In the Vercel dashboard → **Add New Project** → **Import** this GitHub repo
   (`northvexsolutionsllc-bit/the-noodle-`).
3. Framework preset: **Other** · Build command: *(none)* · Output dir: `./` (root).
4. Deploy. Every push to `main` then auto-deploys.

> Prefer CLI? `npm i -g vercel && vercel --prod` from the repo root (requires a Vercel login/token).

## To finish before going fully live
- Add real photos + hero video to `assets/` and wire them in (see `assets/README.md`).
- Confirm the public phone number, exact ramen inventory, and whether the cooking
  stations are automated induction (copy is currently kept neutral: "cook it fresh").
- Swap the placeholder Yelp reviews / reels for live embeds when ready.
- Update the watch-party ticker text in `index.html` as events change.
