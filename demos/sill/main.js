// Sill — reveals, the "will it fit" control, the order bag, index cards, local time, and the motion layer.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // ---------- Reveals: each part once as it enters; the hero plays on load ----------
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  $$('.rise, .shutter, .letters').forEach((el) => io.observe(el));
  requestAnimationFrame(() => $$('.hero .rise, .hero .shutter, .hero .words').forEach((el) => el.classList.add('is-in')));

  $$('.items, .masonry').forEach((list) => {
    [...list.children].forEach((el, i) => { if (!el.style.getPropertyValue('--i')) el.style.setProperty('--i', i % 6); });
  });

  // ---------- Hero: the arched window ----------
  const hero = $('.hero');
  setTimeout(() => hero.classList.add('is-live'), 60);

  // The arch fades between pieces on its own; the round buttons pick one.
  const archImgs = $$('.arch img');
  const picks = $$('.pick');
  const cap = $('.arch-cap');
  let current = 0, timer;
  const show = (i) => {
    if (i === current) return;
    archImgs[current].classList.remove('on'); picks[current].classList.remove('on'); picks[current].setAttribute('aria-pressed', 'false');
    current = i;
    archImgs[i].classList.add('on'); picks[i].classList.add('on'); picks[i].setAttribute('aria-pressed', 'true');
    cap.innerHTML = `<strong>${archImgs[i].dataset.name}</strong><span>$${archImgs[i].dataset.price}</span>`;
    cap.classList.remove('swap'); void cap.offsetWidth; cap.classList.add('swap');
  };
  const autoplay = () => {
    clearInterval(timer);
    if (reduce) return;
    timer = setInterval(() => { if (!document.hidden) show((current + 1) % archImgs.length); }, 4200);
  };
  picks.forEach((b) => b.addEventListener('click', () => { show(Number(b.dataset.i)); autoplay(); }));
  autoplay();

  // Everything in the window floats with the pointer, each at its own depth.
  const field = $('.hero-field');
  const layers = $$('.window [data-depth]');
  if (!reduce && finePointer && field) {
    layers.forEach((l) => { l.style.transition = `${getComputedStyle(l).transition}, translate 1000ms cubic-bezier(0.22, 1, 0.36, 1)`; });
    field.addEventListener('pointermove', (e) => {
      const r = field.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      for (const l of layers) {
        const d = Number(l.dataset.depth);
        l.style.translate = `${(-x * d * 20).toFixed(1)}px ${(-y * d * 20).toFixed(1)}px`;
      }
    });
    field.addEventListener('pointerleave', () => layers.forEach((l) => { l.style.translate = '0 0'; }));
  }

  // ---------- Names marquee: drifts on its own, follows the direction and speed of the scroll ----------
  const track = $('.names-track');
  if (track && !reduce) {
    let x = 0, dir = -1, boost = 0, lastY = scrollY, visible = false;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(track);
    addEventListener('scroll', () => {
      const dy = scrollY - lastY; lastY = scrollY;
      if (dy !== 0) dir = dy > 0 ? -1 : 1;
      boost = Math.min(boost + Math.abs(dy) * 0.6, 40);
    }, { passive: true });
    let prev = performance.now();
    const step = (now) => {
      const dt = Math.min(now - prev, 50); prev = now;
      if (visible) {
        const half = track.scrollWidth / 2;
        x += dir * (0.06 + boost * 0.02) * dt;
        if (x <= -half) x += half; if (x > 0) x -= half;
        track.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
      }
      boost *= 0.92;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // ---------- Will it fit? Dim every piece wider than the visitor's space ----------
  const range = $('#fit-range');
  const out = $('#fit-out');
  const count = $('#fit-count');
  const fill = $('.fit-fill');
  const items = $$('.item[data-w]');
  let shown = items.length;
  const tween = (from, to, render) => {
    if (reduce) return render(to);
    const t0 = performance.now();
    const f = (now) => { const p = Math.min((now - t0) / 400, 1); render(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  };
  const fit = (animate) => {
    const cm = Number(range.value);
    out.textContent = cm;
    fill.style.transform = `scaleX(${(cm / 200).toFixed(3)})`;
    let n = 0;
    for (const it of items) {
      const w = Number(it.dataset.w);
      const wEl = $('.item-w', it);
      wEl.dataset.base ??= wEl.textContent;
      const wasWide = it.classList.contains('too-wide');
      const wide = w > cm;
      if (!wide) n++;
      it.classList.toggle('too-wide', wide);
      wEl.textContent = wide ? `${wEl.dataset.base} · needs ${w - cm} cm more` : wEl.dataset.base;
      if (animate && wasWide !== wide && !reduce) { it.classList.remove('bump'); void it.offsetWidth; it.classList.add('bump'); }
    }
    const from = shown; shown = n;
    tween(from, n, (v) => { count.textContent = n === items.length ? `All ${items.length} pieces fit.` : `${v} of ${items.length} pieces fit in ${cm} cm.`; });
  };
  if (range) { range.addEventListener('input', () => fit(true)); fit(false); }

  // ---------- The order bag ----------
  const bag = document.createElement('button');
  bag.className = 'bag'; bag.type = 'button';
  bag.setAttribute('aria-expanded', 'false'); bag.setAttribute('aria-controls', 'bag-panel');
  bag.innerHTML = 'Your order <span class="bag-count">0</span>';
  const panel = document.createElement('aside');
  panel.className = 'bag-panel'; panel.id = 'bag-panel'; panel.setAttribute('aria-label', 'Your order');
  panel.innerHTML = '<h2>Your order</h2><ul class="bag-list"></ul><p class="bag-total"><span>Total</span><span class="bag-sum">$0</span></p><a class="button bag-send" href="#">Send this order by email</a>';
  document.body.append(panel, bag);
  const order = new Map();

  const renderBag = () => {
    let qty = 0, sum = 0;
    const list = $('.bag-list', panel);
    list.innerHTML = '';
    for (const [name, it] of order) {
      qty += it.qty; sum += it.qty * it.price;
      const li = document.createElement('li');
      li.innerHTML = `<img src="${it.img}" alt=""><span><strong>${name}</strong><br>${it.qty} × $${it.price}</span><button type="button">Remove</button>`;
      $('button', li).addEventListener('click', () => {
        if (--it.qty <= 0) { order.delete(name); $$(`.add[data-name="${CSS.escape(name)}"]`).forEach((b) => { b.classList.remove('added'); b.textContent = 'Add to order'; }); }
        renderBag();
      });
      list.append(li);
    }
    $('.bag-count', bag).textContent = qty;
    $('.bag-sum', panel).textContent = `$${sum.toLocaleString('en-US')}`;
    bag.classList.toggle('show', qty > 0);
    if (qty === 0) togglePanel(false);
    const lines = [...order].map(([n, it]) => `${it.qty} × ${n} — $${it.qty * it.price}`).join('\n');
    $('.bag-send', panel).href = `mailto:hello@sill.example?subject=${encodeURIComponent('Order from the website')}&body=${encodeURIComponent(`Hello Sill,\n\nI'd like to order:\n\n${lines}\n\nTotal: $${sum}\n\nDelivery postcode: `)}`;
  };
  const togglePanel = (open) => {
    panel.classList.toggle('open', open);
    bag.setAttribute('aria-expanded', String(open));
  };
  bag.addEventListener('click', () => togglePanel(!panel.classList.contains('open')));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') togglePanel(false); });

  // A small copy of the piece arcs from where it was picked into the bag.
  const fly = (img) => {
    if (reduce || !img) return Promise.resolve();
    const a = img.getBoundingClientRect();
    const b = bag.getBoundingClientRect();
    const size = Math.min(a.width, a.height, 120);
    const ghost = document.createElement('img');
    ghost.src = img.currentSrc || img.src; ghost.className = 'flyer'; ghost.alt = '';
    Object.assign(ghost.style, { left: `${a.left + a.width / 2 - size / 2}px`, top: `${a.top + a.height / 2 - size / 2}px`, width: `${size}px`, height: `${size}px` });
    document.body.append(ghost);
    const dx = b.left + b.width - 40 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const anim = ghost.animate([
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 140}px) scale(0.7) rotate(-12deg)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.18) rotate(8deg)`, opacity: 0.6 },
    ], { duration: 820, easing: 'cubic-bezier(0.5, 0, 0.3, 1)' });
    return anim.finished.then(() => ghost.remove());
  };

  const add = (name, price, img, sourceImg, button) => {
    const it = order.get(name) || { qty: 0, price, img };
    it.qty++; order.set(name, it);
    if (button) { button.classList.add('added'); button.textContent = `Added · ${it.qty}`; }
    bag.classList.add('show');
    fly(sourceImg).then(() => { renderBag(); bag.classList.remove('pop'); void bag.offsetWidth; bag.classList.add('pop'); });
  };

  // An add button under every piece in the catalogue.
  for (const it of items) {
    const name = $('.item-line strong', it).textContent;
    const price = Number($('.item-line span', it).textContent.replace(/[^0-9]/g, ''));
    const img = $('img', it);
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'add'; btn.dataset.name = name; btn.textContent = 'Add to order';
    btn.addEventListener('click', () => add(name, price, img.getAttribute('src'), img, btn));
    $('div', it).append(btn);
  }
  // The showcase's Order buttons add to the same bag.
  $$('.panel').forEach((p) => {
    const name = $('.item-name', p).textContent;
    const price = Number($('.panel-row span', p).textContent.match(/\$(\d+)/)[1]);
    const img = $('.object', p);
    const btn = $('.button-ink', p);
    btn.textContent = 'Add to order';
    btn.addEventListener('click', (e) => { e.preventDefault(); add(name, price, img.getAttribute('src'), img, null); btn.textContent = 'Added'; });
  });

  // ---------- Index cards: one open at a time ----------
  const cards = $$('.card');
  cards.forEach((card) => $('.q', card).addEventListener('click', () => {
    const open = card.classList.contains('is-open');
    cards.forEach((c) => { c.classList.remove('is-open'); $('.q', c).setAttribute('aria-expanded', 'false'); });
    if (!open) { card.classList.add('is-open'); $('.q', card).setAttribute('aria-expanded', 'true'); }
  }));

  // ---------- Local time in London, and whether the showroom is open (Thu–Sun, 10–18) ----------
  const clock = $('#clock');
  const openNow = $('#open-now');
  const tick = () => {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false }).formatToParts(new Date()).map((p) => [p.type, p.value]));
    clock.textContent = `${parts.hour}:${parts.minute}`;
    const h = Number(parts.hour);
    openNow.textContent = ['Thu', 'Fri', 'Sat', 'Sun'].includes(parts.weekday) && h >= 10 && h < 18 ? 'The showroom is open now' : 'Showroom open Thursday to Sunday';
  };
  tick(); setInterval(tick, 30000);

  // ---------- Visit form: open an email with the visitor's details written in ----------
  const form = $('#visit-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const body = `Hello Sill,\n\nI'd like to book a visit to the showroom.\n\nName: ${form.elements.name.value.trim()}\nEmail: ${form.elements.email.value.trim()}\nPreferred day: `;
    location.href = `mailto:hello@sill.example?subject=${encodeURIComponent('Showroom visit')}&body=${encodeURIComponent(body)}`;
  });

  if (reduce) return;

  // ---------- Showcase: the chairs drift as the panels pass, and lean toward the pointer ----------
  const objs = $$('.panel .object');
  const stages = $$('.stage-tile');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    for (const o of objs) {
      const r = o.parentElement.getBoundingClientRect();
      const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      if (Math.abs(p) < 1.5) o.style.translate = `0 ${(p * 60).toFixed(1)}px`;
    }
    // Process tiles grow upward as they come into view.
    for (const s of stages) {
      const r = s.getBoundingClientRect();
      const p = Math.min(Math.max((innerHeight - r.top) / (innerHeight * 0.7), 0), 1);
      s.style.setProperty('--grow', `${((1 - p) * 35).toFixed(1)}%`);
    }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  if (finePointer) {
    $$('.panel').forEach((p) => {
      const o = $('.object', p);
      o.style.transition = 'rotate 700ms cubic-bezier(0.22, 1, 0.36, 1), scale 700ms cubic-bezier(0.22, 1, 0.36, 1)';
      p.addEventListener('pointermove', (e) => {
        const r = p.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        o.style.rotate = `${(x * 5).toFixed(2)}deg`;
        o.style.scale = '1.03';
      });
      p.addEventListener('pointerleave', () => { o.style.rotate = '0deg'; o.style.scale = '1'; });
    });
  }
})();
