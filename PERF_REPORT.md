# PERF_REPORT — v50 runtime FPS pass (home-page scroll jank)

**Environment disclosure:** the WebKit Playwright binary cannot be installed in this sandbox (cdn.playwright.dev is blocked), so all profiling ran on **Chromium + CDP, 6x CPU throttle, 390x844 viewport, DPR 3, iPhone UA**. Chromium's compositor is not WebKit's; the absolute numbers are a proxy. What transfers to the iPhone is the *workload* reduction (style recalcs, paints, per-frame writes) and the relative FPS gain. Nothing here was tested on a physical iPhone.

> **Stale as of v53:** the `html.ios` class path this report references was removed in the v53 hero rebuild (commit 25ce178, deliberate). Touch-device animation trimming now lives solely in the `@media (hover:none)` relief block in styles.css plus the `.is-offview` offscreen pause; the narrower v47 iOS-only kill list (hero fig/steam/pin idle loops) is no longer applied. A 2026-07 re-probe at v53 (same 6x-throttle design) measured soda at 60.2fps / 16.8ms worst gap — the v50 optimizations held.

## Named root cause of the drinks-section lag

The home "soda bar" section (`.soda`, end of index.html) is a JS-scrubbed 3D carousel: **every scroll frame, on every part of the page, all 11 scroll-story runners executed and the soda runner wrote `transform`, `opacity`, `z-index` and a `--sheen` custom property on all 6 cards — even cards that were invisible, even values that hadn't changed, and even while the section was completely offscreen.** The per-frame z-index churn additionally forced the compositor to re-layerize the scene every frame. Result in the baseline trace: the soda scroll window spent **888ms in style recalculation** (vs ~180–240ms for comparable sections) and ran at **~28–48fps** while every other section held ~55–60fps.

## Baseline vs after — FPS per section (6x CPU throttle, median of paired runs)

| Section | Baseline FPS | After FPS |
|---|---|---|
| hero | 48.5–50 | 45.5–50 (unchanged, within noise) |
| stack | 55.8–58.2 | 51.9–55.8 (unchanged) |
| cinema | 53.2–58.5 | 50.1–57 (unchanged) |
| evband | 54.6–57.4 | 51.8–60.1 (unchanged) |
| **soda (drinks)** | **28.9–48.3, median 43.7** | **57.7–59.2, median 59.2** |
| footer | 57.9–60.1 | 60 (unchanged) |

Clean 4-run paired comparison (no instrumentation overhead): **soda 43.7 → 59.2 fps median; p95 frame gap 33ms → 17ms (every-other-frame drops → none); worst gap 117ms → 33ms.** Whole-page rest-of-scroll unchanged at 59.1fps.

## Long tasks & layers

| Metric | Baseline | After |
|---|---|---|
| Long tasks during scroll (instrumented runs) | 8 (471ms total) | 1–2 (62–121ms) — **>70% cut** |
| Long tasks > 100ms during scroll | 0 | 0 |
| Composited layers (page bottom) | 43 | 43 (no layer explosion; blanket hacks audited, none added) |
| Soda style-recalc time in trace window | 888ms | 684ms |
| Soda Paint time | 184ms | 105ms |

## Fixes applied (all pixel-identical — proven, see Verification)

| # | Fix | File | Measured impact |
|---|---|---|---|
| 1 | **Gate all 11 scroll-story runners by section visibility** (`addRunner()` skips a runner when its section is >160px offscreen; first call always runs for initial poses) | main.js | Long tasks −75%; removes ~all cross-section style writes; biggest contributor to whole-page smoothness |
| 2 | **Soda write-dedupe:** skip writes when value unchanged, skip transform writes on invisible cards (opacity 0), `--sheen` written only where visible (\|off\|<1.6 — beyond that the sweep is outside the card), glow gradient written only when the focused card *index* changes (was every frame), progress bars write-on-change | main.js | Soda recalc 888→684ms, Paint 184→105ms; parked scroll = zero mutations |
| 3 | **z-index depth-banding** (z changes only at half-way crossings; stacking order provably identical — z stays monotonic in distance) | main.js | Kills per-frame re-layerization trigger |
| 4 | **Offscreen ambient-animation pause:** IntersectionObserver toggles `.is-offview` per section; CSS pauses all keyframe loops in offscreen sections via `animation-play-state` (resumes mid-cycle on re-entry, so onscreen visuals identical) | main.js + styles.css | Ambient loops (bottle idle, steam, floats, glow drifts) no longer burn frames page-wide on non-iOS; on iOS v47 already removed hero loops |
| 5 | `contain: layout paint` on `.dcard` | styles.css | Scopes invalidation to the card |
| 6 | Cache bump `?v=50` (main.js + styles.css changed) | 7 HTML | — |

**Tried and rejected (with reasons):**
- `will-change:transform` on the sheen pseudo-element cut soda raster 4x in traces, **but changed the 3D-rotated card's rendering path — a deterministic 1.9% pixel diff. Reverted** (hard rule: pixel-identical).
- Quantizing transform values (0.5px/0.5deg) — caused sub-pixel resampling diffs on card photos at paused positions. **Reverted**; the dedupe works at full precision.
- `content-visibility:auto` on evband/footer — those sections already measure near-zero cost (Paint 0–66ms), and placeholder-height mismatches risk scroll jumps inside the pinned-section math. **Not applied.**

## Phase-1 killer checklist (found / not-found)

| Killer | Verdict |
|---|---|
| A. backdrop-filter/blur onscreen while scrolling | **Found:** fixed nav `blur(20px)` + navCta; soda glow `blur(30px)`. Glow: static layer, repaints only on focus change (6x per full scroll) — left as-is. Nav: see approval list below. Hero glow blurs were already removed on touch in v37. |
| B. box-shadow/filter on animated elements | **Found:** `.dcard` large box-shadow animates via transform (compositor-carried, not repainted — acceptable); no filter on animated elements. |
| C. Layout-property animations | **Not found** — keyframes scan clean (v43 converted everything to transform/opacity). |
| D. Infinite animations running offscreen | **Found** (bottle idle, floats, steam, glow drifts on non-iOS) → fixed with `.is-offview` pause (#4). iOS already clean via v47. |
| E. Unbatched/non-passive scroll listeners | **Not found** — single rAF-batched `onScroll`, `{passive:true}`. |
| F. Autoplaying videos | **Not found** — no `<video>` on any page (`HERO_VIDEO` is disabled). |
| G. Oversized/decode-spiking images in drinks sections | **Not found** — all imgs have width/height + `decoding="async"` + below-fold `loading="lazy"`; ≤2.5x rendered size (v48/v49 slimming). Soda DOM: 6 cards, ~60 nodes, 6 images 800px natural vs ~750px rendered @DPR3. |
| H. Layer explosion from will-change hacks | **Not found** — 43 layers total; 26 `will-change` declarations audited, all on actively animated elements. |
| I. IO reveal re-triggering / over-observing | **Not found** — reveal observer unobserves after firing, threshold 0.16. |
| J. JS loop with interleaved reads+writes | **Not found as thrash** — reads are `getBoundingClientRect` of transformed (layout-stable) elements; trace shows only 15–18 Layout events across a full-page scroll. The real issue was write *volume*, fixed above. |

## Needs your approval: visual tradeoffs

**None required.** The fixed-nav `backdrop-filter: blur(20px)` was A/B-measured in this proxy (blur on vs off): 56.9 vs 58.1 and 56.0 vs 54.0 — **no significant delta here**, so it stays untouched. Caveat: real iOS WebKit is known to pay more for backdrop-filter than Chromium; if the phone still feels heavy after this round, the one candidate worth a real-device experiment is a scrolled-state nav without blur — that WOULD change the look, so it only happens on your say-so.

## Files changed

- **main.js** — `addRunner()` visibility gating for all 11 story runners; soda runner write-dedupe + glow/sheen/z-band logic; progress-bar write-on-change; `.is-offview` IntersectionObserver.
- **styles.css** — `.is-offview` animation-pause rule; `contain:layout paint` on `.dcard`.
- **7 HTML files** — cache bump `?v=49` → `?v=50` only.

## Verification (no behavior/visual regressions)

- **Pixel identity: 154-frame visual regression vs HEAD = 0.0000% mean, every frame ≤0.01%** (11 scroll positions × 7 pages × mobile+desktop, animations frozen).
- flash-test 14/14 · endstate OK · seen-all OK · ios-off (v47 behavior) all pass · qa.py **113/114** (sole fail = WebKit binary unavailable in sandbox).
- Drinks tab page: 52.7 → 54.2 fps (was already mostly fine; benefits from runner gating).

**Not deployed.** Committed on `claude/noodle-lounge-website-fubw2w`, draft PR only — merge after you review these numbers.
