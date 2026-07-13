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

  /* ----- hero scenes ----- */
  var shero = document.querySelector('[data-story="hero"]');
  if (shero && !reduceMotion) {
    var scenes = Array.prototype.slice.call(shero.querySelectorAll("[data-scene]"));
    var Ns = scenes.length;
    shero.style.height = (Ns * 85 + 60) + "vh";
    var counter = document.getElementById("sceneNow");
    var bars = document.getElementById("sceneBars");
    var barEls = bars ? Array.prototype.slice.call(bars.children) : [];
    storyRunners.push(function () {
      var p = sectionProgress(shero) * (Ns - 1);
      scenes.forEach(function (sc, i) {
        var d = p - i;                       // distance from active
        var lp = clamp01(1 - Math.abs(d));   // 1 when centered
        var eIn = ease(clamp01(d + 1));      // entering 0→1 while d: -1→0
        var body = sc.querySelector(".scene__body");
        var img = sc.querySelector(".scene__img");
        sc.style.opacity = lp <= 0 ? 0 : (d > 0 ? 1 - ease(clamp01(d)) : eIn);
        sc.style.zIndex = String(10 - Math.round(Math.abs(d)));
        sc.classList.toggle("is-front", Math.abs(d) < 0.5);
        if (img) img.style.transform = "scale(" + (1.18 - lp * 0.12) + ") translateY(" + (d * -4) + "%)";
        if (body) {
          body.style.opacity = String(Math.pow(lp, 1.4));
          body.style.transform = "translateY(" + ((1 - lp) * 44) + "px)";
        }
        if (barEls[i]) barEls[i].style.setProperty("--f", i < p ? 1 : (i === Math.ceil(p) || i === 0 && p < 1 ? clamp01(1 - Math.abs(d)) : 0));
      });
      var current = Math.min(Ns, Math.round(p) + 1);
      if (counter) counter.textContent = (current < 10 ? "0" : "") + current;
      barEls.forEach(function (b, i) {
        b.style.setProperty("--f", clamp01(p - i + 1) > 1 ? 1 : clamp01(p - i + 1));
      });
    });
  }

  /* ----- stacked cards ----- */
  var stack = document.querySelector('[data-story="stack"]');
  if (stack && !reduceMotion && !isMobile) {
    var cards = Array.prototype.slice.call(stack.querySelectorAll("[data-scard]"));
    var stackHead = document.getElementById("stackHead");
    var stackCards = document.getElementById("stackCards");
    var stackPanel = document.getElementById("stackPanel");
    stack.style.height = "420vh";
    storyRunners.push(function () {
      var p = sectionProgress(stack);
      // phases: 0-.22 card1 · .22-.44 card2 · .44-.66 card3 · .7-1 settle
      cards.forEach(function (c, i) {
        var lp = ease(clamp01((p - i * 0.22) / 0.2));
        c.style.transform = "translateY(" + ((1 - lp) * 120) + "%) rotate(" + ((1 - lp) * (i % 2 ? 3 : -3)) + "deg)";
        // resting offsets so the stack reads as layered
        if (lp >= 1) c.style.transform = "translateY(" + (i * -3) + "%) rotate(" + ((i - 1) * 2.5) + "deg) scale(" + (1 - (cards.length - 1 - i) * 0.035) + ")";
      });
      var settle = ease(clamp01((p - 0.7) / 0.28));
      if (stackHead) {
        stackHead.style.opacity = String(1 - settle);
        stackHead.style.transform = "translateY(" + (settle * -30) + "px)";
      }
      if (stackPanel) {
        stackPanel.style.opacity = String(settle);
        stackPanel.style.transform = "translateX(" + ((1 - settle) * 60) + "px)";
        stackPanel.style.pointerEvents = settle > 0.6 ? "auto" : "none";
      }
      if (stackCards) stackCards.style.transform = "translateX(" + ((1 - settle) * 0) + "px) scale(" + (1 - settle * 0.04) + ")";
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
      var x = -p * span - cw / 2;             // track starts at 50vw padding; center first card
      track.style.transform = "translateX(" + x + "px)";
      var centerX = window.innerWidth / 2;
      ccards.forEach(function (c) {
        var r = c.getBoundingClientRect();
        var d = Math.abs(r.left + r.width / 2 - centerX) / window.innerWidth;
        var sc = 1 - Math.min(0.1, d * 0.22);
        c.style.transform = "scale(" + sc + ")";
        c.style.opacity = String(1 - Math.min(0.45, d * 0.9));
      });
      if (cbar) cbar.style.setProperty("--f", p);
    });
  }

  /* ---------- scroll progress + nav hide ---------- */
  var bar = document.getElementById("progressBar");
  var nav = document.getElementById("nav");
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
        if (y > 400 && y > lastY + 6) nav.classList.add("is-hidden");
        else if (y < lastY - 6 || y < 200) nav.classList.remove("is-hidden");
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
