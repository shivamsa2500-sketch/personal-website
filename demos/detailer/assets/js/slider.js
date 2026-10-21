/* Before/after drag slider. Pointer drag on the frame, arrow keys on the
   range input. Sweeps once on first view (brand.features.autoSweepSlider),
   which reads well on a filmed scroll. Hook: [data-ba] */
import { $, clamp, easeInOut, reducedMotion } from './ui.js';

export function initSlider({ autoSweep = true } = {}) {
  const box = $('[data-ba]');
  if (!box) return;
  const range = $('[data-ba-range]', box);
  let touched = false;

  const set = (v) => {
    const p = clamp(v, 0, 100);
    box.style.setProperty('--pos', `${p}%`);
    range.value = String(Math.round(p));
    range.setAttribute('aria-valuetext', `${Math.round(100 - p)}% after shown`);
  };

  range.addEventListener('input', () => { touched = true; set(Number(range.value)); });

  let dragging = false;
  const fromEvent = (e) => { const r = box.getBoundingClientRect(); set(((e.clientX - r.left) / r.width) * 100); };
  box.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    dragging = true; touched = true;
    box.setPointerCapture(e.pointerId);
    fromEvent(e);
  });
  box.addEventListener('pointermove', (e) => { if (dragging) fromEvent(e); });
  const stop = () => { dragging = false; };
  box.addEventListener('pointerup', stop);
  box.addEventListener('pointercancel', stop);

  set(50);
  if (!autoSweep || reducedMotion() || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return;
    io.disconnect();
    // 50 -> 14 -> 86 -> 50 over 2.6 s
    const keys = [50, 14, 86, 50]; const dur = 2600; const t0 = performance.now();
    const step = (now) => {
      if (touched) return;
      const t = clamp((now - t0) / dur);
      const seg = Math.min(2, Math.floor(t * 3));
      const local = easeInOut(t * 3 - seg);
      set(keys[seg] + (keys[seg + 1] - keys[seg]) * local);
      if (t < 1) requestAnimationFrame(step);
    };
    setTimeout(() => requestAnimationFrame(step), 250);
  }, { threshold: 0.6 });
  io.observe(box);
}
