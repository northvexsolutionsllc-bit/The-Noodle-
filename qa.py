"""Noodle Lounge QA: first-tap reliability, console cleanliness, scroll-engine
stability. Runs the real WebKit (Safari engine) + Chromium."""
from playwright.sync_api import sync_playwright
import re, sys, threading, functools, os
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

import pathlib
SITE_DIR = os.environ.get("SITE_DIR", str(pathlib.Path(__file__).resolve().parent))
Handler = functools.partial(SimpleHTTPRequestHandler, directory=SITE_DIR)
srv = ThreadingHTTPServer(("127.0.0.1", 8000), Handler)
srv.RequestHandlerClass.log_message = lambda *a, **k: None
threading.Thread(target=srv.serve_forever, daemon=True).start()

BASE = "http://127.0.0.1:8000/"
PAGES = ["index.html","menu.html","build.html","drinks.html","events.html","about.html","visit.html"]
ALLOWED_404 = ("hero-loop.mp4",)   # intentional drop-in capability probe (HEAD)

results, failures = [], []

def safe_tap(pg, sel, timeout=6000):
    """tap that never kills the suite; returns (ok, detail)"""
    try:
        pg.tap(sel, timeout=timeout)
        return True, ""
    except Exception as e:
        return False, f"url={pg.url} sel={sel} err={str(e)[:90]}"

def pick_other(pg, container):
    """index of first link in container whose href differs from current page"""
    return pg.evaluate("""(cs)=>{const as=[...document.querySelectorAll(cs+' a')];
        const cur=location.pathname.split('/').pop()||'index.html';
        return as.findIndex(a=>{const h=(a.getAttribute('href')||'').split('/').pop();
            return h && h!==cur && h.endsWith('.html');});}""", container)

def diag(pg, sel):
    return pg.evaluate("(s)=>({n:document.querySelectorAll(s).length,url:location.href,body:document.body?document.body.getAttribute('style'):null})", sel)


def check(label, ok, detail=""):
    results.append((label, ok, detail))
    if not ok: failures.append((label, detail))

def fresh(ctx, url):
    pg = ctx.new_page()
    errs, bad = [], []
    def _on_console(m):
        if m.type != "error":
            return
        u = (m.location or {}).get("url", "")
        if u and "127.0.0.1" not in u and "localhost" not in u:
            return
        if not u and "ERR_FAILED" in m.text:
            return
        errs.append(m.text)
    pg.on("console", _on_console)
    pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))
    pg.on("response", lambda r: bad.append(f"{r.status} {r.url}") if r.status >= 400 and not any(a in r.url for a in ALLOWED_404) else None)
    pg.goto(BASE + url, wait_until="load")
    return pg, errs, bad

def sweep(pg, steps=14):
    h = pg.evaluate("document.documentElement.scrollHeight")
    for i in range(steps + 1):
        pg.evaluate("window.scrollTo({top:%d,behavior:'instant'})" % int(h * i / steps))
        pg.wait_for_timeout(90)
    pg.evaluate("window.scrollTo({top:0,behavior:'instant'})")
    pg.wait_for_timeout(250)

def hermetic(ctx):
    # external hosts (fonts CDN) are environment-dependent noise here
    ctx.route(re.compile(r"^https?://(?!127\.0\.0\.1|localhost)"), lambda r: r.abort())
    return ctx

def run_engine(p, engine_name, launcher):
    # PW_WEBKIT_PATH / PW_CHROMIUM_PATH point at preinstalled browsers where
    # the pinned Playwright builds are unavailable
    exe = os.environ.get(f"PW_{engine_name.upper()}_PATH")
    browser = launcher.launch(executable_path=exe) if exe else launcher.launch()

    # ---------- MOBILE (iPhone 12 class: 390x844, touch, 3x) ----------
    mob = hermetic(browser.new_context(viewport={"width":390,"height":844}, device_scale_factor=3,
                              is_mobile=(engine_name=="chromium"), has_touch=True,
                              user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"))
    for url in PAGES:
        pg, errs, bad = fresh(mob, url)
        pg.wait_for_timeout(400)
        check(f"{engine_name}/mob {url} html.js tagged", pg.evaluate("document.documentElement.classList.contains('js')"))
        try:
            pg.wait_for_function("document.body.classList.contains('hero-live')", timeout=2500); il = True
        except Exception: il = False
        check(f"{engine_name}/mob {url} hero-live gate fires", il)
        hit = pg.evaluate("(()=>{const e=document.elementFromPoint(195,500);return e?(e.id||e.className.toString().slice(0,40)):'none'})()")
        check(f"{engine_name}/mob {url} no overlay intercept", "drawer" not in str(hit) and "progress" not in str(hit), f"hit={hit}")
        pg.tap("#menuBtn")
        pg.wait_for_timeout(750)
        check(f"{engine_name}/mob {url} drawer opens on 1 tap", pg.evaluate("document.getElementById('drawer').classList.contains('is-open')"))
        before = pg.url
        li = pick_other(pg, ".drawer__nav")
        t_ok, t_det = safe_tap(pg, f".drawer__nav a >> nth={li}")
        nav_ok = False
        if t_ok:
            try:
                pg.wait_for_url(lambda u: u != before, timeout=4000); nav_ok = True
            except Exception: pass
        check(f"{engine_name}/mob {url} drawer link navigates on 1 tap", nav_ok, t_det or f"stayed={pg.url}")
        pg.go_back(wait_until="load"); pg.wait_for_timeout(350)
        try:
            pg.wait_for_selector("#drawer", state="attached", timeout=3000)
            closed = not pg.evaluate("document.getElementById('drawer').classList.contains('is-open')")
        except Exception:
            closed = False
        check(f"{engine_name}/mob {url} back-restore drawer closed", closed, f"url-after-back={pg.url}")
        if "about:blank" in pg.url or pg.evaluate("document.querySelectorAll('.botnav a').length") == 0:
            pg.goto(BASE + url, wait_until="load"); pg.wait_for_timeout(400)
        before = pg.url
        li = pick_other(pg, ".botnav")
        t_ok, t_det = safe_tap(pg, f".botnav a >> nth={li}")
        nav_ok = False
        if t_ok:
            try:
                pg.wait_for_url(lambda u: u != before, timeout=4000); nav_ok = True
            except Exception: pass
        check(f"{engine_name}/mob {url} botnav navigates on 1 tap", nav_ok, t_det or str(diag(pg, ".botnav a")))
        pg.go_back(wait_until="load"); pg.wait_for_timeout(300)
        if "about:blank" in pg.url:
            pg.goto(BASE + url, wait_until="load"); pg.wait_for_timeout(300)
        sweep(pg)
        try:
            pg.wait_for_function("[...document.querySelectorAll('.reveal.is-in, .tsplit.is-in')].every(e=>parseFloat(getComputedStyle(e).opacity)>=0.9)", timeout=4500)
            stuck = 0
        except Exception:
            stuck = pg.evaluate("[...document.querySelectorAll('.reveal.is-in, .tsplit.is-in')].filter(e=>parseFloat(getComputedStyle(e).opacity)<0.9).length")
        check(f"{engine_name}/mob {url} no stuck reveals", stuck == 0, f"{stuck} revealed-but-invisible after 4.5s")
        check(f"{engine_name}/mob {url} console clean", not errs, "; ".join(errs[:3]))
        check(f"{engine_name}/mob {url} no 4xx/5xx", not bad, "; ".join(bad[:3]))
        pg.close()

    pg, errs, bad = fresh(mob, "index.html"); pg.wait_for_timeout(300)
    y0 = pg.evaluate("window.scrollY"); pg.tap("#slotR"); pg.wait_for_timeout(900)
    check(f"{engine_name}/mob hero side-panel reacts on 1 tap", pg.evaluate("window.scrollY") > y0)
    pg.close()

    pg, errs, bad = fresh(mob, "menu.html"); pg.wait_for_timeout(300)
    y0 = pg.evaluate("window.scrollY")
    t_ok, t_det = safe_tap(pg, ".menunav a >> nth=1")
    pg.wait_for_timeout(700)
    check(f"{engine_name}/mob menunav anchor jumps on 1 tap", t_ok and pg.evaluate("window.scrollY") != y0, t_det)
    check(f"{engine_name}/mob menu console clean", not errs, "; ".join(errs[:3]))
    pg.close()

    pg, errs, bad = fresh(mob, "build.html"); pg.wait_for_timeout(300)
    pg.evaluate("document.querySelector('[data-topping]').scrollIntoView({block:'center'})"); pg.wait_for_timeout(400)
    pg.tap("[data-topping]"); pg.wait_for_timeout(250)
    check(f"{engine_name}/mob topping picks on 1 tap", pg.evaluate("document.querySelector('[data-topping]').classList.contains('is-picked')"))
    pg.close()

    pg, errs, bad = fresh(mob, "drinks.html"); pg.wait_for_timeout(300)
    pg.evaluate("document.querySelectorAll('[data-tasting]')[1].scrollIntoView({block:'center'})"); pg.wait_for_timeout(400)
    pg.tap("css=[data-tasting] >> nth=1"); pg.wait_for_timeout(1100)
    check(f"{engine_name}/mob coaster reacts on 1 tap", pg.evaluate("document.querySelectorAll('[data-tasting]')[1].classList.contains('is-on') || window.scrollY>0"))
    pg.close()

    pg, errs, bad = fresh(mob, "visit.html"); pg.wait_for_timeout(300)
    pg.evaluate("document.getElementById('mapLoad').scrollIntoView({block:'center'})"); pg.wait_for_timeout(400)
    pg.tap("#mapLoad"); pg.wait_for_timeout(600)
    check(f"{engine_name}/mob map loads on 1 tap", pg.evaluate("!!document.querySelector('iframe[src*=maps]')"))
    check(f"{engine_name}/mob visit console clean", not errs, "; ".join(errs[:3]))
    pg.close()
    mob.close()

    # ---------- DESKTOP 1440x900 ----------
    desk = hermetic(browser.new_context(viewport={"width":1440,"height":900}))
    for url in PAGES:
        pg, errs, bad = fresh(desk, url)
        pg.wait_for_timeout(350)
        before = pg.url
        li = pick_other(pg, ".nav__links")
        nav_ok = False
        try:
            pg.click(f".nav__links a >> nth={li}", timeout=6000)
            pg.wait_for_url(lambda u: u != before, timeout=4000); nav_ok = True
        except Exception: pass
        check(f"{engine_name}/desk {url} nav link 1 click", nav_ok)
        pg.go_back(wait_until="load"); pg.wait_for_timeout(250)
        if "about:blank" in pg.url or not pg.evaluate("!!document.getElementById('nav')"):
            pg.goto(BASE + url, wait_until="load"); pg.wait_for_timeout(300)
        sweep(pg, steps=16)
        try:
            pg.wait_for_function("[...document.querySelectorAll('.reveal.is-in, .tsplit.is-in')].every(e=>parseFloat(getComputedStyle(e).opacity)>=0.9)", timeout=4500)
            stuck = 0
        except Exception:
            stuck = pg.evaluate("[...document.querySelectorAll('.reveal.is-in, .tsplit.is-in')].filter(e=>parseFloat(getComputedStyle(e).opacity)<0.9).length")
        check(f"{engine_name}/desk {url} no stuck reveals", stuck == 0, f"{stuck} revealed-but-invisible after 4.5s")
        maxY = pg.evaluate("document.documentElement.scrollHeight - innerHeight")
        hideY = min(1900, max(600, maxY - 60)); showY = max(300, hideY - 400)
        pg.evaluate("window.scrollTo({top:%d,behavior:'instant'})" % max(300, hideY - 500)); pg.wait_for_timeout(150)
        pg.evaluate("window.scrollTo({top:%d,behavior:'instant'})" % hideY)
        try: pg.wait_for_function("Math.abs(window.scrollY-%d)<3" % hideY, timeout=2000)
        except Exception: pass
        pg.mouse.wheel(0, 260)  # real wheel events = the event stream actual users produce
        pg.wait_for_timeout(150)
        try:
            pg.wait_for_function("document.getElementById('nav').classList.contains('is-hidden')", timeout=2500); hidden = True
        except Exception: hidden = False
        pg.evaluate("window.scrollTo({top:%d,behavior:'instant'})" % showY)
        try: pg.wait_for_function("Math.abs(window.scrollY-%d)<3" % showY, timeout=2000)
        except Exception: pass
        shown = False
        for _ in range(5):  # real upward wheel; heavy pages may need a couple of ticks
            pg.mouse.wheel(0, -260)
            try:
                pg.wait_for_function("!document.getElementById('nav').classList.contains('is-hidden')", timeout=900); shown = True; break
            except Exception: pass
        check(f"{engine_name}/desk {url} nav hide/show", hidden and shown, f"hidden={hidden} shown={shown}")
        check(f"{engine_name}/desk {url} console clean", not errs, "; ".join(errs[:3]))
        check(f"{engine_name}/desk {url} no 4xx/5xx", not bad, "; ".join(bad[:3]))
        pg.close()

    pg, errs, bad = fresh(desk, "index.html"); pg.wait_for_timeout(400)
    def probe():
        pg.evaluate("window.scrollTo({top:Math.round(document.querySelector('[data-story=stack]').offsetTop + 900),behavior:'instant'})")
        # the stack runner smooths toward the target per scroll tick; a teleport
        # delivers one tick, so feed it a few micro-scroll events to converge
        for _ in range(10):
            pg.evaluate("window.scrollBy(0,1);window.scrollBy(0,-1)")
            pg.wait_for_timeout(80)
        last = None
        for _ in range(12):
            pg.wait_for_timeout(150)
            cur = pg.evaluate("document.querySelector('[data-scard]').style.transform")
            if cur == last: break
            last = cur
        return last
    t1 = probe(); pg.evaluate("window.scrollTo(0,0)"); pg.wait_for_timeout(250); t2 = probe()
    check(f"{engine_name}/desk pinned engine deterministic", t1 == t2 and t1 != "", f"{t1[:38]} vs {t2[:38]}")
    pg.close()
    desk.close()
    browser.close()

with sync_playwright() as p:
    for engine_name, launcher in (("webkit", p.webkit), ("chromium", p.chromium)):
        try:
            run_engine(p, engine_name, launcher)
        except Exception as e:
            check(f"{engine_name} engine available", False, str(e)[:120])

passed = sum(1 for _, ok, _ in results if ok)
print(f"\n===== {passed}/{len(results)} checks passed =====")
for label, detail in failures:
    print(f"FAIL: {label}  {detail}")
sys.exit(1 if failures else 0)
