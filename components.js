/* Shared interactive-component logic for the agent sites (STAGED ONLY).
   Data-agnostic: reads window.AGENT_DATA (see data.js). No external requests,
   no forms, no fake buttons — every control does something real.
   Keyboard: native controls throughout; ArrowLeft/ArrowRight move the
   walkthrough when focus is inside it; Escape clears the job search. */
(function () {
  "use strict";
  var DATA = window.AGENT_DATA || {};
  var JOBS = DATA.jobs || [];
  var SUBS = DATA.subscriptions || [];
  var STEPS = DATA.steps || [];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function $(id) { return document.getElementById(id); }
  function money(n) { return "$" + n; }

  /* ---------- 1. Job explorer ---------- */
  var list = $("job-list");
  if (list) {
    var search = $("job-search"), priceSel = $("job-price"), slaSel = $("job-sla"),
        resetBtn = $("job-reset"), count = $("job-count");
    var subsNote = $("job-subs");

    function slaLabel(min) {
      if (min <= 5) return "5 min";
      if (min <= 30) return "30 min";
      if (min <= 1440) return "24h";
      if (min <= 2880) return "48h";
      return "72h";
    }
    function priceBand(p) {
      if (p <= 5) return "low";
      if (p <= 25) return "mid";
      if (p <= 75) return "high";
      return "top";
    }
    function slaBand(min) {
      if (min <= 5) return "5";
      if (min <= 30) return "30";
      if (min <= 1440) return "24";
      if (min <= 2880) return "48";
      return "72";
    }
    function render() {
      var q = (search.value || "").trim().toLowerCase();
      var pb = priceSel.value, sb = slaSel.value;
      var shown = JOBS.filter(function (j) {
        if (q && (j.name + " " + j.desc).toLowerCase().indexOf(q) === -1) return false;
        if (pb !== "all" && priceBand(j.price) !== pb) return false;
        if (sb !== "all" && slaBand(j.slaMinutes) !== sb) return false;
        return true;
      });
      count.textContent = shown.length + " of " + JOBS.length + " jobs shown";
      if (!shown.length) {
        list.innerHTML = '<p class="empty" role="status">No jobs match those filters. ' +
          '<a href="' + esc(DATA.jobsPage || "jobs.html") + '">See the full catalog on the Jobs page</a>.</p>';
        return;
      }
      list.innerHTML = shown.map(function (j) {
        return '<article class="job-card">' +
          "<h3>" + esc(j.name) + "</h3>" +
          '<p><span class="price">' + money(j.price) + ' Fixed USD</span> &middot; ' +
          '<span class="sla">SLA ' + slaLabel(j.slaMinutes) + "</span></p>" +
          "<p>" + esc(j.desc) + "</p>" +
          '<p class="spacer"></p>' +
          '<p><a href="' + esc(DATA.jobsPage || "jobs.html") + '">See it in the catalog &rarr;</a></p>' +
          "</article>";
      }).join("");
    }
    [search, priceSel, slaSel].forEach(function (el) {
      el.addEventListener("input", render);
      el.addEventListener("change", render);
    });
    search.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { search.value = ""; render(); search.focus(); }
    });
    resetBtn.addEventListener("click", function () {
      search.value = ""; priceSel.value = "all"; slaSel.value = "all"; render(); search.focus();
    });
    if (subsNote) {
      subsNote.innerHTML = "<h3>Subscriptions — separate from jobs</h3>" +
        "<p>" + SUBS.map(function (s) {
          return "<strong>" + esc(s.name) + "</strong> — " + money(s.price) + " for " + esc(s.period);
        }).join(" &middot; ") +
        '. Full details on the <a href="subscription-explorer.html">subscription explorer</a>.</p>' +
        '<p class="offline">Listed, not yet online — a hire cannot be completed today.</p>';
    }
    render();
  }

  /* ---------- 2. Hire walkthrough ---------- */
  var stepper = $("hire-stepper");
  if (stepper) {
    var panel = $("step-panel"), dotsWrap = $("step-dots"),
        prevBtn = $("step-prev"), nextBtn = $("step-next"), stepCount = $("step-count");
    var current = 0;
    dotsWrap.innerHTML = STEPS.map(function (s, i) {
      return '<li><button type="button" class="step-dot" data-step="' + i +
        '" aria-label="Step ' + (i + 1) + ': ' + esc(s.title) + '"' +
        (i === 0 ? ' aria-current="step"' : "") + ">" + (i + 1) + "</button></li>";
    }).join("");
    var dots = Array.prototype.slice.call(dotsWrap.querySelectorAll(".step-dot"));
    function show(i) {
      current = Math.max(0, Math.min(STEPS.length - 1, i));
      var s = STEPS[current];
      panel.innerHTML = "<h3>Step " + (current + 1) + ": " + esc(s.title) + "</h3><p>" + s.body + "</p>" +
        '<p class="offline">Listed, not yet online — a hire cannot be completed today.</p>';
      dots.forEach(function (d, di) {
        if (di === current) { d.setAttribute("aria-current", "step"); }
        else { d.removeAttribute("aria-current"); }
      });
      stepCount.textContent = "Step " + (current + 1) + " of " + STEPS.length;
      prevBtn.disabled = current === 0;
      nextBtn.disabled = current === STEPS.length - 1;
    }
    dots.forEach(function (d) {
      d.addEventListener("click", function () { show(Number(d.getAttribute("data-step"))); });
    });
    prevBtn.addEventListener("click", function () { show(current - 1); });
    nextBtn.addEventListener("click", function () { show(current + 1); });
    stepper.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); show(current + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); show(current - 1); }
    });
    show(0);
  }

  /* ---------- 3. Subscription explorer ---------- */
  var subList = $("sub-list");
  if (subList) {
    subList.innerHTML = SUBS.map(function (s, i) {
      var flag = s.undocumented
        ? '<p class="flag">What this covers beyond the name is not documented on the site or in the catalog.</p>' : "";
      return '<article class="sub-card">' +
        "<h3>" + esc(s.name) + "</h3>" +
        '<p><span class="price">' + money(s.price) + '</span> &middot; <span class="sla">every ' + esc(s.period) + "</span></p>" +
        "<p>" + esc(s.desc) + "</p>" + flag +
        '<p><button type="button" class="btn ghost" aria-expanded="false" aria-controls="sub-details-' + i + '">' +
        "What this means</button></p>" +
        '<div class="details" id="sub-details-' + i + '" hidden><p>' + s.detail + "</p>" +
        '<p><a href="' + esc(DATA.acp) + '">See it on the agent&rsquo;s ACP page</a> (subscriptions are managed there, not on this site).</p></div>' +
        "</article>";
    }).join("");
    subList.querySelectorAll("button[aria-expanded]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        var box = document.getElementById(btn.getAttribute("aria-controls"));
        btn.setAttribute("aria-expanded", String(!open));
        box.hidden = open;
        btn.textContent = open ? "What this means" : "Hide details";
      });
    });
  }
})();
