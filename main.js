/* the noodle lounge — tiny runtime: live open/closed badge + year */
(function () {
  "use strict";

  // Hours: Mon–Sat 10:00–22:30, Sun 12:00–22:30 (America/Los_Angeles)
  var HOURS = {
    0: [720, 1350], // Sun 12:00 – 22:30
    1: [600, 1350], // Mon 10:00 – 22:30
    2: [600, 1350],
    3: [600, 1350],
    4: [600, 1350],
    5: [600, 1350],
    6: [600, 1350]  // Sat
  };

  function nowInLA() {
    // Convert local time to America/Los_Angeles reliably.
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false
    }).formatToParts(new Date());
    var map = {};
    parts.forEach(function (p) { map[p.type] = p.value; });
    var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    var hh = parseInt(map.hour, 10) % 24;
    var mm = parseInt(map.minute, 10);
    return { day: days[map.weekday], mins: hh * 60 + mm };
  }

  function computeStatus() {
    var t = nowInLA();
    var span = HOURS[t.day];
    var open = t.mins >= span[0] && t.mins < span[1];
    var label;
    if (open) {
      var closeM = span[1];
      var ch = Math.floor(closeM / 60), cm = closeM % 60;
      var h12 = ((ch + 11) % 12) + 1;
      label = "open now · closes " + h12 + ":" + (cm < 10 ? "0" + cm : cm) + (ch >= 12 ? "p" : "a");
    } else {
      // find next open
      var openM = span[0];
      if (t.mins < openM) {
        var oh = Math.floor(openM / 60), om = openM % 60;
        var oh12 = ((oh + 11) % 12) + 1;
        label = "closed · opens " + oh12 + ":" + (om < 10 ? "0" + om : om) + (oh >= 12 ? "p" : "a");
      } else {
        label = "closed · back tomorrow";
      }
    }
    return { open: open, label: label };
  }

  function apply() {
    var s = computeStatus();
    document.querySelectorAll("[data-status]").forEach(function (el) {
      el.textContent = s.label;
      el.setAttribute("data-open", String(s.open));
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    apply();
    setInterval(apply, 60000);
    var y = document.getElementById("year");
    if (y) {
      y.textContent = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles", year: "numeric"
      }).format(new Date());
    }
  });
})();
