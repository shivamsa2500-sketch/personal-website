/* pages/guide.js: guide articles (DESIGN §7.22, DESIGN-DECISIONS 9).
   - "Coffees for this brewer" rail (pocket cards; + Add sets the grind).
   - Step timer: a progressive enhancement inside the recipe card. Without JS
     the card is a static recipe. Start / Pause / Resume / Reset; the current
     step gets aria-current="step" (3 px Clay rule); the polite live region
     speaks only on step change; Screen Wake Lock while running. Nothing
     animates, so it is reduced-motion safe by construction. */
import { registerPage, brand } from '../main.js';
import { getProduct, coffeesForBrew } from '../../../data/products.js';
import { renderProductList } from '../components/product-card.js';
import { refreshGlass } from '../glass.js';

const $ = (s, r = document) => r.querySelector(s);
const mmss = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

function coffees() {
  const host = $('[data-guide-coffees]');
  if (!host) return;
  const brew = host.dataset.brew;
  let list = (host.dataset.slugs ?? '').split(',').map((s) => getProduct(s.trim())).filter(Boolean);
  if (list.length < 3 && typeof coffeesForBrew === 'function') {
    for (const p of coffeesForBrew(brew)) if (list.length < 3 && !list.includes(p)) list.push(p);
  }
  if (!list.length) return;
  const label = host.closest('section')?.querySelector('h2')?.textContent ?? '';
  host.innerHTML = renderProductList(list, { rail: true, brew, heading: 'h3', label });
}

function timer() {
  const card = $('[data-recipe]');
  const box = card?.querySelector('[data-timer]');
  if (!box || brand.features?.brewTimer === false) return;
  const total = Number(card.dataset.duration) || 240;
  const btn = box.querySelector('[data-timer-start]');
  const reset = box.querySelector('[data-timer-reset]');
  const readout = box.querySelector('[data-timer-readout]');
  const live = box.querySelector('[data-timer-live]');
  const steps = [...document.querySelectorAll('[data-steps] > [data-at]')]
    .map((el) => ({ el, at: Number(el.dataset.at) }))
    .sort((a, b) => a.at - b.at);

  let acc = 0;            // ms accumulated before the current run
  let startedAt = 0;      // performance.now() of the current run
  let tick = 0;
  let state = 'idle';     // idle | running | paused | done
  let current = null;
  let lock = null;

  const elapsed = () => acc + (state === 'running' ? performance.now() - startedAt : 0);
  const say = (t) => { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 60); };

  async function wake(on) {
    try {
      if (on && 'wakeLock' in navigator && !lock) {
        lock = await navigator.wakeLock.request('screen');
        lock.addEventListener?.('release', () => { lock = null; });
      } else if (!on && lock) { await lock.release(); lock = null; }
    } catch { lock = null; /* denied or unsupported: the timer still works */ }
  }

  function setStep(step) {
    if (step === current) return;
    current?.el.removeAttribute('aria-current');
    current = step;
    if (!step) return;
    step.el.setAttribute('aria-current', 'step');
    const title = step.el.querySelector('.step__title')?.textContent.trim() ?? '';
    say(`${mmss(step.at)}. ${title}`);
  }

  function render() {
    const sec = Math.min(total, elapsed() / 1000);
    readout.textContent = mmss(sec);
    let step = null;
    for (const s of steps) if (s.at <= sec) step = s;
    if (state !== 'idle') setStep(step);
    if (sec >= total && state === 'running') finish();
  }

  function setState(next) {
    state = next;
    box.dataset.state = next;
    btn.textContent = { idle: `Start ${mmss(total)}`, running: 'Pause', paused: 'Resume', done: 'Start again' }[next];
  }

  function start() {
    if (state === 'done') resetAll(false);
    startedAt = performance.now();
    setState('running');
    clearInterval(tick);
    tick = setInterval(render, 250);
    render();
    wake(true);
  }
  function pause() {
    acc = elapsed();
    clearInterval(tick);
    setState('paused');
    render();
    wake(false);
    say(`Paused at ${mmss(acc / 1000)}.`);
  }
  function finish() {
    acc = total * 1000;
    clearInterval(tick);
    setState('done');
    readout.textContent = mmss(total);
    wake(false);
    say(card.dataset.done || `${mmss(total)}. Done.`);
  }
  function resetAll(announce = true) {
    clearInterval(tick);
    acc = 0;
    setStep(null);
    setState('idle');
    readout.textContent = mmss(0);
    wake(false);
    if (announce) say('Timer reset.');
  }

  btn.addEventListener('click', () => (state === 'running' ? pause() : start()));
  reset.addEventListener('click', () => { resetAll(); btn.focus(); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state === 'running') { render(); wake(true); }
  });

  setState('idle');
  box.hidden = false;
}

registerPage('guide', () => {
  coffees();
  timer();
  requestAnimationFrame(refreshGlass);
});
