/* the noodle lounge, motion + interaction engine (vanilla, no deps) */
(function () {
  "use strict";
  // Entry authority marker: the inline HTML fallback only fires is-loaded if
  // this flag is absent (main.js truly never arrived). Otherwise armEntrance
  // at the end of this file is the SOLE entry trigger - slow-but-single
  // beats fast-but-double.
  window.__nlBoot = true;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------- page load ---------- */
  // The whole entry choreography fires from ONE trigger at the END of this
  // file (armEntrance): after the split-text masks and reveal observers are
  // installed AND the web fonts have settled (Safari restarts running CSS
  // animations when a font face activates, and a late-arriving deferred
  // main.js used to split the choreography into two visible pulses on iOS).
  // Each page's HTML keeps only a 2.6s safety timer as a fallback.

  /* ---------- live open/closed (America/Los_Angeles) ---------- */
  var HOURS = { 0: [720, 1350], 1: [600, 1350], 2: [600, 1350], 3: [600, 1350], 4: [600, 1350], 5: [600, 1350], 6: [600, 1350] };
  function laNow() {
    var parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    var m = {}; parts.forEach(function (p) { m[p.type] = p.value; });
    var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { day: days[m.weekday], mins: (parseInt(m.hour, 10) % 24) * 60 + parseInt(m.minute, 10) };
  }
  function fmt(mins) {
    var h = Math.floor(mins / 60), mm = mins % 60, h12 = ((h + 11) % 12) + 1;
    return h12 + (mm ? ":" + (mm < 10 ? "0" + mm : mm) : "") + (h >= 12 ? "pm" : "am");
  }
  function updateStatus() {
    var t = laNow(), span = HOURS[t.day];
    var open = t.mins >= span[0] && t.mins < span[1];
    var text = open ? "open now · closes " + fmt(span[1]) : (t.mins < span[0] ? "closed · opens " + fmt(span[0]) : "closed · back tomorrow");
    document.querySelectorAll("#heroDot").forEach(function (d) {
      d.classList.toggle("is-open", open); d.classList.toggle("is-closed", !open);
    });
    document.querySelectorAll("#heroStatus, #visitStatusSub").forEach(function (el) { el.textContent = text; });
  }
  updateStatus();
  setInterval(updateStatus, 60000);
  var yr = document.getElementById("year");
  if (yr) yr.textContent = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", year: "numeric" }).format(new Date());

  /* ---------- drop-in hero video (floating live card) ---------- */
  // set to a real clip path (e.g. "./assets/video/hero-loop.mp4") to enable;
  // empty string means no <video> element and no network request at all.
  var HERO_VIDEO = "";
  var saveData = navigator.connection && navigator.connection.saveData;
  if (HERO_VIDEO && !reduceMotion && !saveData && document.querySelector(".hero")) window.addEventListener("load", function () { setTimeout(initHeroVideo, 1200); }, { once: true });
  function initHeroVideo() {
    var v = document.createElement("video");
    v.className = "hero__videoLayer";
    v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
    v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
    v.src = HERO_VIDEO;
    v.addEventListener("canplaythrough", function () {
      var hero = document.querySelector(".hero");
      if (hero && !v.isConnected) {
        hero.appendChild(v);
        requestAnimationFrame(function () { v.classList.add("is-live"); });
        v.play().catch(function () {});
      }
    }, { once: true });
    v.addEventListener("error", function () { v.remove(); });
  }

  /* ==================================================================
     SCROLL-STORY ENGINE, pinned, scrub-driven sections (home)
     ================================================================== */
  var isMobile = window.matchMedia("(max-width: 880px)").matches;
  if (reduceMotion) document.body.classList.add("is-static");

  // runners are built once for the boot-time layout mode; crossing the 880px
  // breakpoint later (tablet rotation, window resize) would leave pin math
  // built for the wrong mode, so reload exactly once when the flag flips.
  (function () {
    var mq = window.matchMedia("(max-width: 880px)");
    var reloaded = false, timer;
    function onFlip() {
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (!reloaded && mq.matches !== isMobile) { reloaded = true; location.reload(); }
      }, 250);
    }
    if (mq.addEventListener) mq.addEventListener("change", onFlip);
    else if (mq.addListener) mq.addListener(onFlip);
  })();
  var storyRunners = [];

  // iOS Safari: window.innerHeight changes as the URL bar collapses, which
  // would make scroll progress jump mid-gesture. documentElement.clientHeight
  // stays constant (equals 100svh), so all pin math uses it, and JS-assigned
  // runway heights use svh so CSS stages and JS heights speak one language.
  var SVH = (window.CSS && CSS.supports && CSS.supports("height", "1svh")) ? "svh" : "vh";
  function viewH() { return document.documentElement.clientHeight || window.innerHeight; }

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; } // easeInOutQuad

  function sectionProgress(el) {
    var r = el.getBoundingClientRect();
    var vh = viewH();
    return clamp01(-r.top / (r.height - vh));
  }

  /* ----- pinned panel hero: scroll steps the carousel ----- */
  var SLIDES = [
    { pnl: "#F3C969", ink: "#4E3007", title: "the spicy buldak bowl", img: "./assets/img/ramen-bowl-egg.webp", alt: "A spicy ramen bowl with a soft egg, fresh off the cooking station", shape: "round", cta: "Build Your Bowl", href: "./build.html" },
    { pnl: "#F4BBC9", ink: "#7A2136", title: "strawberry cream shake", img: "./assets/img/drink-strawberry-shake.webp", alt: "Strawberry cream shake with a whipped cream dome", shape: "tall", cta: "See Signature Drinks", href: "./drinks.html" },
    { pnl: "#CBD9A6", ink: "#2E4A21", title: "the iced matcha latte", img: "./assets/img/drink-matcha.webp", alt: "Iced matcha latte dusted with matcha powder", shape: "tall", cta: "See Signature Drinks", href: "./drinks.html" },
    { pnl: "#BFD8E8", ink: "#1F3A52", title: "berry creamy red bull", img: "./assets/img/drink-blue-redbull-gummy.webp", alt: "Blue creamy Red Bull topped with whipped cream and a gummy ring", shape: "tall", cta: "See Signature Drinks", href: "./drinks.html" }
  ];
  var shero = document.querySelector('[data-story="heropanels"]');
  var strip = document.getElementById("pstrip");
  if (shero && strip) {
    var slotL = document.getElementById("slotL");
    var slotC = document.getElementById("slotC");
    var slotR = document.getElementById("slotR");
    var stepEls = (function () {
      var w = document.getElementById("heroSteps");
      return w ? Array.prototype.slice.call(w.children) : [];
    })();
    var N = SLIDES.length;
    var active = 0, swapping = false, queued = -1;

    function fill(slot, sl, isCenter) {
      slot.style.setProperty("--pnl", sl.pnl);
      slot.style.setProperty("--pnl-ink", sl.ink);
      var title = slot.querySelector(".pslot__title");
      if (title) title.textContent = sl.title;
      var fig = slot.querySelector(".pslot__fig");
      if (fig) {
        fig.className = "pslot__fig pslot__fig--" + sl.shape;
        var img = fig.querySelector("img");
        if (img) { img.src = sl.img; img.alt = isCenter ? sl.alt : ""; }
      }
      if (isCenter) {
        var cta = slot.querySelector(".pslot__cta");
        if (cta) { cta.textContent = sl.cta; cta.setAttribute("href", sl.href); }
      }
    }
    function render() {
      fill(slotL, SLIDES[(active - 1 + N) % N], false);
      fill(slotC, SLIDES[active], true);
      fill(slotR, SLIDES[(active + 1) % N], false);
      stepEls.forEach(function (b, i) { b.style.setProperty("--f", i <= active ? 1 : 0); });
    }
    function goTo(idx) {
      if (idx === active) return;
      if (swapping) { queued = idx; return; }
      swapping = true;
      active = idx;
      [slotL, slotC, slotR].forEach(function (sl) { sl.classList.add("is-swap"); });
      // 330ms > the .32s CSS fade-out, so content never re-renders mid-fade
      setTimeout(function () {
        render();
        [slotL, slotC, slotR].forEach(function (sl) { sl.classList.remove("is-swap"); });
        setTimeout(function () {
          swapping = false;
          if (queued >= 0 && queued !== active) { var q = queued; queued = -1; goTo(q); }
          else queued = -1;
        }, 340);
      }, 330);
    }
    render();

    if (!reduceMotion) {
      // pin the hero: each scroll segment steps to the next slide
      shero.style.height = (N * 70 + 55) + SVH;
      storyRunners.push(function () {
        var p = sectionProgress(shero);
        var idx = Math.min(N - 1, Math.floor(p * N * 0.999));
        goTo(idx);
      });
    }
    // side panels still clickable (jump scroll to that segment)
    function segScroll(idx) {
      if (reduceMotion) { goTo(idx); return; }
      var target = shero.offsetTop + (idx + 0.55) / N * (shero.offsetHeight - viewH());
      window.scrollTo({ top: target, behavior: "smooth" });
    }
    slotL.addEventListener("click", function () { segScroll((active - 1 + N) % N); });
    slotR.addEventListener("click", function () { segScroll((active + 1) % N); });
  }

  /* ----- stacked cards ----- */
  var stack = document.querySelector('[data-story="stack"]');
  if (stack && !reduceMotion && !isMobile) {
    var cards = Array.prototype.slice.call(stack.querySelectorAll("[data-scard]"));
    var stackHead = document.getElementById("stackHead");
    var stackCards = document.getElementById("stackCards");
    var stackPanel = document.getElementById("stackPanel");
    stack.style.height = 420 + SVH;
    storyRunners.push(function () {
      var p = sectionProgress(stack);
      // phases: cards rise 0-.16/.17-.33/.34-.50 · rest · settle .58-.82 · hold to 1
      cards.forEach(function (c, i) {
        var lp = ease(clamp01((p - i * 0.17) / 0.16));
        var riseY = (1 - lp) * 118;
        var restY = i * -3;
        var riseR = (1 - lp) * (i % 2 ? 3 : -3);
        var restR = (i - 1) * 2.2 * lp;
        var sc = 1 - lp * (cards.length - 1 - i) * 0.03;
        c.style.transform = "translateY(" + (riseY + restY * lp) + "%) rotate(" + (riseR + restR) + "deg) scale(" + sc + ")";
      });
      var settle = ease(clamp01((p - 0.58) / 0.24));
      if (stackHead) {
        stackHead.style.opacity = String(1 - settle);
        stackHead.style.transform = "translateY(" + (settle * -26) + "px)";
      }
      if (stackCards) stackCards.style.transform = "translateX(" + (settle * -22) + "vw) scale(" + (1 - settle * 0.05) + ")";
      if (stackPanel) {
        stackPanel.style.opacity = String(settle);
        stackPanel.style.transform = "translate(" + ((1 - settle) * 60) + "px,-50%)";
        stackPanel.style.pointerEvents = settle > 0.7 ? "auto" : "none";
      }
    });
  }

  /* ----- stacked cards: mobile pinned scrub (pin, card 1-2-3, release) ----- */
  if (stack && !reduceMotion && isMobile) {
    var mCards = Array.prototype.slice.call(stack.querySelectorAll("[data-scard]"));
    var mPanel = document.getElementById("stackPanel");
    // the side panel becomes its own flow block right after the pinned section
    if (mPanel) {
      mPanel.classList.add("stack__panel--flow");
      stack.parentNode.insertBefore(mPanel, stack.nextSibling);
    }
    stack.style.height = 320 + SVH; // 100svh stage + ~73svh of scroll per card
    storyRunners.push(function () {
      var p = sectionProgress(stack);
      mCards.forEach(function (c, i) {
        // cards rise one after another: 0-.28 / .33-.61 / .66-.94
        var lp = ease(clamp01((p - i * 0.33) / 0.28));
        var riseY = (1 - lp) * 118;
        var restY = i * -3 * lp;
        var riseR = (1 - lp) * (i % 2 ? 3 : -3);
        var restR = (i - 1) * 2 * lp;
        var sc = 1 - lp * (mCards.length - 1 - i) * 0.03;
        c.style.transform = "translateY(" + (riseY + restY) + "%) rotate(" + (riseR + restR) + "deg) scale(" + sc + ")";
      });
    });
  }

  /* ----- horizontal cinema ----- */
  var cinema = document.querySelector('[data-story="cinema"]');
  if (cinema && !reduceMotion) {
    var track = document.getElementById("cinemaTrack");
    var cbar = document.getElementById("cinemaBar");
    var ccards = track ? Array.prototype.slice.call(track.children) : [];
    var Nc = ccards.length;
    cinema.style.height = (100 + (Nc - 1) * 55) + SVH;
    storyRunners.push(function () {
      var p = sectionProgress(cinema);
      if (!track || !Nc) return;
      // read layout once, then derive every card's distance from center
      // arithmetically, no per-card rect reads after the transform write
      var cw = ccards[0].getBoundingClientRect().width;
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
      var span = (cw + gap) * (Nc - 1);
      track.style.transform = "translateX(" + (-p * span - cw / 2) + "px)";
      ccards.forEach(function (c, i) {
        var d = Math.abs(i * (cw + gap) - p * span) / window.innerWidth;
        c.style.transform = "scale(" + (1 - Math.min(0.08, d * 0.18)) + ")";
        c.style.opacity = String(1 - Math.min(0.22, d * 0.45));
      });
      if (cbar) cbar.style.setProperty("--f", p);
    });
  }

  /* ----- soda bar: 3D perspective showcase ----- */
  var soda = document.querySelector('[data-story="soda"]');
  if (soda && !reduceMotion) {
    var drinks = Array.prototype.slice.call(soda.querySelectorAll("[data-drink]"));
    var Nd = drinks.length;
    var glow = document.getElementById("sodaGlow");
    var sbar = document.getElementById("sodaBar");
    soda.style.height = (100 + (Nd - 1) * 55) + SVH;
    storyRunners.push(function () {
      var p = sectionProgress(soda) * (Nd - 1);
      drinks.forEach(function (card, i) {
        var off = i - p;                       // 0 = focused
        var a = Math.abs(off);
        var x = off * Math.min(window.innerWidth * (isMobile ? 0.3 : 0.24), 340);
        var rotY = Math.max(-32, Math.min(32, -off * 22));
        var z = -a * 190;
        var sc = 1 - Math.min(0.16, a * 0.07);
        var op = a > 2.4 ? 0 : 1 - Math.max(0, (a - 1) * 0.35);
        card.style.transform = "translateY(-50%) translateX(" + x + "px) translateZ(" + z + "px) rotateY(" + rotY + "deg) scale(" + sc + ")";
        card.style.opacity = String(Math.max(0, op));
        card.style.zIndex = String(100 - Math.round(a * 10));
        // glass sheen sweeps across the focused card
        var media = card.querySelector(".dcard__media");
        if (media) media.style.setProperty("--sheen", ((0.5 - off) * 240 - 120) + "%");
      });
      var focus = Math.min(Nd - 1, Math.max(0, Math.round(p)));
      if (glow) {
        var g = drinks[focus].getAttribute("data-glow");
        if (g) glow.style.background = "radial-gradient(circle, " + g + " 0%, transparent 62%)";
      }
      if (sbar) sbar.style.setProperty("--f", p / (Nd - 1));
    });
  }

  /* ---------- scroll progress + nav hide ---------- */
  var bar = document.getElementById("progressBar");
  var nav = document.getElementById("nav");
  var navCta = document.getElementById("navCta");
  var lastY = 0, ticking = false;

  /* ---------- mobile drawer ---------- */
  var menuBtn = document.getElementById("menuBtn");
  var drawer = document.getElementById("drawer");
  if (menuBtn && drawer) {
    var drawerScrollY = 0;
    function setDrawer(open) {
      menuBtn.classList.toggle("is-open", open);
      drawer.classList.toggle("is-open", open);
      document.body.classList.toggle("drawer-open", open);
      // iOS Safari keeps scrolling behind overflow:hidden; fix the body instead
      if (open) {
        drawerScrollY = window.scrollY;
        document.body.style.position = "fixed";
        document.body.style.top = -drawerScrollY + "px";
        document.body.style.left = "0";
        document.body.style.right = "0";
      } else {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        window.scrollTo(0, drawerScrollY);
      }
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      drawer.setAttribute("aria-hidden", open ? "false" : "true");
      if (open) {
        var first = drawer.querySelector("a");
        if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 250);
      } else {
        menuBtn.focus({ preventScroll: true });
      }
    }
    menuBtn.addEventListener("click", function () { setDrawer(!drawer.classList.contains("is-open")); });
    drawer.addEventListener("click", function (e) { if (e.target.closest("a")) setDrawer(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer.classList.contains("is-open")) setDrawer(false);
    });
  }

  /* ---------- parallax engine ---------- */
  var plxEls = Array.prototype.slice.call(document.querySelectorAll("[data-plx]"));
  function parallax() {
    var vh = viewH();
    plxEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) return;
      var speed = parseFloat(el.getAttribute("data-plx")) || 0.14;
      var mid = r.top + r.height / 2 - vh / 2;
      var target = el.querySelector("img") || el;
      target.style.transform = "translateY(" + (-mid * speed).toFixed(1) + "px) scale(1.12)";
    });
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      var max = document.documentElement.scrollHeight - viewH();
      if (bar && max > 0) bar.style.transform = "scaleX(" + Math.min(1, y / max) + ")";
      if (nav) {
        var hide = y > 400 && y > lastY + 6;
        var show = y < lastY - 6 || y < 200;
        if (hide) { nav.classList.add("is-hidden"); if (navCta) navCta.classList.add("is-hidden"); }
        else if (show) { nav.classList.remove("is-hidden"); if (navCta) navCta.classList.remove("is-hidden"); }
      }
      if (!reduceMotion && plxEls.length) parallax();
      for (var i = 0; i < storyRunners.length; i++) storyRunners[i]();
      lastY = y;
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  if (!reduceMotion && plxEls.length) parallax();
  for (var sr = 0; sr < storyRunners.length; sr++) storyRunners[sr]();

  /* ---------- split headlines into masked lines ---------- */
  // headings are opacity:0 from parse time (see .tsplit:not(.ts-ready) in CSS)
  // so slow networks never show them in final state before the mask animates;
  // ts-ready lifts the guard in the same synchronous pass that installs the
  // line masks, so there is no visible in-between frame.
  document.querySelectorAll(".tsplit").forEach(function (el) {
    if (!reduceMotion) {
      var frag = document.createDocumentFragment();
      // split on <br> boundaries or single line
      var parts = el.innerHTML.split(/<br\s*\/?>/i);
      el.innerHTML = "";
      parts.forEach(function (html, i) {
        var line = document.createElement("span");
        line.className = "ts-line";
        var inner = document.createElement("span");
        inner.className = "ts-inner";
        inner.style.setProperty("--l", i);
        inner.innerHTML = html.trim();
        line.appendChild(inner);
        frag.appendChild(line);
      });
      el.appendChild(frag);
    }
    el.classList.add("ts-ready");
  });

  /* ---------- reveal on scroll (reveal / tsplit / imgframe) ---------- */
  document.querySelectorAll('[data-reveal="stagger"]').forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) { child.style.setProperty("--i", i); });
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.16, rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll(".reveal, .tsplit, .imgframe").forEach(function (el) { io.observe(el); });

  /* ---------- magnetic buttons ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll("[data-magnetic]").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) / r.width;
        var dy = (e.clientY - r.top - r.height / 2) / r.height;
        btn.style.transform = "translate(" + dx * 10 + "px," + (dy * 8 - 3) + "px)";
      });
      btn.addEventListener("pointerleave", function () { btn.style.transform = ""; });
    });
  }

  /* ---------- 3d tilt (any .tilt3d / .hcard) ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".tilt3d, .hcard").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var rx = ((e.clientY - r.top) / r.height - 0.5) * -7;
        var ry = ((e.clientX - r.left) / r.width - 0.5) * 9;
        card.style.transform = "perspective(800px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateY(-4px)";
      });
      card.addEventListener("pointerleave", function () { card.style.transform = ""; });
    });
  }

  /* ----- menu page: pinned drinks deck ----- */
  var mdeck = document.querySelector('[data-story="mdeck"]');
  if (mdeck && !reduceMotion && !isMobile) {
    var dcards = Array.prototype.slice.call(mdeck.querySelectorAll("[data-mdeck-card]"));
    var Ndc = dcards.length;
    var dnow = document.getElementById("mdeckNow");
    var dbar = document.getElementById("mdeckBar");
    var dhead = document.getElementById("mdeckHead");
    mdeck.style.height = (100 + Ndc * 62 + 18) + SVH;
    storyRunners.push(function () {
      var p = sectionProgress(mdeck);
      var total = Ndc * 0.155;
      dcards.forEach(function (c, i) {
        var lp = ease(clamp01((p - i * 0.155) / 0.15));
        // followers pushed the settled card back for layered depth
        var after = 0;
        for (var j = i + 1; j < Ndc; j++) after += ease(clamp01((p - j * 0.155) / 0.15));
        var y = (1 - lp) * 118 + (i === 0 ? 0 : 0);
        var settleY = -Math.min(after, 2.2) * 1.6;
        var sc = 1 - Math.min(after, 2.2) * 0.028;
        var rot = (1 - lp) * (i % 2 ? 2.2 : -2.2);
        c.style.transform = "translateY(" + (y + settleY) + "%) rotate(" + rot + "deg) scale(" + sc + ")";
        c.style.zIndex = String(10 + i);
        c.style.opacity = String(i === 0 ? 1 : (lp > 0 ? 1 : 0));
      });
      var current = 1;
      for (var k = 0; k < Ndc; k++) { if (p >= k * 0.155 + 0.05) current = k + 1; }
      if (dnow) dnow.textContent = (current < 10 ? "0" : "") + current;
      if (dbar) dbar.style.setProperty("--f", clamp01(p / (total + 0.06)));
      if (dhead) {
        var hf = ease(clamp01((p - 0.9) / 0.1));
        dhead.style.opacity = String(1 - hf * 0.5);
      }
    });
  }

  /* ----- build page: pinned build line (chapter cross-fade journey) ----- */
  var bline = document.querySelector('[data-story="bline"]');
  if (bline && !reduceMotion && !isMobile) {
    var bImgs = Array.prototype.slice.call(bline.querySelectorAll("[data-bline-img]"));
    var bChs = Array.prototype.slice.call(bline.querySelectorAll("[data-bline-ch]"));
    var bFill = document.getElementById("blineFill");
    var bJumps = Array.prototype.slice.call(bline.querySelectorAll("[data-bline-jump]"));
    var bGhost = document.getElementById("blineGhost");
    var Nb = bChs.length;
    var BW = 0.09, BHALF = 0.045; // crossfade window centred on chapter boundaries
    bline.style.height = (100 + Nb * 75) + SVH;
    storyRunners.push(function () {
      var p = sectionProgress(bline);
      var idx = Math.min(Nb - 1, Math.floor(p * Nb * 0.999));
      bChs.forEach(function (ch, i) {
        var tin = i === 0 ? 1 : ease(clamp01((p - (i / Nb - BHALF)) / BW));
        var tout = i === Nb - 1 ? 0 : ease(clamp01((p - ((i + 1) / Nb - BHALF)) / BW));
        var v = Math.max(0, tin - tout);
        ch.style.opacity = String(v);
        ch.style.transform = "translateY(" + ((1 - tin) * 46 - tout * 46) + "px)";
        ch.style.pointerEvents = v > 0.6 ? "auto" : "none";
        var img = bImgs[i];
        if (img) {
          img.style.opacity = String(v);
          img.style.transform = "scale(" + (1.1 - 0.1 * tin + 0.04 * tout) + ")";
        }
      });
      if (bGhost) {
        bGhost.textContent = "0" + (idx + 1);
        bGhost.style.transform = "translateY(" + (-(p * Nb - idx) * 16) + "px)";
      }
      if (bFill) bFill.style.transform = "scaleY(" + p + ")";
      bJumps.forEach(function (b, i) { b.classList.toggle("is-on", i === idx); });
    });
    bJumps.forEach(function (b, i) {
      b.addEventListener("click", function () {
        var t = bline.offsetTop + ((i + 0.55) / Nb) * (bline.offsetHeight - viewH());
        window.scrollTo({ top: t, behavior: "smooth" });
      });
    });
  }

  /* ----- build page: topping playground ----- */
  var pickerWall = document.getElementById("pickerWall");
  if (pickerWall) {
    var pickCount = document.getElementById("pickerCount");
    var pickPrice = document.getElementById("pickerPrice");
    var pickTally = pickCount ? pickCount.parentElement : null;
    pickerWall.addEventListener("click", function (e) {
      var t = e.target.closest("[data-topping]");
      if (!t) return;
      t.classList.toggle("is-picked");
      var n = pickerWall.querySelectorAll(".is-picked").length;
      if (pickCount) pickCount.textContent = n === 0 ? "Your bowl is waiting, tap a topping" : "Your stack: " + n + " topping" + (n > 1 ? "s" : "");
      if (pickPrice) pickPrice.textContent = n === 0 ? "" : "+ $" + n + ".00";
      if (pickTally && !reduceMotion) {
        pickTally.classList.remove("is-bump");
        void pickTally.offsetWidth;
        pickTally.classList.add("is-bump");
      }
    });
  }

  /* ----- drinks page: hero pointer-depth parallax ----- */
  var dhero = document.querySelector(".dhero");
  if (dhero && finePointer && !reduceMotion) {
    var dBottles = Array.prototype.slice.call(dhero.querySelectorAll(".dbottle"));
    var dtx = 0, dty = 0, dcx = 0, dcy = 0, dRaf = null;
    function dLoop() {
      dRaf = requestAnimationFrame(function () {
        dcx += (dtx - dcx) * 0.07;
        dcy += (dty - dcy) * 0.07;
        dBottles.forEach(function (b) {
          var d = parseFloat(b.getAttribute("data-depth")) || 1;
          b.style.setProperty("--px", (dcx * 16 * d).toFixed(2) + "px");
          b.style.setProperty("--py", (dcy * 10 * d).toFixed(2) + "px");
        });
        if (Math.abs(dtx - dcx) > 0.002 || Math.abs(dty - dcy) > 0.002) dLoop();
        else dRaf = null;
      });
    }
    dhero.addEventListener("pointermove", function (e) {
      var r = dhero.getBoundingClientRect();
      dtx = ((e.clientX - r.left) / r.width) * 2 - 1;
      dty = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (!dRaf) dLoop();
    });
    dhero.addEventListener("pointerleave", function () { dtx = 0; dty = 0; if (!dRaf) dLoop(); });
  }

  /* ----- drinks page: flavor lab tabs ----- */
  var flabTabs = Array.prototype.slice.call(document.querySelectorAll("[data-flab]"));
  if (flabTabs.length) {
    var flabPanes = Array.prototype.slice.call(document.querySelectorAll("[data-flab-pane]"));
    flabTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var i = parseInt(tab.getAttribute("data-flab"), 10);
        flabTabs.forEach(function (t, j) {
          t.classList.toggle("is-on", j === i);
          t.setAttribute("aria-selected", j === i ? "true" : "false");
        });
        flabPanes.forEach(function (p, j) {
          // re-add the class even for the same pane so the cascade replays
          p.classList.remove("is-on");
          if (j === i) { void p.offsetWidth; p.classList.add("is-on"); }
        });
      });
    });
  }

  /* ----- events page: hero collage depth parallax (scroll-driven) ----- */
  var ehero = document.querySelector('[data-story="ehero"]');
  if (ehero && !reduceMotion) {
    var eLayers = Array.prototype.slice.call(ehero.querySelectorAll("[data-eplx]"));
    storyRunners.push(function () {
      var y = window.scrollY;
      if (y > viewH() * 1.4) return;
      eLayers.forEach(function (el) {
        var d = parseFloat(el.getAttribute("data-eplx")) || 1;
        el.style.setProperty("--ey", (-y * d * 0.14).toFixed(1) + "px");
      });
    });
  }

  /* ----- about page: timeline draws itself with scroll ----- */
  var tline = document.querySelector('[data-story="tline"]');
  var tlineFill = document.getElementById("tlineFill");
  if (tline && tlineFill && !reduceMotion) {
    storyRunners.push(function () {
      var r = tline.getBoundingClientRect();
      var vh = viewH();
      // fill from when the section enters to when its bottom clears 80% of the viewport
      var f = clamp01((vh * 0.8 - r.top) / (r.height));
      tlineFill.style.transform = "scaleY(" + f.toFixed(4) + ")";
    });
  }

  /* ----- menu drinks deck on mobile: pinned scroll-driven carousel.
     phase 1 of each segment slides the card into center, phase 2 scrolls the
     card's own content, so tall cards are fully readable without swiping ----- */
  if (mdeck && isMobile && !reduceMotion) {
    var mdCards = Array.prototype.slice.call(mdeck.querySelectorAll("[data-mdeck-card]"));
    var mdNow = document.getElementById("mdeckNow");
    var mdBar = document.getElementById("mdeckBar");
    var Nmd = mdCards.length;
    var mdCur = -1;
    mdCards.forEach(function (c) {
      if (!c.querySelector(".mcat__inner")) {
        var inner = document.createElement("div");
        inner.className = "mcat__inner";
        while (c.firstChild) inner.appendChild(c.firstChild);
        c.appendChild(inner);
      }
      var img = c.querySelector(".mcat__media img");
      if (img && !c.querySelector(".mcat__blurbg")) {
        var b = img.cloneNode();
        b.className = "mcat__blurbg";
        b.setAttribute("alt", "");
        b.setAttribute("aria-hidden", "true");
        img.parentNode.insertBefore(b, img);
      }
    });
    var mdInners = mdCards.map(function (c) { return c.querySelector(".mcat__inner"); });
    var mdCardsEl = mdeck.querySelector(".mdeck__cards");
    var mdOver = mdCards.map(function () { return 0; });
    function mdMeasure() {
      var win = mdCardsEl ? mdCardsEl.clientHeight : viewH();
      mdCards.forEach(function (c, i) {
        mdOver[i] = Math.max(0, c.offsetHeight - win);
      });
    }
    mdeck.style.height = (100 + Nmd * 85) + SVH;
    mdMeasure();
    window.addEventListener("resize", mdMeasure, { passive: true });
    window.addEventListener("load", mdMeasure);
    storyRunners.push(function () {
      var p = sectionProgress(mdeck);
      var seg = Math.min(Nmd - 1, Math.floor(p * Nmd * 0.9999));
      var s = clamp01(p * Nmd - seg); // local progress within this card's segment
      // conveyor: slides during the first 30% of each segment (card 0 starts centered)
      var C = seg === 0 ? 0 : (s < 0.3 ? seg - 1 + ease(s / 0.3) : seg);
      var step = window.innerWidth * 0.86;
      mdCards.forEach(function (c, i) {
        var off = i - C;
        // phase 2: the whole card rides up so its lower half comes into view;
        // the card itself never scrolls internally
        var q = 0;
        if (mdOver[i] > 0) {
          if (i === seg) q = i === 0 ? ease(clamp01((s - 0.06) / 0.82)) : ease(clamp01((s - 0.36) / 0.56));
          else if (i < seg) q = 1;
        }
        c.style.transform = "translateX(" + (off * step).toFixed(1) + "px) translateY(" + (-mdOver[i] * q).toFixed(1) + "px)";
        var t = mdInners[i];
        if (t) {
          var d = Math.min(1, Math.abs(off));
          t.style.transform = "scale(" + (1 - d * 0.06).toFixed(4) + ")";
          t.style.opacity = String(1 - d * 0.35);
        }
      });
      if (mdBar) mdBar.style.setProperty("--f", p.toFixed(4));
      if (mdNow && seg !== mdCur) { mdCur = seg; mdNow.textContent = "0" + (seg + 1); }
    });
  }

  /* ---------- in-page menu nav scrollspy ---------- */
  var menunav = document.querySelector(".menunav");
  if (menunav) {
    var mlinks = Array.prototype.slice.call(menunav.querySelectorAll("a[href^='#']"));
    var msections = mlinks.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); }).filter(Boolean);
    var mspy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          mlinks.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id); });
        }
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    msections.forEach(function (sec) { mspy.observe(sec); });
  }

  /* ---------- expandable menu cards ---------- */
  document.querySelectorAll(".mcard").forEach(function (card) {
    card.addEventListener("click", function (e) {
      if (e.target.closest("a")) return;
      card.classList.toggle("is-open");
    });
  });

  /* ---------- drinks page: the tasting table (pinned, scroll-poured) ---------- */
  var tasting = document.querySelector('[data-story="tasting"]');
  if (tasting) {
    var tImgs = Array.prototype.slice.call(document.querySelectorAll("#tastingFrame img"));
    var tCoasters = Array.prototype.slice.call(tasting.querySelectorAll("[data-tasting]"));
    var tGlow = document.getElementById("tastingGlow");
    var tSwap = document.getElementById("tastingSwap");
    var tCat = document.getElementById("tastingCat");
    var tName = document.getElementById("tastingName");
    var tDesc = document.getElementById("tastingDesc");
    var tNow = document.getElementById("tastingNow");
    var tBar = document.getElementById("tastingBar");
    var Nt = tImgs.length;
    var tCur = 0, tBooted = false;
    var tPinned = !reduceMotion;

    function tMeta(i) {
      var c = tCoasters[i];
      if (!c) return;
      if (tGlow) tGlow.style.background = "radial-gradient(circle, " + c.getAttribute("data-g") + " 0%, transparent 62%)";
      if (tCat) tCat.textContent = c.getAttribute("data-cat");
      if (tName) tName.textContent = c.getAttribute("data-name");
      if (tDesc) tDesc.textContent = c.getAttribute("data-desc");
      if (tNow) tNow.textContent = "0" + (i + 1);
      if (tSwap && !reduceMotion && tBooted) { tSwap.classList.remove("swap"); void tSwap.offsetWidth; tSwap.classList.add("swap"); }
      tBooted = true;
      tCoasters.forEach(function (b, j) {
        b.classList.toggle("is-on", j === i);
        b.setAttribute("aria-selected", j === i ? "true" : "false");
      });
    }
    tCoasters.forEach(function (b) { b.style.setProperty("--g", b.getAttribute("data-g")); });

    if (tPinned) {
      // scroll-scrubbed: each segment pours the next cup up from the glass base
      tasting.classList.add("is-pinned");
      tasting.style.height = (100 + Nt * 55) + SVH;
      tImgs.forEach(function (im, j) {
        im.classList.remove("is-on");
        im.style.zIndex = String(1 + j);
        im.style.opacity = j === 0 ? "1" : "0";
      });
      var TW = 0.1, THALF = 0.05;
      storyRunners.push(function () {
        var p = sectionProgress(tasting);
        var idx = 0;
        for (var i = 1; i < Nt; i++) {
          var t = ease(clamp01((p - (i / Nt - THALF)) / TW));
          var im = tImgs[i];
          im.style.opacity = t > 0 ? "1" : "0";
          im.style.clipPath = "circle(" + (t * 135).toFixed(2) + "% at 50% 92%)";
          im.style.transform = "scale(" + (1.07 - 0.07 * t).toFixed(4) + ")";
          if (t > 0.5) idx = i;
        }
        if (tBar) tBar.style.transform = "scaleX(" + p + ")";
        if (idx !== tCur) { tCur = idx; tMeta(idx); }
      });
      // coasters scrub the page to that drink's segment
      tCoasters.forEach(function (b, i) {
        b.addEventListener("click", function () {
          var t = tasting.offsetTop + ((i + 0.55) / Nt) * (tasting.offsetHeight - viewH());
          window.scrollTo({ top: t, behavior: "smooth" });
        });
      });
    } else {
      // unpinned fallback (tablet/mobile/reduced motion): tap a coaster to pour
      tCoasters.forEach(function (b, i) {
        b.addEventListener("click", function () {
          if (i === tCur) return;
          var out = tImgs[tCur], inn = tImgs[i];
          tCur = i;
          tImgs.forEach(function (im) { im.classList.remove("is-out"); });
          out.classList.remove("is-on"); out.classList.add("is-out");
          inn.classList.add("is-on");
          setTimeout(function () { out.classList.remove("is-out"); }, 950);
          tMeta(i);
        });
      });
    }
  }

  /* ---------- Safari bfcache + font-swap remeasure ---------- */
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    // back/forward restore: close the drawer if it was open and re-sync
    // every scroll-driven runner to the restored scroll position
    if (drawer && drawer.classList.contains("is-open")) setDrawerSafe(false);
    window.dispatchEvent(new Event("resize"));
    onScroll();
  });
  function setDrawerSafe(open) {
    if (menuBtn && drawer) {
      menuBtn.classList.remove("is-open");
      drawer.classList.remove("is-open");
      document.body.classList.remove("drawer-open");
      document.body.style.position = "";
      document.body.style.top = "";
      menuBtn.setAttribute("aria-expanded", "false");
      drawer.setAttribute("aria-hidden", "true");
    }
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      // Fraunces/Outfit swap shifts layout; re-measure everything once
      window.dispatchEvent(new Event("resize"));
      onScroll();
    });
  }

  /* ---------- lazy map facade ---------- */
  var mapBtn = document.getElementById("mapLoad");
  if (mapBtn) {
    mapBtn.addEventListener("click", function () {
      var wrap = mapBtn.parentElement;
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.google.com/maps?q=The+Noodle+Lounge,+712+Cherry+Ave,+Long+Beach,+CA+90813&output=embed";
      iframe.title = "Map to The Noodle Lounge, 712 Cherry Ave, Long Beach";
      iframe.loading = "lazy";
      iframe.referrerPolicy = "no-referrer-when-downgrade";
      wrap.appendChild(iframe);
      mapBtn.remove();
    }, { once: true });
  }

  /* ---------- entry choreography: one trigger, after masks + fonts ---------- */
  (function armEntrance() {
    var fired = false;
    function go() {
      if (fired) return;
      fired = true;
      // double-rAF guarantees one painted frame so entry transitions play
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { document.body.classList.add("is-loaded"); });
      });
    }
    try {
      if (reduceMotion) return go(); // static poses land instantly, no font wait
      var F = document.fonts;
      if (F && F.load) {
        var faces = ["300 1em Outfit", "400 1em Outfit", "500 1em Outfit", "600 1em Outfit",
          "700 1em Outfit", "800 1em Outfit", "400 1em Fraunces", "500 1em Fraunces",
          "600 1em Fraunces", "italic 400 1em Fraunces", "italic 600 1em Fraunces"];
        Promise.all(faces.map(function (f) { return F.load(f); })).then(go, go);
        setTimeout(go, 350); // fonts have display:swap; never hold the hero hostage
      } else go();
    } catch (e) { go(); }
  })();
})();
