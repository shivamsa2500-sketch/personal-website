/* shell.js: the shared site shell (Frontend Dev #1). One source for every page.

   Injected from templates on boot (main.js calls initShell() before applyBrand):
     - page sprite: #field-tile (from img/topo-field.svg), <symbol id="field">,
       <filter id="lensBlur">, and the bag defs (#bag, #bag-gloss, #bag-clip)
     - capsule-lane glass zone (fixed, behind content)
     - announcement bar wiring   ([data-shell="announce"], static in each page)
     - capsule header            (replaces [data-shell="header"] fallback)
     - desktop "Find your coffee" popover, mobile menu sheet
     - global live region + toast
     - footer                    (replaces [data-shell="footer"] fallback)
   Lazily imported (shell-cart.js, on first open or on intent):
     - cart drawer sheet, quick-add sheet (templates + wiring)

   Public API (import from './shell.js', or '../shell.js' from pages/*):
     quickAdd(slug, { brew, size, qty, trigger })  card "+ Add": direct add with a
                         grind, otherwise opens the quick-add sheet. Returns the
                         cart.add() result (or { ok:false, error:'sheet' }).
     confirmAdd(result, trigger)  run the post-add UI for a cart.add() result you
                         made yourself (PDP): drawer on first add, island after.
     openQuickAdd(slug, { trigger, grind, size })        → Promise
     openDrawer({ trigger, focusKey, focus: 'grind' })   → Promise;  closeDrawer()
     loadCartUI()        → Promise of the lazy drawer/quick-add module (warm it early)
     showIsland(addResult)  hideIsland()
     setCapsuleHidden(bool)  PDP add bar: hide/show the capsule (never both).
                         Also listens for document event 'hn:addbar' {detail:{visible}}.
     setCapsuleTools(html) → the .capsule__tools slot (between logo and cart),
                         filled with page plates (Shop: Filter · Sort); hidden
                         until setCapsuleCompact(true).
     setCapsuleCompact(on, { fallbackFocus })  compact capsule (DESIGN §7.2):
                         icon-only Menu, monogram logo, tools shown;
                         capsule[data-tools="compact"]. Focus inside the tools
                         moves to fallbackFocus when they hide.
     wireSheet(dialog)   Esc / scrim / [data-sheet-close] for a page's own sheet.
     openSheet(dialog, trigger) / closeSheet(dialog)   reuse for filter/sort sheets:
                         <dialog class="sheet sheet--bottom glass-sheet"> + .lens first child.
     announce(text)      polite live region (routes into the open sheet if any)
     toast(text, { actionLabel, onAction, onExpire, ms }) → { el, close }
     tubeHTML(freeShipping, { mini })
   Shared cart markup (lineParts / lineHTML / nudgeHTML): components/cart-line.js.

   Every click on [data-quick-add="{slug}"] (optional data-brew) and on
   [data-cart-open] is handled here by delegation. */

import { brand, cart, format, url, productUrl } from './main.js';
import { getProduct, isAccessory } from '../../data/products.js';
import { getGrind } from '../../data/brew-methods.js';
import { esc, icon, lens, brewerTile, FINDER_OPTIONS } from './components/ui.js';
import { lineMeta } from './components/cart-line.js';
import { alignLens, refreshGlass } from './glass.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const html = document.documentElement;
const P = brand.storagePrefix;
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const ms = (token, fallback) => {
  const v = getComputedStyle(html).getPropertyValue(token).trim();
  return v.endsWith('ms') ? parseFloat(v) : v.endsWith('s') ? parseFloat(v) * 1000 : fallback;
};

/* ==========================================================================
   Sprite (field + lens filter + bag)
   ========================================================================== */
const SVGNS = 'http://www.w3.org/2000/svg';
function injectSprite() {
  if ($('#hn-sprite')) return;
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.id = 'hn-sprite';
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('class', 'sprite');
  // filter + field symbol (2 × 3 tiles = 2400 × 3600: covers any object ≤ 1200 wide
  // at any mod-1200 offset, and sheets up to 2400 tall)
  let uses = '';
  for (let y = 0; y < 3; y++) for (let x = 0; x < 2; x++) uses += `<use href="#field-tile" x="${x * 1200}" y="${y * 1200}"/>`;
  svg.innerHTML = `<defs>
    <filter id="lensBlur" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="1.5"/></filter>
    <symbol id="field" overflow="visible">${uses}</symbol>
  </defs>`;
  document.body.prepend(svg);
  const defs = svg.firstElementChild;
  const pull = (file, pick) =>
    fetch(url(file))
      .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
      .then((t) => {
        const doc = new DOMParser().parseFromString(t, 'image/svg+xml');
        for (const node of pick(doc)) if (node) defs.append(document.importNode(node, true));
      })
      .catch((e) => console.warn(`[shell] sprite ${file}`, e));
  // Graphics' files stay the source of truth; inlined so Safari resolves
  // gradients, clips and custom properties (GRAPHICS §3.2, §6.3).
  pull('assets/img/topo-field.svg', (d) => [d.getElementById('field-tile')]).then(() => document.dispatchEvent(new Event('hn:field-ready')));
  pull('assets/img/bag.svg', (d) => [...(d.querySelector('defs')?.children ?? [])]);
}

/* The capsule lane: a fixed glass zone behind the capsule (DESIGN §2.6).
   .lane-tint (R1 B-01 / D1) is a colour band under the field so the glass
   has something to bend on the first frame; Fixer A styles it (glass.css),
   tints come from --lane-tint / --lane-tint-2 (tokens.css, pages may set). */
function injectLane() {
  if ($('.capsule-lane')) return;
  const lane = document.createElement('div');
  lane.className = 'capsule-lane';
  lane.setAttribute('aria-hidden', 'true');
  lane.dataset.fieldLane = '';
  lane.innerHTML = '<div class="lane-tint" aria-hidden="true"><svg class="lane-tint__field"><use href="#field"/></svg></div><svg class="field-win lens-follow"><use href="#field"/></svg>';
  $('#hn-sprite').after(lane);
}

/* ==========================================================================
   Live region + toast
   ========================================================================== */
let liveTimer;
export function announce(text) {
  const open = $('dialog.sheet[open] .sheet__live');
  const region = open ?? $('#hn-live');
  if (!region) return;
  region.textContent = '';
  clearTimeout(liveTimer);
  liveTimer = setTimeout(() => { region.textContent = text; }, 60);
}

/** toast(text, { actionLabel, onAction, ms, onExpire }) → { el, close } */
export function toast(text, { actionLabel, onAction, onExpire, ms: life = 5000 } = {}) {
  const host = $('dialog.sheet[open] .sheet__toasts') ?? $('#hn-toasts');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<p class="toast__text">${esc(text)}</p>${actionLabel ? `<button type="button" class="toast__action">${esc(actionLabel)}</button>` : ''}`;
  host.append(el);
  let left = life, start = Date.now(), timer;
  const close = (expired) => {
    clearTimeout(timer);
    el.remove();
    if (expired) onExpire?.();
  };
  const run = () => { start = Date.now(); timer = setTimeout(() => close(true), left); };
  const pause = () => { clearTimeout(timer); left -= Date.now() - start; };
  el.addEventListener('pointerenter', pause);
  el.addEventListener('pointerleave', run);
  el.addEventListener('focusin', pause);
  el.addEventListener('focusout', run);
  el.querySelector('.toast__action')?.addEventListener('click', () => { close(false); onAction?.(); });
  run();
  announce(text);
  return { el, close: () => close(false) };
}

/* ==========================================================================
   Sheets (<dialog> T2)
   ========================================================================== */
const triggers = new WeakMap();
export function openSheet(dlg, trigger = document.activeElement) {
  if (!dlg || dlg.open) return;
  triggers.set(dlg, trigger);
  // one modal sheet at a time
  for (const other of $$('dialog.sheet[open]')) if (other !== dlg) closeSheet(other, { restoreFocus: false, instant: true });
  dlg.classList.remove('is-closing');
  dlg.showModal();
  html.classList.add('sheet-open');
  document.dispatchEvent(new CustomEvent('hn:sheet-open', { detail: { el: dlg } }));
}
export function closeSheet(dlg, { restoreFocus = true, instant = false } = {}) {
  if (!dlg?.open || dlg.classList.contains('is-closing')) return;
  const done = () => {
    dlg.classList.remove('is-closing');
    dlg.close();
    if (!$('dialog.sheet[open]')) html.classList.remove('sheet-open');
    const t = triggers.get(dlg);
    if (restoreFocus && t?.isConnected) t.focus({ preventScroll: true });
    dlg.dispatchEvent(new Event('hn:closed'));
  };
  if (instant || reducedMotion()) return done();
  dlg.classList.add('is-closing');
  setTimeout(done, ms('--t-sheet-out', 220));
}
export function wireSheet(dlg) {
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); closeSheet(dlg); });
  dlg.addEventListener('click', (e) => {
    if (e.target !== dlg) return; // the scrim is the dialog's ::backdrop
    const r = dlg.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeSheet(dlg);
  });
  dlg.addEventListener('click', (e) => { if (e.target.closest('[data-sheet-close]')) closeSheet(dlg); });
}

/* ==========================================================================
   Templates
   ========================================================================== */
const NAV = [
  { href: 'shop.html', label: 'Shop coffee' },
  { finder: true, label: 'Find your coffee' },
  { href: 'guides/index.html', label: 'Brew guides' },
  { href: 'cafes.html', label: 'Cafés' },
  { href: 'about.html', label: 'Our story' },
];
const here = (href) => {
  const a = new URL(url(href)).pathname;
  const b = location.pathname.replace(/\/$/, '/index.html');
  return a === b || (href === 'guides/index.html' && b.includes('/guides/'));
};
const logoSvg = (w = 112, h = 22) =>
  `<svg viewBox="0 0 204 40" width="${w}" height="${h}" aria-hidden="true" focusable="false"><use href="${url(brand.logoSvg)}#logo"/></svg>`;

function headerTemplate() {
  return `<div class="capsule glass-chrome" data-capsule data-dark-watch data-state="bar">
    ${lens('fixed')}
    <div class="capsule__bar">
      <button type="button" class="capsule__menu plate squish" data-menu-open aria-label="Open menu" aria-expanded="false" aria-controls="hn-menu">${icon('i-menu', 22)}<span class="capsule__menu-text" aria-hidden="true">Menu</span></button>
      <a class="capsule__logo plate squish" href="${url('index.html')}" aria-label="${esc(brand.name)}, home">${logoSvg()}</a>
      <nav class="capsule__nav plate" aria-label="Main">
        <ul>${NAV.map((n) => n.finder
          ? `<li><button type="button" class="capsule__link capsule__finder" data-finder-toggle aria-expanded="false" aria-controls="hn-finder">${esc(n.label)}${icon('i-chevron-down', 16)}</button></li>`
          : `<li><a class="capsule__link" href="${url(n.href)}"${here(n.href) ? ' aria-current="page"' : ''}>${esc(n.label)}</a></li>`).join('')}</ul>
      </nav>
      <div class="capsule__tools" data-capsule-tools hidden></div>
      <a class="capsule__cart plate squish" href="${url('cart.html')}" data-cart-open data-cart-count-label aria-label="${esc(format.cartCountLabel(cart.count()))}">${icon('i-bag', 22)}<span class="capsule__count" data-cart-count data-roll hidden>0</span></a>
    </div>
    <div class="capsule__island" data-island role="status" aria-live="polite"></div>
  </div>`;
}

function finderTemplate() {
  return `<div class="finder-pop glass-sheet" id="hn-finder" popover="auto" aria-labelledby="hn-finder-title">
    ${lens()}
    <div class="finder-pop__head plate plate--solid">
      <h2 class="finder-pop__title" id="hn-finder-title">What do you brew with?</h2>
      <p class="finder-pop__help">Pick your brewer. We'll show coffees that suit it and grind them to match.</p>
    </div>
    <ul class="brew-tiles brew-tiles--4" role="list">${FINDER_OPTIONS.map((g) => `<li>${brewerTile(g)}</li>`).join('')}</ul>
    <p class="finder-pop__foot plate plate--solid"><a class="link link--arrow" href="${url('guides/index.html')}">Not sure? Start here <span aria-hidden="true">→</span></a></p>
  </div>`;
}

function switchTemplate(cls = '') {
  if (!brand.features?.reduceTransparencySwitch) return '';
  return `<div class="switch-row switch-row--${cls}">
    <button type="button" class="switch" data-transparency-switch role="switch" aria-checked="false" aria-describedby="${cls}-sw-help">
      <span class="switch__label">Reduce transparency</span>
      <span class="switch__track" aria-hidden="true"><span class="switch__thumb"></span></span>
    </button>
    <p class="switch__help" id="${cls}-sw-help" data-switch-help hidden>Set by your device</p>
  </div>`;
}

function menuTemplate() {
  const n = brand.cafes?.length ?? 0;
  return `<dialog class="sheet sheet--left glass-sheet menu-sheet" id="hn-menu" aria-labelledby="hn-menu-title">
    ${lens()}
    <div class="sheet__head plate plate--solid">
      <h2 class="visually-hidden" id="hn-menu-title">Menu</h2>
      <span class="sheet__brand" aria-hidden="true">${logoSvg(102, 20)}</span>
      <button type="button" class="plate--btn plate squish sheet__close" data-sheet-close aria-label="Close menu">${icon('i-x')}</button>
    </div>
    <div class="sheet__body">
      <section class="menu-sheet__brew plate plate--solid" aria-labelledby="hn-menu-brew">
        <h3 class="menu-sheet__h" id="hn-menu-brew">What do you brew with?</h3>
        <ul class="brew-tiles" role="list">${FINDER_OPTIONS.map((g) => `<li>${brewerTile(g)}</li>`).join('')}</ul>
      </section>
      <a class="btn btn--lg btn--block lacquer squish" href="${url('shop.html')}">Shop coffee</a>
      <nav class="menu-sheet__links plate plate--solid" aria-label="More">
        <ul role="list">
          <li><a href="${url('guides/index.html')}">Brew guides</a></li>
          <li><a href="${url('cafes.html')}">Cafés</a></li>
          <li><a href="${url('about.html')}">Our story</a></li>
          <li><a href="${url('contact.html')}">Contact &amp; FAQ</a></li>
        </ul>
      </nav>
      <div class="menu-sheet__small">
        ${n ? `<a class="link" href="${url('cafes.html')}">${n} cafés · Find one <span aria-hidden="true">→</span></a>` : ''}
        <ul class="social" role="list">${(brand.social ?? []).map((s) => `<li><a href="${esc(s.url)}" rel="noopener" target="_blank">${esc(s.label)}<span class="visually-hidden"> (opens in a new tab)</span></a></li>`).join('')}</ul>
      </div>
    </div>
    <div class="sheet__foot plate plate--solid">${switchTemplate('menu')}</div>
    <div class="sheet__toasts" aria-live="off"></div>
    <p class="sheet__live visually-hidden" aria-live="polite"></p>
  </dialog>`;
}

function footerTemplate() {
  const groups = [
    ['Shop', [['All coffee', 'shop.html'], ['Find your coffee', 'index.html#finder'], ['Light roasts', 'shop.html?roast=light'], ['Dark roasts', 'shop.html?roast=dark']]],
    ['Learn', [['Brew guides', 'guides/index.html'], ['Pour-over guide', 'guides/pour-over.html'], ['French press guide', 'guides/french-press.html'], ['Grind size chart', 'guides/index.html#grind-chart']]],
    ['Company', [['Our story', 'about.html'], ['Cafés', 'cafes.html']]],
    ['Help', [['Contact us', 'contact.html'], ['FAQ', 'contact.html#faq'], ['Shipping & returns', 'contact.html#faq-shipping']]],
  ];
  return `<div class="footer__band" aria-hidden="true"><svg class="footer__field"><use href="#field"/></svg></div>
  <div class="container footer__grid">
    <div class="footer__brand">
      <a class="footer__logo" href="${url('index.html')}" aria-label="${esc(brand.name)}, home">${logoSvg(143, 28)}</a>
      <p class="footer__blurb">${esc(brand.footerBlurb)}</p>
      <p class="footer__note">roasted in small batches, every ${['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][brand.roastDay ?? 1]}</p>
    </div>
    <nav class="footer__groups" aria-label="Footer">
      ${groups.map(([h, links]) => `<details class="footer__group" data-footer-group>
        <summary class="footer__summary"><span>${esc(h)}</span>${icon('i-chevron-down', 20)}</summary>
        <ul role="list">${links.map(([l, href]) => `<li><a href="${url(href)}">${esc(l)}</a></li>`).join('')}</ul>
      </details>`).join('')}
    </nav>
    <div class="footer__bottom">
      <p>© <span data-year></span> ${esc(brand.name)}</p>
      ${brand.demoStore ? '<p>Demo store. No real orders or payments.</p>' : ''}
      <p><a href="${url('about.html#credits')}">Photos: Unsplash</a></p>
      <ul class="social" role="list">${(brand.social ?? []).map((s) => `<li><a href="${esc(s.url)}" rel="noopener" target="_blank">${esc(s.label)}<span class="visually-hidden"> (opens in a new tab)</span></a></li>`).join('')}</ul>
      ${switchTemplate('footer')}
    </div>
  </div>`;
}

/* ==========================================================================
   Announcement bar
   ========================================================================== */
function initAnnounce() {
  const bar = $('[data-shell="announce"]');
  if (!bar) return;
  if (!brand.features?.announcementBar) { bar.remove(); return; }
  bar.querySelector('[data-announce-close]')?.addEventListener('click', () => {
    try { sessionStorage.setItem(`${P}announce`, 'off'); } catch { /* session only */ }
    html.classList.add('announce-off');
    $('[data-capsule] .capsule__logo')?.focus();
    requestAnimationFrame(refreshGlass);
  });
}

/* ==========================================================================
   Capsule: compact, hide (PDP), island
   ========================================================================== */
let capsule;
let hiddenByAddbar = false;
export function setCapsuleHidden(hidden) {
  hiddenByAddbar = !!hidden;
  capsule?.classList.toggle('is-hidden', hiddenByAddbar && capsule.dataset.state !== 'island');
}
/* Compact capsule (DESIGN §7.2): pages put their own plates in the tools slot
   and switch the capsule to Menu (icon) · monogram · tools · Cart. */
export function setCapsuleTools(markup = '') {
  const slot = capsule && $('[data-capsule-tools]', capsule);
  if (!slot) return null;
  slot.innerHTML = markup;
  return slot;
}
export function setCapsuleCompact(on, { fallbackFocus } = {}) {
  if (!capsule) return;
  const slot = $('[data-capsule-tools]', capsule);
  const was = capsule.dataset.tools === 'compact';
  on = !!on && !!slot?.childElementCount;
  if (on === was) return;
  if (on) capsule.dataset.tools = 'compact'; else delete capsule.dataset.tools;
  slot.hidden = !on;
  const logo = $('.capsule__logo svg', capsule);
  const use = logo?.querySelector('use');
  if (use) {
    const href = url(brand.logoSvg);
    logo.setAttribute('viewBox', on ? '0 0 40 40' : '0 0 204 40');
    use.setAttribute('href', `${href}#${on ? 'logo-mark' : 'logo'}`);
  }
  if (!on && slot.contains(document.activeElement)) fallbackFocus?.focus({ preventScroll: true });
  requestAnimationFrame(() => alignLens(capsule));
}
function initCapsuleScroll() {
  let last = scrollY, ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = scrollY;
      capsule.toggleAttribute('data-compact', y > 64);
      if (hiddenByAddbar && y < last - 8 && capsule.classList.contains('is-hidden')) {
        capsule.classList.remove('is-hidden');
        document.dispatchEvent(new CustomEvent('hn:capsule', { detail: { visible: true } }));
      } else if (hiddenByAddbar && y > last + 8) {
        capsule.classList.add('is-hidden');
      }
      last = y;
    });
  }, { passive: true });
  document.addEventListener('hn:addbar', (e) => setCapsuleHidden(e.detail?.visible));
}

/* Status island: the capsule's second state (DESIGN §7.3). No timer. */
let islandCleanup = null;
export function showIsland(res) {
  if (!capsule || !res?.line) return;
  const l = res.line;
  const fs = cart.freeShipping();
  const meta = lineMeta(l);
  const region = $('[data-island]', capsule);
  hideIsland(false);
  capsule.dataset.state = 'island';
  capsule.classList.remove('is-hidden');
  region.innerHTML = `<div class="island__msg plate">
      <p class="island__text">${icon('i-check', 20)}<span class="island__line"><span class="island__added">Added</span> <span class="island__name">${esc(l.product.name)}</span> <span class="island__meta">· ${esc(meta)}</span></span></p>
      ${tubeHTML(fs, { mini: true })}
    </div>
    <div class="island__actions">
      ${l.accessory ? '' : `<button type="button" class="island__edit plate squish" data-island-edit="${esc(l.key)}">Edit grind</button>`}
      <button type="button" class="island__view btn btn--sm lacquer squish" data-island-view>View cart</button>
      <button type="button" class="plate--btn plate squish" data-island-close aria-label="Close">${icon('i-x', 20)}</button>
    </div>`;
  requestAnimationFrame(() => alignLens(capsule));
  const y0 = scrollY;
  const onKey = (e) => { if (e.key === 'Escape') hideIsland(); };
  const onDown = (e) => { if (!capsule.contains(e.target)) hideIsland(); };
  const onScroll = () => { if (Math.abs(scrollY - y0) >= innerHeight / 2) hideIsland(); };
  document.addEventListener('keydown', onKey);
  document.addEventListener('pointerdown', onDown, true);
  addEventListener('scroll', onScroll, { passive: true });
  islandCleanup = () => {
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('pointerdown', onDown, true);
    removeEventListener('scroll', onScroll);
  };
}
export function hideIsland(restore = true) {
  islandCleanup?.();
  islandCleanup = null;
  if (!capsule || capsule.dataset.state !== 'island') return;
  const hadFocus = capsule.querySelector('[data-island]')?.contains(document.activeElement);
  capsule.dataset.state = 'bar';
  $('[data-island]', capsule).innerHTML = '';
  if (restore) {
    if (hiddenByAddbar) capsule.classList.add('is-hidden');
    if (hadFocus) $('.capsule__cart', capsule)?.focus();
  }
  requestAnimationFrame(() => alignLens(capsule));
}
function stretchCart() {
  const c = capsule && $('.capsule__cart', capsule);
  if (!c) return;
  c.classList.remove('is-stretch');
  void c.offsetWidth; // restart the keyframes
  c.classList.add('is-stretch');
}

/* ==========================================================================
   Shipping tube (shared with the cart page: export tubeHTML)
   ========================================================================== */
export function tubeHTML(fs = cart.freeShipping(), { mini = false } = {}) {
  const pct = Math.round(fs.progress * 1000) / 10;
  const text = fs.qualified
    ? `<p class="tube__text">${icon('i-check', 20)}<strong>Your order ships free.</strong></p>`
    : `<p class="tube__text">You're <strong class="tube__gap">${format.formatPrice(fs.gap)}</strong> away from free shipping.</p>`;
  return `<div class="tube${mini ? ' tube--mini' : ''}${fs.qualified ? ' is-full' : ''}">
    ${mini ? '' : text}
    <div class="tube__track" role="progressbar" aria-label="Progress to free shipping" aria-valuemin="0" aria-valuemax="${fs.threshold}" aria-valuenow="${Math.min(fs.subtotal, fs.threshold)}" aria-valuetext="${format.formatPrice(fs.subtotal)} of ${format.formatPrice(fs.threshold)}"${mini ? ' aria-hidden="true"' : ''}>
      <span class="tube__fill" style="--p:${pct}%"></span>
      <span class="tube__tick"></span>
    </div>
    ${mini ? '' : `<p class="tube__goal" aria-hidden="true">${format.formatPrice(fs.threshold)}</p>`}
  </div>`;
}

/* ==========================================================================
   Cart drawer + quick add: lazily imported (shell-cart.js)
   The first open imports the module (templates + wiring); pointer/focus intent
   on any cart or + Add control warms it, so the first-add-opens-drawer flow
   still opens within the 240 ms add feedback. If the import fails (offline),
   the drawer falls back to the cart page and quick add to the product page.
   ========================================================================== */
let cartUI = null;
export function loadCartUI() {
  cartUI ??= import('./shell-cart.js').catch((err) => { cartUI = null; throw err; });
  return cartUI;
}
export function openDrawer(opts = {}) {
  return loadCartUI().then((m) => m.openDrawer(opts), (err) => {
    console.warn('[shell] drawer', err);
    location.href = url('cart.html');
  });
}
export function closeDrawer() {
  return cartUI?.then((m) => m.closeDrawer());
}
export function openQuickAdd(slug, opts = {}) {
  return loadCartUI().then((m) => m.openQuickAdd(slug, opts), (err) => {
    console.warn('[shell] quick add', err);
    location.href = productUrl(slug);
  });
}

function busy(btn, on) {
  if (!btn) return;
  if (on) btn.setAttribute('aria-busy', 'true');
  else btn.removeAttribute('aria-busy');
}
export function flashAdded(btn) {
  if (!btn?.isConnected) return;
  const t = btn.querySelector('.add-pill__text');
  if (!t) return;
  const was = t.textContent;
  btn.classList.add('is-added');
  t.textContent = 'Added';
  setTimeout(() => { btn.classList.remove('is-added'); t.textContent = was; }, 1200);
}

/** Post-add UI for any successful cart.add() result. */
export function confirmAdd(res, trigger) {
  if (!res?.ok) return;
  stretchCart();
  if (res.openDrawer) {
    openDrawer({ trigger }).then(() => announce(`Added ${res.line.product.name}, ${lineMeta(res.line)}, to your cart.`));
  } else {
    showIsland(res);
  }
  if (res.capped) toast(`${brand.cart?.maxQtyPerLine ?? 10} is the most per line.`);
}

export function quickAdd(slug, { brew, size, qty = 1, trigger } = {}) {
  const p = getProduct(slug);
  if (!p) return { ok: false, error: 'unknown-product' };
  const grind = isAccessory(p) ? null : brew && getGrind(brew) ? brew : null;
  if (!isAccessory(p) && !grind) {
    openQuickAdd(slug, { trigger, size });
    return { ok: false, error: 'sheet' };
  }
  busy(trigger, true);
  const res = cart.add({ slug, size, grind, qty });
  // the drawer module loads during the add feedback, not after it
  if (res.ok && res.openDrawer) loadCartUI().catch(() => {});
  setTimeout(() => {
    busy(trigger, false);
    if (res.ok) { flashAdded(trigger); confirmAdd(res, trigger); }
    else toast("That didn't work. Please try again.");
  }, reducedMotion() ? 0 : 240);
  return res;
}

/* ==========================================================================
   Finder popover (desktop) + menu
   ========================================================================== */
function wireFinder() {
  const pop = $('#hn-finder');
  const btn = $('[data-finder-toggle]');
  if (!pop || !btn) return;
  const supports = typeof pop.showPopover === 'function';
  const place = () => {
    const c = capsule.getBoundingClientRect();
    const b = btn.getBoundingClientRect();
    const w = Math.min(640, innerWidth - 32);
    pop.style.top = `${Math.round(c.bottom + 8)}px`;
    pop.style.left = `${Math.round(Math.min(Math.max(16, b.left + b.width / 2 - w / 2), innerWidth - w - 16))}px`;
    pop.style.width = `${w}px`;
  };
  const isOpen = () => (supports ? pop.matches(':popover-open') : pop.classList.contains('is-open'));
  const open = () => {
    place();
    if (supports) pop.showPopover(); else pop.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    $('.brew-tile', pop)?.focus({ preventScroll: true });
    requestAnimationFrame(() => alignLens(pop));
  };
  const close = (focus = true) => {
    if (supports) { if (isOpen()) pop.hidePopover(); } else pop.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    if (focus) btn.focus();
  };
  btn.addEventListener('click', () => (isOpen() ? close() : open()));
  if (supports) pop.addEventListener('toggle', (e) => { if (e.newState === 'closed') btn.setAttribute('aria-expanded', 'false'); });
  pop.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    const tiles = $$('.brew-tile', pop);
    const i = tiles.indexOf(document.activeElement);
    if (i < 0) return;
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 4, ArrowUp: -4 }[e.key];
    if (step) { e.preventDefault(); tiles[(i + step + tiles.length) % tiles.length].focus(); }
  });
  if (!supports) document.addEventListener('pointerdown', (e) => { if (isOpen() && !pop.contains(e.target) && !btn.contains(e.target)) close(false); });
  addEventListener('resize', () => { if (isOpen()) place(); }, { passive: true });
}

function wireMenu() {
  const menu = $('#hn-menu');
  const btn = $('[data-menu-open]');
  if (!menu || !btn) return;
  btn.addEventListener('click', () => {
    btn.setAttribute('aria-expanded', 'true');
    openSheet(menu, btn);
    $('.sheet__close', menu)?.focus();
  });
  menu.addEventListener('hn:closed', () => btn.setAttribute('aria-expanded', 'false'));
  // switch helper text when the OS forces reduced transparency
  const help = $$('[data-switch-help]');
  const sync = () => {
    const forced = matchMedia('(prefers-reduced-transparency: reduce)').matches || matchMedia('(prefers-contrast: more)').matches;
    help.forEach((h) => { h.hidden = !forced; });
  };
  sync();
}

function wireFooter(footer) {
  const mq = matchMedia('(min-width: 1024px)');
  const groups = $$('[data-footer-group]', footer);
  const apply = () => groups.forEach((d) => {
    d.open = mq.matches;
    const s = d.querySelector('summary');
    if (mq.matches) s.setAttribute('tabindex', '-1'); else s.removeAttribute('tabindex');
  });
  apply();
  mq.addEventListener?.('change', apply);
  footer.addEventListener('click', (e) => { if (mq.matches && e.target.closest('summary')) e.preventDefault(); });
}

/* ==========================================================================
   Boot
   ========================================================================== */
let started = false;
export function initShell() {
  if (started) return;
  started = true;
  injectSprite();
  injectLane();
  initAnnounce();

  const header = $('[data-shell="header"]');
  if (header) {
    header.innerHTML = headerTemplate();
    header.classList.add('is-enhanced');
    capsule = $('[data-capsule]', header);
    initCapsuleScroll();
  }
  const footer = $('[data-shell="footer"]');
  if (footer) {
    footer.innerHTML = footerTemplate();
    footer.classList.add('is-enhanced');
    wireFooter(footer);
  }

  const layer = document.createElement('div');
  layer.className = 'shell-layer';
  layer.innerHTML = `${finderTemplate()}${menuTemplate()}
    <div class="toasts" id="hn-toasts"></div>
    <p class="visually-hidden" id="hn-live" aria-live="polite"></p>`;
  // overlays must be top-level: move each to <body>
  for (const el of [...layer.children]) document.body.append(el);

  $$('dialog.sheet').forEach(wireSheet);
  wireFinder();
  wireMenu();

  // warm the lazy drawer/quick-add module on intent (hover, touch, keyboard focus)
  const intent = (e) => { if (e.target.closest?.('[data-cart-open], [data-quick-add], [data-add]')) loadCartUI().catch(() => {}); };
  document.addEventListener('pointerover', intent, { passive: true });
  document.addEventListener('pointerdown', intent, { passive: true });
  document.addEventListener('focusin', intent);

  // delegation: cart open + quick add, anywhere on the page
  document.addEventListener('click', (e) => {
    const open = e.target.closest('[data-cart-open]');
    if (open && !e.metaKey && !e.ctrlKey && !e.shiftKey) { e.preventDefault(); openDrawer({ trigger: open }); return; }
    const qa = e.target.closest('[data-quick-add]');
    if (qa && qa.getAttribute('aria-disabled') !== 'true') {
      e.preventDefault();
      quickAdd(qa.dataset.quickAdd, { brew: qa.dataset.brew, trigger: qa });
      return;
    }
    if (e.target.closest('[data-island-close]')) hideIsland();
    else if (e.target.closest('[data-island-view]')) openDrawer({ trigger: $('.capsule__cart', capsule) });
    else if (e.target.closest('[data-island-edit]')) openDrawer({ trigger: $('.capsule__cart', capsule), focusKey: e.target.closest('[data-island-edit]').dataset.islandEdit, focus: 'grind' });
  });

  cart.on('threshold', ({ qualified }) => { if (qualified) announce('Your order now ships free.'); });
  cart.on('notice', (n) => { if (n.code === 'qty-max') toast(`${brand.cart?.maxQtyPerLine ?? 10} is the most per line.`); });
  for (const n of cart.takeNotices()) {
    if (n.code === 'missing') toast(n.name ? `${n.name} is no longer available, so we've taken it out of your cart.` : "A coffee in your cart is no longer available, so we've taken it out.");
  }
  document.addEventListener('hn:transparency', (e) => announce(`Reduced transparency ${e.detail.on ? 'on' : 'off'}`));
  document.addEventListener('hn:field-ready', () => requestAnimationFrame(refreshGlass));
}
