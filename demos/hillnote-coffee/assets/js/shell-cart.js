/* shell-cart.js: the lazily loaded half of the shell (cart drawer + quick-add
   sheet). shell.js imports it with import() on the first open (or on intent:
   pointer/focus on a cart or + Add control), so the drawer and quick-add
   templates and their wiring stay off the critical path on every page.

   Not a public API: call shell.js' openDrawer / openQuickAdd / quickAdd. Shared
   cart markup lives in components/cart-line.js. Evaluated only after shell.js
   has finished, so the circular import below is safe. */
import { brand, cart, format, url, productUrl, getBrewContext } from './main.js';
import { getProduct, getSize } from '../../data/products.js';
import { GRIND_OPTIONS, getGrind } from '../../data/brew-methods.js';
import { esc, icon, lens, brewerChip, FINDER_OPTIONS, slip } from './components/ui.js';
import { bagHTML } from './components/bag.js';
import { lineHTML, lineMeta, nudgeHTML } from './components/cart-line.js';
import { announce, toast, openSheet, closeSheet, wireSheet, tubeHTML, hideIsland, confirmAdd, flashAdded } from './shell.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- templates ------------------------------------------------------------- */
function drawerTemplate() {
  return `<dialog class="sheet sheet--right glass-sheet drawer" id="hn-drawer" aria-labelledby="hn-drawer-title">
    ${lens()}
    <div class="sheet__head plate plate--solid">
      <h2 class="sheet__title" id="hn-drawer-title">Your cart</h2>
      <button type="button" class="plate--btn plate squish sheet__close" data-sheet-close aria-label="Close cart">${icon('i-x')}</button>
    </div>
    <div class="drawer__keep"><button type="button" class="text-btn" data-sheet-close>${icon('i-chevron-right', 20, 'icon--flip')}Keep shopping</button></div>
    <div class="sheet__body drawer__body" data-drawer-body></div>
    <div class="sheet__toasts" aria-live="off"></div>
    <div class="sheet__foot plate plate--solid drawer__foot" data-drawer-foot></div>
    <p class="sheet__live visually-hidden" aria-live="polite"></p>
  </dialog>`;
}

function quickAddTemplate() {
  return `<dialog class="sheet sheet--bottom glass-sheet qa-sheet" id="hn-quick-add" aria-labelledby="hn-qa-title">
    ${lens()}
    <span class="sheet__handle" aria-hidden="true"></span>
    <div class="sheet__head plate plate--solid">
      <h2 class="sheet__title" id="hn-qa-title">Add</h2>
      <button type="button" class="plate--btn plate squish sheet__close" data-sheet-close aria-label="Close">${icon('i-x')}</button>
    </div>
    <form class="sheet__body qa-sheet__body" data-qa-form novalidate></form>
    <div class="sheet__toasts" aria-live="off"></div>
    <div class="sheet__foot plate plate--solid" data-qa-foot></div>
    <p class="sheet__live visually-hidden" aria-live="polite"></p>
  </dialog>`;
}

function emptyHTML() {
  return `<div class="drawer__empty">
    <h3 class="drawer__empty-h">Your cart is empty.</h3>
    <p>What do you brew with? Start there and we'll find your coffee.</p>
    ${slip('start with your brewer', 'drawer__slip')}
    <ul class="chip-row" role="list">${FINDER_OPTIONS.map((g) => `<li>${brewerChip(g, 'paper')}</li>`).join('')}</ul>
    <a class="btn btn--lg lacquer squish" href="${url('shop.html')}">Shop coffee</a>
  </div>`;
}

/* ==========================================================================
   Cart drawer
   ========================================================================== */
let drawer;
let pendingKeyMap = [];

function renderDrawer() {
  const body = $('[data-drawer-body]', drawer);
  const foot = $('[data-drawer-foot]', drawer);
  const active = document.activeElement;
  const fid = drawer.contains(active) ? active?.dataset?.fid : null;
  const lines = cart.getLines();
  const n = cart.count();
  $('#hn-drawer-title', drawer).textContent = n ? `Your cart (${n})` : 'Your cart';
  const storage = cart.isPersistent() ? '' : `<p class="notice">Your browser is blocking storage, so your cart won't be saved if you leave this page.</p>`;
  if (!lines.length) {
    body.innerHTML = storage + emptyHTML();
    foot.hidden = true;
  } else {
    body.innerHTML = `${storage}<div class="drawer__ship plate plate--solid">${tubeHTML()}</div>
      <ul class="cart-lines" role="list">${lines.map((l, i) => lineHTML(l, i, { idPrefix: 'dl' })).join('')}</ul>
      ${nudgeHTML({ id: 'hn-nudge-h' })}`;
    const t = cart.totals();
    foot.hidden = false;
    foot.innerHTML = `<div class="drawer__sum"><span>Subtotal</span><span class="drawer__subtotal">${format.formatPrice(t.subtotal)}</span></div>
      <p class="drawer__small">${cart.freeShipping().qualified ? 'Shipping: free' : 'Shipping calculated at checkout'}${brand.taxesIncluded ? ' · Prices include taxes.' : ''}</p>
      <a class="btn btn--lg btn--block lacquer squish" href="${url('checkout.html')}">Check out</a>
      <a class="link drawer__view" href="${url('cart.html')}">View cart</a>`;
  }
  if (fid) {
    let target = fid;
    for (const [a, b] of pendingKeyMap) target = target.replace(a, b);
    const el = $(`[data-fid="${CSS.escape(target)}"]`, drawer)
      ?? $(`[data-fid="${CSS.escape(target.replace(/^dec:/, 'inc:'))}"]`, drawer)
      ?? $('.cart-lines .cart-line__name', drawer) ?? $('.drawer__keep .text-btn', drawer);
    el?.focus({ preventScroll: true });
  }
  pendingKeyMap = [];
}

export function openDrawer({ trigger, focusKey, focus } = {}) {
  hideIsland(false);
  renderDrawer();
  openSheet(drawer, trigger ?? document.activeElement);
  if (focusKey) {
    const line = $$('.cart-line', drawer).find((li) => li.dataset.key === focusKey);
    const el = line && (focus === 'grind' ? $('[data-line-grind]', line) : $('.cart-line__name', line));
    if (el) { el.focus(); el.scrollIntoView({ block: 'nearest' }); }
  } else {
    $('.drawer__keep .text-btn', drawer)?.focus();
  }
}
export const closeDrawer = () => closeSheet(drawer);

function removeLine(key) {
  const res = cart.remove(key);
  if (!res.ok) return;
  const name = res.line.product.name;
  $('.drawer__keep .text-btn', drawer)?.focus();
  toast(`Removed ${name}.`, {
    actionLabel: 'Undo',
    ms: brand.cart?.undoMs ?? 5000,
    onAction: () => {
      const u = cart.undo();
      if (u.ok) {
        announce(`${name} is back in your cart.`);
        requestAnimationFrame(() => $$('.cart-line', drawer).find((li) => li.dataset.key === u.key)?.querySelector('.cart-line__name')?.focus());
      }
    },
    onExpire: () => cart.dropUndo(),
  });
}

function wireDrawer() {
  drawer.addEventListener('change', (e) => {
    const li = e.target.closest('.cart-line');
    if (!li) return;
    const key = li.dataset.key;
    const name = getProduct(key.split('|')[0])?.name ?? '';
    let res;
    if (e.target.matches('[data-line-grind]')) res = cart.setGrind(key, e.target.value);
    if (e.target.matches('[data-line-size]')) res = cart.setSize(key, e.target.value);
    if (res?.ok) {
      pendingKeyMap = [[key, res.key]];
      if (res.merged) announce(`Merged with your other ${name}, ${lineMeta(res.line)}.`);
      else announce(`${name} updated to ${lineMeta(res.line)}.`);
    }
  });
  drawer.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || btn.getAttribute('aria-disabled') === 'true') return;
    const key = btn.closest('.cart-line')?.dataset.key;
    if (btn.matches('[data-qty-inc], [data-qty-dec]')) {
      const l = cart.getLine(key);
      const n = l.qty + (btn.matches('[data-qty-inc]') ? 1 : -1);
      if (n < 1) return removeLine(key);
      cart.setQty(key, n);
      announce(`${l.product.name} quantity updated to ${Math.min(n, brand.cart?.maxQtyPerLine ?? 10)}.`);
    } else if (btn.matches('[data-line-remove]')) {
      removeLine(key);
    } else if (btn.matches('[data-nudge-add]')) {
      const res = cart.add({ slug: btn.dataset.slug, size: btn.dataset.size, grind: btn.dataset.grind || null });
      if (res.ok) announce(`Added ${res.line.product.name}, ${lineMeta(res.line)}, to your cart.`);
    }
  });
  cart.on('change', () => { if (drawer.open) renderDrawer(); });
}

/* ==========================================================================
   Quick add
   ========================================================================== */
let qaSheet;
let qaState = null;

export function openQuickAdd(slug, { trigger, grind, size } = {}) {
  const p = getProduct(slug);
  if (!p) return;
  const rec = p.brewMethods ?? [];
  const pre = grind ?? getBrewContext();
  qaState = { slug, size: getSize(p, size)?.label ?? p.sizes[0].label, grind: pre && getGrind(pre) ? pre : null, trigger };
  const opts = [...GRIND_OPTIONS].sort((a, b) => {
    const ia = rec.indexOf(a.id), ib = rec.indexOf(b.id);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  $('#hn-qa-title', qaSheet).textContent = `Add ${p.name}`;
  $('[data-qa-form]', qaSheet).innerHTML = `
    <div class="qa-sheet__product">${bagHTML(p, { label: false, decorative: true })}<p><strong>${esc(p.name)}</strong><span>${esc(p.tagline ?? '')}</span></p></div>
    <fieldset class="field-group">
      <legend class="field-group__legend">Bag size</legend>
      <div class="size-cards">${p.sizes.map((s, i) => `<label class="size-card">
        <input type="radio" name="qa-size" value="${esc(s.label)}"${s.label === qaState.size ? ' checked' : ''}>
        <span class="size-card__label">${esc(s.label)}</span>
        <span class="size-card__sub">${s.grams ? esc(format.formatPer100g(s.price, s.grams)) : format.formatPrice(s.price)}</span>
        ${i > 0 && s.grams ? `<span class="size-card__tag">Save ${Math.round((1 - (s.price / s.grams) / (p.sizes[0].price / p.sizes[0].grams)) * 100)}%</span>` : ''}
      </label>`).join('')}</div>
    </fieldset>
    <fieldset class="field-group" data-qa-grind>
      <legend class="field-group__legend field-group__legend--display">How will you brew it?</legend>
      <div class="grind-pills">${opts.map((g) => `<label class="grind-pill">
        <input type="radio" name="qa-grind" value="${g.id}"${g.id === qaState.grind ? ' checked' : ''}>
        ${icon(`i-${g.id}`, 20)}<span class="grind-pill__label">${esc(g.label)}</span><span class="grind-pill__grind">${esc(g.grind)}</span>
        ${rec.includes(g.id) && rec.indexOf(g.id) < 2 ? '<span class="grind-pill__rec">Recommended</span>' : ''}
      </label>`).join('')}</div>
      <p class="field-msg" data-qa-msg role="alert" hidden>${icon('i-x', 16)}Pick how you'll brew it first</p>
    </fieldset>`;
  renderQaFoot();
  openSheet(qaSheet, trigger);
  ($('input[name="qa-grind"]:checked', qaSheet) ?? $('input[name="qa-size"]:checked', qaSheet))?.focus();
}
function renderQaFoot() {
  const p = getProduct(qaState.slug);
  const price = getSize(p, qaState.size).price;
  const ready = !!qaState.grind;
  $('[data-qa-foot]', qaSheet).innerHTML = `
    <button type="button" class="btn btn--lg btn--block lacquer squish" data-qa-add${ready ? '' : ' aria-disabled="true"'}>${ready ? `Add to cart · ${format.formatPrice(price)}` : 'Choose a grind'}</button>
    <a class="link link--arrow qa-sheet__more" href="${esc(productUrl(p.slug, qaState.grind))}">See full details <span aria-hidden="true">→</span></a>`;
}
function wireQuickAdd() {
  qaSheet.addEventListener('change', (e) => {
    if (e.target.name === 'qa-size') qaState.size = e.target.value;
    if (e.target.name === 'qa-grind') { qaState.grind = e.target.value; $('[data-qa-msg]', qaSheet).hidden = true; }
    renderQaFoot();
  });
  qaSheet.addEventListener('submit', (e) => e.preventDefault());
  qaSheet.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-qa-add]');
    if (!btn) return;
    if (btn.getAttribute('aria-disabled') === 'true') {
      $('[data-qa-msg]', qaSheet).hidden = false;
      const first = $('input[name="qa-grind"]', qaSheet);
      first.closest('fieldset').scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
      first.focus({ preventScroll: true });
      return;
    }
    const res = cart.add({ slug: qaState.slug, size: qaState.size, grind: qaState.grind });
    if (!res.ok) return toast("That didn't work. Please try again.");
    cart.setBrewPref(qaState.grind);
    const trigger = qaState.trigger;
    closeSheet(qaSheet, { restoreFocus: !res.openDrawer, instant: res.openDrawer });
    flashAdded(trigger);
    confirmAdd(res, trigger);
  });
}

/* ---- mount (runs once, on first import) ----------------------------------- */
const host = document.createElement('div');
host.innerHTML = drawerTemplate() + quickAddTemplate();
const toasts = $('#hn-toasts');
for (const el of [...host.children]) document.body.insertBefore(el, toasts);
drawer = $('#hn-drawer');
qaSheet = $('#hn-quick-add');
wireSheet(drawer);
wireSheet(qaSheet);
wireDrawer();
wireQuickAdd();
