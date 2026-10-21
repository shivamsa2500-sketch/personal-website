/* Availability engine: turns data/schedule.js into dated slots.
   Shared by the timetable, coach profiles, free trial and booking flow. */
import brand from '../../brand.config.js';
import { services, classes, coachSlots, closedDays, fewLeftAt, demoFill } from '../../data/schedule.js';
import { coaches } from '../../data/coaches.js';

const P = brand.storagePrefix || '';
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const pad = (n) => String(n).padStart(2, '0');
export const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const dayShort = (d) => DAY_SHORT[d.getDay()];
export const dayLong = (d) => DAY_LONG[d.getDay()];
export const fmtDate = (d) => `${DAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
export const fmtDateLong = (d) => `${DAY_LONG[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
export const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
export const fmtTime = (t) => t; // 24 h; change here for 12 h display
export const endTime = (t, minutes) => { const m = toMin(t) + minutes; return `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`; };

export const coachById = (id) => coaches.find((c) => c.id === id);
export const serviceById = (id) => services.find((s) => s.id === id);

export function upcomingDays(n) {
  const out = [];
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) out.push(new Date(t.getFullYear(), t.getMonth(), t.getDate() + i));
  return out;
}

/* ---- Demo bookings in localStorage ------------------------------------- */
function read(key, fallback) {
  try { const v = localStorage.getItem(P + key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(P + key, JSON.stringify(value)); } catch (e) { /* private mode: demo still works for this page view */ }
}
export const store = {
  bookings: () => read('bookings', []),
  addBooking(b) { const all = store.bookings(); all.push(b); write('bookings', all); emit(); },
  trial: () => read('trial', null),
  setTrial(t) { write('trial', t); emit(); },
  reset() { try { localStorage.removeItem(P + 'bookings'); localStorage.removeItem(P + 'trial'); } catch (e) {} emit(); },
};
const listeners = new Set();
export const onChange = (fn) => listeners.add(fn);
function emit() { listeners.forEach((fn) => fn()); }
window.addEventListener('storage', (e) => { if (e.key && e.key.startsWith(P)) emit(); });

/* Repeatable "already booked" pattern so the demo shows few-left and full. */
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const GROUP_FILL = [6, 5, 4, 2, 3, 1, 4, 5, 2, 3, 0, 4];
function presetBooked(id, capacity) {
  if (!demoFill) return 0;
  const h = hash(id);
  if (capacity === 1) return h % 10 < 3 ? 1 : 0;
  return Math.min(capacity, GROUP_FILL[h % GROUP_FILL.length]);
}

function makeSlot(base) {
  const id = `${base.service}|${base.coach}|${base.date}|${base.time}`;
  const mine = store.bookings().filter((b) => b.slotId === id).length;
  const booked = Math.min(base.capacity, presetBooked(id, base.capacity) + mine);
  const left = base.capacity - booked;
  const now = new Date();
  const start = fromKey(base.date);
  start.setHours(0, toMin(base.time), 0, 0);
  const past = start.getTime() < now.getTime() + 30 * 60 * 1000; // closes 30 min before
  let state = 'open';
  if (left <= 0) state = 'full';
  else if (base.capacity > 1 && left <= fewLeftAt) state = 'few';
  return { ...base, id, booked, left, state, past, mineCount: mine };
}

/* All slots on a date, every service and coach. */
export function slotsOn(key) {
  const d = fromKey(key);
  const wd = d.getDay();
  if (closedDays.includes(wd)) return [];
  const out = [];
  classes.filter((c) => c.day === wd).forEach((c) => {
    out.push(makeSlot({ service: 'group', coach: c.coach, date: key, time: c.time, minutes: c.minutes, name: c.name, kind: c.kind, trial: c.trial, classId: c.id, capacity: serviceById('group').capacity }));
  });
  Object.entries(coachSlots).forEach(([coach, bySvc]) => {
    Object.entries(bySvc).forEach(([svc, byDay]) => {
      (byDay[wd] || []).forEach((time) => {
        const s = serviceById(svc);
        out.push(makeSlot({ service: svc, coach, date: key, time, minutes: s.minutes, name: s.label, kind: s.label, trial: false, capacity: s.capacity }));
      });
    });
  });
  return out.sort((a, b) => toMin(a.time) - toMin(b.time));
}

export function slotsFor({ service, coach = 'any', date }) {
  return slotsOn(date).filter((s) => s.service === service && (coach === 'any' || s.coach === coach));
}

export function findSlot(id) {
  const [service, coach, date, time] = id.split('|');
  return slotsOn(date).find((s) => s.service === service && s.coach === coach && s.time === time) || null;
}

/* Weekdays a coach works, derived from the same data. */
export function coachDays(coachId) {
  const days = new Set();
  classes.forEach((c) => { if (c.coach === coachId) days.add(c.day); });
  Object.values(coachSlots[coachId] || {}).forEach((byDay) => Object.entries(byDay).forEach(([d, times]) => { if (times.length) days.add(Number(d)); }));
  return [1, 2, 3, 4, 5, 6, 0].filter((d) => days.has(d));
}
export const DAY_NAMES_SHORT = DAY_SHORT;

export function coachesForService(service) {
  return coaches.filter((c) => (service === 'group' ? classes.some((k) => k.coach === c.id) : coachSlots[c.id] && coachSlots[c.id][service]));
}

export function slotLabel(slot) {
  if (slot.state === 'full') return slot.capacity > 1 ? 'Full' : 'Booked';
  if (slot.capacity > 1) return `${slot.left} ${slot.left === 1 ? 'spot' : 'spots'} left`;
  return 'Available';
}
