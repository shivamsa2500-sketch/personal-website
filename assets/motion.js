// 3D scroll effects. Each element gets a scroll progress value as a CSS variable
// and site.css turns it into transforms and opacity only, so text never reflows.
//   --p  0 → 1 as the element enters the screen        (rise, tilt, flip)
//   --x  0 → 1 as the element leaves through the top   (exit)
//   --t  0 → 1 while the element crosses the screen    (ticker)
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const types = [
    ['.hero, .page-head', 'exit'],
    ['.ticker', 'ticker'],
    ['.row', 'flip'],
    ['.steps > div, .card, .shot, .next', 'tilt'],
    ['.hello, .next-up, .feature-body, .form, .policy', 'rise'],
  ];
  const items = [];
  for (const [sel, type] of types) {
    document.querySelectorAll(sel).forEach((el) => {
      // anything already on screen when the page opens starts settled, not mid-animation
      if (type !== 'exit' && type !== 'ticker' && el.getBoundingClientRect().top < innerHeight * 0.9) return;
      el.dataset['3d'] = type;
      items.push({ el, type, last: '' });
    });
  }
  if (!items.length) return;
  document.documentElement.classList.add('motion');

  const clamp = (v) => Math.min(1, Math.max(0, v));
  let queued = false;

  function update() {
    queued = false;
    const vh = innerHeight;
    for (const item of items) {
      const r = item.el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue;
      let name, v;
      if (item.type === 'exit') {
        name = '--x';
        // starts once a third of the block has scrolled away, so buttons stay solid while in view
        const h = Math.max(r.height, vh * 0.6);
        v = clamp((-r.top - h / 3) / (h * 0.67));
      } else if (item.type === 'ticker') {
        name = '--t';
        v = clamp((vh - r.top) / (vh + r.height));
      } else {
        name = '--p';
        v = clamp((vh - r.top) / (vh * (item.type === 'flip' ? 0.35 : 0.55)));
      }
      const val = v.toFixed(3);
      if (val !== item.last) {
        item.el.style.setProperty(name, val);
        item.last = val;
      }
    }
  }

  const queue = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  update();
})();
