/* contours.js (GRAPHICS.md §4): deterministic altitude contours, no DOM.
   contours([1250,1450], 'cloudline-washed', {w:128, h:64}) -> { svg, path, d, rings:[{alt,x,y,in}], peak }

   Options: w, h, points, cx, cy, sx, sy, catMin, catMax, strokeWidth, peak,
     fit    'meet' (default): every ring stays inside the frame minus `inset`,
            so a hill is never cut by its frame. With an explicit cx/cy (a map
            pin) the rings shrink about that centre; otherwise the hill is
            scaled and moved into the box. svg uses preserveAspectRatio meet.
            'bleed' (or any 'slice' string): the old full-bleed texture look.
            An explicit sx >= 0.45 w or sy >= 0.45 h is read as a texture and
            defaults to 'bleed' (hero panel, PDP band, taste swatches).
     inset  fraction of w/h kept clear in 'meet' mode (default 0.12)
   Real contours never cross (A-05): the per-ring drift is clamped to
   0.4 x the ring step, the wobble phase moves 0.12 rad per ring and the
   total wobble is <= 8 % of the radius. `?debug` asserts it at 14 angles.

   altitudeProfile(target, {min, max, farmMin, farmMax, color, w, h, label})
     A side-section hill silhouette (1.5 px stroke) with the farm band shaded
     at 18 % and two tick labels on Paper plates. target = an <svg> element
     (filled in place and returned) or null (returns the markup string). */

const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const prng = a => () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const f = n => Math.round(n * 10) / 10, TAU = 6.283;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const DEBUG = typeof location !== 'undefined' && /[?&]debug\b/.test(location.search);

/* ring k+1 must lie inside ring k: cast 14 rays from ring k+1's centre */
function rayHit(P, ox, oy, a) {
  const dx = Math.cos(a), dy = Math.sin(a); let best = Infinity;
  for (let j = 0; j < P.length; j++) {
    const [x1, y1] = P[j], [x2, y2] = P[(j + 1) % P.length];
    const ex = x2 - x1, ey = y2 - y1, den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((x1 - ox) * ey - (y1 - oy) * ex) / den, u = ((x1 - ox) * dy - (y1 - oy) * dx) / den;
    if (t > 0 && u >= 0 && u <= 1) best = Math.min(best, t);
  }
  return best;
}
export function assertNested(dense, centres, slug = '') {
  for (let i = 0; i + 1 < dense.length; i++) {
    const [ox, oy] = centres[i + 1];
    for (let j = 0; j < 14; j++) {
      const a = (j / 14) * TAU;
      if (!(rayHit(dense[i + 1], ox, oy, a) < rayHit(dense[i], ox, oy, a))) {
        console.warn(`[contours] ${slug}: ring ${i + 1} crosses ring ${i} at ${Math.round((a * 180) / Math.PI)} deg`);
        return false;
      }
    }
  }
  return true;
}

export function contours(alt, slug, o = {}) {
  const [lo, hi] = Array.isArray(alt) ? alt : [alt, alt];
  const w = o.w ?? 160, h = o.h ?? 100, pts = o.points ?? 14;
  const n = clamp(Math.round((hi - lo) / 50) + 3, 3, 9);
  const t = clamp((hi - (o.catMin ?? 800)) / ((o.catMax ?? 2200) - (o.catMin ?? 800)), 0, 1);
  const r = prng(hash(slug));
  const cx = o.cx ?? w * (0.36 + 0.28 * r()), cy = o.cy ?? h * (0.4 + 0.2 * r());
  const sx = o.sx ?? w * (0.34 + 0.24 * t), sy = o.sy ?? h * (0.38 + 0.26 * t);
  const ph = [r(), r(), r()].map(v => v * TAU), amp = [0.04, 0.025, 0.015]; // sum 0.08: wobble <= 8 % of the radius
  const step = 0.86 / n;
  const da = r() * TAU, drift = 0.4 * Math.min(sx, sy) * step;
  const texture = (o.sx != null && o.sx >= 0.45 * w) || (o.sy != null && o.sy >= 0.45 * h);
  const fitOpt = String(o.fit ?? (texture ? 'bleed' : 'meet'));
  const meet = /meet/.test(fitOpt) && !/slice/.test(fitOpt);
  const inset = o.inset ?? 0.12;

  // 1. raw rings (points + centres); a dense copy for the ?debug assertion
  const rings = [], centres = [];
  for (let i = 0; i < n; i++) {
    const k = 1 - i * step, rough = 0.55 + 0.45 * k;
    const ox = cx + Math.cos(da) * drift * i, oy = cy + Math.sin(da) * drift * i;
    const ring = (count) => {
      const P = [];
      for (let j = 0; j < count; j++) {
        const a = (j / count) * TAU;
        let m = 1;
        for (let q = 0; q < 3; q++) m += amp[q] * rough * Math.sin((q + 2) * a + ph[q] + i * 0.12);
        P.push([ox + Math.cos(a) * sx * k * m, oy + Math.sin(a) * sy * k * m]);
      }
      return P;
    };
    rings.push({ P: ring(pts), D: (DEBUG || o.check) ? ring(72) : null });
    centres.push([ox, oy]);
  }

  // 2. fit: keep every ring inside the frame minus the inset
  let tx = (x) => x, ty = (y) => y;
  if (meet) {
    const all = rings.flatMap((g) => g.P);
    const bx0 = Math.min(...all.map((p) => p[0])), bx1 = Math.max(...all.map((p) => p[0]));
    const by0 = Math.min(...all.map((p) => p[1])), by1 = Math.max(...all.map((p) => p[1]));
    const L = w * inset, R = w * (1 - inset), T = h * inset, B = h * (1 - inset);
    if (o.cx != null || o.cy != null) { // anchored (map pin): shrink about the pin only
      const ratio = (lim, edge, c) => (Math.abs(edge - c) < 1e-6 ? 1 : (lim - c) / (edge - c));
      const s = clamp(Math.min(1, ratio(L, bx0, cx), ratio(R, bx1, cx), ratio(T, by0, cy), ratio(B, by1, cy)), 0.35, 1);
      tx = (x) => cx + (x - cx) * s; ty = (y) => cy + (y - cy) * s;
    } else {
      const s = Math.min(1, (R - L) / (bx1 - bx0), (B - T) / (by1 - by0));
      const mx = (bx0 + bx1) / 2, my = (by0 + by1) / 2;
      const hw = ((bx1 - bx0) * s) / 2, hh = ((by1 - by0) * s) / 2;
      const nx = clamp(mx, L + hw, R - hw), ny = clamp(my, T + hh, B - hh);
      tx = (x) => nx + (x - mx) * s; ty = (y) => ny + (y - my) * s;
    }
  }
  const map = (P) => P.map(([x, y]) => [tx(x), ty(y)]);

  // 3. paths
  let d = '', pk;
  const out = [];
  rings.forEach((g, i) => {
    const P = map(g.P);
    pk = [tx(centres[i][0]), ty(centres[i][1])];
    d += `M${f(P[0][0])} ${f(P[0][1])}`;
    for (let j = 0; j < pts; j++) { // closed Catmull-Rom -> cubic Bezier
      const p0 = P[(j - 1 + pts) % pts], p1 = P[j], p2 = P[(j + 1) % pts], p3 = P[(j + 2) % pts];
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
    }
    d += 'Z';
    const x = f(P[0][0]), y = f(P[0][1]);
    out.push({ alt: Math.round(lo + ((hi - lo) * i) / (n - 1)), x, y, in: x > 0 && x < w && y > 0 && y < h });
  });
  let nested;
  if (DEBUG || o.check) nested = assertNested(rings.map((g) => map(g.D)), centres.map(([x, y]) => [tx(x), ty(y)]), slug);

  const sw = o.strokeWidth ?? 1.25;
  const path = `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
  const peak = o.peak ? `<circle cx="${f(pk[0])}" cy="${f(pk[1])}" r="${sw * 1.6}" fill="currentColor"/>` : '';
  const par = meet ? 'xMidYMid meet' : (/slice/.test(fitOpt) ? fitOpt : 'xMidYMid slice');
  return {
    d, rings: out, path, nested, peak: { x: f(pk[0]), y: f(pk[1]) },
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="${par}" aria-hidden="true" focusable="false">${path}${peak}</svg>`,
  };
}

/* ---- altitude profile (A-05, contract with C-12) ----------------------------
   A designed side section: one hill silhouette from `min` to `max`, the farm
   band shaded at 18 %, two ticks (farmMax, farmMin) on Paper plates in a
   right-hand gutter, so labels never leave the viewBox at 320 px. Labels are
   live SVG text (rebrand- and translate-safe, not baked into an image). */
const fmtM = (m) => `${Math.round(m).toLocaleString('en-IN')} m`;
const escTxt = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
export function altitudeProfile(target, o = {}) {
  const farmMin = o.farmMin ?? 1200, farmMax = o.farmMax ?? farmMin;
  const max = o.max ?? Math.ceil((farmMax + 250) / 100) * 100;
  const min = o.min ?? Math.max(0, Math.floor((farmMin - 700) / 100) * 100);
  const W = o.w ?? 320, H = o.h ?? 200;
  const color = o.color ?? 'currentColor';
  const padT = 14, padB = 10, labW = 92;            // right gutter holds the tick plates
  const plotR = W - labW;
  const y = (m) => padT + (1 - (m - min) / (max - min || 1)) * (H - padT - padB);
  const at = (p) => y(min + (max - min) * p);       // height as a fraction of the range
  const base = H - padB, top = at(0.97), sx = plotR * 0.58;
  const hill = `M0 ${f(base)} C${f(plotR * 0.16)} ${f(base)} ${f(plotR * 0.2)} ${f(at(0.4))} ${f(plotR * 0.33)} ${f(at(0.5))}`
    + ` C${f(plotR * 0.43)} ${f(at(0.57))} ${f(sx - plotR * 0.1)} ${f(top)} ${f(sx)} ${f(top)}`
    + ` C${f(sx + plotR * 0.12)} ${f(top)} ${f(plotR * 0.8)} ${f(at(0.42))} ${f(plotR * 0.9)} ${f(at(0.18))}`
    + ` C${f(plotR * 0.95)} ${f(at(0.06))} ${f(plotR * 0.97)} ${f(base)} ${f(plotR)} ${f(base)}`;
  const y1 = y(farmMax), y0 = y(farmMin);
  const id = `ap-${hash(`${min}-${max}-${farmMin}-${farmMax}-${W}-${H}`).toString(36)}`;
  const plate = (yy, ly, label) => {
    const py = clamp(ly, 12, H - 12);
    return `<line x1="${f(plotR)}" x2="${f(plotR + 10)}" y1="${f(yy)}" y2="${f(py)}" stroke="${color}" stroke-width="1.5" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`
      + `<rect x="${f(plotR + 10)}" y="${f(py - 11)}" width="${labW - 12}" height="22" rx="11" style="fill:var(--paper,#F7F2E8);fill-opacity:.92;stroke:var(--muted,#6B5D50);stroke-width:1"/>`
      + `<text x="${f(plotR + 10 + (labW - 12) / 2)}" y="${f(py + 4.5)}" text-anchor="middle" style="font:600 13px/1 var(--font-body,system-ui,sans-serif);fill:var(--ink,#2A1F17)">${escTxt(label)}</text>`;
  };
  const same = farmMax - farmMin < 1;
  const gap = y0 - y1;
  const ticks = same ? plate(y1, y1, fmtM(farmMax))
    : plate(y1, gap < 26 ? (y1 + y0) / 2 - 13 : y1, fmtM(farmMax)) + plate(y0, gap < 26 ? (y1 + y0) / 2 + 13 : y0, fmtM(farmMin));
  const dash = (yy) => `<line x1="0" x2="${f(plotR)}" y1="${f(yy)}" y2="${f(yy)}" stroke="${color}" stroke-opacity=".55" stroke-width="1" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/>`;
  const inner = `<defs><clipPath id="${id}"><path d="${hill}Z"/></clipPath></defs>`
    + `<rect x="0" y="${f(y1)}" width="${f(plotR)}" height="${f(Math.max(3, gap))}" clip-path="url(#${id})" style="fill:${color};fill-opacity:.18"/>`
    + dash(y1) + (same ? '' : dash(y0))
    + `<path d="${hill}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`
    + `<line x1="0" x2="${f(plotR)}" y1="${f(base)}" y2="${f(base)}" stroke="${color}" stroke-width="1.5" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`
    + ticks;
  const a11y = o.label ? `role="img" aria-label="${escTxt(o.label)}"` : 'aria-hidden="true"';
  if (target && typeof target === 'object' && 'innerHTML' in target) {
    target.setAttribute('viewBox', `0 0 ${W} ${H}`);
    target.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    target.setAttribute('focusable', 'false');
    if (o.label) { target.setAttribute('role', 'img'); target.setAttribute('aria-label', o.label); } else target.setAttribute('aria-hidden', 'true');
    target.innerHTML = inner;
    return target;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" class="alt-profile" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" ${a11y} focusable="false">${inner}</svg>`;
}
export default contours;
