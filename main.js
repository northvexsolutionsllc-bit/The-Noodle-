/* the noodle lounge — vanilla interaction layer (no dependencies) */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------- ordering ----------
     Once the owner confirms the public online-ordering URL (Clover/DoorDash/etc),
     set ORDER_URL and every .js-order button switches from phone to online ordering. */
  var ORDER_URL = "";
  if (ORDER_URL) {
    document.querySelectorAll(".js-order").forEach(function (a) {
      a.href = ORDER_URL;
      a.target = "_blank";
      a.rel = "noopener";
      var label = a.querySelector("[data-order-label]");
      if (label) label.textContent = "order online";
    });
  }

  /* ---------- hero video layer ----------
     Drop a muted portrait loop at assets/video/hero-loop.mp4 (≤3 MB) and it
     automatically fades in over the slideshow. Absent file = slideshow only. */
  var saveData = navigator.connection && navigator.connection.saveData;
  if (!reduceMotion && !saveData) {
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

  /* ---------- live open/closed (America/Los_Angeles) ---------- */
  // Mon–Sat 10:00–22:30, Sun 12:00–22:30
  var HOURS = { 0: [720, 1350], 1: [600, 1350], 2: [600, 1350], 3: [600, 1350], 4: [600, 1350], 5: [600, 1350], 6: [600, 1350] };

  function laNow() {
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false
    }).formatToParts(new Date());
    var m = {};
    parts.forEach(function (p) { m[p.type] = p.value; });
    var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { day: days[m.weekday], mins: (parseInt(m.hour, 10) % 24) * 60 + parseInt(m.minute, 10) };
  }

  function fmt(mins) {
    var h = Math.floor(mins / 60), mm = mins % 60;
    var h12 = ((h + 11) % 12) + 1;
    return h12 + (mm ? ":" + (mm < 10 ? "0" + mm : mm) : "") + (h >= 12 ? "pm" : "am");
  }

  function updateStatus() {
    var t = laNow(), span = HOURS[t.day];
    var open = t.mins >= span[0] && t.mins < span[1];
    var dot = document.getElementById("heroDot");
    var label = document.getElementById("heroStatus");
    var visitSub = document.getElementById("visitStatusSub");
    var text = open
      ? "open now · closes " + fmt(span[1])
      : (t.mins < span[0] ? "closed · opens " + fmt(span[0]) : "closed · back tomorrow");
    if (dot) { dot.classList.toggle("is-open", open); dot.classList.toggle("is-closed", !open); }
    if (label) label.textContent = text;
    if (visitSub) visitSub.textContent = text;
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  var yr = document.getElementById("year");
  if (yr) yr.textContent = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", year: "numeric" }).format(new Date());

  /* ---------- hero panel carousel (puffhs-style) ---------- */
  var SLIDES = [
    { pnl: "#F3C969", ink: "#4E3007", title: "the spicy buldak bowl", img: "./assets/img/ramen-bowl-egg.jpg", alt: "A spicy ramen bowl with a soft egg, fresh off the cooking station", shape: "round", cta: "build your bowl", href: "#build" },
    { pnl: "#F4BBC9", ink: "#7A2136", title: "strawberry cream shake", img: "./assets/img/drink-strawberry-shake.jpg", alt: "Strawberry cream shake with a whipped cream dome", shape: "tall", cta: "sip the drinks menu", href: "#drinks" },
    { pnl: "#CBD9A6", ink: "#2E4A21", title: "the iced matcha latte", img: "./assets/img/drink-matcha.jpg", alt: "Iced matcha latte dusted with matcha powder", shape: "tall", cta: "sip the drinks menu", href: "#drinks" },
    { pnl: "#BFD8E8", ink: "#1F3A52", title: "berry creamy red bull", img: "./assets/img/drink-blue-redbull-gummy.jpg", alt: "Blue creamy Red Bull topped with whipped cream and a gummy ring", shape: "tall", cta: "sip the drinks menu", href: "#drinks" }
  ];
  var strip = document.getElementById("pstrip");
  if (strip) {
    var slotL = document.getElementById("slotL");
    var slotC = document.getElementById("slotC");
    var slotR = document.getElementById("slotR");
    var active = 0;
    var swapping = false;
    var pausedUntil = 0;
    var N = SLIDES.length;

    function fill(slot, s, isCenter) {
      slot.style.setProperty("--pnl", s.pnl);
      slot.style.setProperty("--pnl-ink", s.ink);
      var title = slot.querySelector(".pslot__title");
      if (title) title.textContent = s.title;
      var fig = slot.querySelector(".pslot__fig");
      if (fig) {
        fig.className = "pslot__fig pslot__fig--" + s.shape;
        var img = fig.querySelector("img");
        if (img) { img.src = s.img; img.alt = isCenter ? s.alt : ""; }
      }
      if (isCenter) {
        var cta = slot.querySelector(".pslot__cta");
        if (cta) { cta.textContent = s.cta; cta.setAttribute("href", s.href); }
      }
    }

    function render() {
      fill(slotL, SLIDES[(active - 1 + N) % N], false);
      fill(slotC, SLIDES[active], true);
      fill(slotR, SLIDES[(active + 1) % N], false);
    }

    function rotate(dir) {
      if (swapping) return;
      swapping = true;
      active = (active + dir + N) % N;
      [slotL, slotC, slotR].forEach(function (s) { s.classList.add("is-swap"); });
      setTimeout(function () {
        render();
        [slotL, slotC, slotR].forEach(function (s) { s.classList.remove("is-swap"); });
        setTimeout(function () { swapping = false; }, 340);
      }, 330);
    }

    function userRotate(dir) {
      pausedUntil = Date.now() + 12000;
      rotate(dir);
    }

    slotL.addEventListener("click", function () { userRotate(-1); });
    slotR.addEventListener("click", function () { userRotate(1); });

    // swipe on touch
    var tx = null;
    strip.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
    strip.addEventListener("touchend", function (e) {
      if (tx === null) return;
      var dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 42) userRotate(dx < 0 ? 1 : -1);
      tx = null;
    }, { passive: true });

    // auto-advance, paused after interaction / off-screen / hidden tab
    if (!reduceMotion) {
      var heroVisible = true;
      new IntersectionObserver(function (en) { heroVisible = en[0].isIntersecting; }, { threshold: 0.2 })
        .observe(strip);
      setInterval(function () {
        if (heroVisible && !document.hidden && Date.now() > pausedUntil) rotate(1);
      }, 5500);
    }
  }

  /* ---------- scroll progress + nav hide ---------- */
  var bar = document.getElementById("progressBar");
  var nav = document.getElementById("nav");
  var lastY = 0;
  var ticking = false;

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
      lastY = y;
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- reveal on scroll ---------- */
  document.querySelectorAll('[data-reveal="stagger"]').forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.style.setProperty("--i", i);
    });
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.16, rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  /* ---------- active nav link ---------- */
  var sections = ["top", "drinks", "build", "gallery", "pricing", "events", "reviews", "visit"]
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  var navLinks = document.querySelectorAll("[data-nav]");

  function setActive(id) {
    navLinks.forEach(function (a) {
      var target = a.getAttribute("href").slice(1);
      // botnav "visit" also covers reviews/events; nav pill has more granular links
      a.classList.toggle("is-active", target === id);
    });
  }
  var sectionIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) setActive(e.target.id);
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  sections.forEach(function (s) { sectionIO.observe(s); });

  /* ---------- magnetic buttons (desktop only) ---------- */
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

  /* ---------- 3d tilt cards ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".hcard").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var rx = ((e.clientY - r.top) / r.height - 0.5) * -7;
        var ry = ((e.clientX - r.left) / r.width - 0.5) * 9;
        card.style.transform = "perspective(800px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateY(-4px)";
      });
      card.addEventListener("pointerleave", function () { card.style.transform = ""; });
    });
  }

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
      window.addEventListener("pointerup", function () {
        down = false; rail.classList.remove("is-dragging");
      });
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
