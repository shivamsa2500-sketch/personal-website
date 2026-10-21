/* Instant quote builder. EXAMPLE numbers from data/quote.js, always
   labelled "Example" on the page. Hook: [data-quote] */
import { $, $$, on, emit, money, reducedMotion, scrollToEl } from './ui.js';
import { quote } from '../../data/quote.js';
import { packages, packageById } from '../../data/packages.js';

const ICONS = { coupe: 'i-coupe', sedan: 'i-sedan', suv: 'i-suv', truck: 'i-truck' };
const round10 = (n) => Math.round(n / 10) * 10;

export function initQuote() {
  const form = $('[data-quote]');
  if (!form) return;
  const sizesEl = $('[data-quote-sizes]', form);
  const pkgsEl = $('[data-quote-packages]', form);
  const addonsEl = $('[data-quote-addons]', form);
  const priceEl = $('[data-quote-price]', form);

  sizesEl.innerHTML = quote.sizes.map((s) => `
    <label class="opt"><input type="radio" name="size" value="${s.id}"${s.id === 'sedan' ? ' checked' : ''}>
      <span class="opt__box"><svg aria-hidden="true" focusable="false"><use href="#${ICONS[s.id] || 'i-sedan'}"/></svg><span class="opt__title">${s.label}</span></span></label>`).join('');
  pkgsEl.innerHTML = packages.map((p) => `
    <label class="opt"><input type="radio" name="pkg" value="${p.id}"${p.featured ? ' checked' : ''}>
      <span class="opt__box"><span class="opt__title">${p.name}</span><span class="opt__sub">${p.blurb}</span></span></label>`).join('');
  addonsEl.innerHTML = quote.addons.map((a) => `
    <label class="chip"><input type="checkbox" name="addon" value="${a.id}"><span>${a.label}</span></label>`).join('');

  let shown = [0, 0]; let raf = 0; let last = null;

  const current = () => {
    const size = quote.sizes.find((s) => s.id === form.elements.size.value);
    const pkg = packageById(form.elements.pkg.value);
    const addons = $$('input[name="addon"]:checked', form).map((i) => quote.addons.find((a) => a.id === i.value));
    if (!size || !pkg) return null;
    const base = quote.base[pkg.id];
    let lo = base[0] * size.factor; let hi = base[1] * size.factor;
    addons.forEach((a) => { lo += a.range[0]; hi += a.range[1]; });
    return { size, pkg, addons, lo: round10(lo), hi: round10(hi) };
  };

  const paint = (lo, hi) => {
    priceEl.innerHTML = `${money(lo, quote.currency)}<span class="dash">–</span>${money(hi, quote.currency)}`;
  };

  const update = () => {
    const q = current();
    last = q;
    $('[data-quote-sum-size]', form).textContent = q ? q.size.label : 'Not chosen';
    $('[data-quote-sum-pkg]', form).textContent = q ? q.pkg.name + (q.addons.length ? ` + ${q.addons.length} add-on${q.addons.length > 1 ? 's' : ''}` : '') : 'Not chosen';
    $('[data-quote-sum-time]', form).textContent = q ? q.pkg.time : 'Varies';
    if (!q) { priceEl.textContent = 'Pick a size and package'; priceEl.classList.add('is-empty'); return; }
    priceEl.classList.remove('is-empty');
    if (!quote.showNumbers) { priceEl.textContent = 'We quote within a day'; return; }
    priceEl.setAttribute('aria-label', `Example estimate ${money(q.lo)} to ${money(q.hi)}`);
    if (reducedMotion() || (shown[0] === 0 && shown[1] === 0)) { shown = [q.lo, q.hi]; paint(q.lo, q.hi); return; }
    // count to the new range
    cancelAnimationFrame(raf);
    const from = [...shown]; const t0 = performance.now(); const dur = 450;
    priceEl.classList.remove('is-bump'); void priceEl.offsetWidth; priceEl.classList.add('is-bump');
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur); const e = 1 - Math.pow(1 - t, 3);
      shown = [from[0] + (q.lo - from[0]) * e, from[1] + (q.hi - from[1]) * e];
      paint(round10(shown[0]), round10(shown[1]));
      if (t < 1) raf = requestAnimationFrame(step); else shown = [q.lo, q.hi];
    };
    raf = requestAnimationFrame(step);
  };

  form.addEventListener('change', update);
  form.addEventListener('submit', (e) => e.preventDefault());
  update();

  on('pick-package', (id) => {
    const input = form.querySelector(`input[name="pkg"][value="${id}"]`);
    if (input) { input.checked = true; update(); }
  });

  $('[data-quote-book]', form).addEventListener('click', (e) => {
    if (!last) return;
    e.preventDefault();
    emit('prefill-booking', {
      size: last.size.id,
      pkg: last.pkg.id,
      note: `From the quote builder: ${last.size.label}, ${last.pkg.name}${last.addons.length ? ' + ' + last.addons.map((a) => a.label).join(', ') : ''}. Example estimate ${money(last.lo)}–${money(last.hi)}.`,
    });
    scrollToEl($('#book'));
  });
}
