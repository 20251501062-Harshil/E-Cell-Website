/* =====================================================================
   E-CELL v4 — page behaviour. Nothing here moves on scroll except via
   CSS classes (reveals) and one word-colour pass; scrolling is native.
   ===================================================================== */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const C = window.ECELL || {}, ST = C.sharkTank || {}, L = window.ECellLogo, html = document.documentElement;
  let calm = false; try { calm = localStorage.getItem("ecell.calm") === "1"; } catch (e) {}
  const reduced = calm || matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) html.dataset.motion = "static";
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pts = (poly) => poly.map(([x, y]) => `${(x * 100).toFixed(1)},${(-y * 100).toFixed(1)}`).join(" ");
  let uid = 0;

  /* ---------- the exact mark, in several dresses ---------- */
  $$("[data-logo]").forEach(el => {
    const kind = el.dataset.logo;
    if (kind === "outline") el.innerHTML = `<svg viewBox="-90 -106 180 212" aria-hidden="true">${["shell", "barTop", "barBottom"].map(k => `<polygon points="${pts(L.POLYS[k])}" pathLength="1"/>`).join("")}</svg>`;
    else el.innerHTML = L.svg();
  });

  /* ---------- facts and links (only configured, verified values) ---------- */
  const fin = window.ECellFinaleState();
  $$("[data-finale-short]").forEach(el => { el.textContent = fin.phase === "after" ? "Grand finale · 1 November 2026" : fin.phase === "today" ? "Grand finale · Today, on campus" : "Grand finale · 1 Nov · " + fin.line; });
  const cn = $("[data-count-n]"), cl = $("[data-count-l]");
  if (cn && cl) {
    if (fin.phase === "before") { cn.textContent = String(fin.days).padStart(2, "0"); cl.textContent = fin.days === 1 ? "Day to the grand finale" : "Days to the grand finale"; }
    else if (fin.phase === "today") { cn.textContent = "Today"; cl.textContent = "The grand finale is on campus"; }
  }
  const inViewer = !!(window.claude && window.claude.use);
  $$("[data-cal]").forEach(a => { if (fin.phase !== "after" && window.ECellFinaleICS && !inViewer) { try { a.href = window.ECellFinaleICS(); a.hidden = false; } catch (e) {} } });
  $$("[data-reg]").forEach(a => { if (ST.registrationUrl && fin.phase !== "after") { a.href = ST.registrationUrl; a.hidden = false; } });
  $$("[data-ig]").forEach(a => { a.href = C.instagram; });
  $$("[data-handle]").forEach(el => { el.textContent = C.instagramHandle; });
  if (C.email) { $$("[data-mail]").forEach(a => { a.href = "mailto:" + C.email; a.hidden = false; }); $$("[data-mail-t]").forEach(el => { el.textContent = C.email; }); $$("[data-mail-wrap]").forEach(el => { el.hidden = false; }); }
  if (C.linkedin) { $$("[data-li]").forEach(a => { a.href = C.linkedin; a.hidden = false; }); $$("[data-li-wrap]").forEach(el => { el.hidden = false; }); }
  if (ST.registrationUrl && fin.phase !== "after") $$("[data-reg-answer]").forEach(el => { el.innerHTML = `Register on the <a href="${ST.registrationUrl}" target="_blank" rel="noopener">Shark Tank IIITV 2026 registration page</a>, and follow <a href="${C.instagram}" target="_blank" rel="noopener">${esc(C.instagramHandle)}</a> on Instagram for updates.`; });
  const calmLabel = calm ? "Turn animation back on" : "Reduce motion";
  $$("[data-ext]").forEach(el => {
    el.innerHTML = [C.instagram && `<a href="${C.instagram}" target="_blank" rel="noopener">Instagram ${esc(C.instagramHandle)}</a>`,
      C.linkedin && `<a href="${C.linkedin}" target="_blank" rel="noopener">LinkedIn</a>`,
      C.email && `<a href="mailto:${C.email}">${esc(C.email)}</a>`].filter(Boolean).join("") + `<button type="button" data-calm>${calmLabel}</button>`;
  });
  $$("[data-calm]").forEach(b => b.addEventListener("click", () => { try { localStorage.setItem("ecell.calm", calm ? "0" : "1"); } catch (e) {} location.reload(); }));

  /* "E-Cell" never breaks at its hyphen in running text */
  (function () {
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (t) => /E-Cell/.test(t.nodeValue) && t.parentElement.closest("p, h2, h3, h4, li, dd, dt, small") && !t.parentElement.closest("a, button, [data-split], [data-fill], script, style") ? 1 : 2 });
    const hits = []; while (tw.nextNode()) hits.push(tw.currentNode);
    hits.forEach(t => { const f = document.createDocumentFragment(); t.nodeValue.split(/(E-Cell)/).forEach(p => { if (p === "E-Cell") { const s = document.createElement("span"); s.className = "nobr"; s.textContent = p; f.appendChild(s); } else if (p) f.appendChild(document.createTextNode(p)); }); t.parentNode.replaceChild(f, t); });
  })();

  /* ---------- split headings into words that rise out of masks ---------- */
  const heads = new Map();
  $$("[data-split]").forEach(el => {
    const host = el.closest("h1, h2, h3") || el, start = heads.get(host) || 0;
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w, i) => `<span class="w"><span class="wi" style="--i:${start + i}">${esc(w)}</span></span>`).join(" ");
    heads.set(host, start + words.length);
  });

  /* ---------- the statement fills in, word by word, as you read ---------- */
  const fills = $$("[data-fill]").map(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(w => `<span class="fw">${esc(w)}</span>`).join(" ");
    return { el, spans: $$(".fw", el), n: -1 };
  });
  function paintFills() {
    fills.forEach(f => {
      const r = f.el.getBoundingClientRect(), vh = innerHeight;
      const p = Math.max(0, Math.min(1, (vh * 0.86 - r.top) / (r.height + vh * 0.3)));
      const n = Math.round(p * f.spans.length);
      if (n === f.n) return;
      const lo = Math.min(n, f.n < 0 ? 0 : f.n), hi = Math.max(n, f.n < 0 ? f.spans.length : f.n);
      for (let i = lo; i < hi; i++) f.spans[i].classList.toggle("on", i < n);
      f.n = n;
    });
  }

  /* ---------- reveal on entry ---------- */
  const revealIO = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); revealIO.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }) : null;
  const revealables = $$("main [data-split], main [data-reveal], .card, .tile").filter(el => !el.closest(".hero"));
  if (revealIO && !reduced) revealables.forEach(el => revealIO.observe(el)); else revealables.forEach(el => el.classList.add("in"));

  /* ---------- marquees run only while on screen ---------- */
  $$("[data-marquee]").forEach(t => { t.innerHTML += t.innerHTML; });
  const mq = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach(e => e.target.classList.toggle("run", e.isIntersecting))) : null;
  $$(".marquee").forEach(m => mq ? mq.observe(m) : m.classList.add("run"));

  /* ---------- the wings: each card holds the mark with its own piece pulled out ---------- */
  const NAMES = ["shellUpper", "shellLower", "barTop", "barBottom"];
  const DIR = [[-0.3, 0.42], [-0.3, -0.42], [0.47, 0.38], [0.81, 0.24]];
  const LOOK = {
    "card--1": { ghost: "rgba(4,34,94,.2)", a: "#03246D", b: "#0B5CE6" },
    "card--2": { ghost: "rgba(255,255,255,.26)", a: "#7FA8FF", b: "#FFFFFF" },
    "card--3": { ghost: "rgba(255,255,255,.34)", a: "#FFFFFF", b: "#DCE7FF" },
    "card--4": { ghost: "rgba(4,34,94,.2)", a: "#03246D", b: "#0B5CE6" }
  };
  $$(".card").forEach(card => {
    const art = $(".card__art", card); if (!art) return;
    const k = +art.dataset.piece, look = LOOK[[...card.classList].find(c => LOOK[c])] || LOOK["card--1"], id = "pg" + (++uid);
    const dx = DIR[k][0] * 46, dy = -DIR[k][1] * 46;
    art.innerHTML = `<svg viewBox="-125 -135 250 270" aria-hidden="true"><defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="-84" y1="100" x2="84" y2="-100"><stop offset="0" stop-color="${look.a}"/><stop offset="1" stop-color="${look.b}"/></linearGradient></defs>` +
      NAMES.map((n, i) => i === k ? "" : `<polygon class="pc-ghost" points="${pts(L.PIECES[n])}" stroke="${look.ghost}"/>`).join("") +
      `<polygon class="pc-on" points="${pts(L.PIECES[NAMES[k]])}" fill="url(#${id})" style="--dx:${dx.toFixed(1)}px;--dy:${dy.toFixed(1)}px"/></svg>`;
  });

  /* ---------- header: solid after the top, hides while reading down, inverts over dark sections ---------- */
  const top = $(".top"), darks = $$("[data-dark]");
  let lastY = scrollY, acc = 0, ticking = false;
  function onScroll() {
    ticking = false;
    const y = scrollY, dy = y - lastY; lastY = y;
    top.classList.toggle("is-scrolled", y > 8);
    if (!html.classList.contains("menu-open") && !top.contains(document.activeElement)) {
      acc = Math.sign(dy) === Math.sign(acc) ? acc + dy : dy;
      if (y < 120 || acc < -30) top.classList.remove("is-hidden"); else if (acc > 40) top.classList.add("is-hidden");
    }
    const line = 32; top.classList.toggle("is-dark", darks.some(d => { const r = d.getBoundingClientRect(); return r.top <= line && r.bottom >= line; }));
    paintFills();
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener("resize", () => { fills.forEach(f => { f.n = -1; }); onScroll(); }, { passive: true });
  top.addEventListener("focusin", () => top.classList.remove("is-hidden"));

  /* ---------- menu ---------- */
  const menu = $("#menu"), menuBtn = $(".top__menu"), menuT = $(".top__menu-t");
  const behind = () => $$("body > main, body > footer, body > .skip");
  function setMenu(open) {
    html.classList.toggle("menu-open", open); menuBtn.setAttribute("aria-expanded", String(open)); if (menuT) menuT.textContent = open ? "Close" : "Menu";
    menu.inert = !open; behind().forEach(el => { el.inert = open; }); top.classList.remove("is-hidden");
    if (open) setTimeout(() => { const a = $("a", menu); a && a.focus({ preventScroll: true }); }, 80);
  }
  menuBtn.addEventListener("click", () => setMenu(!html.classList.contains("menu-open")));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && html.classList.contains("menu-open")) { setMenu(false); menuBtn.focus(); } });

  /* ---------- the 3D mark ---------- */
  const cv = $("#mark3d");
  let mark = null;
  if (cv && !reduced && window.ECellMark3D) { try { mark = window.ECellMark3D(cv, { onLost: () => html.classList.add("no-3d") }); } catch (e) { mark = null; } }
  if (cv && !mark) html.classList.add("no-3d");
  if (mark) {
    let moved = 0, downX = 0;
    cv.addEventListener("pointerdown", (e) => { downX = e.clientX; moved = 0; });
    cv.addEventListener("pointermove", (e) => { moved = Math.max(moved, Math.abs(e.clientX - downX)); }, { passive: true });
    cv.addEventListener("click", () => { if (moved < 6) mark.replay(); });
    const hint = $(".hero__hint"); const hideHint = () => { if (hint) hint.style.opacity = "0"; };
    if (hint && matchMedia("(pointer: fine)").matches) hint.textContent = "Drag to spin";
    cv.addEventListener("pointerdown", hideHint, { once: true }); setTimeout(hideHint, 7000);
  }

  /* ---------- intro: a short count while the outline draws, then the curtain lifts ---------- */
  const loader = $("#loader"), num = $("#loadNum");
  function heroIn() {
    $$(".hero [data-split]").forEach(el => el.classList.add("in"));
    if (mark) mark.start();
  }
  if (loader && !reduced) {
    const t0 = performance.now(), dur = 1150;
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      num.textContent = String(Math.round(e * 100));
      if (k < 1) requestAnimationFrame(tick);
      else { loader.classList.add("done"); html.classList.add("loaded"); setTimeout(heroIn, 280); setTimeout(() => loader.remove(), 1400); }
    };
    requestAnimationFrame(tick);
  } else { if (loader) loader.remove(); heroIn(); $$(".hero [data-split]").forEach(el => el.classList.add("in")); }

  /* ---------- desktop: a cursor ring and magnetic buttons ---------- */
  if (matchMedia("(pointer: fine)").matches && !reduced) {
    html.classList.add("has-cursor");
    const cur = $(".cursor"), ring = cur && cur.firstElementChild; let x = -100, y = -100, cx = -100, cy = -100, on = false;
    addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; if (!on) { on = true; requestAnimationFrame(loop); } const t = e.target.closest && e.target.closest("a, button, input, canvas"); cur.classList.toggle("is-link", !!t); cur.classList.toggle("is-dark", top.classList.contains("is-dark") && y < 80 || !!(e.target.closest && e.target.closest("[data-dark]"))); }, { passive: true });
    function loop() { cx += (x - cx) * 0.22; cy += (y - cy) * 0.22; cur.style.transform = `translate(${cx}px, ${cy}px)`; if (Math.abs(x - cx) + Math.abs(y - cy) > 0.3) requestAnimationFrame(loop); else on = false; }
    $$("[data-magnetic]").forEach(b => {
      b.addEventListener("pointermove", (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`; });
      b.addEventListener("pointerleave", () => { b.style.transition = "transform .6s cubic-bezier(.16,1,.3,1)"; b.style.transform = ""; setTimeout(() => { b.style.transition = ""; }, 600); });
    });
  }

  /* ---------- copy the handle ---------- */
  const copyBtn = $("#copyHandle");
  if (copyBtn) copyBtn.addEventListener("click", async () => {
    const t = $("#copyT");
    try { await navigator.clipboard.writeText(C.instagramHandle); t.textContent = "Copied"; }
    catch (err) { const r = document.createRange(); r.selectNodeContents($("[data-handle]", copyBtn)); const s = getSelection(); s.removeAllRanges(); s.addRange(r); t.textContent = "Selected"; }
    setTimeout(() => { t.textContent = "Copy"; }, 2200);
  });

  /* ---------- your idea, as a card you can download and share ---------- */
  const input = $("#idea"), sheet = $("#cardSheet");
  if (input && sheet) {
    const store = { get() { try { return localStorage.getItem("ecell.idea") || ""; } catch (e) { return ""; } }, set(v) { try { localStorage.setItem("ecell.idea", v); } catch (e) {} } };
    let idea = store.get(); if (idea) input.value = idea;
    input.addEventListener("input", () => { idea = input.value.replace(/\s+/g, " ").slice(0, 32); store.set(idea.trim()); });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); input.blur(); } });
    const note = $("#ideaNote"), noteText = note.textContent;
    const pageBehind = () => $$("body > main, body > footer, body > .skip, body > .top, body > .menu");
    let closeTimer = 0, blob = null, url = "", file = null, name = "", making = false, viewerSave = null;
    if (inViewer) window.claude.use("downloads").then(d => { viewerSave = d; }).catch(() => {});
    const close = () => {
      if (!sheet.classList.contains("is-open")) return;
      sheet.classList.remove("is-open"); pageBehind().forEach(el => { el.inert = false; });
      clearTimeout(closeTimer); closeTimer = setTimeout(() => { if (!sheet.classList.contains("is-open")) sheet.hidden = true; }, 500);
      const b = $("#cardBtn"); b.focus({ preventScroll: true }); b.scrollIntoView({ block: "nearest" });
    };
    $("#cardBtn").addEventListener("click", () => {
      if (!(idea && idea.trim())) {
        note.textContent = "Type your idea first, then make the card."; note.classList.add("is-warn"); input.focus();
        setTimeout(() => { note.textContent = noteText; note.classList.remove("is-warn"); }, 3200); return;
      }
      if (making) return; making = true;
      const cv2 = window.ECellCard.render(idea.trim(), { finaleLine: fin.phase !== "after" ? "Shark Tank IIITV 2026 · 1 Nov · IIIT Vadodara" : "" });
      name = "ecell-idea-" + (idea.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "card") + ".png";
      cv2.toBlob((b) => {
        making = false; if (!b) return; blob = b;
        if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(b);
        $("#cardImg").src = url; const dl = $("#cardDownload"); dl.href = url; dl.setAttribute("download", name);
        try { file = new File([b], name, { type: "image/png" }); } catch (e) { file = null; }
        $("#cardShare").hidden = !(file && navigator.canShare && navigator.canShare({ files: [file] }));
        clearTimeout(closeTimer); sheet.hidden = false; pageBehind().forEach(el => { el.inert = true; });
        requestAnimationFrame(() => sheet.classList.add("is-open")); setTimeout(() => $(".sheet__x", sheet).focus(), 60);
      }, "image/png");
    });
    $("#cardDownload").addEventListener("click", (e) => {
      if (!inViewer) return; // on the real website the link downloads the file itself
      e.preventDefault();
      if (viewerSave && blob) viewerSave.save({ filename: name, data: blob }).catch(() => {});
      else $(".sheet__note", sheet).textContent = "Press and hold the card to save it, then tag @iiitvadodara_ecell in your story.";
    });
    $("#cardShare").addEventListener("click", async () => { if (file) { try { await navigator.share({ files: [file], title: "My idea" }); } catch (e) {} } });
    sheet.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) close(); });
    addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }

  /* ---------- Shark Tank page: the pitch clock ---------- */
  const startBtn = $("#pcStart");
  if (startBtn) {
    const pc = { len: 90, left: 90, run: false, timer: 0 }, timeEl = $("#pcTime"), beats = $$("#pcBeats li"), bar = $(".pc__bar"), say = $("#pcSay");
    const C2 = bar ? +bar.getAttribute("data-c") : 0;
    function render() {
      const m = Math.floor(pc.left / 60), s = pc.left % 60;
      timeEl.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      timeEl.classList.toggle("warn", pc.left <= 10 && pc.left > 0);
      const nb = beats.length, idx = Math.min(nb - 1, Math.floor((pc.len - pc.left) / pc.len * nb));
      beats.forEach((b, i) => { b.classList.toggle("now", (pc.run || pc.left < pc.len) && pc.left > 0 && i === idx); b.classList.toggle("done", i < idx || pc.left === 0); });
      if (bar) bar.style.strokeDashoffset = (C2 * (1 - pc.left / pc.len)).toFixed(1);
      startBtn.textContent = pc.run ? "Pause" : (pc.left < pc.len && pc.left > 0 ? "Resume" : (pc.left === 0 ? "Again" : "Start"));
    }
    const pause = () => { pc.run = false; clearInterval(pc.timer); render(); };
    const start = () => { if (pc.left === 0) pc.left = pc.len; pc.run = true; render(); if (say) say.textContent = "Started."; clearInterval(pc.timer); pc.timer = setInterval(() => { pc.left--; if (pc.left <= 0) { pc.left = 0; pause(); if (say) say.textContent = "Time is up."; } render(); }, 1000); };
    const reset = () => { pause(); pc.left = pc.len; render(); };
    startBtn.addEventListener("click", () => (pc.run ? pause() : start()));
    $("#pcReset").addEventListener("click", reset);
    $$("[data-len]").forEach(b => b.addEventListener("click", () => { pc.len = +b.dataset.len; $$("[data-len]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); reset(); }));
    render();
  }

  onScroll();
})();
