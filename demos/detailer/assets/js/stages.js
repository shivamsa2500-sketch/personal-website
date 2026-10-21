/* ==========================================================================
   Scroll story: ARRIVAL -> PURIFY -> CORRECT -> PROTECT -> REVEAL
   One sticky viewport. Scroll position `s` (in screen heights since the
   section reached the top) drives every layer. Only opacity and SVG
   transforms change per frame.
   Hooks: [data-stages] [data-stage-light] [data-stage-card] [data-fx] ...
   ========================================================================== */
import { $, $$, clamp, ramp, easeOut, reducedMotion, seeded, svgEl } from './ui.js';

// Stage boundaries in screen heights (section is 520svh, so s runs 0 -> 4.2)
const EDGES = [0.6, 1.5, 2.5, 3.4];
const CENTERS = [0, 1.05, 2, 2.95, 4];
const SPAN = 4.2;

// Approximate top edge of the body outline, for placing foam and beads
const TOP = [[64, 248], [168, 214], [405, 178], [548, 112], [630, 104], [705, 110], [868, 170], [944, 204]];
function topY(x) {
  for (let i = 0; i < TOP.length - 1; i++) {
    const [x0, y0] = TOP[i]; const [x1, y1] = TOP[i + 1];
    if (x >= x0 && x <= x1) return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  }
  return 250;
}
const nearArch = (x, y) => [238, 772].some((cx) => Math.hypot(x - cx, y - 292) < 86);

function generate(root) {
  const rnd = seeded(11);
  const foam = $('[data-gen="foam"]', root);
  if (foam) {
    let n = 0;
    while (n < 120) {
      const x = 70 + rnd() * 870;
      const t = topY(x);
      const depth = Math.pow(rnd(), 1.8) * (292 - t);
      const y = t + depth - 4;
      if (nearArch(x, y) || y > 290) continue;
      const r = 6 + (1 - depth / (292 - t)) * 14 * rnd() + rnd() * 5;
      foam.appendChild(svgEl('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: r.toFixed(1), fill: 'url(#g-bubble)' }));
      n++;
    }
    // drips running down the doors
    for (let i = 0; i < 14; i++) {
      const x = 120 + rnd() * 780; const t = topY(x) + 20;
      const len = 30 + rnd() * 50;
      if (t + len > 288) continue;
      foam.appendChild(svgEl('rect', { x: x.toFixed(1), y: t.toFixed(1), width: (3 + rnd() * 3).toFixed(1), height: len.toFixed(1), rx: 3, fill: '#fff', 'fill-opacity': '.55' }));
    }
  }
  const beads = $('[data-gen="beads"]', root);
  if (beads) {
    let n = 0;
    while (n < 110) {
      const x = 75 + rnd() * 865;
      const y = topY(x) + 3 + Math.pow(rnd(), 1.3) * 80;
      if (nearArch(x, y) || y > 288) continue;
      const r = 1.6 + rnd() * rnd() * 6;
      beads.appendChild(svgEl('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: r.toFixed(1), fill: 'url(#g-bead)' }));
      n++;
    }
  }
  const spray = $('[data-gen="spray"]', root);
  if (spray) {
    for (let i = 0; i < 26; i++) {
      const x = 90 + rnd() * 840; const t = topY(x) - 6;
      const top = 40 + rnd() * 50;
      spray.appendChild(svgEl('path', { d: `M${(x + 26).toFixed(1)} ${top.toFixed(1)}L${x.toFixed(1)} ${t.toFixed(1)}`, 'stroke-width': (1 + rnd() * 2).toFixed(1), 'stroke-opacity': (0.25 + rnd() * 0.5).toFixed(2), 'stroke-dasharray': `${(8 + rnd() * 18).toFixed(0)} ${(6 + rnd() * 12).toFixed(0)}` }));
    }
  }
  const sparks = $('[data-gen="sparks"]', root);
  if (sparks) {
    [[540, 92, 34], [300, 176, 22], [150, 200, 18], [690, 96, 20], [905, 182, 18], [430, 206, 14]].forEach(([x, y, s], i) => {
      const u = svgEl('use', { href: '#i-spark', x: x - s / 2, y: y - s / 2, width: s, height: s });
      u.dataset.cx = x; u.dataset.cy = y;
      sparks.appendChild(u);
    });
  }
}

export function initStages() {
  const root = $('[data-stages]');
  if (!root) return;
  generate(root);

  const fx = {};
  $$('[data-fx]', root).forEach((el) => { (fx[el.dataset.fx] ||= []).push(el); });
  const lights = $$('[data-stage-light]', root);
  const cards = $$('[data-stage-card]', root);
  const dots = $$('[data-stage-dot]', root);
  const bar = $('[data-stage-bar]', root);
  const spot = $('[data-stage-spot]', root);
  const mover = $('[data-car-move]', root);
  const wheels = $$('[data-wheel]', root);
  const polisher = $('[data-polisher]', root);
  const sweep = fx.sweep ? fx.sweep[0].firstElementChild : null;
  const sparkEls = $$('[data-gen="sparks"] use', root);
  const nums = $$('[data-stage-num]', root);

  const setFx = (name, v) => (fx[name] || []).forEach((el) => { el.style.opacity = v.toFixed(3); });

  let top = 0; let vh = 1; let span = SPAN; let active = -1; let ticking = false;

  const measure = () => {
    vh = window.innerHeight;
    top = root.getBoundingClientRect().top + window.scrollY;
    span = Math.max(1, (root.offsetHeight - vh) / vh);
  };

  const stageOf = (s) => EDGES.filter((e) => s >= e).length;

  function render() {
    ticking = false;
    // normalise so the story always spans 0 -> SPAN whatever the real viewport
    const raw = (window.scrollY - top) / vh;
    const s = raw < 0 ? raw : (raw * SPAN) / span;
    if (s < -1.2 || s > SPAN + 1) return;
    const rm = reducedMotion();
    const idx = stageOf(s);

    if (idx !== active) {
      active = idx;
      nums.forEach((n, i) => n.classList.toggle('is-active', i === idx));
      cards.forEach((c, i) => c.classList.toggle('is-active', i === idx));
      dots.forEach((d, i) => { d.classList.toggle('is-active', i === idx); d.classList.toggle('is-done', i < idx); if (i === idx) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current'); });
    }

    if (rm) {
      // Reduced motion: discrete states, nothing moves
      lights.forEach((l, i) => { l.style.opacity = i === idx ? 1 : 0; });
      setFx('dirt', idx === 0 ? 1 : 0);
      setFx('foam', idx === 1 ? 1 : 0);
      setFx('spray', 0);
      setFx('swirl', idx < 2 ? 1 : 0);
      setFx('polish', idx === 2 ? 1 : 0);
      setFx('sheen', idx === 3 ? 0.9 : idx === 4 ? 0.3 : 0);
      setFx('beads', idx === 3 ? 1 : 0);
      setFx('sweep', 0);
      setFx('sparks', idx === 4 ? 1 : 0);
      if (spot) spot.style.opacity = idx === 4 ? 1 : 0;
      if (polisher) polisher.setAttribute('transform', 'translate(520 200)');
      if (bar) bar.style.transform = `scaleX(${(idx + 1) / 5})`;
      mover.removeAttribute('transform');
      return;
    }

    // Lighting crossfade
    lights.forEach((l, i) => {
      const d = Math.abs(s - CENTERS[i]);
      let v = clamp(1 - d / 0.75);
      if (i === 4 && s > CENTERS[4]) v = 1;
      if (i === 0 && s < 0) v = 1;
      l.style.opacity = v.toFixed(3);
    });
    if (bar) bar.style.transform = `scaleX(${clamp(s / SPAN, 0.02, 1).toFixed(4)})`;

    // Arrival: car drives in from the right as the section scrolls into view
    const drive = easeOut(ramp(-0.85, 0.35, s));
    const x = (1 - drive) * 1150;
    const k = 1 + 0.045 * easeOut(ramp(3.4, 4.1, s));
    mover.setAttribute('transform', `translate(${(x + 505 * (1 - k)).toFixed(1)} ${(300 * (1 - k)).toFixed(1)}) scale(${k.toFixed(4)})`);
    const deg = (x / 60) * 57.3;
    wheels.forEach((w) => w.setAttribute('transform', `rotate(${deg.toFixed(1)})`));

    // Purify
    setFx('dirt', 1 - ramp(0.75, 1.3, s));
    setFx('foam', ramp(0.5, 0.8, s) * (1 - ramp(1.28, 1.5, s)));
    setFx('spray', ramp(0.95, 1.1, s) * (1 - ramp(1.35, 1.5, s)));

    // Correct: polisher light travels nose to tail, swirls disappear behind it
    const pp = ramp(1.55, 2.4, s);
    setFx('polish', ramp(1.5, 1.62, s) * (1 - ramp(2.32, 2.48, s)));
    setFx('swirl', 1 - ramp(1.6, 2.4, s));
    if (polisher) { const px = 120 + pp * 780; polisher.setAttribute('transform', `translate(${px.toFixed(1)} ${(topY(px) + 46).toFixed(1)})`); }

    // Protect
    setFx('sheen', ramp(2.5, 2.85, s) * (1 - 0.7 * ramp(3.4, 3.7, s)));
    setFx('beads', ramp(2.6, 2.9, s) * (1 - ramp(3.32, 3.55, s)));

    // Reveal
    setFx('sweep', ramp(3.35, 3.45, s) * (1 - ramp(4.05, 4.2, s)));
    if (sweep) sweep.setAttribute('transform', `translate(${(ramp(3.4, 4.05, s) * 1600).toFixed(1)} 0)`);
    const sp = ramp(3.55, 3.85, s);
    setFx('sparks', sp);
    sparkEls.forEach((u, i) => {
      const t = clamp(sp * 1.6 - i * 0.12); const { cx, cy } = u.dataset;
      u.setAttribute('transform', `translate(${cx} ${cy}) rotate(${(t * 90).toFixed(1)}) scale(${(0.2 + 0.8 * t).toFixed(3)}) translate(${-cx} ${-cy})`);
    });
    if (spot) spot.style.opacity = ramp(3.35, 3.7, s).toFixed(3);
  }

  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(render); } };
  measure();
  render();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { measure(); render(); });
  window.addEventListener('load', () => { measure(); render(); });
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', render);
}
