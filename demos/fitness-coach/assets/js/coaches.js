/* Find your coach: filter chips, coach cards, profile drawer, match quiz. */
import { coaches, specialties } from '../../data/coaches.js';
import { coachDays, DAY_NAMES_SHORT, upcomingDays, dateKey, slotsOn, fmtDate, slotLabel, serviceById, toMin, onChange } from './availability.js';
import { $, $$, esc, icon, emit, on, openDialog, closeDialog, wireDialog, scrollToId } from './ui.js';
import { portraitHtml } from './portrait.js';

const specLabel = (id) => (specialties.find((s) => s.id === id) || {}).label || id;
let filter = 'all';
let grid, dialog, body, countEl;

export function initCoaches() {
  grid = $('[data-coach-grid]');
  dialog = $('[data-coach-dialog]');
  body = $('[data-coach-dialog-body]');
  countEl = $('[data-coach-count]');
  if (!grid) return;
  wireDialog(dialog);
  renderFilters();
  renderGrid();
  initQuiz();

  grid.addEventListener('click', (e) => {
    const v = e.target.closest('[data-view-coach]');
    const b = e.target.closest('[data-book-coach]');
    if (v) openProfile(v.dataset.viewCoach, v);
    if (b) emit('book', { coach: b.dataset.bookCoach, toast: `Booking with ${coaches.find((c) => c.id === b.dataset.bookCoach).name}` });
  });
  body.addEventListener('click', (e) => {
    const slot = e.target.closest('[data-book-slot]');
    const b = e.target.closest('[data-book-coach]');
    if (slot) { closeDialog(dialog); setTimeout(() => emit('book', { slotId: slot.dataset.bookSlot }), 240); }
    if (b) { closeDialog(dialog); setTimeout(() => emit('book', { coach: b.dataset.bookCoach }), 240); }
  });
  // Program card link "Meet Coach Dev" pre-filters the grid.
  $$('[data-filter-link]').forEach((a) => a.addEventListener('click', () => setFilter(a.dataset.filterLink)));
  on('open-coach', ({ id, opener }) => openProfile(id, opener));
  onChange(() => { if (dialog.open && dialog.dataset.coach) renderProfile(dialog.dataset.coach); });
}

function renderFilters() {
  const wrap = $('[data-coach-filters]');
  const chips = [{ id: 'all', label: 'All coaches' }, ...specialties];
  wrap.innerHTML = chips.map((s) => `<button type="button" class="fchip" data-filter="${s.id}" aria-pressed="${filter === s.id}">${esc(s.label)}</button>`).join('');
  wrap.addEventListener('click', (e) => { const b = e.target.closest('[data-filter]'); if (b) setFilter(b.dataset.filter); });
}

function setFilter(id) {
  filter = id;
  $$('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === id)));
  let n = 0;
  $$('.coach', grid).forEach((card) => {
    const show = id === 'all' || card.dataset.specs.split(' ').includes(id);
    card.hidden = !show;
    if (show) { n++; card.classList.remove('is-filtered-in'); void card.offsetWidth; card.classList.add('is-filtered-in'); }
  });
  let empty = $('.coach-empty', grid.parentNode);
  if (!n) {
    if (!empty) { empty = document.createElement('div'); empty.className = 'empty coach-empty'; grid.after(empty); }
    empty.innerHTML = `<p><strong>No coach lists “${esc(specLabel(id))}” yet.</strong> All four coaches can talk it through on your first session.</p><button type="button" class="btn btn--line btn--sm" data-filter="all">Show all coaches</button>`;
    empty.querySelector('[data-filter]').addEventListener('click', () => setFilter('all'));
  } else if (empty) empty.remove();
  countEl.textContent = `Showing ${n} ${n === 1 ? 'coach' : 'coaches'}${id === 'all' ? '' : ` for ${specLabel(id)}`}.`;
}

function dayChips(id) {
  const days = coachDays(id);
  return `<ul class="day-chips" role="list" aria-label="Available days">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<li class="${days.includes(d) ? 'is-on' : ''}">${DAY_NAMES_SHORT[d]}<span class="visually-hidden">${days.includes(d) ? ' available' : ' not available'}</span></li>`).join('')}</ul>`;
}
function credHtml(n) {
  return `<ul class="creds" role="list">${Array.from({ length: n }, () => `<li>Your certification here</li>`).join('')}</ul>`;
}

function renderGrid() {
  grid.innerHTML = coaches.map((c, i) => `
    <li class="coach" data-specs="${c.specialties.join(' ')}">
      <div class="coach__media">${portraitHtml(c, 'card')}</div>
      <div class="coach__body">
        <h3 class="coach__name">${esc(c.name)}</h3>
        <p class="coach__role">${esc(c.role)}</p>
        <p class="coach__specs">${c.specialties.map((s) => `<span class="chip">${esc(specLabel(s))}</span>`).join('')}</p>
        <p class="coach__summary">${esc(c.summary)}</p>
        ${dayChips(c.id)}
        ${credHtml(1)}
        <div class="coach__actions">
          <button type="button" class="btn btn--ghost btn--sm" data-view-coach="${c.id}" aria-haspopup="dialog">View profile</button>
          <button type="button" class="btn btn--accent btn--sm" data-book-coach="${c.id}">Book with ${esc(c.firstName)}</button>
        </div>
      </div>
    </li>`).join('');
}

/* ---- Profile drawer ---------------------------------------------------- */
function openProfile(id, opener) {
  renderProfile(id);
  dialog.dataset.coach = id;
  openDialog(dialog, opener);
}

function weekSlots(id) {
  return upcomingDays(7).map((d) => {
    const k = dateKey(d);
    const slots = slotsOn(k).filter((s) => s.coach === id && !s.past);
    return { d, k, slots };
  });
}

function renderProfile(id) {
  const c = coaches.find((x) => x.id === id);
  const week = weekSlots(id);
  const total = week.reduce((n, w) => n + w.slots.filter((s) => s.state !== 'full').length, 0);
  body.innerHTML = `
    <div class="drawer__top">
      <p class="drawer__kicker">Coach profile</p>
      <button type="button" class="icon-btn" data-dialog-close data-autofocus>${icon('i-x', 24)}<span class="visually-hidden">Close profile</span></button>
    </div>
    <div class="drawer__hero">
      ${portraitHtml(c, 'drawer', { lazy: false })}
      <div>
        <h2 class="drawer__name" id="coach-dialog-title">${esc(c.name)}</h2>
        <p class="drawer__role">${esc(c.role)}</p>
        <p class="coach__specs">${c.specialties.map((s) => `<span class="chip">${esc(specLabel(s))}</span>`).join('')}</p>
      </div>
    </div>
    <div class="drawer__section">${c.bio.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
    <div class="drawer__section">
      <h3 class="drawer__h">How ${esc(c.firstName)} coaches</h3>
      <ul class="ticks">${c.approach.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
    </div>
    <div class="drawer__section">
      <h3 class="drawer__h">Credentials</h3>
      ${credHtml(c.credentials)}
    </div>
    <div class="drawer__section">
      <h3 class="drawer__h">Next 7 days <span class="drawer__count">${total} open</span></h3>
      <p class="field-hint">Tap a time to book it. These are the same slots as the booking calendar and timetable.</p>
      <div class="wk">${week.map((w) => `
        <div class="wk__day ${w.slots.length ? '' : 'is-off'}">
          <p class="wk__label">${fmtDate(w.d)}</p>
          ${w.slots.length ? `<ul class="wk__slots" role="list">${w.slots.map((s) => `<li><button type="button" class="wk__slot is-${s.state}" data-book-slot="${s.id}" ${s.state === 'full' ? 'disabled' : ''}>
              <span class="wk__time">${s.time}</span><span class="wk__what">${esc(s.service === 'group' ? s.name : serviceById(s.service).label)}</span><span class="wk__state">${slotLabel(s)}</span>
            </button></li>`).join('')}</ul>` : `<p class="wk__none">Not coaching</p>`}
        </div>`).join('')}
      </div>
    </div>
    <div class="drawer__foot">
      <button type="button" class="btn btn--accent btn--lg btn--block" data-book-coach="${c.id}">Book with ${esc(c.firstName)}</button>
    </div>`;
}

/* ---- Match quiz -------------------------------------------------------- */
function initQuiz() {
  const toggle = $('[data-quiz-toggle]');
  const panel = $('[data-quiz]');
  const qform = $('[data-quiz-form]');
  const result = $('[data-quiz-result]');
  const err = $('[data-quiz-error]');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
    if (open) { panel.classList.remove('is-in'); void panel.offsetWidth; panel.classList.add('is-in'); $('input', panel).focus(); }
  });
  // Hero shortcut: scroll to the coaches and open the match quiz.
  document.querySelectorAll('[data-open-quiz]').forEach((link) => link.addEventListener('click', (e) => {
    e.preventDefault();
    scrollToId('coaches');
    if (toggle.getAttribute('aria-expanded') !== 'true') setTimeout(() => toggle.click(), 450);
  }));
  qform.addEventListener('change', () => { err.textContent = ''; });
  qform.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(qform);
    const goal = fd.get('goal'), exp = fd.get('exp'), time = fd.get('time');
    const missing = [!goal && 'your goal', !exp && 'your experience', !time && 'a time of day'].filter(Boolean);
    if (missing.length) { err.textContent = `Answer all three questions to see your match. Still missing: ${missing.length > 1 ? `${missing.slice(0, -1).join(', ')} and ${missing[missing.length - 1]}` : missing[0]}.`; return; }
    const ranked = coaches.map((c) => ({ c, ...score(c, goal, exp, time) })).sort((a, b) => b.score - a.score);
    const best = ranked[0];
    result.innerHTML = `
      <div class="match">
        ${portraitHtml(best.c, 'mini')}
        <div class="match__text">
          <p class="match__kicker">Your match</p>
          <p class="match__name">${esc(best.c.name)}</p>
          <p>${esc(best.reason)}</p>
        </div>
        <div class="match__actions">
          <button type="button" class="btn btn--ghost btn--sm" data-match-view="${best.c.id}" aria-haspopup="dialog">View profile</button>
          <button type="button" class="btn btn--accent btn--sm" data-match-book="${best.c.id}">Book with ${esc(best.c.firstName)}</button>
        </div>
      </div>`;
    result.classList.remove('is-in'); void result.offsetWidth; result.classList.add('is-in');
    $('[data-match-view]', result).addEventListener('click', (ev) => openProfile(best.c.id, ev.currentTarget));
    $('[data-match-book]', result).addEventListener('click', () => emit('book', { coach: best.c.id, toast: `Booking with ${best.c.name}` }));
  });
}

const WINDOWS = { morning: [0, 540], midday: [540, 900], evening: [900, 1440] };
const WINDOW_TEXT = { morning: 'before 9:00', midday: 'between 9:00 and 15:00', evening: 'after 15:00' };
function score(c, goal, exp, time) {
  let s = 0;
  const reasons = [];
  if (c.specialties.includes(goal)) { s += 4; reasons.push(`specialises in ${specLabel(goal).toLowerCase()}`); }
  if (exp === 'new' && c.specialties.includes('beginners')) { s += 3; reasons.push('loves coaching first-timers'); }
  if (exp === 'some' && (c.specialties.includes('strength') || c.specialties.includes('conditioning'))) s += 1;
  if (exp === 'experienced' && c.id === 'maya') { s += 2; reasons.push('coaches the heavy barbell work'); }
  const [a, b] = WINDOWS[time];
  const open = upcomingDays(7).reduce((n, d) => n + slotsOn(dateKey(d)).filter((x) => x.coach === c.id && !x.past && x.state !== 'full' && toMin(x.time) >= a && toMin(x.time) < b).length, 0);
  s += Math.min(3, open / 2);
  const lead = reasons.length ? `${c.firstName} ${reasons.join(' and ')}` : `${c.firstName} is a good all-round fit`;
  const reason = `${lead}, with ${open} open ${open === 1 ? 'slot' : 'slots'} ${WINDOW_TEXT[time]} this week.`;
  return { score: s, reason };
}

export { scrollToId };
