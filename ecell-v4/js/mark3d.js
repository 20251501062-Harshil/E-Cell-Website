/* =====================================================================
   MARK 3D — the exact E-Cell mark as a glossy extruded object (WebGL).
   It lives inside its own box in the page (it scrolls like any element),
   renders only while on screen, and can be spun with a sideways swipe.
   ===================================================================== */
(function (root) {
  "use strict";
  const L = root.ECellLogo;

  function triangulate(pts) {
    const idx = pts.map((_, i) => i), tris = [];
    const area = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
    let sg = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; sg += a[0] * b[1] - b[0] * a[1]; }
    const ccw = sg > 0;
    const inTri = (p, a, b, c) => { const d1 = area(p, a, b), d2 = area(p, b, c), d3 = area(p, c, a); return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)); };
    let guard = 0;
    while (idx.length > 3 && guard++ < 600) {
      let cut = false;
      for (let k = 0; k < idx.length; k++) {
        const i0 = idx[(k + idx.length - 1) % idx.length], i1 = idx[k], i2 = idx[(k + 1) % idx.length], a = pts[i0], b = pts[i1], c = pts[i2], cr = area(a, b, c);
        if (ccw ? cr <= 1e-9 : cr >= -1e-9) continue;
        let ok = true; for (const j of idx) { if (j === i0 || j === i1 || j === i2) continue; if (inTri(pts[j], a, b, c)) { ok = false; break; } }
        if (!ok) continue; tris.push(ccw ? [i0, i1, i2] : [i0, i2, i1]); idx.splice(k, 1); cut = true; break;
      }
      if (!cut) break;
    }
    if (idx.length === 3) tris.push(ccw ? [idx[0], idx[1], idx[2]] : [idx[0], idx[2], idx[1]]);
    return { tris, ccw };
  }

  /** interleaved: x,y,z, nx,ny,nz, kind (0 front, 1 side, 2 back), part (0 shell, 1 bar) */
  function mesh(depth) {
    const out = [], h = depth / 2;
    const push = (x, y, z, n, kind, part) => out.push(x, y, z, n[0], n[1], n[2], kind, part);
    [["shell", 0], ["barTop", 1], ["barBottom", 1]].forEach(([name, part]) => {
      const poly = L.POLYS[name], { tris, ccw } = triangulate(poly);
      for (const t of tris) { for (const i of t) push(poly[i][0], poly[i][1], h, [0, 0, 1], 0, part); }
      for (const t of tris) { for (const i of [t[0], t[2], t[1]]) push(poly[i][0], poly[i][1], -h, [0, 0, -1], 2, part); }
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length], ex = b[0] - a[0], ey = b[1] - a[1], ln = Math.hypot(ex, ey) || 1;
        const n = ccw ? [ey / ln, -ex / ln, 0] : [-ey / ln, ex / ln, 0];
        push(a[0], a[1], -h, n, 1, part); push(b[0], b[1], -h, n, 1, part); push(b[0], b[1], h, n, 1, part);
        push(a[0], a[1], -h, n, 1, part); push(b[0], b[1], h, n, 1, part); push(a[0], a[1], h, n, 1, part);
      }
    });
    return new Float32Array(out);
  }

  const VS = `
    attribute vec3 aP; attribute vec3 aN; attribute float aK; attribute float aPart;
    uniform mat4 uProj, uView, uModel;
    varying vec3 vN; varying vec3 vW; varying vec2 vL; varying float vK; varying float vPart;
    void main(){
      vec4 w = uModel * vec4(aP, 1.0);
      vW = w.xyz; vN = mat3(uModel) * aN; vL = aP.xy; vK = aK; vPart = aPart;
      gl_Position = uProj * uView * w;
    }`;
  const FS = `
    precision highp float;
    varying vec3 vN; varying vec3 vW; varying vec2 vL; varying float vK; varying float vPart;
    uniform vec3 uEye; uniform float uSweep;
    void main(){
      vec3 n = normalize(vN), v = normalize(uEye - vW);
      vec3 l1 = normalize(vec3(-0.45, 0.65, 0.9)), l2 = normalize(vec3(0.8, -0.2, 0.5));
      // the official colours: the shell is a gradient, the bars are navy
      vec3 shell = vec3(5.3 + 2.9 * vL.x + 2.6 * vL.y, 59.0 + 24.9 * vL.x + 21.3 * vL.y, 167.2 + 57.8 * vL.x + 49.0 * vL.y) / 255.0;
      vec3 bar = vec3(3.6 - 1.5 * vL.x, 33.4 + 9.6 * vL.x + 9.0 * vL.y, 93.1 + 22.8 * vL.x + 21.2 * vL.y) / 255.0;
      vec3 base = vPart > 0.5 ? bar : shell;
      float d1 = max(dot(n, l1), 0.0), d2 = max(dot(n, l2), 0.0);
      vec3 col;
      if (vK < 0.5) {
        col = base * (0.86 + 0.18 * d1 + 0.06 * d2);
        // a soft sheen band that travels across the face
        float band = smoothstep(0.34, 0.0, abs(vL.x * 0.8 + vL.y * 0.55 - uSweep));
        col += vec3(0.55, 0.7, 1.0) * band * 0.28;
      } else if (vK < 1.5) {
        // polished sides: pale silver-blue, darker toward the back
        vec3 side = mix(vec3(0.80, 0.85, 0.95), vec3(0.97, 0.98, 1.0), d1);
        col = side * (0.72 + 0.3 * d1 + 0.1 * d2);
      } else {
        col = base * 0.5;
      }
      vec3 hv = normalize(l1 + v);
      float spec = pow(max(dot(n, hv), 0.0), vK < 0.5 ? 60.0 : 24.0);
      col += vec3(1.0) * spec * (vK < 0.5 ? 0.35 : 0.5);
      float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0);
      col += vec3(0.6, 0.75, 1.0) * rim * 0.12;
      gl_FragColor = vec4(col, 1.0);
    }`;

  const persp = (fov, a, n, f) => { const t = 1 / Math.tan(fov / 2), nf = 1 / (n - f); return new Float32Array([t / a, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0]); };
  function rotYX(ry, rx, s) {
    const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
    // M = Rx * Ry * S (column-major)
    return new Float32Array([cy * s, sx * sy * s, -cx * sy * s, 0, 0, cx * s, sx * s, 0, sy * s, -sx * cy * s, cx * cy * s, 0, 0, 0, 0, 1]);
  }

  root.ECellMark3D = function (canvas, opts) {
    opts = opts || {};
    const gl = canvas.getContext("webgl", { antialias: true, alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: false });
    if (!gl) return null;
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    const U = {}; ["uProj", "uView", "uModel", "uEye", "uSweep"].forEach(k => U[k] = gl.getUniformLocation(pr, k));
    const data = mesh(opts.depth || 0.3), buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const S = 32, at = (name, size, off) => { const l = gl.getAttribLocation(pr, name); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, size, gl.FLOAT, false, S, off); };
    at("aP", 3, 0); at("aN", 3, 12); at("aK", 1, 24); at("aPart", 1, 28);
    const count = data.length / 8;
    gl.enable(gl.DEPTH_TEST); // no culling: the bars are wound clockwise, the shell anticlockwise

    const st = { ry: -Math.PI * 1.6, rx: 0.5, vy: 0, tilt: 0, tiltT: 0, scale: 0.55, intro: 0, drag: null, visible: true, running: false, t: 0 };
    const dist = 6.2, eye = [0, 0, dist];
    let w = 1, h = 1;
    function resize() {
      const d = Math.min(devicePixelRatio || 1, 2), r = canvas.getBoundingClientRect();
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      canvas.width = Math.round(w * d); canvas.height = Math.round(h * d); gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize(); addEventListener("resize", resize, { passive: true });

    // a sideways swipe spins the mark; vertical swipes still scroll the page (touch-action: pan-y)
    canvas.addEventListener("pointerdown", (e) => { st.drag = { x: e.clientX, t: performance.now() }; });
    addEventListener("pointermove", (e) => {
      if (st.drag) { const dx = e.clientX - st.drag.x, now = performance.now(); st.drag.x = e.clientX; st.ry += dx * 0.012; st.vy = dx * 0.012 / Math.max(8, now - st.drag.t) * 16; st.drag.t = now; }
      else if (e.pointerType === "mouse") { const r = canvas.getBoundingClientRect(); st.tiltT = ((e.clientY - (r.top + r.height / 2)) / innerHeight) * 0.5; st.lookX = ((e.clientX - (r.left + r.width / 2)) / innerWidth) * 0.6; }
    }, { passive: true });
    const end = () => { st.drag = null; };
    addEventListener("pointerup", end); addEventListener("pointercancel", end);

    let last = 0, raf = 0;
    function frame(now) {
      raf = 0; if (!st.running) return;
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now; st.t += dt;
      // intro: a fast, decelerating spin into place
      if (st.intro < 1) { st.intro = Math.min(1, st.intro + dt / 1.8); const e = 1 - Math.pow(1 - st.intro, 4); st.ry = -Math.PI * 1.6 * (1 - e) + idle() * e; st.rx = 0.5 * (1 - e) + 0.1 * e; st.scale = 0.55 + 0.45 * e; }
      else if (!st.drag) {
        // inertia, then an easy return to a gentle idle sway
        st.ry += st.vy; st.vy *= 0.94;
        if (Math.abs(st.vy) < 0.002) { const target = idle() + (st.lookX || 0); let d = target - st.ry; d = Math.atan2(Math.sin(d), Math.cos(d)); st.ry += d * 0.035; }
        st.rx += ((0.1 + st.tiltT) - st.rx) * 0.06;
      }
      const sweep = ((st.t * 0.32) % 2.6) * 2 - 2.4;
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(U.uProj, false, persp(0.5, w / h, 0.1, 50));
      gl.uniformMatrix4fv(U.uView, false, new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -dist, 1]));
      gl.uniformMatrix4fv(U.uModel, false, rotYX(st.ry, st.rx, st.scale * (opts.scale || 1)));
      gl.uniform3fv(U.uEye, eye); gl.uniform1f(U.uSweep, sweep);
      gl.drawArrays(gl.TRIANGLES, 0, count);
      if (opts.onFrame) opts.onFrame(st);
      raf = requestAnimationFrame(frame);
    }
    const idle = () => Math.sin(st.t * 0.45) * 0.42;
    function start() { if (st.running || document.hidden) return; st.running = true; last = 0; raf = requestAnimationFrame(frame); }
    function stop() { st.running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
    // render only while on screen and while the tab is visible
    if ("IntersectionObserver" in root) new IntersectionObserver((es) => { st.visible = es[0].isIntersecting; st.visible ? start() : stop(); }).observe(canvas);
    document.addEventListener("visibilitychange", () => { document.hidden ? stop() : (st.visible && start()); });
    canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); stop(); if (opts.onLost) opts.onLost(); });
    return { start, stop, resize, state: st, replay() { st.intro = 0; st.vy = 0; start(); } };
  };
})(window);
