/* Mirrorline Detail Studio demo: boot file. No external requests, no libraries. */
import brand from '../../brand.config.js';
import { $, $$ } from './ui.js';
import { initStages } from './stages.js';
import { initPackages } from './packages.js';
import { initSlider } from './slider.js';
import { initQuote } from './quote.js';
import { initBooking } from './booking.js';

/* ---- Brand text from brand.config.js ----------------------------------- */
$$('[data-brand]').forEach((el) => { const v = brand[el.dataset.brand]; if (v) el.textContent = v; });
$$('[data-brand-phone]').forEach((a) => { a.href = brand.contact.phoneHref; });
$$('[data-brand-phone-text]').forEach((el) => { el.textContent = brand.contact.phone; });
$$('[data-brand-email]').forEach((a) => { a.href = `mailto:${brand.contact.email}`; });
$$('[data-brand-email-text]').forEach((el) => { el.textContent = brand.contact.email; });
$$('[data-brand-hours]').forEach((el) => { el.textContent = brand.contact.hours; });
$$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

/* ---- Features ---------------------------------------------------------- */
initPackages();
initStages();
initSlider({ autoSweep: brand.features.autoSweepSlider });
initQuote();
initBooking();

/* ---- Header: transparent over the hero, solid after, hides on scroll down */
const header = $('[data-header]');
const hero = $('[data-hero]');
const stages = $('[data-stages]');
new IntersectionObserver(([e]) => header.classList.toggle('is-solid', !e.isIntersecting), { rootMargin: '-64px 0px 0px 0px' }).observe(hero);
let lastY = window.scrollY;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  const r = stages.getBoundingClientRect();
  const inStages = r.top <= 0 && r.bottom >= window.innerHeight;
  header.classList.toggle('is-hidden', inStages || (y > lastY && y > window.innerHeight));
  lastY = y;
}, { passive: true });
document.addEventListener('focusin', (e) => { if (header.contains(e.target)) header.classList.remove('is-hidden'); });

/* ---- Mobile dock: after the hero, hidden while the booking form shows -- */
const dock = $('[data-dock]');
let heroOut = false; let bookIn = false;
const syncDock = () => dock.classList.toggle('is-visible', heroOut && !bookIn);
new IntersectionObserver(([e]) => { heroOut = !e.isIntersecting; syncDock(); }, { rootMargin: '0px 0px -40% 0px' }).observe(hero);
new IntersectionObserver(([e]) => { bookIn = e.isIntersecting; syncDock(); }, { threshold: 0.15 }).observe($('[data-book-section]'));

/* ---- Scroll-in reveal hook ([data-reveal]) ------------------------------ */
$$('.section-head').forEach((el) => el.setAttribute('data-reveal', ''));
const revealIO = new IntersectionObserver((entries) => entries.forEach((en) => {
  if (en.isIntersecting) { en.target.classList.add('is-in'); revealIO.unobserve(en.target); }
}), { rootMargin: '0px 0px -10% 0px' });
$$('[data-reveal]').forEach((el) => revealIO.observe(el));
