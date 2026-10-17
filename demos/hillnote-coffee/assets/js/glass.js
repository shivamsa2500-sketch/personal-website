/* glass.js: the lens-alignment helper and the dark-zone observer
   (DESIGN.md §2.3, §2.7). Imported by main.js; no visual decisions here.

   Field geometry (reconciles DESIGN §2.3 with GRAPHICS §6.3)
   - The page field is Graphics' seamless 1200 px tile (`#field-tile`, inlined
     into the page sprite by shell.js). shell.js also defines `<symbol id="field">`
     (a 2 × 3 grid of the tile, 2400 × 3600) and `<filter id="lensBlur">`
     (σ 1.5), so the DESIGN markup `<use href="#field" filter="url(#lensBlur)"/>`
     works unchanged in every browser, Safari included (same-document refs only).
   - Because the tile is periodic, offsets are written modulo 1200:
       --fx/--fy  = −(page offset of the object's padding box mod 1200)  [px]
       --lw/--lh  = the object's padding-box size                       [px]
       --field-w/--field-h on :root = the symbol size (2400 × 3600)
     glass.css's transform maths is unchanged by the modulo.
   - Fixed chrome (.lens--fixed): --fy is the viewport offset mod 1200 and
     --fy-scroll carries −(scrollY mod 1200). Where scroll-driven animations
     exist, components.css runs `lens-follow-tile` (0 → −1200 px) for
     --lens-iter = scrollMax / 1200 iterations on the root scroll timeline,
     which is exactly −(scrollY mod 1200) with no JS per frame. Otherwise a
     passive, rAF-throttled listener writes --fy-scroll on the fixed object.
     Under reduced motion it only re-aligns on `scrollend`.

   API
     initGlass()           once, from main.js boot (idempotent)
     refreshGlass()        re-measure every lens now (call after you inject
                           or move glass objects; a ResizeObserver on <body>
                           already catches most layout changes)
     alignLens(el)         measure one glass object

   Variants (attributes on the glass object, i.e. the lens' parent)
     data-sticky-lens      a position:sticky object (guide recipe card, PDP buy
                           slab on desktop). Its page offset changes while it is
                           stuck, so it is re-measured on scroll (rAF-throttled,
                           plus scrollend). The capsule
                           (.lens--fixed in a sticky .site-header) keeps its
                           CSS scroll-follow path and needs no attribute.
     data-lens-band="sel"  the lens shows a flood band's own contours instead of
                           the page field (DESIGN §7.12, PDP buy slab). Markup:
                           <span class="lens lens--band"><svg viewBox=… same as
                           the band's contour svg …></svg></span>. Offsets are
                           measured against the band element (no modulo) and
                           --field-w/--field-h are set on the object to the
                           band's size, so glass.css' transform maths is reused.
*/

const TILE = 1200;
const FIELD_W = TILE * 2;
const FIELD_H = TILE * 3;
const root = document.documentElement;
const mod = (n) => ((n % TILE) + TILE) % TILE;
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasScrollTimeline = () => typeof CSS !== 'undefined' && CSS.supports?.('animation-timeline: scroll()');

let started = false;
let fixedObjects = [];
let stickyObjects = [];
let darkWatchers = [];

/** Measure one glass object (the parent of a `.lens`). */
export function alignLens(el) {
  const lens = el.querySelector(':scope > .lens');
  if (!lens || !el.isConnected) return;
  const r = el.getBoundingClientRect();
  if (!r.width && !r.height) return; // hidden (closed dialog, display:none)
  const s = el.style;
  // band lens: the field is the band's own contour svg, in band coordinates
  const bandSel = el.dataset.lensBand;
  const band = bandSel && document.querySelector(bandSel);
  if (band) {
    const b = band.getBoundingClientRect();
    s.setProperty('--fx', `${-(r.left + el.clientLeft - b.left)}px`);
    s.setProperty('--fy', `${-(r.top + el.clientTop - b.top)}px`);
    s.setProperty('--field-w', `${b.width}px`);
    s.setProperty('--field-h', `${b.height}px`);
    s.setProperty('--lw', `${el.clientWidth}px`);
    s.setProperty('--lh', `${el.clientHeight}px`);
    return;
  }
  const fixed = lens.classList.contains('lens--fixed') || el.matches('dialog, [popover]');
  const x = r.left + el.clientLeft + (fixed ? 0 : scrollX);
  let y = r.top + el.clientTop + (fixed ? 0 : scrollY);
  // sticky capsule: align for its stuck position (where it spends its life)
  const header = fixed && el.closest('.site-header');
  if (header) {
    const top = parseFloat(getComputedStyle(header).top);
    if (!Number.isNaN(top)) y = top + (r.top - header.getBoundingClientRect().top) + el.clientTop;
  }
  s.setProperty('--fx', `${-mod(x)}px`);
  s.setProperty('--fy', `${-mod(y + (fixed && !lens.classList.contains('lens--fixed') ? scrollY : 0))}px`);
  s.setProperty('--lw', `${el.clientWidth}px`);
  s.setProperty('--lh', `${el.clientHeight}px`);
}

function measureRoot() {
  const max = Math.max(0, root.scrollHeight - innerHeight);
  root.style.setProperty('--field-w', `${FIELD_W}px`);
  root.style.setProperty('--field-h', `${FIELD_H}px`);
  root.style.setProperty('--scroll-max', `${max}px`);
  root.style.setProperty('--lens-iter', String(Math.max(max / TILE, 0.0001)));
}

/* ---- lane tint (A-02, contract with B-01 / C-17) ----------------------------
   shell.js puts .lane-tint inside the fixed, masked capsule lane; checkout has
   it statically. Hoist it to a direct child of <body> (so it scrolls with the
   page and is not clipped by the lane's 16 px feather) and start it at the
   announcement bar's bottom edge, in page coordinates. */
function placeLaneTint() {
  const tints = document.querySelectorAll('.lane-tint');
  if (!tints.length) return;
  const ann = document.querySelector('.announce');
  const r = ann && ann.getClientRects().length ? ann.getBoundingClientRect() : null;
  const top = r ? Math.max(0, Math.round(r.bottom + scrollY)) : 0;
  tints.forEach((t, i) => {
    if (i > 0) { t.remove(); return; } // one band per page
    if (t.parentElement !== document.body) document.body.prepend(t);
    t.style.setProperty('--lane-top', `${top}px`);
  });
}

/** Re-measure every lens on the page. */
export function refreshGlass() {
  measureRoot();
  placeLaneTint();
  const hosts = new Set();
  for (const lens of document.querySelectorAll('.lens')) if (lens.parentElement) hosts.add(lens.parentElement);
  fixedObjects = [];
  stickyObjects = [];
  for (const el of hosts) {
    alignLens(el);
    if (el.querySelector(':scope > .lens--fixed')) fixedObjects.push(el);
    else if (el.hasAttribute('data-sticky-lens')) stickyObjects.push(el);
  }
  for (const lane of document.querySelectorAll('[data-field-lane]')) fixedObjects.push(lane);
  writeScroll();
  setupDarkWatchers();
}

/* ---- fixed chrome: scroll follow fallback; sticky objects: re-measure ----- */
function writeScroll() {
  for (const el of stickyObjects) alignLens(el);
  if (hasScrollTimeline() && !reducedMotion()) return; // CSS handles fixed chrome
  const v = `${-mod(scrollY)}px`;
  for (const el of fixedObjects) el.style.setProperty('--fy-scroll', v);
}
let ticking = false;
function onScroll() {
  if (hasScrollTimeline() && !reducedMotion() && !stickyObjects.length) return; // CSS handles it
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { ticking = false; writeScroll(); });
}

/* ---- dark zones (DESIGN §2.7) --------------------------------------------
   Sentinels carry data-zone="dark". Each T1 object (capsule, PDP add bar) gets
   an IntersectionObserver whose root strip is that object's on-screen box
   (via rootMargin), and toggles data-over="dark" on it. The announcement bar
   is never under the capsule (it scrolls away above it), so it is skipped. */
function stripMargin(el) {
  const r = el.getBoundingClientRect();
  // sticky capsule: measure where it sits once stuck
  const header = el.closest('.site-header');
  let top = r.top;
  if (header && getComputedStyle(header).position === 'sticky') top = parseFloat(getComputedStyle(header).top) || 0;
  const bottom = Math.max(0, innerHeight - (top + r.height));
  return `${-Math.round(top)}px 0px ${-Math.round(bottom)}px 0px`;
}
function setupDarkWatchers() {
  for (const w of darkWatchers) w.disconnect();
  darkWatchers = [];
  if (!('IntersectionObserver' in window)) return;
  const sentinels = [...document.querySelectorAll('[data-zone="dark"]')].filter((s) => !s.closest('.announce'));
  for (const el of document.querySelectorAll('[data-dark-watch]')) {
    if (!el.getClientRects().length) continue;
    const hits = new Set();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) e.isIntersecting ? hits.add(e.target) : hits.delete(e.target);
      if (hits.size) el.dataset.over = 'dark';
      else delete el.dataset.over;
    }, { root: document, rootMargin: stripMargin(el), threshold: 0 });
    sentinels.forEach((s) => io.observe(s));
    darkWatchers.push(io);
  }
}

/* ---- boot ------------------------------------------------------------------ */
export function initGlass() {
  if (started) { refreshGlass(); return; }
  started = true;
  let raf = 0;
  const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(refreshGlass); };
  refreshGlass();
  addEventListener('resize', schedule, { passive: true });
  addEventListener('load', schedule, { once: true });
  document.fonts?.ready.then(schedule);
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(document.body);
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('scrollend', writeScroll, { passive: true });
  // horizontally scrolling rails move their glass wells: re-align on settle
  document.addEventListener('scrollend', (e) => {
    const t = e.target;
    if (t instanceof Element && t.matches('[data-rail], .chip-tray__scroller')) {
      t.querySelectorAll('.lens').forEach((l) => alignLens(l.parentElement));
    }
  }, { capture: true, passive: true });
  // sheets: measure once they are open and laid out
  document.addEventListener('hn:sheet-open', (e) => requestAnimationFrame(() => alignLens(e.detail.el)));
}
