/* =====================================================================
   IDEA CARD — a 1080x1920 story card: the exact mark, the visitor's idea
   in dots, the handle. ECellCard.render() returns the canvas;
   ECellCard() returns a PNG data URL. No network needed.
   ===================================================================== */
(function (root) {
  "use strict";
  /** Balanced line breaks: the split whose widest line is narrowest (up to three lines). */
  function wrap(str, maxLines, font) {
    const words = String(str).trim().split(/\s+/).filter(Boolean);
    if (words.length <= 1) return [words.join(" ")];
    const ctx = document.createElement("canvas").getContext("2d"); ctx.font = font;
    const w = (s) => ctx.measureText(s).width; let best = [words.join(" ")], score = w(best[0]);
    const tryL = (ls) => { const m = Math.max(...ls.map(w)); if (m < score - 0.5) { score = m; best = ls; } };
    for (let i = 1; i < words.length; i++) {
      tryL([words.slice(0, i).join(" "), words.slice(i).join(" ")]);
      if (maxLines >= 3) for (let j = i + 1; j < words.length; j++) tryL([words.slice(0, i).join(" "), words.slice(i, j).join(" "), words.slice(j).join(" ")]);
    }
    return best;
  }
  function render(idea, opts) {
    opts = opts || {};
    const L = root.ECellLogo, C = root.ECELL || {}, W = 1080, H = 1920;
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, W, H);
    // the exact mark, drawn from the traced polygons with the official gradient (same as the SVG logo)
    const mh = 500, cx = W / 2, cy = 520, s = mh / 2;
    const P = (poly) => { ctx.beginPath(); poly.forEach(([x, y], i) => { const X = cx + x * s, Y = cy - y * s; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.closePath(); };
    const g = ctx.createLinearGradient(cx - 0.84 * s, cy + s, cx + 0.84 * s, cy - s);
    g.addColorStop(0, "#03246D"); g.addColorStop(0.55, "#0638A6"); g.addColorStop(1, "#0B5CE6");
    P(L.POLYS.shell); ctx.fillStyle = g; ctx.fill();
    P(L.POLYS.barTop); ctx.fillStyle = "#03225F"; ctx.fill();
    P(L.POLYS.barBottom); ctx.fillStyle = "#031F58"; ctx.fill();
    // the idea, rasterised then re-drawn as dots in the logo's colours
    const font = '800 150px "Montserrat", "Archivo", system-ui, sans-serif';
    const lines = wrap(idea, 3, font);
    const TH = 600, tmp = document.createElement("canvas"); tmp.width = W; tmp.height = TH; const t = tmp.getContext("2d", { willReadFrequently: true });
    let size = 150; t.font = font.replace("150px", size + "px");
    while (size > 54 && Math.max(...lines.map(l => t.measureText(l).width)) > W - 160) { size -= 6; t.font = font.replace("150px", size + "px"); }
    t.fillStyle = "#000"; t.textAlign = "center"; t.textBaseline = "middle";
    const lh = size * 1.08, y0 = TH / 2 - (lines.length - 1) * lh / 2, room = W - 160;
    // a long single word that still does not fit at the smallest size is squeezed horizontally
    lines.forEach((l, i) => { const w = t.measureText(l).width, k = w > room ? room / w : 1; t.save(); t.translate(W / 2, y0 + i * lh); t.scale(k, 1); t.fillText(l, 0, 0); t.restore(); });
    const d = t.getImageData(0, 0, W, TH).data, top = 960, step = Math.max(5, Math.round(size / 22));
    for (let y = 0; y < TH; y += step) for (let x = 0; x < W; x += step) {
      if (d[(y * W + x) * 4 + 3] > 120) {
        const k = x / W; ctx.fillStyle = `rgb(${Math.round(3 + 6 * k)},${Math.round(34 + 55 * k)},${Math.round(95 + 133 * k)})`;
        ctx.beginPath(); ctx.arc(x, top + y, step * 0.42, 0, 6.283); ctx.fill();
      }
    }
    // labels
    ctx.textAlign = "center";
    ctx.fillStyle = "#0959E4"; ctx.font = '600 34px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillText("MY IDEA", W / 2, 900);
    ctx.fillStyle = "rgba(4,34,94,.75)"; ctx.font = '500 40px "Archivo", system-ui, sans-serif';
    ctx.fillText("Where student ideas become startups.", W / 2, 1640);
    if (opts.finaleLine) { ctx.fillStyle = "#0959E4"; ctx.font = '600 30px "JetBrains Mono", ui-monospace, monospace'; ctx.fillText(opts.finaleLine.toUpperCase(), W / 2, 1712); }
    ctx.fillStyle = "#04225E"; ctx.font = '800 46px "Montserrat", "Archivo", system-ui, sans-serif';
    ctx.fillText("E-Cell IIIT Vadodara", W / 2, 1796);
    ctx.font = '500 34px "JetBrains Mono", ui-monospace, monospace'; ctx.fillStyle = "rgba(4,34,94,.7)";
    ctx.fillText(C.instagramHandle || "@iiitvadodara_ecell", W / 2, 1850);
    return cv;
  }
  root.ECellCard = function (idea, opts) { return render(idea, opts).toDataURL("image/png"); };
  root.ECellCard.render = render;
})(window);
