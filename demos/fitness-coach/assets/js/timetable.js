/* Weekly timetable. Desktop: a real time-of-day × day table. Mobile: day tabs
   over a list of class rows. Reads the same dated slots as booking. */
import { restDayNote } from '../../data/schedule.js';
import { upcomingDays, dateKey, slotsOn, coachById, dayShort, dayLong, fmtDate, slotLabel, store, onChange, endTime, toMin } from './availability.js';
import { $, $$, esc, emit } from './ui.js';

let root, active = 0, days = [];
const gridMq = window.matchMedia('(min-width: 1024px)');
const BANDS = [
  { id: 'morning', label: 'Morning', hint: 'Before 9:00', from: 0, to: 540 },
  { id: 'midday', label: 'Midday', hint: '9:00 to 15:00', from: 540, to: 900 },
  { id: 'evening', label: 'Evening', hint: 'After 15:00', from: 900, to: 1440 },
];

export function initTimetable() {
  root = $('[data-schedule]');
  if (!root) return;
  days = upcomingDays(7);
  render();
  onChange(render);
  gridMq.addEventListener('change', render);
  window.addEventListener('resize', moveIndicator, { passive: true });

  root.addEventListener('click', (e) => {
    const tab = e.target.closest('[role="tab"]');
    if (tab) { select(Number(tab.dataset.idx), true); return; }
    const book = e.target.closest('[data-tt-book]');
    if (book) { emit('book', { slotId: book.dataset.ttBook }); return; }
    const trial = e.target.closest('[data-tt-trial]');
    if (trial) { emit('trial', { slotId: trial.dataset.ttTrial }); return; }
    const coach = e.target.closest('[data-tt-coach]');
    if (coach) emit('open-coach', { id: coach.dataset.ttCoach, opener: coach });
  });
  root.addEventListener('keydown', (e) => {
    const tab = e.target.closest('[role="tab"]');
    if (!tab) return;
    const n = days.length;
    let i = Number(tab.dataset.idx);
    if (e.key === 'ArrowRight') i = (i + 1) % n;
    else if (e.key === 'ArrowLeft') i = (i - 1 + n) % n;
    else if (e.key === 'Home') i = 0;
    else if (e.key === 'End') i = n - 1;
    else return;
    e.preventDefault();
    select(i, true);
  });
}

const dayLabel = (d, i) => (i === 0 ? 'Today' : dayShort(d));

function classBlock(s, d, trialUsed, compact) {
  const c = coachById(s.coach);
  const state = s.past ? 'past' : s.state;
  const trialOk = s.trial && !s.past && s.state !== 'full' && !trialUsed;
  const when = `${dayLong(d)} at ${s.time}`;
  return `<div class="cls is-${state}">
    <p class="cls__time"><span>${s.time}</span><span class="cls__end">to ${endTime(s.time, s.minutes)}</span></p>
    <div class="cls__main">
      <p class="cls__name">${esc(s.name)}</p>
      <p class="cls__coach-line">with <button type="button" class="text-btn cls__coach" data-tt-coach="${c.id}" aria-haspopup="dialog">${esc(compact ? c.firstName : c.name)}</button></p>
      <p class="cls__tags">${s.trial ? '<span class="chip chip--trial">Free trial</span>' : ''}<span class="cls__spots"><span class="dot" aria-hidden="true"></span>${s.past ? 'Already started' : slotLabel(s)}</span></p>
    </div>
    <div class="cls__actions">
      ${s.past ? '' : s.state === 'full' ? '' : `<button type="button" class="btn btn--line btn--xs" data-tt-book="${s.id}">Book<span class="visually-hidden"> ${esc(s.name)}, ${when}</span></button>`}
      ${trialOk ? `<button type="button" class="btn btn--accent btn--xs" data-tt-trial="${s.id}">Try free<span class="visually-hidden">: ${esc(s.name)}, ${when}</span></button>` : ''}
    </div>
  </div>`;
}

function render() {
  const trialUsed = !!store.trial();
  const isGrid = gridMq.matches;
  root.classList.toggle('is-grid', isGrid);
  const perDay = days.map((d) => slotsOn(dateKey(d)).filter((s) => s.service === 'group'));

  if (isGrid) {
    const head = days.map((d, i) => `<th scope="col"><span class="tt-th__dow">${dayLabel(d, i)}</span> <span class="tt-th__num">${d.getDate()}</span><span class="visually-hidden">, ${fmtDate(d)}</span></th>`).join('');
    const rows = BANDS.map((b, bi) => {
      const cells = days.map((d, di) => {
        if (!perDay[di].length) return bi === 0 ? `<td class="tt-rest" rowspan="${BANDS.length}"><p>${esc(restDayNote)}</p></td>` : '';
        const list = perDay[di].filter((s) => toMin(s.time) >= b.from && toMin(s.time) < b.to);
        return `<td>${list.map((s) => classBlock(s, d, trialUsed, true)).join('')}</td>`;
      }).join('');
      return `<tr><th scope="row"><span class="tt-band">${b.label}</span><span class="tt-band__hint">${b.hint}</span></th>${cells}</tr>`;
    }).join('');
    root.innerHTML = `<table class="tt-table"><caption class="visually-hidden">Small-group classes for the next seven days</caption><thead><tr><td></td>${head}</tr></thead><tbody>${rows}</tbody></table>`;
    return;
  }

  const tabs = `<div class="tt-tabs" role="tablist" aria-label="Choose a day">${days.map((d, i) => `
    <button type="button" role="tab" id="tt-tab-${i}" aria-controls="tt-panel-${i}" aria-selected="${i === active}" tabindex="${i === active ? 0 : -1}" data-idx="${i}" class="tt-tab">
      <span class="tt-tab__dow">${dayLabel(d, i)}</span><span class="tt-tab__num">${d.getDate()}</span>
    </button>`).join('')}<span class="tt-tabs__ind" aria-hidden="true"></span></div>`;
  const panels = days.map((d, i) => {
    const list = perDay[i];
    const body = list.length
      ? `<ul class="tt-list" role="list">${list.map((s) => `<li>${classBlock(s, d, trialUsed, false)}</li>`).join('')}</ul>`
      : `<p class="tt-rest-m">${esc(restDayNote)}</p>`;
    return `<section class="tt-day" role="tabpanel" id="tt-panel-${i}" aria-labelledby="tt-tab-${i}" ${i === active ? '' : 'hidden'}>${body}</section>`;
  }).join('');
  root.innerHTML = tabs + `<div class="tt-days">${panels}</div>`;
  moveIndicator();
}

function select(i, focus) {
  active = i;
  $$('[role="tab"]', root).forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
  $$('[role="tabpanel"]', root).forEach((p, k) => { p.hidden = k !== i; if (k === i) { p.classList.remove('is-in'); void p.offsetWidth; p.classList.add('is-in'); } });
  if (focus) { const t = $(`#tt-tab-${i}`, root); t.focus(); t.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  moveIndicator();
}

function moveIndicator() {
  const ind = $('.tt-tabs__ind', root);
  const tab = $(`#tt-tab-${active}`, root);
  if (!ind || !tab) return;
  ind.style.transform = `translateX(${tab.offsetLeft}px) scaleX(${tab.offsetWidth / 100})`;
}
