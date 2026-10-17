/* motion.js (Motion Dev; DESIGN §2.8, §9). initMotion() runs from main.js after
   initGlass(). transform/opacity only; reduced motion = skipped (instant).
   CSS + the html.motion gate: motion.css. */
import { cart } from './store.js';
import { alignLens } from './glass.js';

const root = document.documentElement;
const mq = matchMedia('(prefers-reduced-motion: reduce)');
const still = () => mq.matches;
const css = (n) => getComputedStyle(root).getPropertyValue(n).trim();
const ms = (n, d) => parseFloat(css(n)) || d;
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ICONS = new URL('../img/icons.svg', import.meta.url).href;
const REVEAL = '[data-reveal], .co-done__panel';
const spring = (t) => 1 - Math.exp(-7 * t) * Math.cos(9 * t);
let SPRING, OUT;

/* Entry: at boot, anything in/above view is shown at once (same task as
   html.motion, no flash); later inserts enter when they scroll in. */
let io, booting = true;
function reveal(el) {
  if (el.__rv) return;
  el.__rv = 1;
  const r = booting && el.getBoundingClientRect();
  if (!io || (r && r.height && r.top < innerHeight)) el.classList.add('is-in');
  else io.observe(el);
}
function onReveal(entries) {
  let i = 0;
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const el = e.target;
    io.unobserve(el);
    el.style.setProperty('--rd', `${Math.min(i++, 2) * 60}ms`);
    el.classList.add('is-in');
    if (el.querySelector('.lens')) el.addEventListener('transitionend', () => {
      for (const l of $$('.lens', el)) alignLens(l.parentElement);
    }, { once: true });
  }
}

/* capsule <-> island (same element) */
function initCapsule() {
  const cap = document.querySelector('[data-capsule]');
  if (!cap) return;
  let state = cap.dataset.state, h = cap.offsetHeight;
  new MutationObserver(() => {
    if (cap.dataset.state === state) return;
    state = cap.dataset.state;
    const h0 = h;
    h = cap.offsetHeight;
    if (still() || !h0 || !h || cap.classList.contains('is-hidden')) return;
    const inner = cap.querySelector(state === 'island' ? '.capsule__island' : '.capsule__bar');
    const r = h0 / h, a = [], b = [], N = 16;
    for (let i = 0; i <= N; i++) {
      const s = r + (1 - r) * spring(i / N);
      a.push({ transform: `scaleY(${s.toFixed(4)})` });
      b.push({ transform: `scaleY(${(1 / s).toFixed(4)})` });
    }
    const d = ms('--t-spring', 380);
    cap.animate(a, { duration: d, composite: 'add' });
    if (!inner) return;
    inner.animate(b, { duration: d, composite: 'add' });
    inner.animate({ opacity: [0, 0, 1], offset: [0, 0.4, 1] }, { duration: d });
  }).observe(cap, { attributes: true, attributeFilter: ['data-state'] });
}

/* cart count roll */
function initRoll() {
  for (const el of $$('[data-roll]')) {
    el.__n = +el.textContent || 0;
    new MutationObserver(() => {
      const n = +el.textContent || 0, d = n - el.__n;
      el.__n = n;
      if (!d || el.hidden || still()) return;
      el.animate([{ transform: `translateY(${d > 0 ? 60 : -60}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: ms('--t-roll', 200), easing: OUT });
    }).observe(el, { childList: true, characterData: true, subtree: true });
  }
}

/* add-to-cart fly ghost: trigger -> cart */
let trig, trigAt = 0;
function fly() {
  if (still() || !trig?.isConnected || performance.now() - trigAt > 1500) return;
  const s = trig.getBoundingClientRect();
  const cap = document.querySelector('[data-capsule]');
  if (!s.width || !cap) return;
  let t = cap.querySelector('.capsule__cart')?.getBoundingClientRect();
  if (!t?.width) { const c = cap.getBoundingClientRect(); t = { left: c.right - 50, top: c.top + 6, width: 44, height: 44 }; }
  const sx = s.x + s.width / 2, sy = s.y + s.height / 2, tx = t.left + t.width / 2, ty = Math.max(t.top + t.height / 2, 24);
  const k = (x, y, sc, o, offset) => ({ transform: `translate(${x - 18}px,${y - 18}px) scale(${sc})`, opacity: o, offset });
  document.body.insertAdjacentHTML('beforeend', `<span class="fly-ghost" aria-hidden="true"><svg width="20" height="20"><use href="${ICONS}#i-bag"/></svg></span>`);
  const g = document.body.lastElementChild;
  g.animate([k(sx, sy, 0.6, 0, 0), k(sx, sy - 8, 1, 1, 0.15), k((sx + tx) / 2, Math.min(sy, ty) - 48, 0.85, 1, 0.55), k(tx, ty, 0.4, 0.2, 1)],
    { duration: 560, easing: 'cubic-bezier(.4,0,.2,1)' }).finished.finally(() => g.remove());
}

/* tube: fill FLIP + one sweep on crossing */
const pct = () => Math.min(1, Math.max(0, cart.freeShipping().progress || 0)) * 100;
let curP = pct(), prevP = curP, changedAt = -1e4, sweepAt = -1e4;
const pOf = (s) => parseFloat(/--p:\s*([\d.]+)%/.exec(s || '')?.[1]);
const fillMO = new MutationObserver((rs) => { for (const r of rs) fill(r.target, pOf(r.oldValue)); });
function fill(f, from) {
  const tube = f.closest('.tube'), now = performance.now();
  if (!f.__seen) { f.__seen = 1; fillMO.observe(f, { attributes: true, attributeFilter: ['style'], attributeOldValue: true }); }
  if (tube?.classList.contains('is-full') && now - sweepAt < 900) tube.classList.add('is-sweep');
  if (from == null) { if (now - changedAt > 700) return; from = prevP; }
  const to = pOf(f.getAttribute('style'));
  if (still() || Number.isNaN(from) || Number.isNaN(to) || Math.abs(from - to) < 0.5) return;
  const w = f.offsetWidth, track = f.parentElement;
  if (!w || !track) return;
  const w0 = Math.max(track.clientHeight, (track.clientWidth * from) / 100);
  f.animate([{ transform: `scaleX(${(w0 / w).toFixed(4)})` }, { transform: 'none' }],
    { duration: ms('--t-spring', 380), easing: css('--ease-sheet') || OUT });
}

function scan(node) {
  if (node.nodeType !== 1) return;
  if (node.matches(REVEAL)) reveal(node);
  for (const el of node.querySelectorAll(REVEAL)) reveal(el);
  for (const f of node.matches('.tube__fill') ? [node] : node.querySelectorAll('.tube__fill')) fill(f);
}

/* sheen: fine pointer, one rAF writer */
function initSheen() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  let el = null, rect = null, x = 0, y = 0, raf = 0;
  const write = () => {
    raf = 0;
    if (!el?.isConnected) return;
    rect ||= el.getBoundingClientRect();
    el.style.setProperty('--sx', `${(100 * (x - rect.left)) / rect.width}%`);
    el.style.setProperty('--sy', `${(100 * (y - rect.top)) / rect.height}%`);
  };
  document.addEventListener('pointerover', (e) => {
    const g = e.target.closest?.('.glass-chrome, .glass-sheet, .glass-baked');
    if (g === el) return;
    for (const v of ['--sx', '--sy']) el?.style.removeProperty(v);
    el = g; rect = null;
  }, { passive: true });
  document.addEventListener('pointermove', (e) => {
    if (!el || still()) return;
    x = e.clientX; y = e.clientY;
    raf ||= requestAnimationFrame(write);
  }, { passive: true });
  addEventListener('scroll', () => { rect = null; }, { passive: true });
}

/* Press squish on touch (R1 B-02 / D1): :active comes too late (Blink adds it
   on touch release) or never (iOS without a touchstart listener). One
   delegated pointerdown marks the pressed control for the whole hold. Runs
   even under reduced motion: the CSS then scales by 1 (lip only). */
const PRESS = '.squish, .lacquer, .grind-pill, .size-card';
function initPress() {
  let el = null;
  const release = () => {
    if (!el) return;
    el.classList.remove('is-pressed');
    el.removeEventListener('pointerleave', release);
    el = null;
  };
  document.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return; // primary button / touch / pen only
    release();
    const t = e.target.closest?.(PRESS);
    // aria-disabled controls still squish (e.g. the Pine "Choose a grind" CTA,
    // which explains itself on press); only sold-out and truly disabled don't
    if (!t || t.matches('[data-soldout], :disabled')) return;
    el = t;
    el.classList.add('is-pressed');
    el.addEventListener('pointerleave', release);
  }, { passive: true });
  for (const type of ['pointerup', 'pointercancel', 'dragstart']) addEventListener(type, release, { passive: true, capture: true });
  // iOS Safari: a touchstart listener anywhere makes :active (and fast taps) work
  document.addEventListener('touchstart', () => {}, { passive: true });
}

export function initMotion() {
  if (root.classList.contains('motion')) return;
  initPress();
  SPRING = css('--ease-spring') || 'ease-out';
  OUT = css('--ease-out') || 'ease-out';
  if ('IntersectionObserver' in window) io = new IntersectionObserver(onReveal, { rootMargin: '0px 0px -8% 0px' });
  for (const el of $$(REVEAL)) reveal(el);
  booting = false;
  root.classList.add('motion');
  for (const f of $$('.tube__fill')) fill(f);
  new MutationObserver((rs) => { for (const r of rs) r.addedNodes.forEach(scan); })
    .observe(document.body, { childList: true, subtree: true });
  initCapsule();
  initRoll();
  initSheen();
  addEventListener('click', (e) => {
    const b = e.target.closest?.('button, [role="button"]');
    if (b) { trig = b; trigAt = performance.now(); }
  }, { capture: true, passive: true });
  cart.on('add', fly);
  cart.on('change', () => { prevP = curP; curP = pct(); changedAt = performance.now(); });
  cart.on('threshold', (d) => { if (d?.qualified) sweepAt = performance.now(); });
  document.addEventListener('change', (e) => {
    const p = e.target.checked && e.target.closest?.('.grind-pill, .size-card');
    if (p && !still()) p.animate([{ transform: 'scale(.96)' }, { transform: 'none' }], { duration: ms('--t-spring', 380), easing: SPRING });
  });
}
