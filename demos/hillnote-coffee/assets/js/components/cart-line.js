/* components/cart-line.js: shared cart markup (drawer + cart page).
   Pure templates, no DOM wiring, no shell dependency, so the cart page can
   import it without pulling in the lazily loaded drawer module.

   lineParts(line, i, { idPrefix })  → { thumb, name, size, grind, stepper, remove, warn }
                                       (`remove` is kept for the cart page until C-15
                                       drops it; the stepper's trash at qty 1 is THE
                                       remove control, B-13)
   lineHTML(line, i, { idPrefix })   → the drawer's Paper card <li class="cart-line">
   nudgeHTML({ id, cls })            → the free-shipping nudge <section> or ''

   Hooks (identical in drawer and page, so one wiring pattern works anywhere):
   [data-line-size] [data-line-grind] [data-qty-dec] [data-qty-inc]
   [data-line-remove] [data-nudge-add] and data-fid="{kind}:{line key}" for
   focus restore after a re-render (kinds: name size grind dec inc rm nudge). */
import { brand, cart, format, productUrl } from '../main.js';
import { GRIND_OPTIONS, getGrind } from '../../../data/brew-methods.js';
import { esc, icon } from './ui.js';
import { bagHTML } from './bag.js';

const MAX = () => brand.cart?.maxQtyPerLine ?? 10;
export const grindName = (id) => (id ? getGrind(id)?.label ?? '' : 'One size');
/** "250 g · French press" / "One size" */
export const lineMeta = (l) => (l.accessory ? 'One size' : `${l.size} · ${grindName(l.grind)}`);

export function lineParts(l, i, { idPrefix = 'dl' } = {}) {
  const p = l.product;
  const href = esc(productUrl(p.slug));
  const k = esc(l.key);
  const id = `${idPrefix}-${i}`;
  const size = p.sizes.length > 1
    ? `<label class="visually-hidden" for="${id}-size">Size for ${esc(p.name)}</label>
       <select class="select select--sm" id="${id}-size" data-line-size data-fid="size:${k}">${p.sizes.map((s) => `<option${s.label === l.size ? ' selected' : ''}>${esc(s.label)}</option>`).join('')}</select>`
    : `<span class="cart-line__fixed">${esc(l.accessory ? 'One size' : l.size)}</span>`;
  const grind = l.accessory ? '' : `<label class="visually-hidden" for="${id}-grind">Grind for ${esc(p.name)}</label>
       <select class="select select--sm" id="${id}-grind" data-line-grind data-fid="grind:${k}">${GRIND_OPTIONS.map((g) => `<option value="${g.id}"${g.id === l.grind ? ' selected' : ''}>${esc(g.label)}</option>`).join('')}</select>`;
  const dec = l.qty <= 1
    ? `<button type="button" class="stepper__btn" data-qty-dec data-fid="dec:${k}" aria-label="Remove ${esc(p.name)}, ${esc(l.accessory ? 'one size' : l.size)}">${icon('i-trash', 18)}</button>`
    : `<button type="button" class="stepper__btn" data-qty-dec data-fid="dec:${k}" aria-label="Decrease quantity of ${esc(p.name)}">${icon('i-minus', 18)}</button>`;
  const stepper = `<div class="stepper" role="group" aria-label="Quantity of ${esc(p.name)}">${dec}
      <output class="stepper__value" aria-label="Quantity">${l.qty}</output>
      <button type="button" class="stepper__btn" data-qty-inc data-fid="inc:${k}" aria-label="Increase quantity of ${esc(p.name)}"${l.qty >= MAX() ? ' aria-disabled="true"' : ''}>${icon('i-plus', 18)}</button></div>`;
  return {
    size, grind, stepper,
    thumb: `<a class="cart-line__thumb" href="${href}" tabindex="-1" aria-hidden="true">${bagHTML(p, { label: false, decorative: true })}</a>`,
    name: `<a class="cart-line__name" href="${href}" data-fid="name:${k}">${esc(p.name)}</a>`,
    remove: `<button type="button" class="text-btn text-btn--clay cart-line__remove" data-line-remove data-fid="rm:${k}">Remove<span class="visually-hidden"> ${esc(p.name)}</span></button>`,
    warn: l.available ? '' : `<p class="cart-line__warn">${esc(p.name)} has sold out. We've kept it in your cart but it won't be included at checkout.</p>`,
  };
}

/** Drawer card. */
export function lineHTML(l, i, opts) {
  const c = lineParts(l, i, opts);
  return `<li class="cart-line" data-key="${esc(l.key)}">
    ${c.thumb}
    <div class="cart-line__body">
      ${c.name}
      <div class="cart-line__opts">${c.size}${c.grind}</div>
      ${c.warn}
      <div class="cart-line__row">${c.stepper}<p class="cart-line__price">${format.formatPrice(l.lineTotal)}</p></div>
    </div>
  </li>`;
}

/** Free-shipping nudge (≤ 1, below the threshold, features.cart.nudge). */
export function nudgeHTML({ id = 'hn-nudge-h', cls = '' } = {}) {
  if (!brand.features?.cart?.nudge) return '';
  const n = cart.nudge();
  if (!n) return '';
  const gap = cart.freeShipping().gap;
  const g = n.grind ? grindName(n.grind) : '';
  const href = esc(productUrl(n.product.slug));
  const aria = `Add ${n.product.name}, ${n.size}${g ? `, ${g}` : ''}`;
  // one-line title: the short name; size / pack / grind go on the meta line (B-14)
  const title = n.product.shortName ?? n.product.name;
  const meta = n.product.pack ?? (n.size === 'One size' ? '' : n.size);
  return `<section class="nudge${cls ? ` ${cls}` : ''}" aria-labelledby="${id}">
    <a class="nudge__thumb" href="${href}" tabindex="-1" aria-hidden="true">${bagHTML(n.product, { label: false, decorative: true })}</a>
    <div class="nudge__body">
      <h3 class="nudge__h" id="${id}">Add this for free shipping</h3>
      <p class="nudge__name"><a href="${href}">${esc(title)}</a></p>
      ${meta || g ? `<p class="nudge__meta">${esc([meta, g].filter(Boolean).join(' · '))}</p>` : ''}
      <p class="nudge__line">${n.price >= gap ? `${format.formatPrice(n.price)} closes the gap.` : format.formatPrice(n.price)}</p>
    </div>
    <button type="button" class="add-pill lacquer squish" data-nudge-add data-fid="nudge" data-slug="${esc(n.product.slug)}" data-size="${esc(n.size)}" data-grind="${esc(n.grind ?? '')}" aria-label="${esc(aria)}">${icon('i-plus', 16)}<span class="add-pill__text">Add</span></button>
  </section>`;
}
