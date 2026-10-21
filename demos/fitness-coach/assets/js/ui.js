/* Small shared UI helpers: dialogs, toasts, scrolling, cross-feature events. */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const icon = (id, size = 18, cls = '') => `<svg class="${cls}" width="${size}" height="${size}" aria-hidden="true" focusable="false"><use href="#${id}"/></svg>`;

/* ---- Cross-feature bus ----------------------------------------------- */
const bus = new EventTarget();
export const on = (type, fn) => bus.addEventListener(type, (e) => fn(e.detail));
export const emit = (type, detail) => bus.dispatchEvent(new CustomEvent(type, { detail }));

/* ---- Scrolling -------------------------------------------------------- */
export function scrollToId(id, focusSel) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  if (focusSel) {
    const target = typeof focusSel === 'string' ? $(focusSel, el) : focusSel;
    if (target) setTimeout(() => target.focus({ preventScroll: true }), reducedMotion() ? 0 : 450);
  }
}

/* ---- Dialogs: native <dialog> + explicit focus trap + Esc + focus return */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
export function openDialog(dialog, opener) {
  if (!dialog || dialog.open) return;
  dialog._opener = opener || document.activeElement;
  dialog.showModal();
  document.documentElement.classList.add('has-dialog');
  requestAnimationFrame(() => dialog.classList.add('is-open'));
  const first = $('[data-autofocus]', dialog) || $$(FOCUSABLE, dialog)[0];
  if (first) first.focus();
}
export function closeDialog(dialog) {
  if (!dialog || !dialog.open) return;
  dialog.classList.remove('is-open');
  const done = () => {
    dialog.close();
    document.documentElement.classList.remove('has-dialog');
    const o = dialog._opener;
    if (o && document.contains(o)) o.focus({ preventScroll: true });
  };
  if (reducedMotion()) done(); else setTimeout(done, 220);
}
export function wireDialog(dialog) {
  if (!dialog) return;
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); closeDialog(dialog); }); // Esc
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeDialog(dialog); // backdrop click
    if (e.target.closest('[data-dialog-close]')) closeDialog(dialog);
  });
  dialog.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const items = $$(FOCUSABLE, dialog).filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}

/* ---- Toast ------------------------------------------------------------ */
let toastTimer;
export function toast(msg) {
  const t = $('[data-toast]');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-on'), 3200);
}

/* ---- ICS download (built in the browser, nothing leaves the device) --- */
export function downloadIcs({ title, description, date, time, minutes, uid }) {
  const [y, m, d] = date.split('-');
  const [hh, mm] = time.split(':').map(Number);
  const start = new Date(+y, +m - 1, +d, hh, mm);
  const end = new Date(start.getTime() + minutes * 60000);
  const p = (n) => String(n).padStart(2, '0');
  const local = (dt) => `${dt.getFullYear()}${p(dt.getMonth() + 1)}${p(dt.getDate())}T${p(dt.getHours())}${p(dt.getMinutes())}00`;
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${p(now.getUTCMonth() + 1)}${p(now.getUTCDate())}T${p(now.getUTCHours())}${p(now.getUTCMinutes())}${p(now.getUTCSeconds())}Z`;
  const escIcs = (s) => String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Forgeline Coaching//Demo booking//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${stamp}`, `DTSTART:${local(start)}`, `DTEND:${local(end)}`,
    `SUMMARY:${escIcs(title)}`, `DESCRIPTION:${escIcs(description)}`,
    'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', `DESCRIPTION:${escIcs(title)}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${uid.split('@')[0]}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---- Email check (friendly, not strict) -------------------------------- */
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
