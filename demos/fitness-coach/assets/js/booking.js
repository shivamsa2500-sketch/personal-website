/* Booking system: service → coach → date + time → details → review → confirmed.
   All state lives in ONE object (`state`). Front end only: nothing is sent. */
import brand from '../../brand.config.js';
import { services, bookingWindowDays } from '../../data/schedule.js';
import { coaches } from '../../data/coaches.js';
import {
  upcomingDays, dateKey, fromKey, fmtDate, fmtDateLong, dayShort, dayLong, slotsFor, findSlot, coachById, serviceById,
  coachesForService, coachDays, DAY_NAMES_SHORT, slotLabel, endTime, store, onChange,
} from './availability.js';
import { $, $$, esc, icon, on, scrollToId, reducedMotion, downloadIcs, isEmail, toast } from './ui.js';
import { portraitHtml } from './portrait.js';

const dayLongOf = (k) => (fromKey(k).toDateString() === new Date().toDateString() ? 'today' : `${dayLong(fromKey(k))} ${fromKey(k).getDate()}`);

const STEPS = [
  { id: 'service', label: 'Service', title: 'What would you like to book?' },
  { id: 'coach', label: 'Coach', title: 'Who would you like to train with?' },
  { id: 'when', label: 'Date & time', title: 'Pick a day and a time.' },
  { id: 'details', label: 'Details', title: 'Where should we send the confirmation?' },
  { id: 'review', label: 'Review', title: 'Check your booking.' },
];

const state = {
  step: 0,
  service: null,
  coach: 'any',
  date: null,
  slotId: null,
  details: { name: '', email: '', goal: '' },
  status: 'editing', // editing | submitting | done
  ref: null,
  touched: {},
};

let root, form, stage, progress, summary, errorEl, backBtn, nextBtn, nextLabel;

export function initBooking() {
  root = $('[data-booker]');
  if (!root) return;
  form = $('[data-booker-form]', root);
  stage = $('[data-booker-stage]', root);
  progress = $('[data-progress]', root);
  summary = $('[data-booker-summary]', root);
  errorEl = $('[data-step-error]', root);
  backBtn = $('[data-back]', root);
  nextBtn = $('[data-next]', root);
  nextLabel = $('[data-next-label]', root);

  form.addEventListener('submit', (e) => { e.preventDefault(); next(); });
  backBtn.addEventListener('click', () => go(state.step - 1));
  form.addEventListener('change', onFieldChange);
  form.addEventListener('input', onFieldInput);
  form.addEventListener('focusout', onFieldBlur);
  form.addEventListener('click', (e) => {
    const jump = e.target.closest('[data-jump-date]');
    if (jump) {
      state.date = jump.dataset.jumpDate; state.slotId = null;
      const r = form.querySelector(`input[name="date"][value="${state.date}"]`);
      if (r) { r.checked = true; r.focus(); r.closest('label').scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
      renderSlots(); renderSummary();
    }
    const edit = e.target.closest('[data-edit-step]');
    if (edit) go(Number(edit.dataset.editStep));
  });
  progress.addEventListener('click', (e) => {
    const b = e.target.closest('[data-goto]');
    if (b) go(Number(b.dataset.goto));
  });
  // Arrow keys on the date strip scroll the chosen date into view.
  form.addEventListener('keydown', (e) => {
    if (e.target.name === 'date' && ['ArrowLeft', 'ArrowRight'].includes(e.key)) {
      setTimeout(() => { const c = form.querySelector('input[name="date"]:checked'); if (c) c.closest('label').scrollIntoView({ block: 'nearest', inline: 'nearest' }); }, 0);
    }
  });

  on('book', preselect);
  on('demo-reset', () => { reset(false); clearError(); render(false); });
  onChange(() => { if (state.status === 'editing' && STEPS[state.step].id === 'when') renderSlots(); });

  render(false);
}

/* ---- Entry points from other sections --------------------------------- */
function preselect(opts = {}) {
  if (state.status === 'done') reset(false);
  if (opts.service) { state.service = opts.service; }
  if (opts.coach) state.coach = opts.coach;
  if (opts.slotId) {
    const s = findSlot(opts.slotId);
    if (s) { state.service = s.service; state.date = s.date; state.slotId = s.state !== 'full' && !s.past ? s.id : null; if (!opts.coach) state.coach = opts.anyCoach ? 'any' : s.coach; }
  } else if (opts.date) {
    state.date = opts.date; state.slotId = null;
  } else if (opts.service || opts.coach) {
    state.slotId = null;
  }
  if (state.service && state.coach !== 'any' && !coachesForService(state.service).some((c) => c.id === state.coach)) state.coach = 'any';
  // Jump to the first step that still needs an answer.
  let step = 0;
  if (state.service) step = opts.coach || opts.slotId || opts.date ? 2 : 1;
  if (state.service && state.slotId) step = 3;
  if (opts.coach && !state.service) step = 0;
  state.step = step;
  clearError();
  render(false);
  scrollToId('book');
  setTimeout(() => focusHeading(), reducedMotion() ? 0 : 500);
  if (opts.toast) toast(opts.toast);
}

function reset(rerender = true) {
  Object.assign(state, { step: 0, service: null, coach: 'any', date: null, slotId: null, details: { name: '', email: '', goal: '' }, status: 'editing', ref: null, touched: {} });
  if (rerender) { render(false); focusHeading(); }
}

/* ---- Navigation -------------------------------------------------------- */
function validate(stepId) {
  if (stepId === 'service' && !state.service) return 'You haven’t picked a service yet. Choose one of the three options above.';
  if (stepId === 'coach' && !state.coach) return 'You haven’t picked a coach yet. Choose one, or pick “Any coach”.';
  if (stepId === 'when') {
    if (!state.date) return 'No day picked yet. Choose a date to see its times.';
    if (!state.slotId) return 'No time picked yet. Choose one of the open times above.';
  }
  if (stepId === 'details') {
    state.touched.name = state.touched.email = true;
    const errs = detailErrors();
    renderFieldErrors(errs);
    if (errs.name || errs.email) {
      const first = errs.name ? '#bk-name' : '#bk-email';
      $(first, form)?.focus();
      return errs.name && errs.email ? 'Two details need fixing. Check the message under each field.' : 'One detail needs fixing. Check the message under the field.';
    }
  }
  return '';
}

function next() {
  if (state.status !== 'editing') return;
  const id = STEPS[state.step].id;
  const err = validate(id);
  if (err) { showError(err); return; }
  if (id === 'review') { submit(); return; }
  go(state.step + 1);
}

function go(i) {
  if (i < 0 || i >= STEPS.length || state.status !== 'editing') return;
  // Can't skip ahead past an unanswered step.
  for (let k = 0; k < i; k++) { if (validateSilent(STEPS[k].id)) { i = k; break; } }
  const dir = i >= state.step ? 'fwd' : 'back';
  state.step = i;
  clearError();
  transition(dir, () => { render(true); });
}

function validateSilent(id) {
  if (id === 'service') return !state.service;
  if (id === 'coach') return !state.coach;
  if (id === 'when') return !state.slotId;
  if (id === 'details') { const e = detailErrors(); return !!(e.name || e.email); }
  return false;
}

function transition(dir, swap) {
  if (reducedMotion()) { swap(); return; }
  stage.dataset.dir = dir;
  stage.classList.add('is-leaving');
  setTimeout(() => {
    swap();
    stage.classList.remove('is-leaving');
    stage.classList.add('is-entering');
    requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.remove('is-entering')));
  }, 160);
}

function focusHeading() {
  const h = $('[data-step-heading]', stage) || $('[data-done-heading]', stage);
  if (h) h.focus({ preventScroll: true });
}

/* ---- Rendering --------------------------------------------------------- */
function render(focus) {
  renderProgress();
  renderSummary();
  if (state.status === 'done') { renderDone(); return; }
  const id = STEPS[state.step].id;
  stage.innerHTML = stepHtml(id);
  if (id === 'when') { renderSlots(); scrollDateIntoView(); }
  if (id === 'details') renderFieldErrors(detailErrors());
  backBtn.style.visibility = state.step === 0 ? 'hidden' : 'visible';
  backBtn.disabled = state.step === 0;
  nextLabel.textContent = id === 'review' ? 'Confirm booking' : 'Next';
  form.classList.toggle('is-review', id === 'review');
  $('.booker__nav', form).hidden = false;
  const live = `Step ${state.step + 1} of ${STEPS.length}: ${STEPS[state.step].label}`;
  stage.setAttribute('aria-label', live);
  if (focus) focusHeading();
}

function renderProgress() {
  const done = state.status === 'done';
  progress.innerHTML = STEPS.map((s, i) => {
    const st = done || i < state.step ? 'done' : i === state.step ? 'current' : 'todo';
    const inner = `<span class="progress__num">${st === 'done' ? icon('i-check', 14) : i + 1}</span><span class="progress__label">${s.label}</span>`;
    const canGo = !done && i < state.step;
    return `<li class="progress__item is-${st}" ${st === 'current' ? 'aria-current="step"' : ''}>${canGo ? `<button type="button" data-goto="${i}" aria-label="Back to step ${i + 1}: ${s.label}">${inner}</button>` : `<span>${inner}<span class="visually-hidden">${st === 'done' ? ' (done)' : st === 'current' ? ' (current step)' : ''}</span></span>`}</li>`;
  }).join('') + `<li class="progress__bar" aria-hidden="true"><span style="transform:scaleX(${done ? 1 : state.step / (STEPS.length - 1)})"></span></li>`;
}

function chosenSlot() { return state.slotId ? findSlot(state.slotId) : null; }

function renderSummary() {
  const svc = state.service && serviceById(state.service);
  const slot = chosenSlot();
  const coachName = slot ? coachById(slot.coach).name : state.coach === 'any' ? 'Any coach' : state.coach ? coachById(state.coach).name : null;
  const row = (k, v) => `<div class="sum-row ${v ? '' : 'is-empty'}"><dt>${k}</dt><dd>${v ? esc(v) : '—'}</dd></div>`;
  summary.innerHTML = `
    <h3 class="sum__title">Your booking</h3>
    <dl class="sum">
      ${row('Service', svc ? (slot && slot.service === 'group' ? `${svc.label}: ${slot.name}` : svc.label) : '')}
      ${row('Coach', coachName && (state.step > 0 || state.coach !== 'any') ? coachName : '')}
      ${row('Date', slot ? fmtDateLong(fromKey(slot.date)) : state.date ? fmtDateLong(fromKey(state.date)) : '')}
      ${row('Time', slot ? `${slot.time} to ${endTime(slot.time, slot.minutes)}` : '')}
    </dl>
    <p class="sum__note">Ask for pricing on your first session. No payment is taken online.</p>`;
}

function stepHtml(id) {
  const s = STEPS[state.step];
  const head = `<div class="step__head"><p class="step__count">Step ${state.step + 1} of ${STEPS.length}</p><h3 class="step__title" tabindex="-1" data-step-heading id="bk-h-${id}">${s.title}</h3></div>`;
  if (id === 'service') {
    const pre = state.coach && state.coach !== 'any' ? coachById(state.coach) : null;
    return head + (pre ? `<p class="prefill">${portraitHtml(pre, 'mini')}<span>Booking with <strong>${esc(pre.name)}</strong>. Pick a service to see their times.</span></p>` : '') + `<fieldset class="opt-grid opt-grid--3" aria-labelledby="bk-h-service">${services.map((sv) => `
      <label class="opt">
        <input type="radio" name="service" value="${sv.id}" ${state.service === sv.id ? 'checked' : ''}>
        <span class="opt__box">
          <span class="opt__tick" aria-hidden="true">${icon('i-check', 14)}</span>
          <span class="opt__title">${esc(sv.label)}</span>
          <span class="opt__meta">${icon('i-clock', 16)} ${sv.minutes ? `${sv.minutes} min` : '30 to 75 min'}</span>
          <span class="opt__text">${esc(sv.blurb)}</span>
        </span>
      </label>`).join('')}</fieldset>`;
  }
  if (id === 'coach') {
    const list = coachesForService(state.service);
    const any = `<label class="opt opt--coach">
        <input type="radio" name="coach" value="any" ${state.coach === 'any' ? 'checked' : ''}>
        <span class="opt__box"><span class="opt__tick" aria-hidden="true">${icon('i-check', 14)}</span>
          <span class="mini-portrait mini-portrait--any" aria-hidden="true">${icon('i-user', 22)}</span>
          <span class="opt__title">Any coach</span><span class="opt__text">The first coach free at your time. Most flexible.</span></span>
      </label>`;
    return head + `<fieldset class="opt-grid opt-grid--coach" aria-labelledby="bk-h-coach">${any}${list.map((c) => `
      <label class="opt opt--coach">
        <input type="radio" name="coach" value="${c.id}" ${state.coach === c.id ? 'checked' : ''}>
        <span class="opt__box"><span class="opt__tick" aria-hidden="true">${icon('i-check', 14)}</span>
          ${portraitHtml(c, 'mini')}
          <span class="opt__title">${esc(c.name)}</span>
          <span class="opt__text">${esc(c.role)}</span><span class="opt__days">Coaches ${coachDays(c.id).map((d) => DAY_NAMES_SHORT[d]).join(', ')}</span></span>
      </label>`).join('')}</fieldset>`;
  }
  if (id === 'when') {
    const days = upcomingDays(bookingWindowDays);
    if (!state.date || !days.some((d) => dateKey(d) === state.date)) {
      const firstOpen = days.find((d) => openCount(dateKey(d)) > 0);
      state.date = firstOpen ? dateKey(firstOpen) : dateKey(days[0]);
    }
    const strip = days.map((d) => {
      const k = dateKey(d);
      const n = openCount(k);
      const isToday = k === dateKey(new Date());
      return `<label class="date ${n ? '' : 'is-none'}">
        <input type="radio" name="date" value="${k}" ${state.date === k ? 'checked' : ''} aria-label="${fmtDateLong(d)}, ${n ? `${n} ${n === 1 ? 'time' : 'times'} free` : 'no times free'}">
        <span class="date__box" aria-hidden="true">
          <span class="date__dow">${isToday ? 'Today' : dayShort(d)}</span>
          <span class="date__num">${d.getDate()}</span>
          <span class="date__dots">${n ? `${Math.min(n, 9)}${n > 9 ? '+' : ''} free` : 'None'}</span>
        </span>
      </label>`;
    }).join('');
    return head + `
      <fieldset class="when__dates" aria-labelledby="bk-dates-legend">
        <legend class="field-label" id="bk-dates-legend">Date <span class="field-hint">(next two weeks)</span></legend>
        <div class="date-strip" data-date-strip>${strip}</div>
      </fieldset>
      <fieldset class="when__slots" aria-labelledby="bk-slots-legend">
        <legend class="field-label" id="bk-slots-legend">Time</legend>
        <div class="slot-list" data-slot-list></div>
      </fieldset>`;
  }
  if (id === 'details') {
    const d = state.details;
    return head + `<div class="fields">
      <div class="field">
        <label for="bk-name" class="field-label">Your name</label>
        <input id="bk-name" name="name" type="text" autocomplete="name" required value="${esc(d.name)}" aria-describedby="bk-name-err" spellcheck="false">
        <p class="field-error" id="bk-name-err"></p>
      </div>
      <div class="field">
        <label for="bk-email" class="field-label">Email</label>
        <input id="bk-email" name="email" type="email" autocomplete="email" inputmode="email" required value="${esc(d.email)}" aria-describedby="bk-email-hint bk-email-err" spellcheck="false">
        <p class="field-hint" id="bk-email-hint">For the confirmation only. Demo: nothing is sent.</p>
        <p class="field-error" id="bk-email-err"></p>
      </div>
      <div class="field field--full">
        <label for="bk-goal" class="field-label">Goal or note for your coach <span class="field-hint">(optional)</span></label>
        <textarea id="bk-goal" name="goal" rows="3" maxlength="280" aria-describedby="bk-goal-count">${esc(d.goal)}</textarea>
        <p class="field-hint field-count" id="bk-goal-count">${d.goal.length} / 280</p>
      </div>
    </div>`;
  }
  if (id === 'review') {
    const slot = chosenSlot();
    const svc = serviceById(state.service);
    const c = coachById(slot.coach);
    const rows = [
      ['Service', slot.service === 'group' ? `${svc.label}: ${slot.name}` : svc.label, 0],
      ['Coach', `${c.name}${state.coach === 'any' ? ' (first free coach)' : ''}`, 1],
      ['When', `${fmtDateLong(fromKey(slot.date))}, ${slot.time} to ${endTime(slot.time, slot.minutes)}`, 2],
      ['Name', state.details.name, 3],
      ['Email', state.details.email, 3],
    ];
    if (state.details.goal) rows.push(['Note', state.details.goal, 3]);
    return head + `<dl class="review-list">${rows.map(([k, v, s]) => `
      <div class="review-list__row"><dt>${k}</dt><dd>${esc(v)}</dd><dd class="review-list__edit"><button type="button" class="text-btn" data-edit-step="${s}">Change<span class="visually-hidden"> ${k.toLowerCase()}</span></button></dd></div>`).join('')}
    </dl>
    <p class="field-hint">By confirming you agree this is a demo booking. A real site would email ${esc(state.details.email)}.</p>`;
  }
  return '';
}

function openCount(key) {
  return slotOptions(key).filter((o) => !o.disabled).length;
}

/* Options for a date. "Any coach" groups 1:1 and online slots by time and
   picks the first coach with that time free. */
function slotOptions(key) {
  const slots = slotsFor({ service: state.service, coach: state.coach || 'any', date: key }).filter((s) => !s.past);
  if (state.coach !== 'any' || state.service === 'group') {
    return slots.map((s) => ({ id: s.id, time: s.time, slot: s, disabled: s.state === 'full', coachName: coachById(s.coach).firstName }));
  }
  const byTime = new Map();
  slots.forEach((s) => { if (!byTime.has(s.time)) byTime.set(s.time, []); byTime.get(s.time).push(s); });
  return Array.from(byTime.entries()).map(([time, list]) => {
    const free = list.find((s) => s.state !== 'full');
    const s = free || list[0];
    return { id: s.id, time, slot: s, disabled: !free, coachName: coachById(s.coach).firstName, freeCount: list.filter((x) => x.state !== 'full').length };
  });
}

function renderSlots() {
  const box = $('[data-slot-list]', stage);
  if (!box) return;
  const opts = slotOptions(state.date);
  if (state.slotId && !opts.some((o) => o.id === state.slotId && !o.disabled)) state.slotId = null;
  if (!opts.length) {
    const days = upcomingDays(bookingWindowDays).map(dateKey);
    const after = days.slice(days.indexOf(state.date) + 1).concat(days.slice(0, days.indexOf(state.date)));
    const alt = after.find((k) => openCount(k) > 0);
    const isToday = (k) => fromKey(k).toDateString() === new Date().toDateString();
    const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
    box.innerHTML = `<div class="empty"><p><strong>Nothing open ${isToday(state.date) ? 'today' : `on ${dayLongOf(state.date)}`}.</strong> ${alt ? `${cap(dayLongOf(alt))} has ${openCount(alt)} open ${openCount(alt) === 1 ? 'time' : 'times'}.` : `Try ${state.coach !== 'any' ? '“Any coach”' : 'another service'} instead.`}</p>${alt ? `<button type="button" class="btn btn--line btn--sm" data-jump-date="${alt}">Show ${dayLongOf(alt)}</button>` : ''}</div>`;
    return;
  }
  box.innerHTML = opts.map((o) => {
    const s = o.slot;
    const stateCls = o.disabled ? 'full' : s.state;
    const extra = s.service === 'group' ? `<span class="slot__what">${esc(s.name)}</span><span class="slot__what">with ${esc(o.coachName)}</span>` : `<span class="slot__what">with ${esc(o.coachName)}</span>`;
    const lbl = o.disabled ? slotLabel({ ...s, state: 'full' }) : slotLabel(s);
    return `<label class="slot is-${stateCls}">
      <input type="radio" name="slot" value="${o.id}" ${state.slotId === o.id ? 'checked' : ''} ${o.disabled ? 'disabled' : ''}>
      <span class="slot__box">
        <span class="slot__time">${s.time}</span>
        ${extra}
        <span class="slot__state"><span class="dot" aria-hidden="true"></span>${lbl}</span>
      </span>
    </label>`;
  }).join('');
}

function scrollDateIntoView() {
  const c = stage.querySelector('input[name="date"]:checked');
  if (c) { const strip = $('[data-date-strip]', stage); const l = c.closest('label'); strip.scrollLeft = Math.max(0, l.offsetLeft - strip.offsetLeft - 8); }
}

/* ---- Field handling ---------------------------------------------------- */
function onFieldChange(e) {
  const t = e.target;
  if (t.name === 'service') { state.service = t.value; state.slotId = null; if (state.coach !== 'any' && !coachesForService(t.value).some((c) => c.id === state.coach)) state.coach = 'any'; clearError(); }
  if (t.name === 'coach') { state.coach = t.value; state.slotId = null; clearError(); }
  if (t.name === 'date') { state.date = t.value; state.slotId = null; renderSlots(); }
  if (t.name === 'slot') { state.slotId = t.value; clearError(); }
  renderSummary();
}
function onFieldInput(e) {
  const t = e.target;
  if (['name', 'email', 'goal'].includes(t.name)) {
    state.details[t.name] = t.value;
    if (t.name === 'goal') { const c = $('#bk-goal-count', form); if (c) c.textContent = `${t.value.length} / 280`; }
    if (state.touched[t.name]) renderFieldErrors(detailErrors());
  }
}
function onFieldBlur(e) {
  const t = e.target;
  if (['name', 'email'].includes(t.name) && t.value.trim()) { state.touched[t.name] = true; renderFieldErrors(detailErrors()); }
}
function detailErrors() {
  const d = state.details, e = {};
  if (d.name.trim().length < 2) e.name = 'Your name is missing. Add it so your coach knows who to expect.';
  if (!d.email.trim()) e.email = 'Your email is missing. Add it so we can send your confirmation.';
  else if (!isEmail(d.email)) e.email = 'This email looks incomplete. Check it has an @ and a domain, like name@example.com.';
  return e;
}
function renderFieldErrors(errs) {
  ['name', 'email'].forEach((f) => {
    const input = $(`#bk-${f}`, form);
    const out = $(`#bk-${f}-err`, form);
    if (!input || !out) return;
    const show = state.touched[f] && errs[f];
    out.textContent = show ? errs[f] : '';
    input.setAttribute('aria-invalid', show ? 'true' : 'false');
    input.closest('.field').classList.toggle('is-valid', !!(state.touched[f] && !errs[f]));
  });
  if (!errs.name && !errs.email) clearError();
}
function showError(msg) { errorEl.textContent = msg; errorEl.classList.add('is-on'); form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake'); }
function clearError() { errorEl.textContent = ''; errorEl.classList.remove('is-on'); }

/* ---- Submit ------------------------------------------------------------ */
function submit() {
  state.status = 'submitting';
  nextBtn.disabled = true;
  nextBtn.classList.add('is-loading');
  nextLabel.textContent = 'Confirming…';
  setTimeout(() => {
    nextBtn.disabled = false;
    nextBtn.classList.remove('is-loading');
    const slot = chosenSlot();
    if (!slot || slot.state === 'full' || slot.past) {
      // Error state: the slot filled up meanwhile (e.g. booked in another tab).
      state.status = 'editing';
      state.slotId = null;
      state.step = 2;
      render(true);
      showError('Someone booked that time while you were deciding. Pick another open time below.');
      return;
    }
    state.ref = `${brand.bookingRefPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    store.addBooking({ slotId: slot.id, ref: state.ref, at: Date.now(), kind: 'booking' });
    state.status = 'done';
    transition('fwd', () => render(false));
    setTimeout(focusHeading, reducedMotion() ? 0 : 200);
  }, 700);
}

function renderDone() {
  const slot = findSlot(state.slotId);
  const svc = serviceById(slot.service);
  const c = coachById(slot.coach);
  const first = state.details.name.trim().split(/\s+/)[0];
  $('.booker__nav', form).hidden = true;
  clearError();
  stage.innerHTML = `
    <div class="done">
      <div class="done__badge" aria-hidden="true">${icon('i-check', 36)}</div>
      <p class="step__count">Booking confirmed</p>
      <h3 class="step__title" tabindex="-1" data-done-heading>You’re booked in, ${esc(first)}.</h3>
      <dl class="review-list review-list--done">
        <div class="review-list__row"><dt>Reference</dt><dd>${esc(state.ref)}</dd></div>
        <div class="review-list__row"><dt>Session</dt><dd>${esc(slot.service === 'group' ? slot.name : svc.label)}</dd></div>
        <div class="review-list__row"><dt>Coach</dt><dd>${esc(c.name)}</dd></div>
        <div class="review-list__row"><dt>When</dt><dd>${fmtDateLong(fromKey(slot.date))}, ${slot.time} to ${endTime(slot.time, slot.minutes)}</dd></div>
      </dl>
      <div class="done__actions">
        <button type="button" class="btn btn--accent" data-ics>${icon('i-download', 18)} Add to calendar</button>
        <button type="button" class="btn btn--ghost" data-again>Book another session</button>
      </div>
      <p class="field-hint">This is a demo, so nothing was sent and no real booking was made. On a live site, a confirmation would go to ${esc(state.details.email)}.</p>
    </div>`;
  $('[data-ics]', stage).addEventListener('click', () => {
    downloadIcs({
      title: `${slot.service === 'group' ? slot.name : svc.label} with ${c.name}`,
      description: `${brand.name} demo booking ${state.ref}. ${state.details.goal ? 'Note: ' + state.details.goal : ''}`.trim(),
      date: slot.date, time: slot.time, minutes: slot.minutes, uid: `${state.ref.toLowerCase()}-${slot.date}@forgeline.demo`,
    });
    toast('Calendar file downloaded.');
  });
  $('[data-again]', stage).addEventListener('click', () => reset(true));
}
