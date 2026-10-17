/* store.js: cart + shopper preferences. State only, NO DOM / UI code.

   Persistence
     localStorage  `${prefix}cart`      [{ slug, size, grind, qty }]  (line key = slug|size|grind)
     localStorage  `${prefix}brewPref`  a grind id, e.g. "french-press"
     sessionStorage `${prefix}firstAddDone`  "1" after the first add of a session
   Every storage call is wrapped in try/catch; if storage is blocked the cart
   lives in memory and isPersistent() is false (UI shows COPY §14 notice).
   Prices are NEVER stored: they are re-read from data/products.js.

   Events (subscribe with cart.on(type, fn) → returns an unsubscribe fn;
   fn receives the event detail object):
     change     every mutation. detail { reason, ...reasonDetail }
     add        detail { key, line, merged, capped, firstAddOfSession, openDrawer }
     update     detail { key, prevKey, line, merged }   (qty / size / grind)
     remove     detail { key, line, index }             (undo() is possible)
     undo       detail { key, line }
     clear      detail {}
     threshold  detail { qualified }   free-shipping threshold crossed either way
     notice     detail { code, name, slug }  codes: missing | sold-out | qty-max | storage
     sync       detail {}   cart changed in another tab

   Usage:  import { cart } from './store.js';
   Tests:  import { createStore } from './store.js'; createStore({ storage, session }) */

import brand from '../../brand.config.js';
import { getProduct, getSize, isAccessory, ACCESSORIES, PRODUCTS } from '../../data/products.js';
import { isValidGrind } from '../../data/brew-methods.js';

const lineKey = (l) => `${l.slug}|${l.size}|${l.grind ?? ''}`;

/** Wrap a Web Storage object so it never throws; falls back to memory. */
function safeStorage(getter) {
  let s = null;
  try {
    s = getter();
    const t = '__hn_test__';
    s.setItem(t, t);
    s.removeItem(t);
  } catch {
    s = null;
  }
  const mem = new Map();
  return {
    persistent: !!s,
    get(k) { try { return s ? s.getItem(k) : mem.get(k) ?? null; } catch { return mem.get(k) ?? null; } },
    set(k, v) { try { s ? s.setItem(k, v) : mem.set(k, v); } catch { mem.set(k, v); } },
    remove(k) { try { s ? s.removeItem(k) : mem.delete(k); } catch { mem.delete(k); } },
  };
}

export function createStore({
  storage = safeStorage(() => globalThis.localStorage),
  session = safeStorage(() => globalThis.sessionStorage),
  config = brand,
} = {}) {
  const P = config.storagePrefix ?? '';
  const KEY_CART = `${P}cart`;
  const KEY_BREW = `${P}brewPref`;
  const KEY_FIRST = `${P}firstAddDone`;
  const MAX = config.cart?.maxQtyPerLine ?? 10;
  const bus = new EventTarget();
  let lines = [];
  let lastRemoved = null; // { line, index }
  const notices = [];

  /* ---- events ---- */
  const emit = (type, detail = {}) => bus.dispatchEvent(Object.assign(new Event(type), { detail }));
  const on = (type, fn) => {
    const h = (e) => fn(e.detail);
    bus.addEventListener(type, h);
    return () => bus.removeEventListener(type, h);
  };
  const notice = (code, extra = {}) => {
    const n = { code, ...extra };
    notices.push(n);
    emit('notice', n);
  };

  /* ---- load + sanitise ---- */
  function sanitise(raw) {
    const out = [];
    for (const l of Array.isArray(raw) ? raw : []) {
      const p = getProduct(l?.slug);
      // name: null when the product can't be resolved (never show a raw slug, B-16)
      if (!p) { notice('missing', { slug: l?.slug ?? null, name: typeof l?.name === 'string' ? l.name : null }); continue; }
      if (!getSize(p, l.size)) { notice('missing', { slug: p.slug, name: p.name }); continue; }
      const grind = isAccessory(p) ? null : isValidGrind(l.grind) ? l.grind : 'whole-bean';
      const qty = Math.min(MAX, Math.max(1, Math.floor(Number(l.qty) || 1)));
      const line = { slug: p.slug, size: l.size, grind, qty };
      const dup = out.find((x) => lineKey(x) === lineKey(line));
      if (dup) dup.qty = Math.min(MAX, dup.qty + qty); else out.push(line);
      if (p.inStock === false) notice('sold-out', { slug: p.slug, name: p.name });
    }
    return out;
  }
  function load() {
    let raw = [];
    try { raw = JSON.parse(storage.get(KEY_CART) || '[]'); } catch { raw = []; }
    lines = sanitise(raw);
  }
  load();
  if (!storage.persistent) notice('storage');

  /* ---- derived ---- */
  function enrich(l) {
    const product = getProduct(l.slug);
    const size = getSize(product, l.size);
    const available = product.inStock !== false;
    return {
      key: lineKey(l), slug: l.slug, size: l.size, grind: l.grind, qty: l.qty,
      product, grams: size.grams, unitPrice: size.price,
      lineTotal: size.price * l.qty, available,
      accessory: isAccessory(product),
    };
  }
  const getLines = () => lines.map(enrich);
  const getLine = (key) => { const l = lines.find((x) => lineKey(x) === key); return l ? enrich(l) : null; };
  const count = () => lines.reduce((n, l) => n + l.qty, 0);
  const subtotal = () => getLines().reduce((s, l) => s + (l.available ? l.lineTotal : 0), 0);

  function freeShipping() {
    const threshold = config.freeShippingThreshold;
    const sub = subtotal();
    return {
      threshold, subtotal: sub,
      gap: Math.max(0, threshold - sub),
      progress: threshold > 0 ? Math.min(1, sub / threshold) : 1,
      qualified: sub >= threshold,
    };
  }
  /** method: 'standard' | 'express'. Standard is free at/above the threshold. */
  function totals(method = 'standard') {
    const sub = subtotal();
    const fs = freeShipping();
    let shipping = method === 'express' ? config.shippingExpress : fs.qualified ? 0 : config.shippingFlat;
    if (sub === 0) shipping = 0;
    return { subtotal: sub, shipping, total: sub + shipping, method, freeShipping: shipping === 0 && sub > 0, count: count() };
  }

  /* ---- commit ---- */
  function commit(reason, detail = {}) {
    const before = commit.qualified ?? freeShipping().qualified;
    storage.set(KEY_CART, JSON.stringify(lines));
    const after = freeShipping().qualified;
    commit.qualified = after;
    emit(reason, detail);
    emit('change', { reason, ...detail });
    if (before !== after) emit('threshold', { qualified: after });
  }
  commit.qualified = freeShipping().qualified;

  /* ---- mutations ---- */
  /**
   * add({ slug, size?, grind?, qty? })
   * size defaults to the product's first size; coffees need a grind
   * (whole-bean counts), accessories ignore it.
   * @returns { ok, error?, key, line, merged, capped, firstAddOfSession, openDrawer }
   */
  function add({ slug, size, grind, qty = 1 } = {}) {
    const p = getProduct(slug);
    if (!p) return { ok: false, error: 'unknown-product' };
    if (p.inStock === false) return { ok: false, error: 'sold-out' };
    const s = getSize(p, size);
    if (!s) return { ok: false, error: 'unknown-size' };
    const g = isAccessory(p) ? null : grind;
    if (!isAccessory(p) && !isValidGrind(g)) return { ok: false, error: 'grind-required' };
    const n = Math.max(1, Math.floor(Number(qty) || 1));
    const line = { slug, size: s.label, grind: g, qty: n };
    const key = lineKey(line);
    const existing = lines.find((x) => lineKey(x) === key);
    let capped = false;
    if (existing) {
      capped = existing.qty + n > MAX;
      existing.qty = Math.min(MAX, existing.qty + n);
    } else {
      capped = n > MAX;
      line.qty = Math.min(MAX, n);
      lines.push(line);
    }
    if (capped) notice('qty-max', { slug, name: p.name });
    const firstAddOfSession = session.get(KEY_FIRST) !== '1';
    session.set(KEY_FIRST, '1');
    const openDrawer = !!config.features?.cart?.openDrawerOnFirstAdd && firstAddOfSession;
    const res = { ok: true, key, line: getLine(key), merged: !!existing, capped, firstAddOfSession, openDrawer };
    commit('add', res);
    return res;
  }

  /** setQty(key, n): n ≤ 0 removes the line; n > max is capped (notice qty-max). */
  function setQty(key, qty) {
    const l = lines.find((x) => lineKey(x) === key);
    if (!l) return { ok: false, error: 'unknown-line' };
    const n = Math.floor(Number(qty));
    if (!(n > 0)) return remove(key);
    if (n > MAX) notice('qty-max', { slug: l.slug, name: getProduct(l.slug).name });
    l.qty = Math.min(MAX, n);
    const res = { ok: true, key, prevKey: key, line: getLine(key), merged: false };
    commit('update', res);
    return res;
  }

  /**
   * updateLine(key, { size?, grind? }): change size and/or grind in place.
   * If the new key matches another line, the two merge (qty summed, capped).
   * @returns { ok, key (new), prevKey, line, merged }
   */
  function updateLine(key, { size, grind } = {}) {
    const idx = lines.findIndex((x) => lineKey(x) === key);
    if (idx < 0) return { ok: false, error: 'unknown-line' };
    const l = lines[idx];
    const p = getProduct(l.slug);
    const next = { ...l };
    if (size !== undefined) {
      const s = getSize(p, size);
      if (!s) return { ok: false, error: 'unknown-size' };
      next.size = s.label;
    }
    if (grind !== undefined && !isAccessory(p)) {
      if (!isValidGrind(grind)) return { ok: false, error: 'unknown-grind' };
      next.grind = grind;
    }
    const newKey = lineKey(next);
    if (newKey === key) return { ok: true, key, prevKey: key, line: getLine(key), merged: false };
    const other = lines.find((x) => lineKey(x) === newKey);
    let merged = false;
    if (other) {
      other.qty = Math.min(MAX, other.qty + l.qty);
      lines.splice(idx, 1);
      merged = true;
    } else {
      lines[idx] = next;
    }
    const res = { ok: true, key: newKey, prevKey: key, line: getLine(newKey), merged };
    commit('update', res);
    return res;
  }
  const setGrind = (key, grind) => updateLine(key, { grind });
  const setSize = (key, size) => updateLine(key, { size });

  /** remove(key): removes and remembers the line for undo(). */
  function remove(key) {
    const index = lines.findIndex((x) => lineKey(x) === key);
    if (index < 0) return { ok: false, error: 'unknown-line' };
    const line = getLine(key);
    const [raw] = lines.splice(index, 1);
    lastRemoved = { raw, index };
    const res = { ok: true, key, line, index };
    commit('remove', res);
    return res;
  }

  /** undo(): restores the last removed line at its old position. */
  function undo() {
    if (!lastRemoved) return { ok: false, error: 'nothing-to-undo' };
    const { raw, index } = lastRemoved;
    lastRemoved = null;
    const key = lineKey(raw);
    const existing = lines.find((x) => lineKey(x) === key);
    if (existing) existing.qty = Math.min(MAX, existing.qty + raw.qty);
    else lines.splice(Math.min(index, lines.length), 0, raw);
    const res = { ok: true, key, line: getLine(key) };
    commit('undo', res);
    return res;
  }
  const canUndo = () => !!lastRemoved;
  /** Call when the Undo toast expires. */
  const dropUndo = () => { lastRemoved = null; };

  function clear() {
    lines = [];
    lastRemoved = null;
    commit('clear', {});
  }

  /* ---- nudge ---- */
  /**
   * nudge(): one suggestion whose price best closes the free-shipping gap,
   * or null when qualified / cart empty. Prefers the cheapest item that
   * closes the gap; otherwise the most expensive one below it.
   * Coffees use the size + grind of the last added coffee line.
   * Accessories with `forGrinds` are offered only when a coffee in the cart is
   * ground for one of those brewers (whole bean ignored), so a French-press
   * cart is never offered paper filters (B-08 / D5). Accessories without
   * `forGrinds` (the mug) and coffees remain the fallback.
   * @returns { product, size, grind, price } | null
   */
  function nudge() {
    const { gap, qualified } = freeShipping();
    if (qualified || lines.length === 0) return null;
    const inCart = new Set(lines.map((l) => l.slug));
    const lastCoffee = [...lines].reverse().find((l) => l.grind);
    const cartGrinds = new Set(lines.map((l) => l.grind).filter((g) => g && g !== 'whole-bean'));
    const suits = (p) => !p.forGrinds || p.forGrinds.some((g) => cartGrinds.has(g));
    const cands = [];
    for (const p of ACCESSORIES) if (!inCart.has(p.slug) && p.inStock !== false && suits(p)) cands.push({ product: p, size: p.sizes[0].label, grind: null, price: p.sizes[0].price });
    if (lastCoffee) {
      for (const p of PRODUCTS) {
        if (inCart.has(p.slug) || p.inStock === false) continue;
        const s = getSize(p, lastCoffee.size) ?? p.sizes[0];
        cands.push({ product: p, size: s.label, grind: lastCoffee.grind, price: s.price });
      }
    }
    if (!cands.length) return null;
    const closing = cands.filter((c) => c.price >= gap).sort((a, b) => a.price - b.price);
    if (closing.length) return closing[0];
    return cands.sort((a, b) => b.price - a.price)[0];
  }

  /* ---- preferences ---- */
  const getBrewPref = () => { const v = storage.get(KEY_BREW); return isValidGrind(v) ? v : null; };
  const setBrewPref = (id) => {
    if (id == null) storage.remove(KEY_BREW);
    else if (isValidGrind(id)) storage.set(KEY_BREW, id);
    else return false;
    emit('change', { reason: 'brewPref', brewPref: getBrewPref() });
    return true;
  };
  const isFirstAddOfSession = () => session.get(KEY_FIRST) !== '1';

  /* ---- misc ---- */
  /** Demo order number: HN-123456 (prefix from brand.orderPrefix). */
  const makeOrderNumber = () =>
    `${config.orderPrefix}-${String(Math.floor(Math.random() * 1e6)).padStart(6, '0')}`;

  /** Re-read storage (another tab changed it). */
  function reload() {
    load();
    commit.qualified = freeShipping().qualified;
    emit('sync', {});
    emit('change', { reason: 'sync' });
  }
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('storage', (e) => { if (e.key === KEY_CART) reload(); });
  }

  return {
    // read
    getLines, getLine, count, subtotal, freeShipping, totals, nudge,
    isEmpty: () => lines.length === 0,
    isPersistent: () => storage.persistent,
    takeNotices: () => notices.splice(0),
    // write
    add, setQty, updateLine, setGrind, setSize, remove, undo, canUndo, dropUndo, clear, reload,
    // prefs
    getBrewPref, setBrewPref, isFirstAddOfSession,
    // misc
    on, makeOrderNumber, lineKey,
  };
}

/** The shared singleton every page uses. */
export const cart = createStore();
export default cart;
