/* Forgeline Coaching demo: boot file. No external requests, no libraries. */
import brand from '../../brand.config.js';
import { $, $$, reducedMotion, openDialog, closeDialog, wireDialog, emit, toast } from './ui.js';
import { upcomingDays, dateKey, slotsOn, coachById, dayShort, slotLabel, store, onChange } from './availability.js';
import { initHero } from './hero.js';
import { initCoaches } from './coaches.js';
import { initTimetable } from './timetable.js';
import { initTrial } from './trial.js';
import { initBooking } from './booking.js';

/* ---- Brand text + media from brand.config.js --------------------------- */
$$('[data-brand]').forEach((el) => { const v = brand[el.dataset.brand]; if (v) el.textContent = v; });
$$('[data-brand-email]').forEach((a) => { a.href = `mailto:${brand.contact.email}`; a.textContent = brand.contact.email; });
$$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
$$('img[data-media-src]').forEach((img) => {
  const src = brand.media[img.dataset.mediaSrc];
  const host = img.parentElement;
  // No licensed photo configured, or it fails to load: drop the <img> and let
  // the section show its built-in brand graphic (no broken image, no 404).
  const missing = () => { img.remove(); host.classList.add('no-photo'); };
  if (!src) { missing(); return; }
  if (img.dataset.mediaSrcset) {
    const set = img.dataset.mediaSrcset.split(',').map((part) => { const [key, w] = part.trim().split(/\s+/); return brand.media[key] ? `${brand.media[key]} ${w}` : ''; }).filter(Boolean);
    if (set.length) img.srcset = set.join(', ');
  }
  img.addEventListener('error', missing, { once: true });
  img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true });
  img.src = src;
});

/* ---- Features ---------------------------------------------------------- */
initHero();
initCoaches();
initTimetable();
initTrial();
initBooking();

/* ---- Header: transparent over the hero, solid after ------------------- */
const header = $('[data-header]');
const hero = $('[data-hero]');
new IntersectionObserver(([e]) => header.classList.toggle('is-solid', !e.isIntersecting), { rootMargin: '-72px 0px 0px 0px' }).observe(hero);
let lastY = window.scrollY;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  header.classList.toggle('is-hidden', y > lastY && y > window.innerHeight && !document.documentElement.classList.contains('has-dialog'));
  lastY = y;
}, { passive: true });
document.addEventListener('focusin', (e) => { if (header.contains(e.target)) header.classList.remove('is-hidden'); });

/* ---- Mobile menu ------------------------------------------------------- */
const menu = $('[data-menu]');
wireDialog(menu);
$('[data-menu-open]').addEventListener('click', (e) => openDialog(menu, e.currentTarget));
$$('[data-menu-link]').forEach((a) => a.addEventListener('click', () => closeDialog(menu)));

/* ---- Links that jump into booking with something preselected ----------- */
$$('[data-book]').forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  let opts = {};
  try { opts = JSON.parse(a.dataset.book); } catch (err) { /* plain link */ }
  emit('book', opts);
}));

/* ---- Reset demo data ---------------------------------------------------- */
const resetBtn = $('[data-reset-demo]');
if (resetBtn) {
  if (!brand.features.resetDemoLink) resetBtn.hidden = true;
  resetBtn.addEventListener('click', () => { store.reset(); emit('demo-reset'); toast('Demo data cleared: free trial and bookings reset.'); });
}

/* ---- Hero chip: next free-trial class (live from data/schedule.js) ------ */
const nextChip = $('[data-next-class]');
function renderNextClass() {
  if (!nextChip) return;
  const used = !!store.trial();
  const next = upcomingDays(7).flatMap((d) => slotsOn(dateKey(d))).find((s) => s.service === 'group' && s.trial && !s.past && s.state !== 'full');
  if (!next || used) { nextChip.hidden = true; return; }
  const today = next.date === dateKey(new Date());
  const c = coachById(next.coach);
  nextChip.hidden = false;
  nextChip.innerHTML = `<span class="next-class__label">Next free class</span><span class="next-class__what">${next.name} with ${c.firstName}</span><span class="next-class__when">${today ? 'Today' : dayShort(new Date(next.date + 'T00:00'))} at ${next.time}</span><span class="next-class__spots">${slotLabel(next)}</span>`;
  nextChip.onclick = (e) => { e.preventDefault(); emit('trial', { slotId: next.id }); };
}
renderNextClass();
onChange(renderNextClass);

/* ---- Counters: the only scroll-triggered motion (results numbers) ------ */
if (!reducedMotion() && 'IntersectionObserver' in window) {
  $$('[data-count-to]').forEach((el) => { el.textContent = el.dataset.countFrom || 0; });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { countUp(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.4 });
  $$('[data-progress-card]').forEach((el) => io.observe(el));
}

function countUp(card) {
  const el = $('[data-count-to]', card);
  if (!el) return;
  const to = Number(el.dataset.countTo), from = Number(el.dataset.countFrom || 0);
  const dur = 1200, t0 = performance.now() + 200;
  const tick = (t) => {
    const p = Math.min(1, Math.max(0, (t - t0) / dur));
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (to - from) * eased);
    if (p < 1) requestAnimationFrame(tick);
  };
  el.textContent = from;
  requestAnimationFrame(tick);
}
