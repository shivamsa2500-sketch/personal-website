/* Booking request form. No backend in the demo: a valid submit shows a
   confirmation and sends nothing. For a live site, point the form at
   Formspree (action="https://formspree.io/f/XXXX" method="POST") or the
   owner's booking tool. Hook: [data-book-form] */
import { $, $$, on } from './ui.js';
import { packages } from '../../data/packages.js';
import { quote } from '../../data/quote.js';
import brand from '../../brand.config.js';

const MESSAGES = {
  name: 'Please tell us your name.',
  phone: 'Please add a phone number so we can confirm your slot.',
  phoneBad: 'That number looks too short. Include the area code.',
  email: 'That email does not look right. Check for a typo, or leave it blank.',
  car: 'Which car is it? Make and model is enough.',
  size: 'Pick the closest size.',
  package: 'Pick a package. Not sure? Choose Gloss Correction and we will advise.',
  date: 'Choose a day that suits you.',
  datePast: 'Please choose today or a later date.',
};

export function initBooking() {
  const form = $('[data-book-form]');
  if (!form) return;
  const done = $('[data-book-done]');
  const sizeSel = $('[data-book-size]', form);
  const pkgSel = $('[data-book-pkg]', form);
  const dateIn = $('[data-book-date]', form);

  quote.sizes.forEach((s) => sizeSel.add(new Option(s.label, s.id)));
  packages.forEach((p) => pkgSel.add(new Option(p.name, p.id)));
  const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  const iso = today.toISOString().slice(0, 10);
  dateIn.min = iso;

  on('prefill-booking', ({ size, pkg, note }) => {
    sizeSel.value = size; pkgSel.value = pkg;
    const notes = $('[data-book-notes]', form);
    if (!notes.value.trim()) notes.value = note;
    [sizeSel, pkgSel].forEach(clearError);
  });

  function showError(input, msg) {
    const err = $(`#${input.id}-err`);
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', err.id);
    err.textContent = msg; err.hidden = false;
  }
  function clearError(input) {
    const err = $(`#${input.id}-err`);
    input.removeAttribute('aria-invalid');
    if (err) { err.hidden = true; err.textContent = ''; }
  }

  function check(input) {
    const v = input.value.trim();
    switch (input.name) {
      case 'name': return v.length >= 2 ? '' : MESSAGES.name;
      case 'phone': if (!v) return MESSAGES.phone; return v.replace(/\D/g, '').length >= 7 ? '' : MESSAGES.phoneBad;
      case 'email': return !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : MESSAGES.email;
      case 'car': return v ? '' : MESSAGES.car;
      case 'size': return v ? '' : MESSAGES.size;
      case 'package': return v ? '' : MESSAGES.package;
      case 'date': if (!v) return MESSAGES.date; return v >= iso ? '' : MESSAGES.datePast;
      default: return '';
    }
  }

  const fields = $$('input[id], select[id]', form).filter((i) => $(`#${i.id}-err`));
  fields.forEach((input) => {
    input.addEventListener('blur', () => { if (input.value) { const m = check(input); m ? showError(input, m) : clearError(input); } });
    input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true' && !check(input)) clearError(input); });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let first = null;
    fields.forEach((input) => {
      const m = check(input);
      if (m) { showError(input, m); first ||= input; } else clearError(input);
    });
    if (first) { first.focus(); return; }
    const data = new FormData(form);
    const ref = `${brand.bookingRefPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    const pkg = packages.find((p) => p.id === data.get('package'));
    const when = new Date(`${data.get('date')}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    $('[data-book-done-text]').textContent = `Thanks, ${String(data.get('name')).split(' ')[0]}. Your ${pkg ? pkg.name : 'detail'} request for ${when} is in (ref ${ref}). We will confirm by phone within one working day.`;
    form.hidden = true; done.hidden = false; done.focus();
  });

  $('[data-book-again]').addEventListener('click', () => {
    form.reset(); form.hidden = false; done.hidden = true; $('#bk-name').focus();
  });
}
