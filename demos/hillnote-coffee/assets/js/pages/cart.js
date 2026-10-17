/* pages/cart.js: the cart page (DESIGN §7.16, SITEMAP §3.4b, COPY §5.3).
   Lines: a ruled <table> at ≥ 1024 px, Paper cards below (re-rendered on the
   breakpoint so table semantics are never faked with CSS). Editable size,
   grind and qty; Remove → Undo toast; liquid tube; nudge; standard/express
   via cart.totals(method) (the choice is carried to checkout in
   sessionStorage `${prefix}shipMethod`); empty state with brewer chips. */
import { registerPage, brand, cart, format } from '../main.js';
import { PRODUCTS, ACCESSORIES } from '../../../data/products.js';
import { getGrind } from '../../../data/brew-methods.js';
import { tubeHTML, announce, toast } from '../shell.js';
import { lineParts, nudgeHTML } from '../components/cart-line.js';
import { renderProductList } from '../components/product-card.js';
import { esc, brewerChip, FINDER_OPTIONS } from '../components/ui.js';
import { contours } from '../contours.js';
import { refreshGlass } from '../glass.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const MAX = brand.cart?.maxQtyPerLine ?? 10;
const SHIP_KEY = `${brand.storagePrefix}shipMethod`;
const wide = matchMedia('(min-width: 1024px)');
const price = format.formatPrice;
const grindName = (id) => getGrind(id)?.label ?? '';
const meta = (l) => (l.accessory ? 'One size' : `${l.size} · ${grindName(l.grind)}`);

export function getShipMethod() {
  try { return sessionStorage.getItem(SHIP_KEY) === 'express' ? 'express' : 'standard'; } catch { return 'standard'; }
}
function setShipMethod(m) {
  try { sessionStorage.setItem(SHIP_KEY, m); } catch { /* session only */ }
}

/* ---- line controls: shared markup with the drawer (components/cart-line.js) */
const controls = (l, i) => lineParts(l, i, { idPrefix: 'cl' });

function cardsHTML(lines) {
  return `<ul class="cart-lines cartpg__cards" role="list">${lines.map((l, i) => {
    const c = controls(l, i);
    return `<li class="cart-line" data-key="${esc(l.key)}">${c.thumb}
      <div class="cart-line__body">
        <div class="cartpg__card-top">${c.name}<p class="cart-line__price">${price(l.lineTotal)}</p></div>
        <p class="cartpg__meta">${esc(meta(l))} · ${price(l.unitPrice)} each</p>
        <div class="cart-line__opts">${c.size}${c.grind}</div>
        ${c.warn}
        <div class="cart-line__row">${c.stepper}</div>
      </div>
    </li>`;
  }).join('')}</ul>`;
}

function tableHTML(lines) {
  return `<table class="cart-table">
    <caption class="visually-hidden">Coffees in your cart</caption>
    <thead><tr>
      <th scope="col">Coffee</th><th scope="col">Size &amp; grind</th><th scope="col" class="num">Price</th>
      <th scope="col">Quantity</th><th scope="col" class="num">Total</th>
    </tr></thead>
    <tbody>${lines.map((l, i) => {
      const c = controls(l, i);
      return `<tr data-key="${esc(l.key)}">
        <th scope="row"><div class="cart-table__item">${c.thumb}<span class="cart-table__name">${c.name}<span class="cartpg__meta">${esc(meta(l))}</span>${c.warn}</span></div></th>
        <td><div class="cart-line__opts">${c.size}${c.grind}</div></td>
        <td class="num">${price(l.unitPrice)}</td>
        <td>${c.stepper}</td>
        <td class="num cart-line__price">${price(l.lineTotal)}</td>
      </tr>`;
    }).join('')}</tbody>
  </table>`;
}

/* ---- tube: update in place so the success sweep plays only on crossing --- */
/* C-15: ≥ 1024 the shipping tube heads the summary column, so the table and
   the summary start on one line; below that it stays under the H1. */
function placeTube() {
  const host = $('[data-cart-tube]');
  const target = wide.matches ? $('[data-cart-summary-card]') : $('.cartpg__head');
  if (wide.matches) { if (host.parentElement !== target) target.prepend(host); }
  else if (host.parentElement !== target) $('#cart-title').after(host);
}
function renderTube() {
  placeTube();
  const host = $('[data-cart-tube]');
  const fs = cart.freeShipping();
  const tube = $('.tube', host);
  if (!tube || tube.classList.contains('is-full') !== fs.qualified) { host.innerHTML = tubeHTML(fs); return; }
  const track = $('.tube__track', tube);
  $('.tube__fill', tube).style.setProperty('--p', `${Math.round(fs.progress * 1000) / 10}%`);
  track.setAttribute('aria-valuenow', String(Math.min(fs.subtotal, fs.threshold)));
  track.setAttribute('aria-valuetext', `${price(fs.subtotal)} of ${price(fs.threshold)}`);
  const gap = $('.tube__gap', tube);
  if (gap) gap.textContent = price(fs.gap);
}

/* ---- nudge (≤ 1, below the threshold only) ------------------------------- */
function renderNudge() {
  $('[data-cart-nudge]').innerHTML = nudgeHTML({ id: 'cp-nudge-h', cls: 'cartpg__nudge' });
}

/* ---- summary ------------------------------------------------------------- */
function renderSummary() {
  const m = getShipMethod();
  const t = cart.totals(m);
  const std = cart.totals('standard').shipping;
  const opts = $('[data-ship-opts]');
  const optHTML = (id, label, days, cost) => `<label class="size-card ship-card">
      <input type="radio" name="ship" value="${id}"${m === id ? ' checked' : ''} data-fid="ship:${id}">
      <span class="size-card__label">${label} <span class="ship-card__cost">${cost === 0 ? 'Free' : price(cost)}</span></span>
      <span class="size-card__sub">${esc(days)}</span>
    </label>`;
  opts.innerHTML = optHTML('standard', 'Standard', brand.shipping.standardDays, std)
    + optHTML('express', 'Express', brand.shipping.expressDays, brand.shippingExpress);
  $('[data-summary-rows]').innerHTML = `
    <div><dt>Subtotal</dt><dd>${price(t.subtotal)}</dd></div>
    <div><dt>Shipping (estimated)</dt><dd>${t.shipping === 0 ? 'Free' : price(t.shipping)}</dd></div>
    <div class="summary-rows__total"><dt>Total</dt><dd>${price(t.total)}</dd></div>`;
  $('[data-cart-bar-total]').textContent = price(t.total);
  // contour signature: the first coffee's altitude, in its bag colour
  const first = cart.getLines().find((l) => !l.accessory);
  const scope = $('[data-summary-scope]');
  const topo = $('[data-summary-topo]');
  const seed = first ? first.slug : 'cart';
  if (topo.dataset.seed !== seed) {
    topo.dataset.seed = seed;
    scope.style.setProperty('--bag', first ? first.product.image.bagColor : 'var(--pine)');
    topo.innerHTML = contours(first?.product.origin?.altitudeM ?? [1200, 1500], `${seed}-summary`, { w: 400, h: 120, strokeWidth: 1.5 }).svg;
  }
}

/* ---- pairs well: 3 items not in the cart (accessories first) ------------- */
function renderPairs() {
  const host = $('[data-cart-pairs]');
  const inCart = new Set(cart.getLines().map((l) => l.slug));
  const pool = [...ACCESSORIES, ...[...PRODUCTS].sort((a, b) => (a.featured ?? 99) - (b.featured ?? 99))]
    .filter((p) => !inCart.has(p.slug) && p.inStock !== false);
  const pick = pool.slice(0, 3);
  const sig = pick.map((p) => p.slug).join();
  if (host.dataset.sig === sig) return;
  host.dataset.sig = sig;
  host.innerHTML = pick.length ? renderProductList(pick, { heading: 'h3', label: 'Pairs well with your cart' }) : '';
  $('[data-cart-pairs-wrap]').hidden = !pick.length;
}

/* ---- notices (storage blocked) ------------------------------------------- */
function renderNotices() {
  $('[data-cart-notices]').innerHTML = cart.isPersistent() ? ''
    : `<p class="notice">Your browser is blocking storage, so your cart won't be saved if you leave this page.</p>`;
}

/* ---- full render ---------------------------------------------------------- */
let pendingFocus = null;
function render() {
  const lines = cart.getLines();
  const empty = lines.length === 0;
  const filled = $('[data-cart-filled]');
  const emptyEl = $('[data-cart-empty]');
  const wasEmpty = filled.hidden;
  filled.hidden = empty;
  emptyEl.hidden = !empty;
  $('[data-cart-bar]').hidden = empty;
  document.title = `${empty ? 'Your cart is empty' : 'Your cart'} | ${brand.name}`;
  if (empty) {
    pendingFocus = null;
    const lost = !document.activeElement || document.activeElement === document.body || !document.activeElement.isConnected;
    if (!wasEmpty && lost) $('#cart-empty-h').focus({ preventScroll: true });
    return;
  }
  const active = document.activeElement;
  const fid = pendingFocus ?? ($('[data-cart-lines]').contains(active) || $('[data-cart-nudge]').contains(active) || $('[data-ship-opts]').contains(active) ? active.dataset.fid : null);
  pendingFocus = null;

  const n = cart.count();
  $('[data-cart-page-count]').textContent = `(${n})`;
  $('[data-cart-page-count]').setAttribute('aria-label', format.cartCountLabel(n).replace('Cart, ', ''));
  renderNotices();
  renderTube();
  $('[data-cart-lines]').innerHTML = wide.matches ? tableHTML(lines) : cardsHTML(lines);
  renderNudge();
  renderSummary();
  renderPairs();
  $('[data-brand-taxes]').hidden = !brand.taxesIncluded;

  if (fid) {
    const el = $(`[data-fid="${CSS.escape(fid)}"]`)
      ?? $(`[data-fid="${CSS.escape(fid.replace(/^dec:/, 'inc:'))}"]`);
    if (el) el.focus({ preventScroll: true });
    else $('#cart-title').focus({ preventScroll: true });
  }
  requestAnimationFrame(refreshGlass);
}

/* ---- actions ----------------------------------------------------------------
   Page-initiated mutations run "muted": the change listener skips its render
   and we render once, with focus aimed at the right control. */
let muted = false;
function mutate(fn, focus) {
  muted = true;
  let res;
  try { res = fn(); } finally { muted = false; }
  pendingFocus = typeof focus === 'function' ? focus(res) : focus;
  render();
  return res;
}

function removeLine(key) {
  const lines = cart.getLines();
  const idx = lines.findIndex((l) => l.key === key);
  const next = lines[idx + 1] ?? lines[idx - 1];
  const res = mutate(() => cart.remove(key), next ? `name:${next.key}` : null);
  if (!res.ok) return;
  const name = res.line.product.name;
  const t = toast(`Removed ${name}.`, {
    actionLabel: 'Undo',
    ms: brand.cart?.undoMs ?? 5000,
    onAction: () => {
      const u = mutate(() => cart.undo(), (r) => (r.ok ? `name:${r.key}` : null));
      if (u.ok) announce(`${name} is back in your cart.`);
    },
    onExpire: () => cart.dropUndo(),
  });
  // Keyboard path to Undo: focus it (the toast pauses while focused). The
  // toast is announced politely by shell.toast().
  t.el.querySelector('.toast__action')?.focus({ preventScroll: true });
}

function wire() {
  const main = $('main');
  main.addEventListener('change', (e) => {
    const row = e.target.closest('[data-key]');
    if (e.target.name === 'ship') {
      setShipMethod(e.target.value);
      const t = cart.totals(e.target.value);
      mutate(() => null, `ship:${e.target.value}`);
      announce(`${e.target.value === 'express' ? 'Express' : 'Standard'} shipping. Total ${price(t.total)}.`);
      return;
    }
    if (!row) return;
    const key = row.dataset.key;
    const name = cart.getLine(key)?.product.name ?? '';
    const isGrind = e.target.matches('[data-line-grind]');
    if (!isGrind && !e.target.matches('[data-line-size]')) return;
    // keep focus on the control the shopper just used, under the line's new key
    const res = mutate(() => (isGrind ? cart.setGrind(key, e.target.value) : cart.setSize(key, e.target.value)),
      (r) => (r.ok ? `${isGrind ? 'grind' : 'size'}:${r.key}` : null));
    if (!res?.ok) return;
    announce(res.merged ? `Merged with your other ${name}, ${res.line.size} · ${grindName(res.line.grind) || 'One size'}.` : `${name} updated to ${meta(res.line)}.`);
  });
  main.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || btn.getAttribute('aria-disabled') === 'true') return;
    const key = btn.closest('[data-key]')?.dataset.key;
    if (btn.matches('[data-qty-inc], [data-qty-dec]')) {
      const l = cart.getLine(key);
      const n = l.qty + (btn.matches('[data-qty-inc]') ? 1 : -1);
      if (n < 1) return removeLine(key);
      mutate(() => cart.setQty(key, n), btn.dataset.fid);
      announce(`${l.product.name} quantity updated to ${Math.min(n, MAX)}.`);
    } else if (btn.matches('[data-line-remove]')) {
      removeLine(key);
    } else if (btn.matches('[data-nudge-add]')) {
      const res = mutate(() => cart.add({ slug: btn.dataset.slug, size: btn.dataset.size, grind: btn.dataset.grind || null }), (r) => (r.ok ? `name:${r.key}` : null));
      if (res.ok) {
        announce(`Added ${res.line.product.name}, ${meta(res.line)}, to your cart.`);
      } else toast("That didn't work. Please try again.");
    }
  });
}

/* Mobile bottom bar: hide while the summary's own Check out is on screen,
   so there is never two of the same button in view. */
function watchBar() {
  const target = $('[data-summary-checkout]');
  const bar = $('[data-cart-bar]');
  if (!('IntersectionObserver' in window)) return;
  new IntersectionObserver(([e]) => bar.classList.toggle('is-tucked', e.isIntersecting), { threshold: 0.5 }).observe(target);
}

registerPage('cart', () => {
  $('[data-cart-chips]').innerHTML = FINDER_OPTIONS.map((g) => `<li>${brewerChip(g, 'paper')}</li>`).join('');
  $('[data-empty-topo]').innerHTML = contours([1100, 1600], 'empty-cart', { w: 480, h: 160, strokeWidth: 1.5 }).svg;
  render();
  wire();
  watchBar();
  cart.on('change', (d) => { if (!muted && d.reason !== 'brewPref') render(); });
  wide.addEventListener?.('change', render);
});
