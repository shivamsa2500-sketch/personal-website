/* pages/about.js: About (DESIGN §8.7). Static copy lives in about.html; this
   keeps the [DEMO] stats in step with the data ("4 cities with a café"
   matches brand.cafes, "12 coffees" matches the catalogue), draws the hero's
   contour hills and the team monogram wells with contours() (D-07), and
   opens the folded photo credits when someone lands on #credits. */
import { registerPage, brand } from '../main.js';
import { PRODUCTS } from '../../../data/products.js';
import { contours } from '../contours.js';

function heroTopo() {
  const host = document.querySelector('[data-about-topo]');
  if (!host) return;
  const W = 1440, H = 620;
  const hills = [
    { alt: [950, 1500], slug: 'about-west', cx: W * 0.2, cy: H * 0.62, sx: 420, sy: 260 },
    { alt: [1100, 1400], slug: 'about-mid', cx: W * 0.58, cy: H * 0.4, sx: 360, sy: 220 },
    { alt: [1000, 1250], slug: 'about-east', cx: W * 0.9, cy: H * 0.72, sx: 300, sy: 200 },
  ];
  const paths = hills.map((h) => contours(h.alt, h.slug, { w: W, h: H, cx: h.cx, cy: h.cy, sx: h.sx, sy: h.sy, strokeWidth: 1.5, fit: 'bleed' }).path).join('');
  host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${paths}</svg>`;
}

function monograms() {
  for (const el of document.querySelectorAll('[data-mono]')) {
    const topo = el.querySelector('.person__topo');
    if (topo) topo.innerHTML = contours([1000, 1400], `team-${el.dataset.mono}`, { w: 160, h: 160, strokeWidth: 1.25, fit: 'bleed', sx: 110, sy: 96 }).svg;
  }
}

function credits() {
  const d = document.querySelector('[data-credits]');
  if (!d) return;
  const open = () => { if (location.hash === '#credits') { d.open = true; } };
  open();
  addEventListener('hashchange', open);
}

registerPage('about', () => {
  const set = (key, v) => { const el = document.querySelector(`[data-stat="${key}"]`); if (el && v) el.textContent = String(v); };
  set('cities', new Set((brand.cafes ?? []).map((c) => c.city)).size);
  set('coffees', PRODUCTS.length);
  for (const fn of [heroTopo, monograms, credits]) { try { fn(); } catch (err) { console.error('[about]', err); } }
});
