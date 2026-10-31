/* =====================================================================
   GUIDES — glossary search and filters, the deck builder, the
   before-you-pitch checklist. Everything typed stays on this device.
   ===================================================================== */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const inViewer = !!(window.claude && window.claude.use);
  let viewerSave = null;
  if (inViewer) window.claude.use("downloads").then(d => { viewerSave = d; }).catch(() => {});

  /* ---------- glossary ---------- */
  const gl = $("#gloss");
  if (gl) {
    const terms = $$(".gterm", gl), input = $("#gq"), count = $("#gcount"), empty = $("#gempty"), chips = $$(".chips button");
    let cat = "all", q = "";
    const mark = (raw) => { if (!q) return esc(raw); const i = raw.toLowerCase().indexOf(q); return i < 0 ? esc(raw) : esc(raw.slice(0, i)) + "<mark>" + esc(raw.slice(i, i + q.length)) + "</mark>" + esc(raw.slice(i + q.length)); };
    function apply() {
      let n = 0;
      terms.forEach(t => {
        const show = (cat === "all" || t.dataset.cat === cat) && (!q || t.dataset.text.includes(q));
        t.hidden = !show; if (show) n++;
        const b = $("dt b", t); b.innerHTML = mark(b.dataset.raw);
      });
      $$(".gsec", gl).forEach(sec => { sec.hidden = !$(".gterm:not([hidden])", sec); });
      $$(".az a").forEach(a => { const sec = document.getElementById(a.getAttribute("href").slice(1)); a.hidden = !sec || sec.hidden; });
      count.textContent = n + (n === 1 ? " term" : " terms");
      empty.hidden = n > 0; if (!n) empty.textContent = q ? `No terms match “${input.value.trim()}”.` : "No terms in this category.";
    }
    input.addEventListener("input", () => { q = input.value.trim().toLowerCase(); apply(); });
    input.addEventListener("keydown", (e) => { if (e.key === "Escape") { input.value = ""; q = ""; apply(); } });
    chips.forEach(b => b.addEventListener("click", () => { cat = b.dataset.cat; chips.forEach(x => x.setAttribute("aria-pressed", String(x === b))); apply(); }));
    try { const p = new URLSearchParams(location.search).get("q"); if (p) { input.value = p; q = p.toLowerCase(); } } catch (e) {}
    apply();
  }

  /* ---------- deck builder ---------- */
  const bld = $("#builder");
  if (bld) {
    const fields = $$("textarea", bld), KEY = "ecell.deck", saved = store.get(KEY, []);
    const countEl = $("#bcount"), say = $("#bsay");
    fields.forEach((f, i) => { if (saved[i]) f.value = saved[i]; });
    function sync() {
      const vals = fields.map(f => f.value.trim()); store.set(KEY, fields.map(f => f.value));
      let done = 0; fields.forEach((f, i) => { const ok = !!vals[i]; f.closest(".field").classList.toggle("done", ok); if (ok) done++; });
      countEl.innerHTML = `<b>${done}</b> / ${fields.length} slides written`;
      return vals;
    }
    let t = 0; bld.addEventListener("input", () => { clearTimeout(t); t = setTimeout(sync, 200); });
    const outline = () => {
      const vals = sync(), lines = ["MY PITCH DECK", "Outline written with the pitch deck guide of E-Cell IIIT Vadodara", ""];
      fields.forEach((f, i) => { lines.push(`${String(i + 1).padStart(2, "0")}  ${f.dataset.title.toUpperCase()}`); lines.push(vals[i] || "(not written yet)"); lines.push(""); });
      return lines.join("\n");
    };
    const note = (m) => { if (say) { say.textContent = m; clearTimeout(note.t); note.t = setTimeout(() => { say.textContent = ""; }, 3200); } };
    $("#bdl").addEventListener("click", (e) => {
      const text = outline(), blob = new Blob([text], { type: "text/plain" });
      if (inViewer) {
        e.preventDefault();
        if (viewerSave) viewerSave.save({ filename: "my-pitch-deck-outline.txt", data: blob }).catch(() => {});
        else note("Downloads are not available here. Use Copy instead.");
        return;
      }
      const a = e.currentTarget; if (a._url) URL.revokeObjectURL(a._url); a._url = URL.createObjectURL(blob); a.href = a._url;
    });
    $("#bcopy").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(outline()); note("Copied. Paste it into your slides or notes."); }
      catch (err) { note("Copy is not available here. Use Download instead."); }
    });
    const clr = $("#bclear"); let armed = false;
    clr.addEventListener("click", () => {
      if (!armed) { armed = true; clr.textContent = "Tap again to clear"; setTimeout(() => { armed = false; clr.textContent = "Clear"; }, 3000); return; }
      fields.forEach(f => { f.value = ""; }); sync(); armed = false; clr.textContent = "Clear"; note("Cleared.");
    });
    sync();
  }

  /* ---------- before-you-pitch checklist ---------- */
  const ck = $("#checklist");
  if (ck) {
    const boxes = $$("input[type=checkbox]", ck), KEY = "ecell.check", saved = store.get(KEY, []), bar = $("#cprog"), lab = $("#clab");
    boxes.forEach((b, i) => { b.checked = !!saved[i]; });
    function sync() {
      const v = boxes.map(b => b.checked); store.set(KEY, v);
      const n = v.filter(Boolean).length; bar.style.setProperty("--p", (n / boxes.length * 100).toFixed(1) + "%");
      lab.textContent = n === boxes.length ? "Ready to pitch" : `${n} / ${boxes.length} ready`;
    }
    ck.addEventListener("change", sync); sync();
  }
})();
