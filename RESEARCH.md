# The Noodle Lounge — Research Dossier & Website Blueprint

> Compiled research for the "link-in-bio" website build. This document is the
> single source of truth for facts, copy, brand direction, and open questions.
> **No website has been built yet** — this is the information-hunting + architecture
> phase. Images/assets to be uploaded to the repo separately.
>
> Last researched: **July 13, 2026**

---

## 1. Business Snapshot (verified facts)

| Field | Detail | Confidence |
|---|---|---|
| **Name** | The Noodle Lounge | ✅ Confirmed |
| **Concept** | DIY Korean-style instant-ramen convenience store + custom "dirty soda" / creamy Red Bull bar + community hangout | ✅ Confirmed |
| **Owner / Founder** | Leylanee Hernandez | ✅ Confirmed (Hoodline/LB Post) |
| **Address** | 712 Cherry Ave, Long Beach, CA 90813 | ✅ Confirmed |
| **Cross streets** | Corner of 7th Street & Cherry Avenue | ✅ Confirmed |
| **Former tenant** | Old **Cityside Pizza Palace** space | ✅ Confirmed |
| **Phone** | (562) 248-2178 | ⚠️ From search snippet — verify before publishing |
| **Opened** | ~June 2026 ("quietly opened last month" per July 2026 articles) | ✅ Confirmed |
| **Coordinates** | 33.7755587, -118.1675343 (Google) / 33.775616, -118.167484 (Apple) | ✅ Confirmed |

### Hours — ⚠️ DISCREPANCY TO RESOLVE
- **Client brief says:** "Open Daily: 10:00 AM – 10:30 PM"
- **Search data says:** Mon–Sat 10:00 AM – 10:30 PM, **Sun 12:00 PM – 10:30 PM**
- **Action:** Confirm Sunday open time with the owner before publishing. Default to the client brief ("Open Daily 10:00 AM–10:30 PM") only if owner confirms; otherwise show the split Sunday hours.

---

## 2. The Concept / Story (for the "About" narrative & meta description)

- Modeled on **South Korean convenience stores** — the grab-and-go + cook-it-yourself + hang-out culture (like a CU/GS25/7-Eleven Korea experience), scaled down for Long Beach.
- Customers **pick an instant ramen** (cups or packets, cheesy → spicy), **cook it in-store**, and **stack toppings/sides**.
- The **creamy Red Bulls & dirty sodas** grew out of a **pop-up business Hernandez started earlier in 2026**, after she **fell in love with the concept on a trip to Washington** (state — dirty soda / creamy energy drink culture is big in the PNW / Utah). The store is essentially that pop-up given a permanent home.
- Positioning is deliberately **social + late-night**, not just quick in-and-out snacks. The goal in the owner's words: **"become the hangout spot."**
- Found its early customer base through **social media + word of mouth**, driven by **unique, Instagrammable drinks**.

**Owner quote / vision:** Hopes the store becomes a **community hub**.

---

## 3. Menu & Pricing (verified)

### Core offer
- **$15 Pack Combo** — choice of ramen packet + **1 core topping** + a standard drink. (This is the most popular / hero item.)
- **Customizers: +$1 per extra topping.**

### Ramen
- Massive curated wall of **imported instant ramen** — cups and packets, ranging **cheesy → very spicy**.
- Brands to reference (Korean instant-ramen canon; confirm exact inventory with owner):
  - **Samyang Buldak** (Hot Chicken / Fire Noodle line — carbonara, kimchi, 2x spicy, cheese, etc.)
  - **Nongshim Shin Ramyun**, Neoguri, Chapagetti
  - **Ottogi**, **Paldo** varieties
- Cooking: customers cook on-site. Client brief specifies **automated induction cooking stations** ("place your bowl, press start"). *Not explicitly confirmed in press — treat "induction stations / press start" as the client's described UX; keep copy accurate to what's actually installed.*

### Toppings (+$1 each beyond the combo's one)
Confirmed in press: **green onion, hard-boiled or raw egg, cheese, shrimp** — "and more."
Client brief adds: **soft-boiled eggs, kimchi, rice cakes (tteok)**.
→ Combined topping list for the site: **cheese, soft/hard-boiled egg, raw egg, green onions, kimchi, rice cakes, shrimp** (+ "and more").

### Drinks — "not your average corner store soda"
- Large selection of **Asian sodas & juices**.
- **Creamy Red Bulls** — Red Bull + flavored syrups + cream.
- **Dirty sodas** — soda + flavored syrups + cream, made to order.
- **Signature / most popular drink: "Berry Breeze"** — blue raspberry syrup + Iced Vanilla Berry Red Bull + creamer + whipped cream. *(Great candidate to feature by name on the drinks block.)*
- Also stocks **Asian snacks**.

---

## 4. Community / Events (key differentiator)

- **Watch parties** already hosted: **World Cup** and **Love Island**.
- **Board game corner.**
- **Trinket trading post** (a swap/trade station — very Gen-Z, on-brand for social content).
- Vision: neighborhood **community hangout hub**, late-night friendly.
- **Ticker copy from brief:** "Next Watch Party: This Thursday at 7 PM!" (make this an easily-editable field — events change weekly).

---

## 5. Digital Footprint / Channels (link-in-bio targets)

| Channel | Handle / URL | Notes |
|---|---|---|
| Instagram | **@thenoodleloungee** — https://www.instagram.com/thenoodleloungee/ | Bio reads "sʟᴜʀᴘ , sɪᴘ & sɴᴀᴄᴋ 🍜". Primary visual channel. |
| TikTok | **@thenoodleloungee** — https://www.tiktok.com/@thenoodleloungee | Reels/short-form; "first days open" creator videos exist. |
| Yelp | https://www.yelp.com/biz/the-noodle-lounge-long-beach | 17 photos as of July 2026, category **Ramen**. |
| Google Maps | https://maps.app.goo.gl/ (place: The Noodle Lounge) | Coordinates above; place-id `0x80dd319c4a92893d:0x24286dcf605abdc`. |
| Apple Maps | https://maps.apple.com/place?place-id=I857D2AC94E03E2AB | Address confirmed 90813. |

**Note:** Star ratings / review counts for Google & Yelp were not reliably retrievable in research — pull live at build time or embed dynamically. Do **not** hard-code a fabricated rating.

**Press coverage (social proof / "as seen in"):**
- Hoodline (July 2026): "Long Beach Noodle Lounge Aims To Be Ramen Hangout"
- Long Beach Post — Eat.See.Do. (July 2026): "This new convenience store wants to be Long Beach's hangout for instant ramen lovers"

---

## 6. Website Architecture (agreed from brief + research)

**Type:** Mobile-first, single-page, smooth-scroll "link-in-bio" hub. No heavy top nav.
**Primary traffic:** Google/Apple Maps, Instagram, Yelp, local news → so **fast mobile load + directions + menu** are the top jobs.

### Sticky bottom mobile nav (4 icons)
`[ Menu ]  [ How It Works ]  [ Events ]  [ Directions ]`

### Section order (top → bottom)
1. **Hero** — full-bleed ASMR video loop placeholder (bubbling ramen / soda pour).
   - H1: **"slurp. sip. chill."** (bold, neon-yellow, lowercase)
   - Sub: "Long Beach's DIY Korean instant ramen lounge & dirty soda bar. Pick your pack, stack your toppings, and cook it fresh."
   - CTAs (side-by-side, high contrast): **[Map Our Location]** + **[Find Us on Yelp]**
2. **How to Noodle** — 4-step icon/card grid:
   - 01 / **Browse the Wall** — pick your base from our curation of imported Korean instant ramen packets.
   - 02 / **Stack the Top** — grab fresh add-ons: cheese, soft-boiled eggs, green onions, kimchi, or rice cakes.
   - 03 / **Press Start** — place your bowl on our induction cooking stations. Perfect noodles every time.
   - 04 / **Mix a Drink** — pair it with a custom creamy Red Bull or a signature dirty soda.
3. **Menu & Pricing** —
   - $15 Pack Combo (ramen packet + 1 core topping + standard drink)
   - Customizers: +$1 per extra topping
   - Drinks sub-block — H: "not your average corner store soda." / body: "Creamy Red Bulls, custom flavor shots, and dirty sodas made to order. The ultimate chaser for a spicy bowl of Buldak." (Optionally feature **Berry Breeze** by name.)
4. **Social & Validation** — side-by-side grid: (L) live-updating Yelp review stream card; (R) 9:16 vertical video grid "Trending at the Lounge" (mimics Reels/TikTok).
5. **Neighborhood Footer** —
   - Address: 712 Cherry Ave, Long Beach, CA 90813
   - Hours: Open Daily 10:00 AM – 10:30 PM *(pending Sunday confirmation)*
   - Bottom ticker: "Next Watch Party: This Thursday at 7 PM!"

---

## 7. Design System

- **Background:** pure black `#000000` (dark mode only) so neon + packaging colors pop.
- **Accent / neon yellow:** primary highlight for headers & CTAs (suggest `#E8FF00` / `#F2FF49` range — finalize against real packaging photos).
- **Secondary pops:** vibrant drink colors (blue-raspberry blue, red-bull red/pink) pulled from photography, used sparingly for buttons/badges.
- **Typography:**
  - Headers: clean lowercase geometric sans (e.g. General Sans, Clash Grotesk, Space Grotesk, or system-safe: Inter/Helvetica lowercase) — Gen-Z social feel.
  - Body: high-readability geometric sans (Inter / DM Sans).
- **Motion:** smooth scroll, subtle section reveals, looping muted autoplay hero video, hover glow on neon elements. Keep it lightweight for mobile.
- **UI:** 100% responsive, instant load, sticky bottom nav on mobile only.

---

## 8. Recommended Upgrades (my additions — "other upgrades you deem fit")

1. **Local SEO / structured data:** `LocalBusiness` + `Restaurant` JSON-LD (name, address, geo, hours, phone, priceRange `$`, sameAs → IG/TikTok/Yelp/Maps). Critical since traffic is map-driven.
2. **One-tap actions bar:** Call, Get Directions (deep-links to Google *and* Apple Maps), Order/Follow — native mobile intents (`tel:`, `maps:`).
3. **Editable "Events" data source:** a simple JSON/markdown the owner can update for the watch-party ticker + upcoming events calendar (World Cup, Love Island, board-game nights).
4. **Open/Closed live badge:** compute from hours (e.g. "🟢 Open now · closes 10:30 PM") — reduces "are they open?" bounce.
5. **Menu clarity module:** visual ramen "wall" gallery + topping/drink builder mock so first-timers understand the DIY flow before arriving.
6. **Berry Breeze hero drink spotlight** — name-drop the signature to drive FOMO / social shares.
7. **Instagram/TikTok embed strategy:** since ratings/feeds change, plan for live embeds or a lightweight cached grid rather than hard-coded content.
8. **Accessibility on black:** ensure neon-on-black meets contrast (WCAG AA), add `prefers-reduced-motion` fallbacks for the ASMR loop, captions/poster image for the hero video.
9. **Performance:** hero video as compressed/looping poster-first (lazy, muted, `playsinline`), image `srcset`, preconnect to map/embed hosts.
10. **"Trinket Trading Post" + "Board Game Corner" mini-cards** — lean into the community differentiators, not just food.
11. **Share/UTM-ready links** so Maps/Yelp/IG traffic is attributable.
12. **Newsletter / SMS opt-in** for watch-party announcements (community retention).

---

## 9. Open Questions for the Owner (before/while building)

1. **Sunday hours** — 10 AM or 12 PM open? (resolve the discrepancy)
2. **Phone number** — confirm (562) 248-2178 is public-facing.
3. **Exact ramen brands/wall inventory** to feature and any signature toppings.
4. **Full drink menu** + prices (beyond the $15 combo standard drink) — is Berry Breeze the one to hero?
5. **Are the cooking stations truly automated induction "press start"** or manual? (keep copy honest)
6. **Logo, brand fonts, and hi-res photo/video assets** — to be uploaded to this repo.
7. **Online ordering / delivery?** (DoorDash listing exists for LB ramen generally — confirm if they're on it.)
8. **Real upcoming events** to seed the ticker/calendar.
9. **Email/booking** for watch-party reservations or private hangs?

---

## 10. Asset Checklist (to upload to repo)

- [ ] Logo (SVG preferred + PNG)
- [ ] Hero ASMR video loop (ramen boil / soda pour) — mp4 + webm + poster jpg
- [ ] Ramen "wall" photos
- [ ] Topping close-ups (egg, cheese, kimchi, green onion, rice cakes)
- [ ] Drink photos (creamy Red Bulls, dirty sodas, **Berry Breeze**)
- [ ] Storefront / interior (board game corner, trinket trading post)
- [ ] Watch-party / event photos
- [ ] Brand color hex values + font files (if custom)
- [ ] Confirmed hours, phone, socials, event schedule

---

### Sources
- Long Beach Post — Eat.See.Do.: https://lbpost.com/esd/eat-see-do-2/eat/noodle-lounge-long-beach-korean/
- Hoodline: https://hoodline.com/2026/07/ramen-crowd-stakes-out-long-beach-s-new-noodle-lounge-hangout/
- Yelp: https://www.yelp.com/biz/the-noodle-lounge-long-beach
- Instagram: https://www.instagram.com/thenoodleloungee/
- TikTok: https://www.tiktok.com/@thenoodleloungee
- Google Maps: https://www.google.com/maps/place/The+Noodle+Lounge/
- Apple Maps: https://maps.apple.com/place?place-id=I857D2AC94E03E2AB
