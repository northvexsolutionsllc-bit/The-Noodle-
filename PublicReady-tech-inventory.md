# Technical Inventory — The Noodle Lounge (www.thenoodlelounge.com)

Prepared 2026-08-03 from repository `northvexsolutionsllc-bit/The-Noodle-` (read-only audit).
Scope note: per instruction, MUTCDSignChart.com was excluded. WorkZoneCompliance.com lives in a
separate repository (`northvexsolutionsllc-bit/workzonecompliance`) not attached to this audit
session — not inspected. No paths were provided for either; nothing was guessed.

---

## A. Version control

- Remote: `https://github.com/northvexsolutionsllc-bit/The-Noodle-` (public repository).
  The local clone shows a sandbox git-proxy URL; the canonical remote above is confirmed via the
  GitHub API (`clone_url`).
- Owner handle: **northvexsolutionsllc-bit** (GitHub **User** account, not an organization).
- Branches: `main` (production — every push auto-deploys), `claude/website-audit-fixes-2plcyg`
  (working branch). No other branches on the remote.
  - Note: GitHub API metadata reports `default_branch: claude/noodle-lounge-website-fubw2w`,
    a branch that no longer appears in `git branch -a`. Likely stale index metadata from repo
    creation; all recent PRs merge into `main`, which is what Vercel deploys. Verify manually in
    repo Settings → Branches.
- Repository created: **2026-07-13T15:17:04Z** (GitHub API `created_at`).
- Earliest commit visible in this clone: 2026-07-13 (`071b6a6`). The clone is **shallow**, so the
  local log cannot prove the true first commit; the API creation date above is the reliable anchor.
- Last commit on `main`: **2026-07-26** — `9857ba2` "Migrate to www.thenoodlelounge.com, fix
  Directions links, harden dcard badge" (squash of PR #78). 135 commits visible in the shallow clone.

## B. Stack

- **Static HTML + CSS + vanilla JavaScript. Zero-build, no framework, no bundler.**
- 7 pages (`index/menu/build/drinks/events/about/visit.html`) + `styles.css` + `main.js`
  + `robots.txt`, `sitemap.xml`, `site.webmanifest`, `vercel.json`.
- No `package.json`, `composer.json`, or `requirements.txt`. No package manager. No Node runtime
  in production — files are served as-is.
- `qa.py` (Python 3 + Playwright) exists in the repo as an internal test harness only; it is
  excluded from deployment via `.vercelignore`.

## C. Hosting and deployment

- **Vercel** — proven by `vercel.json` (cleanUrls, security + cache headers) and `.vercelignore`.
- Deploy model: git-integration; pushes to `main` auto-deploy. No GitHub Actions
  (`.github/workflows` absent), no `netlify.toml`, `wrangler.toml`, `.firebaserc`, `CNAME`,
  or `Dockerfile`.
- `vercel.json` sets: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`,
  `Referrer-Policy: strict-origin-when-cross-origin`; 1-year immutable caching for images/css/js,
  no-cache for HTML and `/assets/menu/` (the menu PDF).

## D. Domains

- Production: **https://www.thenoodlelounge.com** — canonical/og/sitemap/robots all point here
  (migrated 2026-07-26). Non-www 308-redirects to www (owner-confirmed behavior; DNS/redirect
  config lives in Vercel, not in the repo).
- Former/platform domain: **the-noodle.vercel.app** (Vercel default). No longer referenced in any
  deployed file; still listed as the GitHub repo "homepage" field (stale — update in repo settings).
- Per-branch Vercel preview URLs (`the-noodle-git-*.vercel.app`) exist transiently on PRs; none in code.
- A client-preview domain (recipania.xyz) was mentioned in project conversation but appears in **no
  repository file** — its DNS/ownership is outside this repo. Unknown, verify manually.

## E. Databases, backend, external APIs

- **No database. No backend. No API keys.** The site is fully static with no runtime data store.
- Third-party endpoints referenced (all public, unauthenticated):
  - Google Fonts CSS + font files — `fonts.googleapis.com` / `fonts.gstatic.com` (all 7 HTML heads)
  - Google Maps — outbound "Directions" links (`google.com/maps/search/?api=1&query=…`, 10 links
    across all pages) and a lazy-loaded embed iframe (`google.com/maps?q=…&output=embed`,
    `main.js:934`)
  - Apple Maps — one outbound link (`maps.apple.com/place?...`, `visit.html`)
  - Social profile links (outbound only): Instagram `@thenoodleloungee`, TikTok `@thenoodleloungee`,
    Yelp `the-noodle-lounge-long-beach`
- `main.js` makes **no** fetch/XHR/beacon calls. Structured data uses schema.org JSON-LD (markup
  vocabulary only, no network dependency).

## F. Analytics, Search Console, monitoring

- **None present.** Greps for gtag / G-XXXX / UA-XXXX / Google Tag Manager /
  google-site-verification / Clarity / Plausible / Hotjar / Sentry all return zero across every
  HTML/JS file. No cookies, no trackers. If the client expects analytics or Search Console
  verification, it has not been installed — verify whether Search Console is claimed via DNS
  instead (not visible from the repo).

## G. Third-party materials

- **Fonts:** Fraunces (variable, 400–600 + italics) and Outfit (300–800), loaded from Google
  Fonts (`index.html` head and all pages). Both are licensed under the SIL Open Font License 1.1
  (per Google Fonts); served remotely, not vendored into the repo.
- **Images:** all photography is the restaurant's own (client-supplied phone photos, processed to
  WebP in `assets/img/`, 4.6 MB). Logo/brand marks in `assets/brand/` derive from the client's own
  branding. No stock photography detected, no third-party image credits present.
- **Icons:** hand-authored inline SVG in the HTML/JS — no icon library (no Font Awesome etc.).
- **Menu PDF:** `assets/menu/noodle-lounge-menu-jul-2026.pdf` (2.0 MB) — client's own menu.
- **Code:** all CSS/JS is bespoke for this project. No vendored libraries, no npm dependencies,
  no copied framework code. `qa.py` (non-deployed) imports Playwright (Apache-2.0).
- **Datasets:** none.

## H. Paid or licensed assets

- None found in the repo. No premium plugins, licensed fonts, or paid API references.
- Vercel hosting and the thenoodlelounge.com domain registration are account-level services whose
  plan/billing is **not derivable from files** — Unknown, verify manually.

## I. Open-source obligations

- **No copyleft (GPL/AGPL/LGPL/MPL) or attribution-required (CC-BY) material is shipped.**
- SIL OFL 1.1 fonts via the Google Fonts link carry no attribution or copyleft obligation for web
  embedding. Playwright (Apache-2.0) is dev-tooling only and is not distributed with the site.

## J. Secrets present (names only)

- **None.** There is no `.env`, `.env.example`, CI config, or config file containing credentials.
  Pattern greps (api key / token / secret / password / bearer / private key) across every tracked
  file return only false positives (CSS design-token comments).
- No hardcoded secrets in committed code → nothing requires rotation at the code level.
- Handover rotation applies only to **account-level** access (GitHub repo access, the
  Vercel↔GitHub integration, domain registrar login) — none of which store anything in this repo.

## K. Unfinished work, tech debt, security

- TODO/FIXME/HACK/XXX greps: **zero** in shipped code.
- Open items documented in README ("Still pending from the owner"): public online-ordering URL
  (`ORDER_URL` constant in `main.js` is intentionally empty — order buttons dial the phone);
  full drink menu names/prices.
- Phone-number provenance: README notes the site's number (562) 248-2178 was owner-directed, while
  the receipt scan in RESEARCH.md recorded (714) 600-7684 as newer — owner should confirm.
- **PRIVACY FLAG (public repo):** the repository is public and tracks raw client material that is
  *excluded from the deployed site* by `.vercelignore` but *fully downloadable from GitHub*:
  9 original phone photos (HEIC/JPG at repo root), `Issues fix.mp4` (9 MB screen recording),
  `assets/reference/` (26 MB: 4 design-reference videos + **receipt.jpg**, a receipt scan), and
  internal docs (RESEARCH.md — contains the owner's personal details — plus AUDIT_REPORT.md,
  PERF_REPORT.md). Recommend either making the repo private or purging these files from git
  history before any handover.
- Dependency vulnerabilities: none possible in production (no dependencies). Repo has 1 open
  issue/PR per GitHub metadata — review before handover.
- Site health at last release (v67, 2026-07-26 audit run): 0 console errors, 0 404s, 0 broken
  images across 7 pages × desktop/iPhone × 5 widths; internal QA suite 113/114 (the one failure is
  a sandbox-environment WebKit-availability check, not a site defect).

## L. Design and other files

- No `.fig`, `.psd`, `.ai`, or `.sketch` files.
- Design references: `assets/reference/` (4 inspiration videos + receipt scan, 26 MB, not deployed).
- Brand sources: `assets/brand/` (1.5 MB, logo source images; `lockup-source.png` not deployed).
- Documentation (all excluded from deploy): `README.md` (ops manual: cache-stamp rule, deploy flow,
  verified business facts), `RESEARCH.md` (research dossier), `AUDIT_REPORT.md` (2026-07 audit,
  score 69→92/100), `PERF_REPORT.md`, `assets/README.md`.
- Large asset folders: `assets/img/` 4.6 MB (deployed), `assets/reference/` 26 MB (not deployed),
  root-level raw photos ~16 MB (not deployed).

---

## Platforms and services

| Platform or service | Which site(s) | Purpose | Evidence file | Owner |
|---|---|---|---|---|
| GitHub (`northvexsolutionsllc-bit/The-Noodle-`, public) | thenoodlelounge.com | Source control, deploy trigger | `git remote -v`; GitHub API | northvexsolutionsllc-bit (User) |
| Vercel | thenoodlelounge.com | Hosting, CDN, headers, previews, domain binding | `vercel.json`, `.vercelignore` | Unknown (account not derivable from files) |
| Domain: thenoodlelounge.com | thenoodlelounge.com | Production domain (www canonical, non-www 308) | canonical/og in all 7 HTML; `sitemap.xml`; `robots.txt` | Unknown — registrar not derivable from files |
| Google Fonts | thenoodlelounge.com | Fraunces + Outfit webfonts (OFL 1.1) | all HTML heads | Google (free service) |
| Google Maps | thenoodlelounge.com | Directions links (10) + lazy embed | all HTML; `main.js:934` | Google (free, unkeyed) |
| Apple Maps | thenoodlelounge.com | Alternate directions link | `visit.html:176` | Apple (free) |
| Instagram `@thenoodleloungee` | thenoodlelounge.com | Outbound social link | multiple HTML | Client — verify |
| TikTok `@thenoodleloungee` | thenoodlelounge.com | Outbound social link | multiple HTML | Client — verify |
| Yelp `the-noodle-lounge-long-beach` | thenoodlelounge.com | Outbound review-profile link | `about.html`, `visit.html` | Client — verify |

No analytics, tag-management, error-monitoring, database, email, or payment services exist for this site.

---

## Verify manually (not derivable from repository files)

1. **Vercel account** owning the `the-noodle` project — login, plan/billing, and who holds the
   GitHub↔Vercel integration.
2. **Domain registrar** for thenoodlelounge.com — registrar name, account owner, renewal/billing,
   and where the non-www→www 308 redirect is configured (Vercel domain settings vs registrar).
3. **GitHub account** `northvexsolutionsllc-bit` — credential owner; also fix the stale repo
   metadata (homepage still `the-noodle.vercel.app`; default-branch entry) and decide
   public→private given the privacy flag in §K.
4. **Social accounts** (Instagram/TikTok/Yelp handles above) — confirm the client controls them.
5. **Google Search Console / Business Profile** — no HTML verification tag exists; check for
   DNS-level verification and Business-Profile ownership.
6. **recipania.xyz** — preview domain used during the project; not in any repo file; confirm its
   DNS and whether it should be retired.
7. **Phone number** on the site, (562) 248-2178 vs the receipt's (714) 600-7684 — owner to confirm.
