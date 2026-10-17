/* pages/cafes.js: Cafés (DESIGN §7.23, §8.8, DESIGN-DECISIONS 10).
   Everything comes from brand.config.js `cafes`: city chips, cards with an
   "Open now" status computed from the hours, a 6 px day bar, the week's
   hours, and an illustrative contour map with pin buttons (no map API).
   Time zone: `cafe.timeZone` → `brand.timeZone` → the device's local time
   (COPY §10.4 "Based on your device's local time"). */
import { registerPage, brand } from '../main.js';
import { esc, icon, lens } from '../components/ui.js';
import { contours } from '../contours.js';
import { refreshGlass } from '../glass.js';
import { BOX_INDIA, project, outlineSVG } from '../map-india.js';

const $ = (s, r = document) => r.querySelector(s);
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const BAR_FROM = 7 * 60, BAR_TO = 23 * 60; // the day bar spans 07:00–23:00
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const toMin = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + (m || 0); };
/** 450 → "7:30 am", 1260 → "9 pm" */
const fmt = (min) => {
  const h = Math.floor(min / 60) % 24, m = min % 60;
  const h12 = h % 12 || 12;
  return `${h12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'am' : 'pm'}`;
};

/** "Mon–Fri" / "Sat–Sun" / "Mon" → [0..6] day indexes (Mon = 0), wraps. */
function expandDays(str) {
  const [a, b] = String(str).split(/\s*[–-]\s*/).map((d) => DAYS.indexOf(d.slice(0, 3)));
  if (a < 0) return [];
  if (b == null || b < 0) return [a];
  const out = [];
  for (let i = a; ; i = (i + 1) % 7) { out.push(i); if (i === b || out.length > 7) break; }
  return out;
}
/** week[0..6] = { open, close } in minutes, or null when closed */
function weekOf(cafe) {
  const week = Array(7).fill(null);
  for (const r of cafe.hours ?? []) {
    for (const d of expandDays(r.days)) week[d] = r.open && r.close ? { open: toMin(r.open), close: toMin(r.close) } : null;
  }
  return week;
}
/** { day (Mon = 0), min } now, in the café's time zone when known */
function nowIn(tz) {
  const d = new Date();
  if (tz) {
    try {
      const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        .formatToParts(d).map((p) => [p.type, p.value]));
      return { day: DAYS.indexOf(parts.weekday.slice(0, 3)), min: Number(parts.hour) * 60 + Number(parts.minute) };
    } catch { /* unknown zone: fall through to local */ }
  }
  return { day: (d.getDay() + 6) % 7, min: d.getHours() * 60 + d.getMinutes() };
}
function status(week, now) {
  const t = week[now.day];
  if (t && now.min >= t.open && now.min < t.close) return { open: true, text: `Open now · until ${fmt(t.close)}` };
  if (t && now.min < t.open) return { open: false, text: `Opens at ${fmt(t.open)}` };
  for (let k = 1; k <= 7; k++) {
    const n = week[(now.day + k) % 7];
    if (n) return { open: false, text: `Closed · opens ${k === 1 ? 'tomorrow' : DAYS[(now.day + k) % 7]} ${fmt(n.open)}` };
  }
  return { open: false, text: 'Closed today' };
}

const pct = (m) => Math.min(100, Math.max(0, ((m - BAR_FROM) / (BAR_TO - BAR_FROM)) * 100));
function hoursBar(today, now) {
  const span = today ? `<span class="hours-bar__open" style="left:${pct(today.open).toFixed(2)}%;width:${(pct(today.close) - pct(today.open)).toFixed(2)}%"></span>` : '';
  const tick = now.min >= BAR_FROM && now.min <= BAR_TO ? `<span class="hours-bar__now" style="left:${pct(now.min).toFixed(2)}%"></span>` : '';
  return `<div class="hours-bar" aria-hidden="true">${span}${tick}</div>
    <p class="hours-scale" aria-hidden="true"><span>7</span><span>12</span><span>18</span><span>23</span></p>`;
}
function hoursList(cafe) {
  const rows = (cafe.hours ?? []).map((r) => `<div><dt>${esc(r.days)}</dt><dd>${r.open && r.close ? `${fmt(toMin(r.open))}–${fmt(toMin(r.close))}` : 'Closed'}</dd></div>`);
  if (rows.length <= 3) return `<dl class="hours-list">${rows.join('')}</dl>`;
  // > 3 ranges: Saturday's range stays visible, the rest fold away (DESIGN §7.23)
  const satIdx = (cafe.hours ?? []).findIndex((r) => expandDays(r.days).includes(5));
  const sat = rows.splice(Math.max(0, satIdx), 1);
  return `<dl class="hours-list">${sat.join('')}</dl><details><summary class="text-btn">All days</summary><dl class="hours-list">${rows.join('')}</dl></details>`;
}

function cardHTML(cafe, now, tz) {
  const week = weekOf(cafe);
  const st = status(week, now);
  const tel = `tel:${String(cafe.phone ?? '').replace(/[^\d+]/g, '')}`;
  const dir = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${cafe.name}, ${cafe.address}`)}`;
  const id = esc(cafe.id);
  return `<li data-city="${esc(cafe.city)}">
  <article class="cafe-card" id="cafe-${id}" data-cafe="${id}" tabindex="-1" aria-labelledby="cafe-${id}-name">
    ${lens()}
    <div class="cafe-card__plate">
      <h2 class="cafe-card__name" id="cafe-${id}-name">${esc(cafe.name)}</h2>
      <address class="cafe-card__addr">${esc(cafe.address)}</address>
      <p class="cafe-status${st.open ? '' : ' cafe-status--closed'}"><span class="cafe-status__dot" aria-hidden="true"></span><span>${esc(st.text)}</span><span class="visually-hidden">. ${tz ? `Times in ${esc(cafe.city)} local time` : "Based on your device's local time"}</span></p>
      ${hoursBar(week[now.day], now)}
      <h3 class="visually-hidden">Opening hours</h3>
      ${hoursList(cafe)}
      ${cafe.blurb ? `<p class="cafe-card__blurb">${esc(cafe.blurb)}</p>` : ''}
      ${cafe.amenities?.length ? `<ul class="cafe-card__amen" role="list" aria-label="At this café">${cafe.amenities.map((a) => `<li class="note-pill">${esc(a)}</li>`).join('')}</ul>` : ''}
      <div class="cafe-card__actions">
        <a class="btn btn--ghost squish cafe-card__dir" href="${esc(dir)}" target="_blank" rel="noopener" aria-label="Get directions to ${esc(cafe.name)} (opens in a new tab)"><span>Get directions</span>${icon('i-external-link', 16)}</a>
        ${cafe.phone ? `<a class="text-btn cafe-card__call" href="${esc(tel)}" aria-label="Call ${esc(cafe.name)}">${icon('i-phone', 20)}<span>Call</span></a>` : ''}
      </div>
    </div>
  </article>
</li>`;
}

/* ---- map labels (shared with the Home farm map) ----------------------------
   Every label sits on a Paper plate beside its pin. Candidates are tried in
   cost order (beside → above/below → diagonal with a leader line → further
   out), and a small exhaustive search picks the cheapest set in which no
   label overlaps another label, any pin, an `avoid` box or the frame edge.
   All units are CSS px inside the frame. A point may carry `prefer: 'bl'`
   (an art-directed side); it wins whenever it fits. */
const LABEL_SIDES = [ // [side, cost, (x, y, w, h, o) → [left, top]]; o = dot radius + 3
  ['r', 0, (x, y, w, h, o) => [x + o, y - h / 2]], ['l', 1, (x, y, w, h, o) => [x - o - w, y - h / 2]],
  ['r-u', 1.5, (x, y, w, h, o) => [x + o, y - h + 4]], ['r-d', 1.5, (x, y, w, h, o) => [x + o, y - 4]],
  ['l-u', 2, (x, y, w, h, o) => [x - o - w, y - h + 4]], ['l-d', 2, (x, y, w, h, o) => [x - o - w, y - 4]],
  ['b', 2, (x, y, w, h, o) => [x - w / 2, y + o]], ['a', 2, (x, y, w, h, o) => [x - w / 2, y - o - h]],
  ['br', 3, (x, y, w, h, o) => [x + o, y + o]], ['bl', 3, (x, y, w, h, o) => [x - o - w, y + o]],
  ['tr', 3, (x, y, w, h, o) => [x + o, y - o - h]], ['tl', 3, (x, y, w, h, o) => [x - o - w, y - o - h]],
  ['br2', 6, (x, y, w, h, o) => [x + o + 8, y + o + 16]], ['bl2', 6, (x, y, w, h, o) => [x - o - 8 - w, y + o + 16]],
  ['tr2', 6, (x, y, w, h, o) => [x + o + 8, y - o - 16 - h]], ['tl2', 6, (x, y, w, h, o) => [x - o - 8 - w, y - o - 16 - h]],
];
export function placeLabels(pts, { W, H, avoid = [], gap = 4, dot = 9, edge = 4 } = {}) {
  const hit = (a, b, m = 0) => a[0] < b[2] + m && a[2] > b[0] - m && a[1] < b[3] + m && a[3] > b[1] - m;
  const dots = pts.map((p) => [p.x - dot, p.y - dot, p.x + dot, p.y + dot]);
  const cands = pts.map((p) => LABEL_SIDES.map(([side, cost, fn]) => {
    const [l, t] = fn(p.x, p.y, p.w, p.h, dot + 3);
    const preferred = p.prefer && (side === p.prefer || side.startsWith(`${p.prefer}-`) || side === `${p.prefer}2`);
    return { side, cost: preferred ? cost / 10 - 1 : cost, box: [l, t, l + p.w, t + p.h] };
  }).sort((a, b) => a.cost - b.cost).filter((c) => c.box[0] >= edge && c.box[1] >= edge && c.box[2] <= W - edge && c.box[3] <= H - edge
    && !dots.some((d) => hit(c.box, d, 2)) && !avoid.some((a) => hit(c.box, a, gap))));
  // most constrained first; exhaustive with pruning (≤ 12^n, capped)
  const order = pts.map((_, i) => i).sort((a, b) => cands[a].length - cands[b].length);
  let best = null, bestCost = Infinity, steps = 0;
  const pick = Array(pts.length);
  (function walk(k, cost) {
    if (cost >= bestCost || ++steps > 40000) return;
    if (k === order.length) { best = [...pick]; bestCost = cost; return; }
    const i = order[k];
    for (const c of cands[i]) {
      if (order.slice(0, k).some((j) => hit(c.box, pick[j].box, gap))) continue;
      pick[i] = c; walk(k + 1, cost + c.cost);
    }
    if (!cands[i].length) { pick[i] = null; walk(k + 1, cost + 50); }
  })(0, 0);
  return pts.map((p, i) => {
    let c = best?.[i];
    if (!c) { const [l, t] = LABEL_SIDES[0][2](p.x, p.y, p.w, p.h, dot + 3); c = { side: 'r', box: [l, t, l + p.w, t + p.h] }; }
    // leader line from the dot's edge to the nearest point of the plate
    const nx = Math.min(Math.max(p.x, c.box[0]), c.box[2]), ny = Math.min(Math.max(p.y, c.box[1]), c.box[3]);
    const dx = nx - p.x, dy = ny - p.y, len = Math.hypot(dx, dy);
    const lead = len > dot + 6 ? { x: p.x + (dx / len) * (dot - 2), y: p.y + (dy / len) * (dot - 2), len: len - (dot - 2), angle: Math.atan2(dy, dx) } : null;
    return { side: c.side, left: c.box[0], top: c.box[1], lead };
  });
}
/** Write placeLabels() output onto label + leader elements. */
export function applyLabels(placed, labels, leads) {
  placed.forEach((q, i) => {
    labels[i].style.left = `${q.left}px`; labels[i].style.top = `${q.top}px`;
    labels[i].dataset.side = q.side;
    const ln = leads[i];
    if (!ln) return;
    ln.hidden = !q.lead;
    if (q.lead) Object.assign(ln.style, { left: `${q.lead.x}px`, top: `${q.lead.y}px`, width: `${q.lead.len}px`, rotate: `${q.lead.angle}rad` });
  });
}

/* ---- map ----------------------------------------------------------------- */
/** Normalise config mapX/mapY (% of an India map) to the frame with 12 % padding. */
function mapPoints(cafes) {
  const xs = cafes.map((c) => c.mapX ?? 50), ys = cafes.map((c) => c.mapY ?? 50);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const nx = (x) => (x1 === x0 ? 50 : 12 + ((x - x0) / (x1 - x0)) * 76);
  const ny = (y) => (y1 === y0 ? 50 : 14 + ((y - y0) / (y1 - y0)) * 72);
  return cafes.map((c) => ({ cafe: c, x: nx(c.mapX ?? 50), y: ny(c.mapY ?? 50) }));
}
function terrain(points, aspect = 0.75, geo = false) {
  const W = 400, H = Math.round(400 * aspect);
  const paths = points.filter((p, i) => points.findIndex((q) => q.cafe.city === p.cafe.city) === i)
    .map((p, i) => contours([1000 + i * 40, 1150 + i * 40], `${p.cafe.id}-map`, { w: W, h: H, cx: (p.x / 100) * W, cy: (p.y / 100) * H, sx: 20, sy: 18, strokeWidth: 1.5, fit: "bleed" }).path)
    .join('');
  const extra = contours([1100, 1300], 'cafes-ridge', { w: W, h: H, cx: W * 0.8, cy: H * 0.6, sx: 56, sy: Math.min(40, H * 0.12), strokeWidth: 1.5 }).path;
  // R2-3: over the India outline a free-floating ridge would read as an island, so it is dropped
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${paths}${geo ? '' : extra}</svg>`;
}
/** Push pins apart so 44 px hit areas never overlap (positions are illustrative). */
function spread(pins, frame) {
  const w = frame.clientWidth, h = frame.clientHeight, gap = 46;
  if (!w || !h) return;
  const pts = pins.map((p) => ({ el: p.el, x: (p.x / 100) * w, y: (p.y / 100) * h }));
  for (let it = 0; it < 40; it++) {
    let moved = false;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const a = pts[i], b = pts[j];
      let dx = b.x - a.x, dy = b.y - a.y;
      let d = Math.hypot(dx, dy);
      if (d >= gap) continue;
      if (d < 0.01) { dx = 1; dy = 0; d = 1; }
      const push = (gap - d) / 2;
      a.x -= (dx / d) * push; a.y -= (dy / d) * push;
      b.x += (dx / d) * push; b.y += (dy / d) * push;
      moved = true;
    }
    for (const p of pts) { p.x = Math.min(w - 22, Math.max(22, p.x)); p.y = Math.min(h - 22, Math.max(22, p.y)); }
    if (!moved) break;
  }
  for (const p of pts) { p.el.style.left = `${p.x}px`; p.el.style.top = `${p.y}px`; }
  return pts;
}

registerPage('cafes', () => {
  const cafes = brand.cafes ?? [];
  const list = $('[data-cafe-list]');
  if (!list) return;
  const tz = brand.timeZone ?? null;

  // header count
  const cities = [...new Set(cafes.map((c) => c.city))];
  const count = $('[data-cafe-count]');
  if (count) count.textContent = `${cafes.length} ${cafes.length === 1 ? 'café' : 'cafés'} in ${cities.length} ${cities.length === 1 ? 'city' : 'cities'}`;

  const renderCards = () => {
    list.innerHTML = cafes.map((c) => cardHTML(c, nowIn(c.timeZone ?? tz), c.timeZone ?? tz)).join('');
  };
  renderCards();

  // map + pins
  const frame = $('.cafe-map__frame');
  const pinsHost = $('[data-map-pins]');
  const pts = mapPoints(cafes);
  const terrainHost = $('[data-map-terrain]');
  const short = (n) => n.replace(new RegExp(`^${brand.shortName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`), '');
  pinsHost.innerHTML = pts.map((p) => `<button type="button" class="cafe-pin" data-pin="${esc(p.cafe.id)}" data-city="${esc(p.cafe.city)}" aria-label="Show ${esc(p.cafe.name)}" aria-controls="cafe-${esc(p.cafe.id)}" style="left:${p.x}%;top:${p.y}%">
      <span class="cafe-pin__drop glass-baked squish">${lens('round thin')}<span class="cafe-pin__core"></span></span>
    </button>`).join('')
    + pts.map((p) => `<span class="map-lead cafe-lead" data-lead="${esc(p.cafe.id)}" aria-hidden="true" hidden></span>`).join('')
    + pts.map((p) => `<span class="map-label cafe-pin__tag" data-tag="${esc(p.cafe.id)}" aria-hidden="true">${esc(short(p.cafe.name))}</span>`).join('');
  const pins = pts.map((p) => ({ ...p, el: pinsHost.querySelector(`[data-pin="${CSS.escape(p.cafe.id)}"]`) }));
  // R2-3: with lat/lng on every café, pins are projected onto the India outline (fit to the frame)
  const geo = cafes.length && cafes.every((c) => c.lat != null && c.lng != null);
  if (geo) terrainHost.insertAdjacentHTML('beforebegin', outlineSVG(BOX_INDIA));
  const tags = pts.map((p) => pinsHost.querySelector(`[data-tag="${CSS.escape(p.cafe.id)}"]`));
  const leads = pts.map((p) => pinsHost.querySelector(`[data-lead="${CSS.escape(p.cafe.id)}"]`));
  let lastAspect = '';
  const layout = () => {
    const w = frame.clientWidth, h = frame.clientHeight;
    if (!w || !h) return;
    const aspect = Math.round((h / w) * 100) / 100;
    if (geo) pins.forEach((p) => Object.assign(p, project(p.cafe.lat, p.cafe.lng, BOX_INDIA, w, h)));
    const px = spread(pins, frame) ?? [];
    // hills sit under the pins where spread() actually put them
    const key = `${aspect}|${px.map((q) => `${Math.round(q.x)},${Math.round(q.y)}`).join(';')}`;
    if (key !== lastAspect) {
      terrainHost.innerHTML = terrain(px.map((q, i) => ({ cafe: pts[i].cafe, x: (q.x / w) * 100, y: (q.y / h) * 100 })), aspect, geo);
      lastAspect = key;
    }
    const placed = placeLabels(px.map((q, i) => ({ x: q.x, y: q.y, w: tags[i].offsetWidth, h: tags[i].offsetHeight })), { W: w, H: h, dot: 16 });
    applyLabels(placed, tags, leads);
    refreshGlass();
  };
  layout();
  if ('ResizeObserver' in window) new ResizeObserver(() => requestAnimationFrame(layout)).observe(frame);
  const label = $('.cafe-map__label');
  if (label) frame.setAttribute('aria-label', `Illustrative map with pins for ${brand.shortName} cafés in ${cities.join(', ')}`);
  frame.setAttribute('role', 'group');

  // pin ↔ card highlighting
  let selected = null;
  const card = (id) => document.getElementById(`cafe-${id}`);
  const pinFor = (id) => pinsHost.querySelector(`[data-pin="${CSS.escape(id)}"]`);
  function highlight(id, { select = false } = {}) {
    for (const p of pinsHost.querySelectorAll('.cafe-pin')) {
      const on = p.dataset.pin === id || p.dataset.pin === selected;
      p.classList.toggle('is-active', on);
      pinsHost.querySelector(`[data-tag="${CSS.escape(p.dataset.pin)}"]`)?.classList.toggle('is-on', on);
      pinsHost.querySelector(`[data-lead="${CSS.escape(p.dataset.pin)}"]`)?.classList.toggle('is-on', on);
    }
    if (!select) return;
    if (selected && selected !== id) setGlass(card(selected), false);
    selected = id;
    setGlass(card(id), true);
  }
  function setGlass(el, on) {
    if (!el) return;
    el.classList.toggle('glass-baked', on);
    el.classList.toggle('glass--card', on);
    el.querySelector('.cafe-card__plate').classList.toggle('plate', on);
    if (on) requestAnimationFrame(refreshGlass);
  }
  pinsHost.addEventListener('click', (e) => {
    const pin = e.target.closest('[data-pin]');
    if (!pin) return;
    const id = pin.dataset.pin;
    highlight(id, { select: true });
    const el = card(id);
    el?.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
    el?.focus({ preventScroll: true });
  });
  pinsHost.addEventListener('focusin', (e) => { const p = e.target.closest('[data-pin]'); if (p) highlight(p.dataset.pin); });
  pinsHost.addEventListener('focusout', () => highlight(null));
  pinsHost.addEventListener('pointerover', (e) => { const p = e.target.closest('[data-pin]'); if (p) highlight(p.dataset.pin); });
  pinsHost.addEventListener('pointerleave', () => highlight(null));
  list.addEventListener('focusin', (e) => { const c = e.target.closest('[data-cafe]'); if (c) highlight(c.dataset.cafe); });
  list.addEventListener('pointerover', (e) => { const c = e.target.closest('[data-cafe]'); if (c) highlight(c.dataset.cafe); });
  list.addEventListener('pointerleave', () => highlight(null));
  list.addEventListener('focusout', (e) => { if (!list.contains(e.relatedTarget)) highlight(null); });

  // city chips (single-select, aria-pressed); hidden when only one city
  const strip = $('[data-city-strip]');
  const chips = $('[data-city-chips]');
  const live = $('[data-city-live]');
  const empty = $('[data-cafe-empty]');
  if (cities.length > 1 && chips) {
    chips.innerHTML = ['All', ...cities].map((c, i) => `<li><button type="button" class="city-chip plate squish" data-city-chip="${i ? esc(c) : ''}" aria-pressed="${i === 0}">${esc(c)}</button></li>`).join('');
    strip.hidden = false;
    chips.addEventListener('click', (e) => {
      const b = e.target.closest('[data-city-chip]');
      if (!b) return;
      const city = b.dataset.cityChip;
      for (const x of chips.querySelectorAll('[data-city-chip]')) x.setAttribute('aria-pressed', String(x === b));
      let n = 0;
      for (const li of list.children) { const show = !city || li.dataset.city === city; li.hidden = !show; n += show; }
      for (const p of pinsHost.querySelectorAll('.cafe-pin')) {
        const dim = !!city && p.dataset.city !== city;
        p.classList.toggle('is-dim', dim);
        pinsHost.querySelector(`[data-tag="${CSS.escape(p.dataset.pin)}"]`)?.classList.toggle('is-dim', dim);
      }
      if (empty) { empty.hidden = n > 0; $('[data-cafe-empty-text]').textContent = `No cafés in ${city} yet. We ship there, though.`; }
      live.textContent = city ? `Showing ${n} ${n === 1 ? 'café' : 'cafés'} in ${city}` : `Showing all ${n} cafés`;
      requestAnimationFrame(refreshGlass);
    });
  }

  // keep "Open now" honest: re-render statuses every minute (no animation)
  setInterval(() => {
    if (list.contains(document.activeElement)) return; // never yank focus
    const scrollKeep = selected;
    renderCards();
    const city = chips?.querySelector('[aria-pressed="true"]')?.dataset.cityChip;
    if (city) for (const li of list.children) li.hidden = li.dataset.city !== city;
    if (scrollKeep) { selected = null; highlight(scrollKeep, { select: true }); }
  }, 60_000);

  requestAnimationFrame(refreshGlass);
});
