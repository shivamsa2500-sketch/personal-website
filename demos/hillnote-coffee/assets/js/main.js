/* main.js: the single module entry on every page.

   <script type="module" src="assets/js/main.js"></script>        (root pages)
   <script type="module" src="../assets/js/main.js"></script>     (guides/*)

   Page code lives in its own module and registers itself:
     // assets/js/pages/shop.js
     import { registerPage, cart, brand } from '../main.js';
     registerPage('shop', ({ params }) => { ... });
   and the page sets <body data-page="shop">. Use '*' to run on every page.

   main.js itself only wires sitewide glue that has no visual design:
   brand text/links ([data-brand]), cart count badges ([data-cart-count]),
   the Reduce-transparency switch ([data-transparency-switch]), and the
   brew context (?brew= → brewPref). Components (drawer, island, menu) are
   the Frontend Dev's; motion is motion.js. */

import brand from '../../brand.config.js';
import { cart } from './store.js';
import * as format from './format.js';
import { getGrind } from '../../data/brew-methods.js';
import { initShell } from './shell.js';
import { initGlass } from './glass.js';
import { initMotion } from './motion.js';

export { brand, cart, format };

/* ---- Site-root aware URLs (works from /guides/ and on sub-path hosts) ---- */
const ROOT = new URL('../../', import.meta.url);
/** url('product.html?c=shade-line') → absolute URL string from the site root. */
export const url = (path = '') => new URL(path, ROOT).href;
export const productUrl = (slug, brew) =>
  url(`product.html?c=${encodeURIComponent(slug)}${brew ? `&brew=${encodeURIComponent(brew)}` : ''}`);
export const shopUrl = (params = {}) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '')).toString();
  return url(`shop.html${q ? `?${q}` : ''}`);
};

/* ---- Brew context: ?brew= wins, then the saved brewPref ---------------- */
/** @returns a grind id ('french-press', 'whole-bean', …) or null */
export function getBrewContext() {
  const fromUrl = new URLSearchParams(location.search).get('brew');
  if (fromUrl && getGrind(fromUrl)) {
    if (cart.getBrewPref() !== fromUrl) cart.setBrewPref(fromUrl);
    return fromUrl;
  }
  return cart.getBrewPref();
}

/* ---- Reduce transparency ------------------------------------------------
   The <head> inline snippet (see README "Head snippet") sets
   html[data-transparency="reduced"] before first paint. These helpers keep the
   switch, storage and attribute in sync after load. Key: `${prefix}transparency`. */
const TKEY = `${brand.storagePrefix}transparency`;
/* The head snippet reads the prefix from <html data-storage-prefix> (B-05);
   tools/rebrand.mjs keeps it equal to brand.storagePrefix. */
if (document.documentElement.dataset.storagePrefix !== brand.storagePrefix) {
  console.warn(`[brand] <html data-storage-prefix="${document.documentElement.dataset.storagePrefix ?? ''}"> differs from brand.storagePrefix "${brand.storagePrefix}". Run: node tools/rebrand.mjs`);
}
const osReduced = () =>
  typeof matchMedia === 'function' &&
  (matchMedia('(prefers-reduced-transparency: reduce)').matches || matchMedia('(prefers-contrast: more)').matches);

export function isReducedTransparency() {
  return document.documentElement.dataset.transparency === 'reduced' || osReduced();
}
/* Sets BOTH hooks (DESIGN §2.11 / §7.20): html[data-glass="off"] and its
   alias html[data-transparency="reduced"]. tokens.css + glass.css match either. */
export function setReducedTransparency(on) {
  const html = document.documentElement;
  if (on) { html.dataset.transparency = 'reduced'; html.dataset.glass = 'off'; }
  else { delete html.dataset.transparency; delete html.dataset.glass; }
  try { localStorage.setItem(TKEY, on ? 'reduced' : 'off'); } catch { /* storage blocked: session-only */ }
  syncTransparencySwitches();
  document.dispatchEvent(new CustomEvent('hn:transparency', { detail: { on } }));
}
function syncTransparencySwitches() {
  const forced = osReduced();
  for (const btn of document.querySelectorAll('[data-transparency-switch]')) {
    btn.setAttribute('role', 'switch');
    btn.setAttribute('aria-checked', String(isReducedTransparency()));
    // The OS preference forces "on"; the switch shows checked and can't turn it off.
    if (forced) btn.setAttribute('aria-disabled', 'true');
    else btn.removeAttribute('aria-disabled');
  }
}
function initTransparencySwitches() {
  syncTransparencySwitches();
  document.addEventListener('click', (e) => {
    const btn = e.target.closest?.('[data-transparency-switch]');
    if (!btn || btn.getAttribute('aria-disabled') === 'true') return;
    setReducedTransparency(!(document.documentElement.dataset.transparency === 'reduced'));
  });
}

/* ---- Brand binding -------------------------------------------------------
   <span data-brand="name"></span>            → brand.name
   <a data-brand-href="contact.email">        → href mailto:/tel: set, text if empty
   data-brand values are dot paths into brand.config.js. */
const pick = (path) => path.split('.').reduce((o, k) => o?.[k], brand);
export function applyBrand(root = document) {
  for (const el of root.querySelectorAll('[data-brand]')) {
    const v = pick(el.dataset.brand);
    if (v != null) el.textContent = typeof v === 'number' ? format.formatPrice(v) : v;
  }
  for (const el of root.querySelectorAll('[data-brand-href]')) {
    const key = el.dataset.brandHref;
    const v = pick(key);
    if (v == null) continue;
    el.href = /email$/i.test(key) ? `mailto:${v}` : /phone$/i.test(key) ? `tel:${String(v).replace(/[^\d+]/g, '')}` : v;
    if (!el.textContent.trim()) el.textContent = v;
  }
  for (const el of root.querySelectorAll('[data-year]')) el.textContent = String(new Date().getFullYear());
  // long + short line; CSS shows one (< 480 px: short, B-22). display:none
  // keeps the hidden one out of the accessibility tree.
  for (const el of root.querySelectorAll('[data-announcement]')) {
    const long = document.createElement('span');
    const short = document.createElement('span');
    long.className = 'announce__long';
    short.className = 'announce__short';
    long.textContent = format.announcementText();
    short.textContent = format.announcementText({ short: true });
    el.replaceChildren(long, short);
  }
}

/* ---- Cart count badges ---------------------------------------------------
   <a data-cart-count-label …><span data-cart-count></span></a>
   [data-cart-count] gets the number (hidden attr when 0); [data-cart-count-label]
   gets aria-label "Cart, 2 items" (COPY §1.2). */
function renderCartCount() {
  const n = cart.count();
  for (const el of document.querySelectorAll('[data-cart-count]')) {
    el.textContent = String(n);
    el.hidden = n === 0;
  }
  for (const el of document.querySelectorAll('[data-cart-count-label]')) {
    el.setAttribute('aria-label', format.cartCountLabel(n));
  }
}

/* ---- Page registry ------------------------------------------------------- */
const queue = [];
let booted = false;
const ctx = () => ({ page: document.body?.dataset.page ?? '', params: new URLSearchParams(location.search), brand, cart, format });

/** registerPage(name | '*', init(ctx)). Runs once, after main's boot. */
export function registerPage(name, init) {
  if (booted) run(name, init);
  else queue.push([name, init]);
}
function run(name, init) {
  const c = ctx();
  if (name !== '*' && name !== c.page) return;
  try { init(c); } catch (err) { console.error(`[page:${name}]`, err); }
}

function boot() {
  initShell(); // injects header / footer / drawer / sheets before brand binding
  applyBrand();
  renderCartCount();
  cart.on('change', renderCartCount);
  initTransparencySwitches();
  getBrewContext(); // persists ?brew= as brewPref on any page
  booted = true;
  for (const [name, init] of queue.splice(0)) run(name, init);
  initGlass(); // lens alignment + dark-zone observer, after pages rendered
  try { initMotion(); } catch (err) { console.error('[motion]', err); } // reveals, morphs, fly, sheen
}

// Modules are deferred, so the DOM is parsed by now; guard anyway.
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
