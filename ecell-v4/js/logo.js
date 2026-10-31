/* =====================================================================
   E-CELL IIIT VADODARA — EXACT LOGO GEOMETRY
   Traced from the official PNG (99.3% pixel IoU). Coordinates are
   normalised: bounding box centred on the origin, height 2, y up.
   Pieces: shell (the open hexagon "C") and two bars (the "E").
   ===================================================================== */
(function (root) {
  "use strict";
  const POLYS = {
    shell: [[0.83762,0.49498],[-0.00334,1.0],[-0.83762,0.49721],[-0.83762,-0.50166],[-0.00334,-1.0],[0.83762,-0.49281],[0.58845,-0.36155],[-0.00334,-0.71746],[-0.59062,-0.36377],[-0.59062,0.36812],[-0.00116,0.71746],[0.58845,0.36372]],
    barTop: [[-0.33265,0.21689],[0.03226,0.43269],[0.27693,0.29475],[-0.33048,-0.07011]],
    barBottom: [[-0.33048,-0.38157],[0.20574,-0.06121],[0.44829,-0.19252],[-0.08348,-0.51506]]
  };
  // The shell split at the middle of its spine: four pieces of the mark.
  const yMid = 0;
  const PIECES = {
    shellUpper: [[0.83762,0.49498],[-0.00334,1.0],[-0.83762,0.49721],[-0.83762,yMid],[-0.59062,yMid],[-0.59062,0.36812],[-0.00116,0.71746],[0.58845,0.36372]],
    shellLower: [[-0.83762,yMid],[-0.83762,-0.50166],[-0.00334,-1.0],[0.83762,-0.49281],[0.58845,-0.36155],[-0.00334,-0.71746],[-0.59062,-0.36377],[-0.59062,yMid]],
    barTop: POLYS.barTop,
    barBottom: POLYS.barBottom
  };
  const ASPECT = 0.83762 * 2 / 2; // width / height of the mark

  /** Official colour at a point (0..255 rgb). Shell is a gradient; bars are navy. */
  function colourAt(x, y, piece) {
    if (piece === "barTop" || piece === "barBottom") return [3.6 - 1.5 * x, 33.4 + 9.6 * x + 9 * y, 93.1 + 22.8 * x + 21.2 * y];
    return [5.3 + 2.9 * x + 2.6 * y, 59 + 24.9 * x + 21.3 * y, 167.2 + 57.8 * x + 49 * y];
  }

  function area(poly) { let a = 0; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) a += (poly[j][0] + poly[i][0]) * (poly[j][1] - poly[i][1]); return Math.abs(a / 2); }
  function inside(poly, x, y) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c;
    }
    return c;
  }
  function bbox(poly) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of poly) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return [x0, y0, x1, y1]; }

  /** Deterministic PRNG so shapes are identical on every load. */
  function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e9) / 1e9; }; }

  /**
   * Sample n points uniformly over the given pieces (area-weighted).
   * Returns { pos: Float32Array(n*3), col: Float32Array(n*3) in 0..1, piece: Uint8Array(n) }.
   * depth: half-thickness for a 3D extrusion (z in [-depth, depth]).
   */
  function sample(n, opts) {
    opts = opts || {};
    const set = opts.pieces || PIECES;
    const names = Object.keys(set), polys = names.map(k => set[k]);
    const areas = polys.map(area), total = areas.reduce((a, b) => a + b, 0);
    const r = rng(opts.seed || 7), depth = opts.depth || 0, edgeBias = opts.edgeBias || 0;
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), piece = new Uint8Array(n);
    let k = 0;
    names.forEach((name, pi) => {
      const count = pi === names.length - 1 ? n - k : Math.round(n * areas[pi] / total);
      const poly = polys[pi], [x0, y0, x1, y1] = bbox(poly);
      for (let c = 0; c < count && k < n; ) {
        const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0);
        if (!inside(poly, x, y)) continue;
        // optional bias: keep a share of points on the outline so edges read crisply
        let px = x, py = y;
        if (edgeBias && r() < edgeBias) {
          const i = Math.floor(r() * poly.length), a = poly[i], b = poly[(i + 1) % poly.length], t = r();
          px = a[0] + (b[0] - a[0]) * t; py = a[1] + (b[1] - a[1]) * t;
        }
        const rgb = colourAt(px, py, name.startsWith("bar") ? name : "shell");
        pos[k * 3] = px; pos[k * 3 + 1] = py; pos[k * 3 + 2] = depth ? (r() * 2 - 1) * depth : 0;
        col[k * 3] = rgb[0] / 255; col[k * 3 + 1] = rgb[1] / 255; col[k * 3 + 2] = rgb[2] / 255;
        piece[k] = pi; k++; c++;
      }
    });
    return { pos, col, piece, names };
  }

  /** Inline SVG of the exact mark. */
  function svg(opts) {
    opts = opts || {};
    const id = "lg" + Math.floor(Math.random() * 1e6);
    const pts = p => p.map(([x, y]) => `${(x * 100).toFixed(2)},${(-y * 100).toFixed(2)}`).join(" ");
    const mono = opts.mono;
    return `<svg viewBox="-84 -100 168 200" ${opts.attrs || ""} aria-hidden="true" focusable="false">` +
      (mono ? "" : `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="-84" y1="100" x2="84" y2="-100"><stop offset="0" stop-color="#03246D"/><stop offset=".55" stop-color="#0638A6"/><stop offset="1" stop-color="#0B5CE6"/></linearGradient></defs>`) +
      `<polygon points="${pts(POLYS.shell)}" fill="${mono || `url(#${id})`}"/>` +
      `<polygon points="${pts(POLYS.barTop)}" fill="${mono || "#03225F"}"/>` +
      `<polygon points="${pts(POLYS.barBottom)}" fill="${mono || "#031F58"}"/></svg>`;
  }

  root.ECellLogo = { POLYS, PIECES, ASPECT, colourAt, sample, svg, inside, area, rng };
})(window);
