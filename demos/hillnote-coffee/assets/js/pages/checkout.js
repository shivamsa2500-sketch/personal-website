/* pages/checkout.js: demo checkout (DESIGN §7.16–7.17, SITEMAP §3.4c/§4.4, COPY §5.4).
   One page: contact → address → delivery → (switched-off) payment → place order.
   8 required fields + 1 optional; inline validation on blur, live re-check
   while an error is showing, error summary on submit (focus moves to it).
   No payment inputs of any kind. Submit shows an in-page confirmation with
   cart.makeOrderNumber() and then clears the cart. Nothing leaves the browser. */
import { registerPage, brand, cart, format, productUrl, url } from '../main.js';
import { getGrind } from '../../../data/brew-methods.js';
import { bagHTML } from '../components/bag.js';
import { esc, icon, slip } from '../components/ui.js';
import { contours } from '../contours.js';
import { refreshGlass } from '../glass.js';
import { announce } from '../shell.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const price = format.formatPrice;
const SHIP_KEY = `${brand.storagePrefix}shipMethod`;
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const meta = (l) => (l.accessory ? 'One size' : `${l.size} · ${getGrind(l.grind)?.label ?? ''}`);

let state = null; // 'form' | 'empty' | 'done'
let attempted = false; // after the first submit, every field validates live

/* ---- shipping method ------------------------------------------------------ */
const shipMethod = () => $('input[name="ship"]:checked')?.value ?? 'standard';
function loadShip() {
  let m = 'standard';
  try { if (sessionStorage.getItem(SHIP_KEY) === 'express') m = 'express'; } catch { /* default */ }
  const r = $(`input[name="ship"][value="${m}"]`);
  if (r) r.checked = true;
}

/* ---- gift (C-08 / D2): demo state lives in sessionStorage ----------------- */
const GIFT_KEY = `${brand.storagePrefix}gift`;
const GIFT_MAX = 200;
const giftState = () => ({
  on: !!$('#co-gift')?.checked,
  note: ($('#co-gift-note')?.value ?? '').trim(),
  hide: !!$('#co-gift-hide')?.checked,
});
/** "Gift · note included · prices hidden on the slip" (only the parts that apply) */
function giftLine(g = giftState()) {
  if (!g.on) return '';
  return ['Gift', g.note ? 'note included' : null, g.hide ? 'prices hidden on the slip' : null].filter(Boolean).join(' · ');
}
function saveGift() {
  try { sessionStorage.setItem(GIFT_KEY, JSON.stringify(giftState())); } catch { /* session only */ }
}
let lastCountSaid = 0;
function paintGiftCount({ speak = true } = {}) {
  const n = $('#co-gift-note').value.length;
  $('[data-gift-count]').textContent = `${n} of ${GIFT_MAX}`;
  // polite, and only at the two thresholds (not on every keystroke)
  const mark = n >= GIFT_MAX ? GIFT_MAX : n >= 180 ? 180 : 0;
  if (speak && mark && mark !== lastCountSaid) $('[data-gift-live]').textContent = mark === GIFT_MAX ? `${GIFT_MAX} of ${GIFT_MAX} characters. The note is full.` : `${n} of ${GIFT_MAX} characters.`;
  lastCountSaid = mark;
}
function setGiftOpen(on) {
  $('#co-gift-opts').hidden = !on;
  $('[data-co-gift]').classList.toggle('is-on', on);
}
function wireGift() {
  const box = $('#co-gift');
  if (!box) return;
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(GIFT_KEY) ?? 'null'); } catch { /* none */ }
  box.checked = !!saved?.on;
  $('#co-gift-note').value = saved?.note ?? '';
  $('#co-gift-hide').checked = saved ? saved.hide !== false : true;
  setGiftOpen(box.checked);
  paintGiftCount({ speak: false });
  box.addEventListener('change', () => {
    // "Hide prices" is ticked by default each time the gift option is switched on
    if (box.checked && !saved?.on) $('#co-gift-hide').checked = true;
    setGiftOpen(box.checked); // focus stays on the checkbox
    saved = null;
    saveGift(); renderSummary();
  });
  $('#co-gift-note').addEventListener('input', () => { paintGiftCount(); saveGift(); renderSummary(); });
  $('#co-gift-hide').addEventListener('change', () => { saveGift(); renderSummary(); });
}

/* ---- summary --------------------------------------------------------------- */
const available = () => cart.getLines().filter((l) => l.available);

function summaryHTML() {
  const lines = available();
  const t = cart.totals(shipMethod());
  return `<ul class="co-items" role="list">${lines.map((l) => `<li class="co-item">
      <span class="co-item__thumb" aria-hidden="true">${bagHTML(l.product, { label: false, decorative: true })}<span class="co-item__qty">${l.qty}</span></span>
      <span class="co-item__body"><a class="co-item__name" href="${esc(productUrl(l.slug))}">${esc(l.product.name)}</a><span class="co-item__meta">${esc(meta(l))}<span class="visually-hidden">, quantity ${l.qty}</span></span></span>
      <span class="co-item__price">${price(l.lineTotal)}</span>
    </li>`).join('')}</ul>
    <dl class="summary-rows">
      <div><dt>Subtotal</dt><dd>${price(t.subtotal)}</dd></div>
      <div><dt>Shipping</dt><dd>${t.shipping === 0 ? 'Free' : price(t.shipping)}</dd></div>
      <div class="summary-rows__total"><dt>Total</dt><dd>${price(t.total)}</dd></div>
    </dl>
    ${giftLine() ? `<p class="co-giftline">${icon('i-check', 16)}<span>${esc(giftLine())}</span></p>` : ''}
    ${brand.taxesIncluded ? '<p class="summary-card__small">Prices include taxes.</p>' : ''}`;
}

function renderSummary() {
  const t = cart.totals(shipMethod());
  $('[data-co-summary]').innerHTML = summaryHTML();
  $('[data-co-summary-mini]').innerHTML = summaryHTML();
  $('[data-co-total]').textContent = price(t.total);
  const std = cart.totals('standard').shipping;
  $('[data-co-std-cost]').textContent = std === 0 ? 'Free' : price(std);
  const btn = $('[data-co-submit]');
  if (!btn.hasAttribute('aria-busy')) btn.textContent = `Place order · ${price(t.total)}`;
  // contour signature in the summary header: the first coffee's altitude
  const first = available().find((l) => !l.accessory);
  const topo = $('[data-co-topo]');
  const seed = first?.slug ?? 'checkout';
  if (topo.dataset.seed !== seed) {
    topo.dataset.seed = seed;
    $('[data-co-scope]').style.setProperty('--bag', first ? first.product.image.bagColor : 'var(--pine)');
    topo.innerHTML = contours(first?.product.origin?.altitudeM ?? [1200, 1500], `${seed}-co`, { w: 400, h: 120, strokeWidth: 1.5 }).svg;
  }
  const soldOut = cart.getLines().filter((l) => !l.available);
  let warn = $('[data-co-soldout]');
  if (soldOut.length && !warn) {
    warn = document.createElement('div');
    warn.dataset.coSoldout = '';
    $('#co-form').prepend(warn);
  }
  if (warn) warn.innerHTML = soldOut.map((l) => `<p class="notice">${esc(l.product.name)} has sold out. We've kept it in your cart but it won't be included at checkout.</p>`).join('');
}

function show(which) {
  state = which;
  for (const el of $$('[data-co]')) el.hidden = el.dataset.co !== which;
}

function sync() {
  if (state === 'done') return;
  if (!available().length) { show('empty'); return; }
  if (state !== 'form') show('form');
  renderSummary();
}

/* ---- validation ------------------------------------------------------------ */
const RULES = {
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
  phone: (v) => {
    let d = v.replace(/\D/g, '');
    if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
    if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
    return /^\d{10}$/.test(d);
  },
  pin: (v) => /^[1-9]\d{5}$/.test(v.replace(/\s/g, '')),
};
const fields = () => $$('#co-form [data-field]').map((f) => ({ wrap: f, el: $('input, select', f), name: f.dataset.field })).filter((f) => f.el.required);

function check(f) {
  const v = f.el.value.trim();
  if (!v) return f.el.dataset.empty;
  if (RULES[f.name] && !RULES[f.name](v)) return f.el.dataset.invalid;
  return '';
}

function paint(f, msg) {
  const err = $('.field__error', f.wrap);
  const hint = $('.field__help', f.wrap);
  const ids = [hint?.id, msg ? err.id : null].filter(Boolean).join(' ');
  if (ids) f.el.setAttribute('aria-describedby', ids); else f.el.removeAttribute('aria-describedby');
  f.wrap.classList.toggle('field--error', !!msg);
  if (msg) {
    f.el.setAttribute('aria-invalid', 'true');
    err.innerHTML = `${icon('i-x', 16)}<span>${esc(msg)}</span>`;
    err.hidden = false;
  } else {
    f.el.removeAttribute('aria-invalid');
    err.hidden = true;
    err.textContent = '';
  }
}

function renderErrors(errs, { focus = false } = {}) {
  const box = $('[data-co-errors]');
  if (!errs.length) { box.hidden = true; return; }
  $('#co-errors-h', box).textContent = errs.length === 1
    ? 'Please fix 1 thing before placing the order:'
    : `Please fix ${errs.length} things before placing the order:`;
  $('.co-errors__list', box).innerHTML = errs.map(({ f, msg }) => `<li><a class="link" href="#${f.el.id}" data-jump="${f.el.id}">${esc(msg)}</a></li>`).join('');
  box.hidden = false;
  if (focus) {
    box.focus({ preventScroll: true });
    box.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
  }
}
const currentErrors = () => fields().map((f) => ({ f, msg: check(f) })).filter((x) => x.msg);

function wireValidation() {
  const form = $('#co-form');
  form.addEventListener('focusout', (e) => {
    const f = fields().find((x) => x.el === e.target);
    if (!f) return;
    // on blur: only judge a field the shopper has typed in (or after a submit)
    if (!attempted && !f.el.value.trim() && f.el.getAttribute('aria-invalid') !== 'true') return;
    paint(f, check(f));
    if (!$('[data-co-errors]').hidden) renderErrors(currentErrors());
  });
  const live = (e) => {
    const f = fields().find((x) => x.el === e.target);
    if (!f || f.el.getAttribute('aria-invalid') !== 'true') return;
    // clear the error as soon as it's fixed; never add new ones mid-typing
    if (!check(f)) {
      paint(f, '');
      if (!$('[data-co-errors]').hidden) renderErrors(currentErrors());
    }
  };
  form.addEventListener('input', live);
  form.addEventListener('change', (e) => {
    if (e.target.name === 'ship') {
      try { sessionStorage.setItem(SHIP_KEY, e.target.value); } catch { /* session only */ }
      renderSummary();
      announce(`${e.target.value === 'express' ? 'Express' : 'Standard'} delivery. Total ${price(cart.totals(e.target.value).total)}.`);
      return;
    }
    if (e.target.tagName === 'SELECT') {
      const f = fields().find((x) => x.el === e.target);
      if (f) { paint(f, check(f)); if (!$('[data-co-errors]').hidden) renderErrors(currentErrors()); }
    }
  });
  $('[data-co-errors]').addEventListener('click', (e) => {
    const a = e.target.closest('[data-jump]');
    if (!a) return;
    e.preventDefault();
    const el = document.getElementById(a.dataset.jump);
    el.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
    el.focus({ preventScroll: true });
  });
  form.addEventListener('submit', onSubmit);
}

/* ---- submit + confirmation ---------------------------------------------- */
function onSubmit(e) {
  e.preventDefault();
  const btn = $('[data-co-submit]');
  if (btn.getAttribute('aria-disabled') === 'true') return;
  attempted = true;
  const errs = currentErrors();
  for (const f of fields()) paint(f, errs.find((x) => x.f.el === f.el)?.msg ?? "");
  if (errs.length) { renderErrors(errs, { focus: true }); return; }
  renderErrors([]);
  btn.setAttribute('aria-disabled', 'true');
  btn.setAttribute('aria-busy', 'true');
  btn.textContent = 'Placing order…';
  announce('Placing order…');
  setTimeout(confirmOrder, reducedMotion() ? 150 : 700);
}

function confirmOrder() {
  const data = Object.fromEntries(new FormData($('#co-form')));
  const lines = available();
  const t = cart.totals(data.ship);
  const order = cart.makeOrderNumber();
  const first = String(data.name).trim().split(/\s+/)[0];
  const gift = giftLine();
  const email = String(data.email).trim();
  const days = brand.shipping;
  const step = (n, title, line) => `<li class="co-step">
      <span class="co-step__icon" aria-hidden="true">${contours([1000 + n * 250, 1300 + n * 250], `${order}-step-${n}`, { w: 56, h: 56, strokeWidth: 1.5 }).svg}<span class="co-step__n">${n}</span></span>
      <p><strong>${title}</strong> · ${esc(line)}</p>
    </li>`;

  const done = $('[data-co="done"]');
  done.innerHTML = `<div class="co-done__panel">
    <div class="co-done__head">
      <div class="co-done__topo" aria-hidden="true">${contours([1250, 1650], order, { w: 720, h: 220, strokeWidth: 1.5 }).svg}</div>
      <p class="marker">Order received</p>
      <h1 id="co-done-h" tabindex="-1">Order ${esc(order)} <em>confirmed</em> (demo)</h1>
    </div>
    <p class="lead co-done__lead">Thanks, ${esc(first)}! In a real store, a confirmation would be on its way to ${esc(email)}.</p>
    <p>This is a demo, so nothing was charged and nothing will ship.</p>
    ${slip(`we'd email ${email}`, 'co-done__slip')}
    <section class="co-done__sec" aria-labelledby="co-ordered-h">
      <h2 class="co-done__h2" id="co-ordered-h">What you ordered</h2>
      <ul class="co-items" role="list">${lines.map((l) => `<li class="co-item">
        <span class="co-item__thumb" aria-hidden="true">${bagHTML(l.product, { label: false, decorative: true })}<span class="co-item__qty">${l.qty}</span></span>
        <span class="co-item__body"><span class="co-item__name">${esc(l.product.name)}</span><span class="co-item__meta">${esc(meta(l))}<span class="visually-hidden">, quantity ${l.qty}</span></span></span>
        <span class="co-item__price">${price(l.lineTotal)}</span>
      </li>`).join('')}</ul>
      <dl class="summary-rows">
        <div><dt>Subtotal</dt><dd>${price(t.subtotal)}</dd></div>
        <div><dt>Shipping (${data.ship === 'express' ? 'Express' : 'Standard'})</dt><dd>${t.shipping === 0 ? 'Free' : price(t.shipping)}</dd></div>
        <div class="summary-rows__total"><dt>Total</dt><dd>${price(t.total)}</dd></div>
      </dl>
      ${gift ? `<p class="co-giftline">${icon('i-check', 16)}<span>${esc(gift)}</span></p>` : ''}
    </section>
    <section class="co-done__sec" aria-labelledby="co-next-h">
      <h2 class="co-done__h2" id="co-next-h">What happens next</h2>
      <ol class="co-steps" role="list">
        ${step(1, 'Roast', "Your coffee goes into this week's roast.")}
        ${step(2, 'Ship', `We grind it to order and hand it to the courier within ${days.dispatchHours} hours.`)}
        ${step(3, 'Arrive', `Standard delivery takes ${days.standardDays}. Express takes ${days.expressDays}.`)}
      </ol>
    </section>
    <a class="btn btn--lg lacquer squish co-done__cta" href="${url('shop.html')}">Back to the shop</a>
  </div>`;

  show('done');
  cart.clear();
  try { sessionStorage.removeItem(SHIP_KEY); sessionStorage.removeItem(GIFT_KEY); } catch { /* fine */ }
  // C-17 / F11: nothing left in the cart, so the capsule's way back is the shop
  const back = $('[data-co-back]');
  if (back) { back.href = url('shop.html'); $('[data-co-back-label]', back).textContent = 'Back to the shop'; }
  document.title = `Order ${order} confirmed (demo) | ${brand.name}`;
  scrollTo({ top: 0, behavior: 'auto' });
  $('#co-done-h').focus({ preventScroll: true });
  requestAnimationFrame(refreshGlass);
}

/* ---- setup ----------------------------------------------------------------- */
function fillStates() {
  const sel = $('#co-state');
  const regions = brand.regions ?? [];
  if (regions.length) {
    sel.insertAdjacentHTML('beforeend', regions.map((r) => `<option>${esc(r)}</option>`).join(''));
    return;
  }
  // country-neutral fallback (SITEMAP §4.4): a text field
  const input = document.createElement('input');
  Object.assign(input, { className: 'input', id: sel.id, name: sel.name, type: 'text', autocomplete: 'address-level1', required: true });
  input.dataset.empty = 'Enter your state or region.';
  sel.replaceWith(input);
}

function wireMini() {
  const d = $('[data-co-mini]');
  const label = $('[data-co-mini-label]');
  d.addEventListener('toggle', () => { label.textContent = d.open ? 'Hide order summary' : 'Show order summary'; });
}

registerPage('checkout', () => {
  $('[data-co-logo]')?.setAttribute('aria-label', `${brand.name}, home`);
  $('[data-co-dispatch]').textContent = String(brand.shipping?.dispatchHours ?? 48);
  fillStates();
  loadShip();
  wireMini();
  wireValidation();
  wireGift();
  sync();
  cart.on('change', (d) => { if (d.reason !== 'brewPref') sync(); });
  requestAnimationFrame(refreshGlass);
});
