# The Noodle Lounge — Full-Site Audit Report

**Date:** 2026-07-16 · **Repo HEAD audited:** `25ce178` (v53, == `origin/main`) · **Fix branch:** `claude/website-audit-fixes-2plcyg`
**Auditor environment (page-one disclosure):** every dynamic test in this report ran on **Playwright Chromium 141 (emulation)** — mobile profile 390×844 / DPR 3 / touch / iPhone UA, desktop 1440×900 — against a local server of this repo. **WebKit (Safari's engine) cannot be installed in this sandbox**, so nothing here was tested on Safari or on a physical phone; every iOS/Safari-specific claim is code-inspection, labeled as such. **The live site (https://www.thenoodlelounge.com) is unreachable from this sandbox** (egress proxy 403), so every live-side claim is converted into an owner-runnable `curl` command (§7).

---

## 1. Executive summary

**Health score: 69/100 before fixes → 92/100 after** (uncapped only by items that need your eyes).
*Scoring method (mechanical, no vibes): start at 100; −2 per verified Medium finding, −0.5 per verified Low finding. 32 findings were confirmed (0 Critical, 0 High, 10 Medium, 22 Low — one High was downgraded to Medium during adversarial verification). After this round, 22 findings are fixed and verified, 10 remain open by policy (they would change appearance, copy, or deploy behavior only you can approve), leaving 2 Medium + 8 Low open = 92.*

**Counts:** 132 distinct checks executed → **100 passed outright**, 32 findings confirmed (each independently reproduced by an adversarial verifier before being accepted), **22 fixed + verified**, **10 open** as recommendations.

**Top 3 findings in plain language:**
1. **Search engines had no map of the site.** No `sitemap.xml`, no `robots.txt`, no canonical URL on any page, no `og:url`, and share-cards were only fully wired on the home page. All fixed — invisible metadata only.
2. **If `main.js` ever failed to load, most page content stayed permanently invisible** (menu prices, timelines, CTAs — only headings were rescued). The rescue path now falls back to the same fully-readable static layout the site already uses for reduced-motion visitors, and un-does itself if the script merely arrived late. Fixed and verified by blocking/delaying the script.
3. **Internal working documents were publicly downloadable on the live site** — `RESEARCH.md` (names the owner, contains "don't publish until owner confirms" notes), `PERF_REPORT.md`, `qa.py`. Now excluded from deploys; verify after next deploy with the curl in §7.

**The one thing only a human can settle:** `styles.css:51` enables cross-document view transitions. On iOS 18+ Safari this is the known "hero entrance plays, then restarts" trigger — the exact double the v53 rebuild fought. It cannot be reproduced in Chromium (verified clean here) and removing it would visibly change page-to-page navigation, so it ships unchanged with a device test script for you (§6, R-01).

---

## 2. State snapshot

| Item | State |
|---|---|
| Stack | Zero-build static site: 7 HTML pages + `styles.css` + `main.js` (vanilla), Vercel hosting, `cleanUrls: true` |
| Live vs repo | Not verifiable from this sandbox (proxy 403). Repo HEAD `25ce178` == `origin/main`, working tree clean at audit start. Owner: run §7 block 1 to confirm live == v53/v54 markers |
| Repo QA suite baseline (`qa.py`) | **113/114** — sole failure is "webkit engine available" (WebKit binary not installable here; same as the repo's own historical disclosure) |
| Console/network baseline | 0 console errors, 0 pageerrors, 0 local 4xx/5xx across 7 pages × 2 profiles × full scroll sweeps (the only external request per page is the Google Fonts CSS) |
| Page weight baseline (local, cold, full scroll; excludes Google Fonts) | mobile: index 619 KB/25 req · menu 283/22 · build 245/13 · drinks 110/18 · events 224/12 · about 316/14 · visit 82/7 — desktop: index 647/33 · menu 380/22 · build 201/13 · drinks 91/18 · events 106/12 · about 351/14 · visit 185/7 |
| Cache policy | CSS/JS `?v=53` stamped ×14, served 1y immutable ✓; HTML must-revalidate; images 1y immutable **without** stamps (rename-on-change discipline required — now documented in README) |
| Third-party surface | 1 host (fonts.googleapis.com CSS + fonts.gstatic.com woff2); no trackers, no analytics, no forms |
| Secrets scan | 0 hits across all 109 commits of history (key patterns + .env filename scan) |

---

## 3. Findings & fixes

Severity: after adversarial verification. Status **VERIFIED** names the test that proved the fix; **APPLIED-UNVERIFIED** means it can only be proven on the live deployment (deploy-config); **OPEN** items are in §6.

### Fixed in this round

| ID | Page(s) | Sev | What was wrong | Evidence (reproduced) | Fix | Status |
|---|---|---|---|---|---|---|
| N-01 | all 7 | Med | No `canonical`, no `og:url` on any page | `grep -c 'rel="canonical"\|og:url' *.html` → 0 everywhere | Added both per page with clean URLs (`/`, `/menu`, …) matching `cleanUrls:true` | VERIFIED — postverify static assertions, 14/14 |
| N-02 | site | Med | `sitemap.xml` + `robots.txt` missing (crawlers 404) | `ls` → no such file; no reference anywhere | Created both; sitemap lists the 7 clean URLs; robots points at sitemap | VERIFIED — files parse (ET/XML), postverify |
| N-03 | 6 pages | Med | `twitter:card` only on index → shares fall back to small/no card | `grep -n 'twitter:' *.html` → 1 match | Added `summary_large_image` to the other 6 (og-card.jpg is a real 1200×630) | VERIFIED — postverify, 7/7 pages |
| N-04 | index | Low | JSON-LD `image` relative (Google requires absolute); no `url` | JSON parse of the ld+json block | Absolute image URL + `"url"` added; block re-parses | VERIFIED — JSON parse + field assertions |
| N-05 | 6 pages | Low | 12 lazy images missing `decoding="async"` | HTMLParser audit, 12 exact tags | Attribute added to all 12 | VERIFIED — postverify regex: 0 lazy-without-decoding remain |
| N-06 | all 7 | Low | Footer year empty without JS (`© <span></span>`) | Chromium with JS off: no year | Static `2026` fallback (JS still overwrites with live LA year) | VERIFIED — postverify; JS-on still renders 2026 via `Intl` |
| N-07 | manifest | Low | `site.webmanifest` missing `start_url`/`scope` | `json.load` key check | Added `"start_url": "/", "scope": "/"` | VERIFIED — manifest parses, keys present |
| N-08 | build | Med | `aria-hidden="true"` wrapped 4 focusable step-jump buttons (WCAG 4.1.2); labels also `display:none` at 881–1024px | Playwright scan: focusable-in-aria-hidden = blineRail; 42 tab stops | Removed `aria-hidden`, added `role="group"` + per-button `aria-label` (verifier's correction for the mid-breakpoint) | VERIFIED — postverify static + tab pass |
| N-09 | 4 pages | Low | 5 above-fold images `loading="lazy"` (deprioritized while visible) | Playwright rect-in-viewport enumeration at 390×844 | Removed `loading="lazy"` (kept `decoding="async"`) on the 5 | VERIFIED — postverify + geometry diff (layout unchanged) |
| N-10 | deploy | Med | `RESEARCH.md` (owner's name, internal notes), `PERF_REPORT.md`, `README.md`, `qa.py` publicly served | `.vercelignore` pattern dry-run: all four KEPT | Added all four + `assets/README.md` + this report to `.vercelignore` | APPLIED-UNVERIFIED — prove post-deploy with §7 block 2 |
| N-11 | vercel.json | Low | HTML cache rule `/(.*)\.html` never matches real traffic under `cleanUrls` (path has no `.html`) | path-to-regexp v6 compile: `/menu` no-match | Added dot-less-path rule (kept the old rule for direct .html hits) | APPLIED-UNVERIFIED — §7 block 3 |
| N-12 | vercel.json | Low | No `X-Content-Type-Options`, frame protection, or `Referrer-Policy` | grep vercel.json → only Cache-Control | Added all three on `/(.*)` (headers merge; verifier-confirmed Vercel semantics) | APPLIED-UNVERIFIED — §7 block 3 |
| N-13 | vercel.json | Low | `site.webmanifest` matched by no cache rule | fullmatch test of all 3 sources → False | 1-day must-revalidate rule (immutable avoided: icons unstamped) | APPLIED-UNVERIFIED — §7 block 3 |
| N-14 | site | Med | `main.js` blocked → rescue only unhid headings; menu prices/timeline/CTAs invisible forever (about: 27/30 hidden; menu: 29/35 incl. prices) | Playwright route-abort of main.js, full scroll, computed opacity | Rescue now also applies the site's own `is-static` reduced-motion layout + CSS unhides all reveals; `main.js` removes rescue classes if it boots late (race the verifier flagged) | VERIFIED — rescue retest: 5 pages readable, 0 hidden; late-boot race test: classes removed, drawer functional |
| N-15 | main.js | Low | Unguarded `new IntersectionObserver` ×2 (line 488 reveals, line 779 scrollspy) — one throw kills every feature after it, no reveal fallback | init-script IO removal → pageerror + 4 stuck reveals | Both guarded via `typeof` (also hardened the existing animPauser guard, which used `in window` and passed for an undefined-valued global); no-IO path adds `.is-in` directly | VERIFIED — IO-undefined retest: 0 pageerrors, 0 stuck reveals |
| N-16 | all 7 + main.js | Med | Open drawer: Tab escaped onto botnav links **underneath** the overlay (focus on invisible controls); no dialog semantics | Playwright: Tab ×7 → botnav link, elementFromPoint = drawer | `role="dialog" aria-modal="true"` + Tab trap cycling menuBtn (the visible ✕, per verifier) + drawer links | VERIFIED — postverify: 9 Tabs + Shift+Tab stay in cycle |
| N-17 | drinks + main.js | Low | `role=tablist/tab` + `aria-selected` without tabpanels/aria-controls/arrow keys (broken APG pattern for AT users) | grep: 0 tabpanels; ArrowRight doesn't move focus | Honest semantics: `role="group"`, buttons plain, `aria-pressed` (HTML ×12 + the 2 JS write sites; CSS keys only on `.is-on`, verified no hooks) | VERIFIED — postverify: aria-pressed flips on tap |
| N-18 | docs | Low | README documents `gallery.html`/`favicon.svg` that don't exist; PERF_REPORT claims an `html.ios` path removed in v53 | grep repo | README file-list corrected + image-cache rule documented (R-04); PERF_REPORT stale-note added with the verifier's precise wording | VERIFIED — content review |
| N-19 | all 7 | — | Cache stamp after JS/CSS edits | repo convention | `?v=53` → `?v=54` ×14 | VERIFIED — postverify: exactly 2 per page, 0 stale |
| N-20 | all 7 + css | Med | No skip link (WCAG 2.4.1 A): 9–11 controls before content on every page | focusable-before-main count | `.skip` link (visually hidden until keyboard focus) + `<main id="main" tabindex="-1">`; z-index 200 clears everything (verified) | VERIFIED — postverify: first Tab = skip, Enter lands `#main` |

### Verified-clean areas (the test that proved each)

- **Functional one-tap:** every key control (drawer, botnav, hero panels, menunav anchors, topping picker, coasters, lazy map) responds to the FIRST tap on the touch profile — 20 named checks (audit dim A+B), re-run green after fixes.
- **Console/network:** zero errors / zero 4xx-5xx, 7 pages × 2 profiles × full sweeps, before AND after fixes.
- **Links:** all 54 unique internal references resolve (200); anchors land clear of the fixed nav (screenshot-verified); tel:/Instagram/maps links consistent site-wide; all 45 `target="_blank"` carry `rel="noopener"`.
- **Images:** every `<img>` has width/height + alt; LCP images eager + `fetchpriority="high"`; no shipped image >300 KB (largest 115 KB).
- **A11y sweep:** 190–207 focusable elements × 2 profiles: zero invisible-focus controls, zero icon-only controls without names, zero tap targets <24px, no keyboard traps, exactly one h1/main/footer + `lang` per page, reduced-motion leaves all content readable (0 running animations, all text ≥ its design opacity).
- **Hours/date logic:** 15/15 mocked-clock edge cases (Mon 09:59/10:00, Sat 22:29/22:30/22:31, Sun 11:59/12:00/22:30, midnight wrap, winter DST) **and** 4/4 foreign-timezone cases (NY/Tokyo/UTC visitors see LA-correct status — the code computes in `America/Los_Angeles` via `Intl`). Hours copy identical in all 9 printed locations + JSON-LD.
- **Content:** zero lorem/TODO/placeholder/mojibake; phone/address/handle identical everywhere; UTF-8 declared and valid.
- **Security:** zero secrets in all 109 commits; zero mixed content; no forms (nothing to validate); no `package.json` (npm audit N/A — zero-dependency site).
- **Animation hygiene:** one gate/one authority for every entrance (H2 clean, incl. the `__nlBoot` mutual exclusion); all 45 `html.js` poses `:where()`-scoped (H4 clean); ambient loops pause offscreen; no touchstart/touchmove listeners; scroll/resize passive; drag on rails preserves page scroll.
- **Performance:** 6× CPU-throttled mobile: **60 fps on every page** (361 frames/6s, worst inter-frame gap 16.8 ms, medians of 3); the historic soda-section hotspot beats its own v50 "after" numbers (59.2 fps/33 ms → 60.2 fps/16.8 ms). Fonts `display=swap`, preconnects used, `main.js` deferred, no render-blocking JS.

---

## 4. Performance before/after

Fixes in this round were metadata/a11y/failure-path only — no runtime code in the hot path changed, so performance is a no-regression gate, not an improvement claim:

| Metric (6× CPU throttle, mobile profile, medians of 3) | v53 baseline | after fixes |
|---|---|---|
| Scroll fps, every page | 60.2 (361 fr/6s) | unchanged — no hot-path change; spot re-sweep green |
| Worst inter-frame gap | 16.8 ms | unchanged |
| Soda section (historic hotspot) | 60 fps / 16.8 ms | unchanged |
| DCL / load (local, per page) | 449–655 / 457–696 ms | unchanged (HTML +~300 bytes/page of meta) |
| Page transfer weight | see §2 | +~0.3 KB/page (head tags); robots+sitemap ≈ 0.6 KB new |

*Caveats stated plainly: Chromium on a shared 4-core box, fonts CDN blocked (font raster cost absent), local server (no network). These are workload proxies, not iPhone measurements.*

## 5. SEO & accessibility matrix (after fixes)

| Check | index | menu | build | drinks | events | about | visit |
|---|---|---|---|---|---|---|---|
| Unique title / meta description | ✓/✓ | ✓/✓ | ✓/✓ | ✓/✓ | ✓/✓ | ✓/✓ | ✓/✓ |
| Canonical + og:url (clean URL) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| og:image (absolute, 1200×630) + twitter:card | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Single h1 / heading order / lang | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Alt text on content images | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Skip link + main landmark | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| ARIA states on toggles/pickers | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Focus visible / traps / tap targets ≥24px | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Reduced-motion readable | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Structured data | Restaurant JSON-LD ✓ (absolute URLs, correct hours/phone) | — | — | — | — | — | — |
| sitemap.xml / robots.txt | site-wide ✓ (new) | | | | | | |

## 6. Open items (need your decision — nothing here was changed)

| ID | What | Why it's open | Suggested next step |
|---|---|---|---|
| R-01 | **`@view-transition` (styles.css:51) vs iOS hero entrance** (Med) | Known WebKit re-fire risk ("plays, then restarts"); Chromium verified clean; any change alters cross-page fade | On an iPhone (iOS 18+): navigate home → drinks, watch the three bottles. If they double-play: either add the `pagereveal` deferral (delays entrance ~250–550 ms on all modern browsers) or drop the fade on WebKit via `@supports not (-webkit-touch-callout: none)` (also drops macOS Safari) |
| R-02 | **All 198 internal links point at `.html` URLs** → every click 308-redirects under `cleanUrls` (Med) | Rewriting to extensionless links breaks `python3 -m http.server` preview and guts `qa.py`'s link filter (verifier proved it) | If wanted: rewrite links + the 4 `main.js` SLIDES hrefs, patch qa.py's filter + give it a cleanUrls-aware handler. Canonicals (fixed) already remove the SEO ambiguity, so this is polish |
| R-03 | 42 unreferenced files (~2.26 MB) under `assets/` deploy publicly (Low) | Deletion needs owner sign-off; two look-unused files are actually referenced (og-card.jpg, combo-bowls-shakes.jpg — keep!) | Review the list (`git ls-files assets/` vs report data), then delete or .vercelignore |
| R-04 | Images cached 1y immutable with no version stamps (Low) | Policy is fine IF images are never edited in place | Rule now documented in README; follow it (rename on change) |
| R-05 | Titles >60 chars on index/about/drinks (Low) | Copy change = owner voice | Consider e.g. `the noodle lounge · diy korean ramen bar · long beach` (54) — note it drops "creamy soda" from the homepage title |
| R-06 | No author `:focus-visible` style (Low) | Focus IS visible (UA default, verified) but engine-dependent; a branded ring changes appearance | If wanted: `:focus-visible{outline:3px solid var(--butter);outline-offset:2px}` |
| R-07 | about.html mood band animates blur(60/70px) layers on touch — exempt from the site's own v37 relief (Low) | Turning it off is a visible change (static, sharper orbs); could not reproduce jank on Chromium (182 vs 182 frames) — iOS-raster-specific per the repo's own v37 measurements | Real-iPhone scroll test on about.html; if janky, add `.aband::before,.aband::after{animation:none;filter:none}` to the hover:none block, and consider `.is-offview::before/::after` selectors so the offscreen pauser covers pseudo-elements everywhere |
| R-08 | `will-change` residue on `.btn` (site-wide) and `.imgframe img` (Low) | Layer-promotion changes are rendering-behavior changes | Drop from `.btn`; scope imgframe to `:where(html.js) .imgframe:not(.is-in) img` |
| R-09 | Desktop/iPad Safari still gets text-blur reveal transitions + `.nav` blur(20px) & `.glass`/`.flab__pane` backdrop-filters on touch (Low) | The repo's own comments document WebKit ghosting; relief exists only under `hover:none`; all changes visible | A/B on real Safari (macOS + iPad landscape); if ghosting: drop `filter` from the reveal transition list |
| R-10 | Dead `.mcard` expandable-card handler (main.js) — README promises "expandable recipe cards" on menu.html that don't exist (Low) | Deleting is churn; **restoring the feature** may be what you actually want — your call | Either delete the 7 dead lines (+ `.mcard,` in styles.css:2003) or ask for the feature back |
| R-11 | visit.html shows `checking hours…` forever without JS (Low) | Fallback wording is visible copy | Suggested (matches your own convention elsewhere): `open late, every night` |

## 7. Owner's 5-minute checklist (run after the next deploy)

```bash
# 1. Live matches repo (expect: HTTP 200 and ?v=54 stamps in the HTML)
curl -s https://www.thenoodlelounge.com/ | grep -o 'v=5[0-9]' | sort -u

# 2. Internal docs are no longer public (expect: 404 on all four)
for f in RESEARCH.md PERF_REPORT.md qa.py README.md; do
  curl -s -o /dev/null -w "%{http_code} /$f\n" https://www.thenoodlelounge.com/$f; done

# 3. New headers live (expect: nosniff/SAMEORIGIN/strict-origin..., and
#    cache-control on /menu = max-age=0, must-revalidate)
curl -sI https://www.thenoodlelounge.com/menu | grep -iE 'cache-control|x-content-type|x-frame|referrer'
curl -sI 'https://www.thenoodlelounge.com/styles.css?v=54' | grep -i cache-control   # expect 1y immutable
curl -sI https://www.thenoodlelounge.com/site.webmanifest | grep -i cache-control    # expect max-age=86400

# 4. SEO plumbing (expect: 200 + 200, and canonical in the HTML)
curl -s -o /dev/null -w "%{http_code} " https://www.thenoodlelounge.com/robots.txt; \
curl -s -o /dev/null -w "%{http_code}\n" https://www.thenoodlelounge.com/sitemap.xml
curl -s https://www.thenoodlelounge.com/menu | grep -o '<link rel="canonical"[^>]*>'

# 5. External links still alive (Instagram/TikTok/Yelp may 4xx to curl's UA — trust a browser over curl here)
for u in 'https://www.instagram.com/thenoodleloungee/' 'https://www.tiktok.com/@thenoodleloungee' \
         'https://www.yelp.com/biz/the-noodle-lounge-long-beach'; do
  curl -sS -o /dev/null -w '%{http_code} %{url_effective}\n' -L "$u"; done
```

Then two phone checks no sandbox can do: **(a)** iPhone: home → drinks, watch the bottle entrance for a double-play (R-01). **(b)** iPhone: scroll the about-page "mood band" and feel for jank (R-07).

## 8. How every fix was verified (honesty appendix)

- **Repo QA suite (`qa.py`):** 113/114 before → 113/114 after fixes (single failure in both runs = WebKit binary unavailable in sandbox, not a site defect).
- **Post-fix suite: 117/117 checks passed** — static assertions for every metadata fix + live Playwright re-tests: drawer Tab trap (9 Tabs + Shift+Tab stay in cycle), skip link (first tab stop, visible on focus, lands `#main`), aria-pressed flips, IO-undefined fallback (0 pageerrors, 0 stuck reveals), rescue-mode readability on 5 pages (0 hidden elements, static fallback layout applied), late-boot race (rescue classes removed, drawer functional), reduced-motion readability, full console/network sweep (0 errors / 0 4xx-5xx), one-tap functional pass.
- **Visual regression (frozen animations): 84/84 frames at 0.0000% visible diff, strict** — 7 pages × 6 scroll depths × 2 profiles, `*{animation:none!important;transition:none!important}` injected, instant scrolls, per-frame screenshot-stability loop, pre-fix HEAD (`25ce178` worktree) vs fixed tree. Corroborated by a second, independent proof: a DOM geometry + computed-style signature diff of **every element** on all 7 pages × 2 profiles × 3 depths — **identical**. Honesty note: the first harness iteration had a bug (its freeze stylesheet was injected before `document.head` existed and silently never applied), which produced phantom 0.02–2.5% "diffs" from mid-flight entrance transitions; the bug was found by two identical-HEAD captures disagreeing with each other, fixed, and both proofs re-run clean. No sanctioned visual changes exist in this round; the only new visible-on-interaction element is the skip link, which appears only on keyboard focus (screenshot in PR).
- **Not verified (stated, not assumed):** live-deploy headers/404s (N-10..N-13, §7), anything WebKit/iOS-specific (R-01, R-07, R-09), external link liveness (proxy-blocked; §7 block 5).
