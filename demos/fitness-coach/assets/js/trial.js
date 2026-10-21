/* Free trial: pick an eligible class → level → name/email → what to expect.
   One trial per visitor in this demo (localStorage). Nothing is sent. */
import brand from '../../brand.config.js';
import { upcomingDays, dateKey, slotsOn, findSlot, coachById, fromKey, fmtDateLong, dayShort, slotLabel, endTime, store, onChange } from './availability.js';
import { $, esc, icon, emit, on, scrollToId, reducedMotion, isEmail, downloadIcs, toast } from './ui.js';

const LEVELS = [
  { id: 'new', label: 'I’m new', text: 'Never trained, or not for a long time.' },
  { id: 'some', label: 'Some experience', text: 'I’ve used weights before, on and off.' },
  { id: 'experienced', label: 'Experienced', text: 'I train regularly and know the main lifts.' },
];
const EXPECT = {
  new: ['Arrive 10 minutes early so your coach can show you around.', 'You will learn each move with light weights or none at all.', 'Rest whenever you need. Nobody is counting.'],
  some: ['Arrive 10 minutes early for a quick chat about past training.', 'Your coach will check your form and pick sensible weights with you.', 'Expect to leave tired, not wrecked.'],
  experienced: ['Arrive 10 minutes early and tell your coach your current numbers.', 'You will work at your own loads within the class plan.', 'Ask about Barbell Club if you want heavier sessions.'],
};
const BRING = ['Comfortable clothes you can move in', 'Flat trainers (or bare feet for mobility)', 'A water bottle and a small towel'];

const state = { step: 0, slotId: null, level: null, name: '', email: '', touched: {}, justBooked: null };
let root;

export function initTrial() {
  root = $('[data-trial]');
  if (!root) return;
  render(false);
  onChange(() => { if (!state.justBooked) render(false); });
  on('demo-reset', () => { Object.assign(state, { step: 0, slotId: null, level: null, name: '', email: '', touched: {}, justBooked: null }); render(false); });
  on('trial', ({ slotId }) => {
    state.justBooked = null;
    if (!store.trial()) { const s = findSlot(slotId); if (s && s.trial && s.state !== 'full') { state.slotId = slotId; state.step = 1; } }
    render(false);
    scrollToId('trial');
    setTimeout(() => focusHead(), reducedMotion() ? 0 : 500);
  });
  root.addEventListener('submit', (e) => { e.preventDefault(); nextStep(); });
  root.addEventListener('change', (e) => {
    if (e.target.name === 'tslot') state.slotId = e.target.value;
    if (e.target.name === 'level') state.level = e.target.value;
    setErr('');
  });
  root.addEventListener('input', (e) => {
    if (e.target.name === 'tname' || e.target.name === 'temail') {
      state[e.target.name.slice(1)] = e.target.value;
      if (state.touched[e.target.name]) fieldErrs();
    }
  });
  root.addEventListener('focusout', (e) => { if ((e.target.name === 'tname' || e.target.name === 'temail') && e.target.value.trim()) { state.touched[e.target.name] = true; fieldErrs(); } });
  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-t-back]')) { state.step = Math.max(0, state.step - 1); render(true); }
    if (e.target.closest('[data-t-regular]')) emit('book', { service: 'group', toast: 'Pick any class to book a regular session.' });
    if (e.target.closest('[data-t-ics]')) {
      const t = store.trial(); const s = t && findSlot(t.slotId);
      if (s) { downloadIcs({ title: `Free trial: ${s.name}`, description: `${brand.name} demo free trial ${t.ref}. Bring: ${BRING.join(', ')}.`, date: s.date, time: s.time, minutes: s.minutes, uid: `${t.ref.toLowerCase()}@forgeline.demo` }); toast('Calendar file downloaded.'); }
    }
  });
}

function eligible() {
  return upcomingDays(7).flatMap((d) => slotsOn(dateKey(d)).filter((s) => s.service === 'group' && s.trial && !s.past));
}

function focusHead() { const h = $('[data-t-head]', root); if (h) h.focus({ preventScroll: true }); }
function setErr(m) { const e = $('[data-t-err]', root); if (e) e.textContent = m; }

function nextStep() {
  if (state.step === 0) { if (!state.slotId) return setErr('No class picked yet. Choose one of the free-trial classes above.'); state.step = 1; return render(true); }
  if (state.step === 1) { if (!state.level) return setErr('No level picked yet. Choose the closest option. You can tell your coach more on the day.'); state.step = 2; return render(true); }
  if (state.step === 2) {
    state.touched.tname = state.touched.temail = true;
    const errs = fieldErrs();
    if (errs.name || errs.email) { $(errs.name ? '#t-name' : '#t-email', root).focus(); return; }
    const s = findSlot(state.slotId);
    if (!s || s.state === 'full' || s.past) { state.step = 0; state.slotId = null; render(true); return setErr('That class filled up while you were deciding. Pick another one.'); }
    if (brand.features.oneTrialPerVisitor && store.trial()) { render(true); return; }
    const ref = `${brand.bookingRefPrefix}-T${Math.floor(100 + Math.random() * 900)}`;
    state.justBooked = { slotId: s.id, level: state.level, name: state.name.trim(), email: state.email.trim(), ref, at: Date.now() };
    store.addBooking({ slotId: s.id, ref, kind: 'trial', at: Date.now() });
    store.setTrial(state.justBooked);
    render(true);
  }
}

function fieldErrs() {
  const e = {};
  if (state.name.trim().length < 2) e.name = 'Your name is missing. Add it so the coach can greet you.';
  if (!state.email.trim()) e.email = 'Your email is missing. Add it so we can send your confirmation.';
  else if (!isEmail(state.email)) e.email = 'This email looks incomplete. Check it has an @ and a domain, like name@example.com.';
  [['name', 'tname'], ['email', 'temail']].forEach(([k, n]) => {
    const input = $(`#t-${k}`, root), out = $(`#t-${k}-err`, root);
    if (!input) return;
    const show = state.touched[n] && e[k];
    out.textContent = show ? e[k] : '';
    input.setAttribute('aria-invalid', show ? 'true' : 'false');
    input.closest('.field').classList.toggle('is-valid', !!(state.touched[n] && !e[k]));
  });
  return e;
}

function stepsDots() {
  return `<ol class="tsteps" aria-label="Free trial progress">${['Class', 'Level', 'Details'].map((l, i) => `<li class="${i < state.step ? 'is-done' : i === state.step ? 'is-current' : ''}" ${i === state.step ? 'aria-current="step"' : ''}><span>${i < state.step ? icon('i-check', 12) : i + 1}</span>${l}</li>`).join('')}</ol>`;
}

function successHtml(t, fresh) {
  const s = findSlot(t.slotId);
  const c = s && coachById(s.coach);
  const when = s ? `${fmtDateLong(fromKey(s.date))}, ${s.time} to ${endTime(s.time, s.minutes)}` : 'Your chosen class';
  const first = (t.name || '').split(/\s+/)[0];
  return `<div class="trial-done ${fresh ? 'is-fresh' : 'is-locked'}">
    <div class="trial-done__head">
      <span class="done__badge done__badge--sm" aria-hidden="true">${icon('i-check', 26)}</span>
      <div>
        <p class="step__count">${fresh ? 'Free class booked' : 'One free class per person'}</p>
        <h3 class="step__title" tabindex="-1" data-t-head>${fresh ? `See you there, ${esc(first)}.` : 'You’ve already booked your free trial.'}</h3>
      </div>
    </div>
    ${s ? `<div class="trial-done__class"><p class="trial-done__name">${esc(s.name)}</p><p>${when}</p><p>with ${esc(c.name)}</p>${t.ref ? `<p class="trial-done__ref">Reference ${esc(t.ref)}</p>` : ''}</div>` : ''}
    ${fresh ? `<div class="trial-done__cols">
      <div><h4 class="drawer__h">What to bring</h4><ul class="ticks">${BRING.map((b) => `<li>${esc(b)}</li>`).join('')}</ul></div>
      <div><h4 class="drawer__h">What to expect</h4><ul class="ticks">${EXPECT[t.level || 'new'].map((b) => `<li>${esc(b)}</li>`).join('')}</ul></div>
    </div>` : '<p class="lead lead--sm">Enjoyed it, or want more? Regular sessions are open to book any time.</p>'}
    <div class="done__actions">
      ${fresh ? `<button type="button" class="btn btn--accent" data-t-ics>${icon('i-download', 18)} Add to calendar</button>` : ''}
      <button type="button" class="btn ${fresh ? 'btn--ghost' : 'btn--accent'}" data-t-regular>Book a regular session</button>
    </div>
    <p class="field-hint">Demo only: nothing was sent. ${brand.features.resetDemoLink ? 'Use “Reset demo data” in the footer to try again.' : ''}</p>
  </div>`;
}

function render(focus) {
  if (state.justBooked) { root.innerHTML = successHtml(state.justBooked, true); if (focus) focusHead(); return; }
  const used = brand.features.oneTrialPerVisitor && store.trial();
  if (used) { root.innerHTML = successHtml(used, false); if (focus) focusHead(); return; }

  let body = '';
  if (state.step === 0) {
    const list = eligible();
    if (state.slotId && !list.some((s) => s.id === state.slotId && s.state !== 'full')) state.slotId = null;
    body = `<h3 class="step__title" tabindex="-1" data-t-head id="t-h">Pick a free-trial class.</h3>
      <fieldset class="tclasses" aria-labelledby="t-h">${list.length ? list.map((s) => {
        const c = coachById(s.coach);
        return `<label class="tclass is-${s.state}">
          <input type="radio" name="tslot" value="${s.id}" ${state.slotId === s.id ? 'checked' : ''} ${s.state === 'full' ? 'disabled' : ''}>
          <span class="tclass__box">
            <span class="tclass__day">${dateKey(new Date()) === s.date ? 'Today' : dayShort(fromKey(s.date))} <b>${s.time}</b></span>
            <span class="tclass__name">${esc(s.name)}<small>with ${esc(c.firstName)}, ${s.minutes} min</small></span>
            <span class="tclass__state"><span class="dot" aria-hidden="true"></span>${slotLabel(s)}</span>
          </span>
        </label>`;
      }).join('') : `<div class="empty"><p><strong>Every free-trial class this week is full.</strong> New spots open each morning, or you can book a regular class now.</p><button type="button" class="btn btn--line btn--sm" data-t-regular>Book a regular class</button></div>`}</fieldset>`;
  } else if (state.step === 1) {
    const s = findSlot(state.slotId);
    body = `<h3 class="step__title" tabindex="-1" data-t-head id="t-h">How much have you trained?</h3>
      <p class="field-hint">For ${esc(s.name)}, ${dayShort(fromKey(s.date))} ${s.time}. Your coach will scale every move to suit.</p>
      <fieldset class="levels" aria-labelledby="t-h">${LEVELS.map((l) => `<label class="opt opt--level">
        <input type="radio" name="level" value="${l.id}" ${state.level === l.id ? 'checked' : ''}>
        <span class="opt__box"><span class="opt__tick" aria-hidden="true">${icon('i-check', 14)}</span><span class="opt__title">${l.label}</span><span class="opt__text">${l.text}</span></span>
      </label>`).join('')}</fieldset>`;
  } else {
    body = `<h3 class="step__title" tabindex="-1" data-t-head>Save your spot.</h3>
      <div class="fields fields--stack">
        <div class="field"><label class="field-label" for="t-name">Your name</label><input id="t-name" name="tname" type="text" autocomplete="name" value="${esc(state.name)}" aria-describedby="t-name-err" required><p class="field-error" id="t-name-err"></p></div>
        <div class="field"><label class="field-label" for="t-email">Email</label><input id="t-email" name="temail" type="email" inputmode="email" autocomplete="email" value="${esc(state.email)}" aria-describedby="t-email-err" required><p class="field-error" id="t-email-err"></p></div>
      </div>`;
  }
  root.innerHTML = `<form class="tform" novalidate>
      <div class="tform__top">${stepsDots()}</div>
      <div class="tform__body ${focus && !reducedMotion() ? 'is-entering' : ''}">${body}</div>
      <p class="field-error" data-t-err role="alert"></p>
      <div class="tform__nav">
        <button type="button" class="btn btn--ghost" data-t-back ${state.step === 0 ? 'hidden' : ''}>Back</button>
        <button type="submit" class="btn btn--accent">${state.step === 2 ? 'Book my free class' : 'Next'}</button>
      </div>
    </form>`;
  if (state.step === 2) fieldErrs();
  if (focus) {
    focusHead();
    const b = $('.tform__body', root);
    requestAnimationFrame(() => requestAnimationFrame(() => b && b.classList.remove('is-entering')));
  }
}
