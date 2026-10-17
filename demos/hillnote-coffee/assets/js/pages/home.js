/* pages/home.js: Home (DESIGN §8.1). Static copy lives in index.html; this
   module renders the data-driven parts: hero bags, bestsellers, taste-tile
   swatches, the farm map and the cafés teaser line.
   Every part renders on its own (one failure never blanks the rest), copes
   with a catalogue of 1 or 2 coffees, and everything below the fold renders
   when it comes within a screen of the viewport (one IntersectionObserver). */
import { registerPage, brand, format } from '../main.js';
import { PRODUCTS, getProduct } from '../../../data/products.js';
import { renderProductList } from '../components/product-card.js';
import { bagHTML } from '../components/bag.js';
import { esc } from '../components/ui.js';
import { contours } from '../contours.js';
import { refreshGlass } from '../glass.js';
import { placeLabels, applyLabels } from './cafes.js';
import { BOX_SOUTH, project, outlineSVG } from '../map-india.js';

const $ = (s, r = document) => r.querySelector(s);
const featured = () => [...PRODUCTS].filter((p) => p.inStock !== false).sort((a, b) => (a.featured ?? 99) - (b.featured ?? 99));

const listNames = (a) => (a.length > 1 ? `${a.slice(0, -1).join(', ')} and ${a.at(-1)}` : a[0] ?? '');

function heroBags() {
  const host = $('[data-hero-bags]');
  if (!host) return;
  let trio = (brand.heroBags ?? []).map(getProduct).filter(Boolean);
  if (trio.length < 3) trio = [...new Set([...trio, ...featured()])].slice(0, 3);
  const panel = host.closest('.hero__panel');
  if (!trio.length) { panel?.setAttribute('hidden', ''); return; }
  // 3 bags fan out l/m/r; 2 sit l/r of centre; 1 stands in the middle
  const slots = [['m'], ['l2', 'r2'], ['l', 'm', 'r']][trio.length - 1];
  const n = ['One', 'Two', 'Three'][trio.length - 1];
  host.setAttribute('aria-label', `${n} ${brand.shortName} coffee ${trio.length === 1 ? 'bag' : 'bags'}: ${listNames(trio.map((p) => p.name))}`);
  host.dataset.count = String(trio.length);
  host.innerHTML = trio.map((p, i) => bagHTML(p, { decorative: true, cls: `hero__bag hero__bag--${slots[i]}` })).join('');
  // the panel's glass zone: contour lines of the middle (or first) bag's origin, 18 %
  const mid = trio[Math.floor(trio.length / 2)] ?? trio[0];
  const topo = $('[data-hero-topo]');
  if (topo && mid.origin?.altitudeM) {
    if (mid.image?.bagColor) panel.style.setProperty('--bag', mid.image.bagColor);
    topo.innerHTML = contours(mid.origin.altitudeM, `${mid.slug}-hero`, { w: 640, h: 560, strokeWidth: 1.5, sx: 300, sy: 250 }).svg;
  }
}

/* desktop hero tray: one scrolling row; the right-edge fade drops once the
   last chip is in view */
function chipTray() {
  const row = $('.hero__finder .chip-tray__scroller');
  if (!row) return;
  const update = () => { row.dataset.end = String(row.scrollLeft + row.clientWidth >= row.scrollWidth - 4); };
  row.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(update).observe(row);
  update();
}

function bestsellers() {
  const host = $('[data-bestsellers]');
  if (!host) return;
  const list = (brand.bestsellers ?? []).map(getProduct).filter(Boolean);
  const items = list.length ? list : PRODUCTS.filter((p) => p.badges?.includes('bestseller')).slice(0, 4);
  if (!items.length) { host.closest('section')?.setAttribute('hidden', ''); return; }
  host.dataset.count = String(items.length);
  host.innerHTML = renderProductList(items, { heading: 'h3', label: 'Bestsellers', badge: false });
  requestAnimationFrame(refreshGlass);
}

function tasteTiles() {
  for (const tile of document.querySelectorAll('[data-family]')) {
    const fam = tile.dataset.family;
    const p = featured().find((x) => x.noteFamilies?.[0] === fam) ?? featured().find((x) => x.noteFamilies?.includes(fam));
    if (!p) continue;
    if (p.image?.bagColor) tile.style.setProperty('--bag', p.image.bagColor);
    const sw = tile.querySelector('.taste-tile__swatch');
    if (sw && p.origin?.altitudeM) sw.innerHTML = contours(p.origin.altitudeM, `${fam}-swatch`, { w: 360, h: 96, sx: 220, sy: 120 }).svg;
  }
}

function farmMap() {
  const host = $('[data-farm-map]');
  if (!host) return;
  // the South Indian growing regions named in COPY §2.7 (the map's pins),
  // positioned from each region's first single-origin mapPin in the catalogue
  const NAMES = (host.dataset.regions ?? '').split('|').filter(Boolean);
  const W = 400, H = 440;
  const regions = NAMES.map((n) => PRODUCTS.find((p) => p.type !== 'blend' && p.origin?.region === n && p.origin.mapPin)).filter(Boolean);
  // R2-3: pins with lat/lng are projected onto the South India outline; the rest keep their x/y %
  const geo = regions.every((p) => p.origin.mapPin.lat != null && p.origin.mapPin.lng != null);
  const pos = regions.map((p) => (geo ? project(p.origin.mapPin.lat, p.origin.mapPin.lng, BOX_SOUTH) : p.origin.mapPin));
  const paths = regions.map((p, i) => contours(p.origin.altitudeM, `${p.slug}-map`, {
    w: W, h: H, cx: (pos[i].x / 100) * W, cy: (pos[i].y / 100) * H, sx: 22, sy: 20, strokeWidth: 1.25, // small enough that neighbouring hills never touch
  }).path).join('');
  host.innerHTML = `${geo ? outlineSVG(BOX_SOUTH) : ''}<svg class="farm__terrain" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">${paths}</svg>
    ${pos.map((q) => `<span class="farm__pin" style="left:${q.x}%;top:${q.y}%"><span class="farm__dot"></span></span>`).join('')}
    ${regions.map(() => '<span class="map-lead farm__lead" hidden></span>').join('')}
    ${regions.map((p) => `<span class="map-label farm__pin-label">${esc(p.origin.region.split(',')[0])}</span>`).join('')}
    <span class="farm__map-tag" aria-hidden="true">Map (illustrative)</span>`;
  // labels on Paper plates, placed so none touches another label or pin
  const labels = [...host.querySelectorAll('.farm__pin-label')], leads = [...host.querySelectorAll('.farm__lead')];
  const tag = host.querySelector('.farm__map-tag');
  // optional art direction: data-label-sides="Region, State:r|Other, State:bl"
  const prefer = Object.fromEntries((host.dataset.labelSides ?? '').split('|').filter(Boolean).map((x) => { const i = x.lastIndexOf(':'); return [x.slice(0, i), x.slice(i + 1)]; }));
  const layout = () => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    const hb = host.getBoundingClientRect(), tb = tag.getBoundingClientRect();
    const pts = regions.map((p, i) => ({ x: (pos[i].x / 100) * w, y: (pos[i].y / 100) * h, w: labels[i].offsetWidth, h: labels[i].offsetHeight, prefer: prefer[p.origin.region] }));
    applyLabels(placeLabels(pts, { W: w, H: h, dot: 9, avoid: [[tb.left - hb.left, tb.top - hb.top, tb.right - hb.left, tb.bottom - hb.top]] }), labels, leads);
  };
  layout();
  if ('ResizeObserver' in window) new ResizeObserver(() => requestAnimationFrame(layout)).observe(host);
  const alts = regions.flatMap((p) => p.origin.altitudeM);
  const cap = $('[data-farm-alt]');
  if (cap && alts.length) cap.textContent = `Altitude range: ${format.formatAltitude([Math.min(...alts), Math.max(...alts)])}`;
}

function cafes() {
  const list = brand.cafes ?? [];
  const counts = new Map();
  for (const c of list) counts.set(c.city, (counts.get(c.city) ?? 0) + 1);
  const cities = [...counts.keys()];
  const line = $('[data-cafes-line]');
  if (line && list.length) line.textContent = `${list.length} ${list.length === 1 ? 'café' : 'cafés'} in ${listNames(cities)}. Every one has a brew bar, beans to take home, and someone happy to talk you through a grind.`;
  const ul = $('[data-cafes-cities]');
  if (ul) ul.innerHTML = [...counts].map(([c, n]) => `<li>${esc(c)}${n > 1 ? ` (${n})` : ''}</li>`).join('');
}

function reviewsCarousel() {
  const row = $('[data-reviews]');
  const prev = $('[data-reviews-prev]'), next = $('[data-reviews-next]'), pos = $('[data-reviews-pos]');
  if (!row || !prev) return;
  const items = [...row.children];
  const index = () => Math.round(row.scrollLeft / (items[1]?.offsetLeft - items[0]?.offsetLeft || row.clientWidth));
  const update = () => {
    const i = Math.min(items.length - 1, Math.max(0, index()));
    pos.textContent = `${i + 1} of ${items.length}`;
    prev.setAttribute('aria-disabled', String(i === 0));
    next.setAttribute('aria-disabled', String(i === items.length - 1));
  };
  const go = (d) => {
    const i = Math.min(items.length - 1, Math.max(0, index() + d));
    row.scrollTo({ left: items[i].offsetLeft - items[0].offsetLeft, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  row.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  update();
}

/* run each part on its own; below-the-fold parts wait until they are within
   one screen of the viewport */
const safely = (name, fn) => { try { fn(); } catch (err) { console.error(`[home:${name}]`, err); } };
function whenNear(map) {
  const entries = Object.entries(map).map(([sel, [name, fn]]) => [$(sel), name, fn]).filter(([el]) => el);
  if (!('IntersectionObserver' in window)) { for (const [, name, fn] of entries) safely(name, fn); return; }
  const io = new IntersectionObserver((list) => {
    for (const e of list) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      const hit = entries.find(([el]) => el === e.target);
      if (hit) { safely(hit[1], hit[2]); requestAnimationFrame(refreshGlass); }
    }
  }, { rootMargin: '100% 0px' });
  for (const [el] of entries) io.observe(el);
}

registerPage('home', () => {
  safely('hero', heroBags);
  safely('tray', chipTray);
  safely('cafes', cafes);
  whenNear({
    '[data-bestsellers]': ['bestsellers', bestsellers],
    '.taste__tiles': ['taste', tasteTiles],
    '[data-farm-map]': ['farm', farmMap],
    '[data-reviews]': ['reviews', reviewsCarousel],
  });
  requestAnimationFrame(refreshGlass);
});
