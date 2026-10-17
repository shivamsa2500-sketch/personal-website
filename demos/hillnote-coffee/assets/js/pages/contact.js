/* pages/contact.js: Contact + FAQ (DESIGN §7.17, §8.9; COPY §11).
   - Fills the few non-price brand values the FAQ quotes.
   - The contact form: client-side validation with COPY's messages, an error
     summary that takes focus, and a demo confirmation that replaces the form.
     There is NO backend: nothing is sent (see REVIEWS "Dev #4" → README). */
import { registerPage, brand } from '../main.js';
import { esc } from '../components/ui.js';

const $ = (s, r = document) => r.querySelector(s);
const ERR_ICON = '<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/></svg>';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function fillBrand() {
  const vals = { dispatchHours: brand.shipping?.dispatchHours, returnsWindowDays: brand.returnsWindowDays };
  for (const el of document.querySelectorAll('[data-fill]')) {
    const v = vals[el.dataset.fill];
    if (v != null) el.textContent = String(v);
  }
  const qh = $('[data-qc-hours]');
  if (qh && brand.contact?.hours) qh.textContent = brand.contact.hours;
}

function openFromHash() {
  const t = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
  if (t?.matches('details')) t.open = true;
}

function form() {
  const f = $('[data-contact-form]');
  if (!f) return;
  f.noValidate = true;
  if (brand.contact?.email) f.action = `mailto:${brand.contact.email}`;
  const prefix = brand.orderPrefix ?? 'HN';
  const ORDER = new RegExp(`^${prefix}-?\\d{6}$`, 'i');
  const help = $('[data-order-help]');
  if (help) help.textContent = `Starts with ${prefix}-, from your confirmation email`;
  $('#cf-order').dataset.invalid = `Order numbers look like ${prefix}-123456.`;

  const topic = $('#cf-topic');
  const orderField = $('[data-order-field]');
  const syncOrder = () => { orderField.hidden = topic.value !== 'order'; };
  topic.addEventListener('change', syncOrder);
  syncOrder();

  const summary = $('[data-error-summary]');
  let tried = false;

  function check(input) {
    const v = input.value.trim();
    if (input.closest('[hidden]')) return '';
    if (input.required && !v) return input.dataset.empty;
    if (!v) return '';
    if (input.type === 'email' && !EMAIL.test(v)) return input.dataset.invalid;
    if (input.id === 'cf-order' && !ORDER.test(v)) return input.dataset.invalid;
    if (input.id === 'cf-message' && v.length < 10) return input.dataset.short;
    return '';
  }
  function show(input, msg) {
    const field = input.closest('.field');
    const err = document.getElementById(`${input.id}-err`);
    const helpId = input.getAttribute('aria-describedby')?.split(' ').filter((x) => x !== err.id).join(' ') ?? '';
    field.classList.toggle('field--error', !!msg);
    err.hidden = !msg;
    err.innerHTML = msg ? `${ERR_ICON}<span>${esc(msg)}</span>` : '';
    if (msg) {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', [err.id, helpId].filter(Boolean).join(' '));
    } else {
      input.removeAttribute('aria-invalid');
      if (helpId) input.setAttribute('aria-describedby', helpId); else input.removeAttribute('aria-describedby');
    }
  }
  const inputs = () => [...f.querySelectorAll('.input, .select, .textarea')];

  // after the first submit, fields re-check as people fix them
  f.addEventListener('input', (e) => { if (tried && e.target.matches('.input, .textarea')) show(e.target, check(e.target)); });
  f.addEventListener('change', (e) => { if (tried && e.target.matches('.select')) show(e.target, check(e.target)); });
  f.addEventListener('focusout', (e) => { if (tried && e.target.matches('.input, .select, .textarea')) show(e.target, check(e.target)); });

  f.addEventListener('submit', (e) => {
    e.preventDefault();
    tried = true;
    const bad = [];
    for (const input of inputs()) {
      const msg = check(input);
      show(input, msg);
      if (msg) bad.push([input, msg]);
    }
    if (bad.length) {
      $('[data-error-title]').textContent = `Please fix ${bad.length === 1 ? '1 thing' : `${bad.length} things`} before sending:`;
      $('[data-error-list]').innerHTML = bad.map(([i, m]) => `<li><a href="#${i.id}">${esc(m)}</a></li>`).join('');
      summary.hidden = false;
      summary.focus();
      return;
    }
    summary.hidden = true;
    const btn = f.querySelector('[data-send]');
    btn.setAttribute('aria-busy', 'true');
    btn.textContent = 'Sending…';
    // Demo: no backend. Pretend to send, then confirm (COPY §11.5).
    setTimeout(() => {
      const name = $('#cf-name').value.trim().split(/\s+/)[0];
      const box = $('[data-confirm]');
      $('[data-confirm-title]').textContent = `Thanks, ${name}. Message received.`;
      f.hidden = true;
      box.hidden = false;
      box.focus();
    }, 600);
  });
  summary.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    e.preventDefault();
    const t = document.getElementById(a.getAttribute('href').slice(1));
    t?.focus();
  });
}

registerPage('contact', () => {
  fillBrand();
  openFromHash();
  addEventListener('hashchange', openFromHash);
  form();
});
