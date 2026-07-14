/* the noodle lounge — motion + interaction engine (vanilla, no deps) */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------- page load ---------- */
  requestAnimationFrame(function () { document.body.classList.add("is-loaded"); });

  /* ---------- ordering ----------
     Once the owner confirms the public online-ordering URL, set ORDER_URL and
     every .js-order button switches from phone to online ordering. */
  var ORDER_URL = "";
  if (ORDER_URL) {
    document.querySelectorAll(".js-order").forEach(function (a) {
      a.href = ORDER_URL; a.target = "_blank"; a.rel = "noopener";
      var label = a.querySelector("[data-order-label]");
      if (label) label.textContent = "order online";
    });
  }

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
  var saveData = navigator.connection && navigator.connection.saveData;
  if (!reduceMotion && !saveData && document.querySelector(".hero")) {
    var v = document.createElement("video");
    v.className = "hero__videoLayer";
    v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
    v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
    v.src = "./assets/video/hero-loop.mp4";
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
     SCROLL-STORY ENGINE — pinned, scrub-driven sections (home)
     ================================================================== */
  var isMobile = window.matchMedia("(max-width: 880px)").matches;
  if (reduceMotion) document.body.classList.add("is-static");
  var storyRunners = [];

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; } // easeInOutQuad

  function sectionProgress(el) {
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight;
    return clamp01(-r.top / (r.height - vh));
  }

  /* ----- pinned panel hero: scroll steps the carousel ----- */
  var SLIDES = [
    { pnl: "#F3C969", ink: "#4E3007", title: "the spicy buldak bowl", img: "./assets/img/ramen-bowl-egg.jpg", alt: "A spicy ramen bowl with a soft egg, fresh off the cooking station", shape: "round", cta: "Build Your Bowl", href: "./build.html" },
    { pnl: "#F4BBC9", ink: "#7A2136", title: "strawberry cream shake", img: "./assets/img/drink-strawberry-shake.jpg", alt: "Strawberry cream shake with a whipped cream dome", shape: "tall", cta: "See Signature Drinks", href: "./drinks.html" },
    { pnl: "#CBD9A6", ink: "#2E4A21", title: "the iced matcha latte", img: "./assets/img/drink-matcha.jpg", alt: "Iced matcha latte dusted with matcha powder", shape: "tall", cta: "See Signature Drinks", href: "./drinks.html" },
    { pnl: "#BFD8E8", ink: "#1F3A52", title: "berry creamy red bull", img: "./assets/img/drink-blue-redbull-gummy.jpg", alt: "Blue creamy Red Bull topped with whipped cream and a gummy ring", shape: "tall", cta: "See Signature Drinks", href: "./drinks.html" }
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
      setTimeout(function () {
        render();
        [slotL, slotC, slotR].forEach(function (sl) { sl.classList.remove("is-swap"); });
        setTimeout(function () {
          swapping = false;
          if (queued >= 0 && queued !== active) { var q = queued; queued = -1; goTo(q); }
          else queued = -1;
        }, 320);
      }, 300);
    }
    render();

    if (!reduceMotion) {
      // pin the hero: each scroll segment steps to the next slide
      shero.style.height = (N * 70 + 55) + "vh";
      storyRunners.push(function () {
        var p = sectionProgress(shero);
        var idx = Math.min(N - 1, Math.floor(p * N * 0.999));
        goTo(idx);
      });
    }
    // side panels still clickable (jump scroll to that segment)
    function segScroll(idx) {
      if (reduceMotion) { goTo(idx); return; }
      var target = shero.offsetTop + (idx + 0.55) / N * (shero.offsetHeight - window.innerHeight);
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
    stack.style.height = "470vh";
    storyRunners.push(function () {
      var p = sectionProgress(stack);
      // phases: cards rise 0-.18/.18-.36/.36-.54 · hold · settle .62-.82 · hold to 1
      cards.forEach(function (c, i) {
        var lp = ease(clamp01((p - i * 0.18) / 0.16));
        var riseY = (1 - lp) * 118;
        var restY = i * -3;
        var riseR = (1 - lp) * (i % 2 ? 3 : -3);
        var restR = (i - 1) * 2.2 * lp;
        var sc = 1 - lp * (cards.length - 1 - i) * 0.03;
        c.style.transform = "translateY(" + (riseY + restY * lp) + "%) rotate(" + (riseR + restR) + "deg) scale(" + sc + ")";
      });
      var settle = ease(clamp01((p - 0.62) / 0.2));
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

  /* ----- horizontal cinema ----- */
  var cinema = document.querySelector('[data-story="cinema"]');
  if (cinema && !reduceMotion && !isMobile) {
    var track = document.getElementById("cinemaTrack");
    var cbar = document.getElementById("cinemaBar");
    var ccards = track ? Array.prototype.slice.call(track.children) : [];
    var Nc = ccards.length;
    cinema.style.height = (100 + (Nc - 1) * 55) + "vh";
    storyRunners.push(function () {
      var p = sectionProgress(cinema);
      if (!track || !Nc) return;
      var cw = ccards[0].getBoundingClientRect().width;
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
      var span = (cw + gap) * (Nc - 1);
      track.style.transform = "translateX(" + (-p * span - cw / 2) + "px)";
      var centerX = window.innerWidth / 2;
      ccards.forEach(function (c) {
        var r = c.getBoundingClientRect();
        var d = Math.abs(r.left + r.width / 2 - centerX) / window.innerWidth;
        c.style.transform = "scale(" + (1 - Math.min(0.08, d * 0.18)) + ")";
        c.style.opacity = String(1 - Math.min(0.22, d * 0.45));
      });
      if (cbar) cbar.style.setProperty("--f", p);
    });
  }

  /* ----- soda bar: 3D perspective showcase ----- */
  var soda = document.querySelector('[data-story="soda"]');
  if (soda && !reduceMotion && !isMobile) {
    var drinks = Array.prototype.slice.call(soda.querySelectorAll("[data-drink]"));
    var Nd = drinks.length;
    var glow = document.getElementById("sodaGlow");
    var sbar = document.getElementById("sodaBar");
    soda.style.height = (100 + (Nd - 1) * 52) + "vh";
    storyRunners.push(function () {
      var p = sectionProgress(soda) * (Nd - 1);
      drinks.forEach(function (card, i) {
        var off = i - p;                       // 0 = focused
        var a = Math.abs(off);
        var x = off * Math.min(window.innerWidth * 0.24, 340);
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
  var navOrder = document.getElementById("navOrder");
  var lastY = 0, ticking = false;

  /* ---------- parallax engine ---------- */
  var plxEls = Array.prototype.slice.call(document.querySelectorAll("[data-plx]"));
  function parallax() {
    var vh = window.innerHeight;
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
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar && max > 0) bar.style.transform = "scaleX(" + Math.min(1, y / max) + ")";
      if (nav) {
        var hide = y > 400 && y > lastY + 6;
        var show = y < lastY - 6 || y < 200;
        if (hide) { nav.classList.add("is-hidden"); if (navOrder) navOrder.classList.add("is-hidden"); }
        else if (show) { nav.classList.remove("is-hidden"); if (navOrder) navOrder.classList.remove("is-hidden"); }
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
  if (!reduceMotion) {
    document.querySelectorAll(".tsplit").forEach(function (el) {
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
    });
  }

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

  /* ---------- drinks rail: arrows + drag ---------- */
  var rail = document.getElementById("drinksRail");
  if (rail) {
    var step = function () { return Math.min(rail.clientWidth * 0.8, 640); };
    var prev = document.getElementById("drinksPrev");
    var next = document.getElementById("drinksNext");
    if (prev) prev.addEventListener("click", function () { rail.scrollBy({ left: -step(), behavior: "smooth" }); });
    if (next) next.addEventListener("click", function () { rail.scrollBy({ left: step(), behavior: "smooth" }); });
    if (finePointer) {
      var down = false, startX = 0, startL = 0, moved = false;
      rail.addEventListener("pointerdown", function (e) {
        down = true; moved = false; startX = e.clientX; startL = rail.scrollLeft;
        rail.classList.add("is-dragging");
      });
      window.addEventListener("pointermove", function (e) {
        if (!down) return;
        var dx = e.clientX - startX;
        if (Math.abs(dx) > 4) moved = true;
        rail.scrollLeft = startL - dx;
      });
      window.addEventListener("pointerup", function () { down = false; rail.classList.remove("is-dragging"); });
      rail.addEventListener("click", function (e) { if (moved) e.preventDefault(); }, true);
    }
  }

  /* ---------- gallery lightbox ---------- */
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lightboxImg");
  if (lb && lbImg) {
    document.querySelectorAll(".shot").forEach(function (fig) {
      fig.addEventListener("click", function () {
        lbImg.src = fig.getAttribute("data-full");
        var cap = fig.querySelector("figcaption");
        lbImg.alt = cap ? cap.textContent : "Expanded gallery photo";
        if (typeof lb.showModal === "function") lb.showModal();
      });
    });
    var close = document.getElementById("lightboxClose");
    if (close) close.addEventListener("click", function () { lb.close(); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
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
})();
