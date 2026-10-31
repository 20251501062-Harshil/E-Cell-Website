/* =====================================================================
   BOOT — creates the stage, decides quality and motion mode, and hands
   a ready engine to the page script. Falls back to a static, exact SVG
   logo when WebGL is unavailable or the visitor prefers reduced motion.
   ===================================================================== */
(function (root) {
  "use strict";
  root.ECellBoot = function (opts) {
    opts = opts || {};
    let calm = false; try { calm = localStorage.getItem("ecell.calm") === "1"; } catch (e) {}
    const reduced = calm || matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stage = document.createElement("canvas");
    stage.className = "stage"; stage.setAttribute("aria-hidden", "true");
    document.body.prepend(stage);
    let engine = null, error = null;
    // phones and small tablets: no WebGL stage at all; pages draw inline illustrations instead
    const small = innerWidth < 900;
    if (small) {
      let lastSmall = small, t = 0;
      addEventListener("resize", () => { clearTimeout(t); t = setTimeout(() => { if ((innerWidth < 900) !== lastSmall) location.reload(); }, 400); }, { passive: true });
    }
    if ((!reduced || opts.allowReduced) && !small) {
      try { engine = new root.ECellEngine.Particles(stage, opts.engine || {}); }
      catch (e) { error = e; engine = null; }
    }
    const mode = engine ? (reduced ? "reduced" : "full") : (small && !reduced ? "inline" : "static");
    document.documentElement.dataset.motion = mode;
    if (!engine) stage.remove();
    else stage.addEventListener("webglcontextlost", (e) => {
      e.preventDefault(); engine.dead = true; engine.stop();
      // keep the reader's place: the stage windows collapse when the page turns static
      const keep = document.elementFromPoint(innerWidth / 2, innerHeight * 0.3), before = keep ? keep.getBoundingClientRect().top : 0;
      document.documentElement.dataset.motion = "static";
      if (keep && keep.isConnected) scrollBy(0, keep.getBoundingClientRect().top - before);
      stage.remove(); document.querySelectorAll(".solid-stage").forEach(c => c.remove());
      if (opts.onLost) opts.onLost();
    });
    return { engine, mode, reduced, error, stage: engine ? stage : null };
  };
  /** Wait for named fonts before sampling text into particles (max ~1.2s). */
  root.ECellFonts = function (specs) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const all = Promise.all(specs.map(s => document.fonts.load(s).catch(() => null)));
    return Promise.race([all, new Promise(r => setTimeout(r, 1200))]);
  };
  /** IST calendar date as yyyy-mm-dd. */
  root.ECellTodayIST = function () {
    try { const q = new URLSearchParams(location.search).get("date"); if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) return q; } catch (e) {}
    try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date()); }
    catch (e) { const d = new Date(Date.now() + 5.5 * 3600e3); return d.toISOString().slice(0, 10); }
  };
  /** Shark Tank state line, computed against the IST calendar. Never placeholder language. */
  root.ECellFinaleState = function () {
    const st = (root.ECELL || {}).sharkTank || {}, day = (st.finaleISO || "2026-11-01").slice(0, 10), today = root.ECellTodayIST();
    const ms = Date.parse(day + "T00:00:00+05:30") - Date.parse(today + "T00:00:00+05:30"), days = Math.round(ms / 864e5);
    if (days > 1) return { phase: "before", line: "In " + days + " days", days };
    if (days === 1) return { phase: "before", line: "Tomorrow", days };
    if (days === 0) return { phase: "today", line: "Today, on campus", days };
    return { phase: "after", line: "Held " + (st.finaleLabel || "1 November 2026"), days };
  };
  /** A calendar file for the grand finale: all-day on the published date, at the published place. */
  root.ECellFinaleICS = function () {
    const C = root.ECELL || {}, st = C.sharkTank || {}, day = (st.finaleISO || "2026-11-01").slice(0, 10).replace(/-/g, "");
    const next = new Date(Date.UTC(+day.slice(0, 4), +day.slice(4, 6) - 1, +day.slice(6, 8) + 1)).toISOString().slice(0, 10).replace(/-/g, "");
    const esc = (v) => String(v).replace(/[\\,;]/g, (m) => "\\" + m);
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//E-Cell IIIT Vadodara//Shark Tank IIITV//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
      "UID:shark-tank-iiitv-" + day + "-finale@ecell-iiit-vadodara", "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z",
      "DTSTART;VALUE=DATE:" + day, "DTEND;VALUE=DATE:" + next,
      "SUMMARY:" + esc((st.name || "Shark Tank IIITV") + " " + (st.year || "") + ": grand finale"),
      "LOCATION:" + esc(st.venue || "IIIT Vadodara campus"),
      "DESCRIPTION:" + esc("The grand finale of " + (st.name || "Shark Tank IIITV") + " " + (st.year || "") + ", the startup pitching competition of E-Cell IIIT Vadodara." + (C.instagram ? " Updates: " + C.instagram : "")),
      "END:VEVENT", "END:VCALENDAR"];
    return URL.createObjectURL(new Blob([lines.join("\r\n") + "\r\n"], { type: "text/calendar" }));
  };
})(window);
