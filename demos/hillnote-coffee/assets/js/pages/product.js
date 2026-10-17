/* pages/product.js: product detail, product.html?c={slug} (DESIGN §7.12–7.13,
   §8.3 · DESIGN-DECISIONS 3 · SITEMAP §3.3 · COPY §4). Frontend Dev #2.

   Everything below the shell is data-driven, so the page is rendered here:
   flood band (bagColor) + gallery, the inline baked buy slab (grind pills,
   size radios, qty, add), tasting profile + flavour bars, freshness dial,
   origin spec sheet + contour graphic with live elevation ticks, brewing tips
   that follow the grind, demo reviews, related rail, the sticky add bar
   (< 1024 px; fires hn:addbar, reacts to hn:capsule) and the not-found state.

   Motion hooks: [data-reveal] on the info sections; the add bar toggles
   .is-visible (CSS transitions on --addbar-shift). */
import { registerPage, cart, format, brand, url, shopUrl, productUrl, getBrewContext } from '../main.js';
import { PRODUCTS, ROAST_LEVELS, PROCESSES, DRINK_WITH, BADGES, getProduct, getSize, isAccessory } from '../../../data/products.js';
import { GRIND_OPTIONS, getGrind, getBrewMethod } from '../../../data/brew-methods.js';
import { renderProductList } from '../components/product-card.js';
import { bagHTML } from '../components/bag.js';
import { esc, icon, slip, marginNote, FINDER_OPTIONS } from '../components/ui.js';
import { confirmAdd, openSheet, toast } from '../shell.js';
import { contours } from '../contours.js';
import * as contourKit from '../contours.js'; // altitudeProfile() comes from Fixer A (contract 2); local fallback below
import { refreshGlass, alignLens } from '../glass.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
const MAX = brand.cart?.maxQtyPerLine ?? 10;
const DAY = 864e5;

/* ---- Demo roast schedule ---------------------------------------------------
   Weekly roast day from brand.config.js `roastDay` (0 = Sunday … 6 = Saturday). */
const ROAST_WEEKDAY = Number.isInteger(brand.roastDay) ? brand.roastDay : 1;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ROAST_DAY = WEEKDAYS[ROAST_WEEKDAY];
function lastRoast(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - ((d.getDay() - ROAST_WEEKDAY + 7) % 7));
  return d;
}
const shortDay = (d) => `${WEEKDAYS[d.getDay()].slice(0, 3)} ${d.getDate()}`;
// "Mon 12 Oct" for the roast slip (C-13); month name from the brand locale
const monthFmt = (() => { try { return new Intl.DateTimeFormat(brand.currency?.locale ?? 'en-IN', { month: 'short' }); } catch { return null; } })();
const slipDay = (d) => `${shortDay(d)}${monthFmt ? ` ${monthFmt.format(d).replace('.', '')}` : ''}`;

/* ---- Colour helpers (band contrast + dark-zone sentinel) ------------------- */
const hexRgb = (hex) => {
  const h = String(hex).replace('#', '').trim();
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255);
};
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const luminance = (hex) => { const [r, g, b] = hexRgb(hex).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
function oklabL(hex) {
  const [r, g, b] = hexRgb(hex).map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
}
const cssVar = (name, fallback) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

/* ---- Copy ------------------------------------------------------------------ */
const REVIEWS = {
  'cloudline-washed': [
    ['Bright but not sour, which is what I was worried about. Like orange peel and gur.', 'Ananya R.', 'Hyderabad', 'pour-over', 5],
    ['Tried it as cold brew on a whim. Dangerously easy to drink.', 'Vikram J.', 'Mumbai', 'cold-brew', 5],
  ],
  'paper-lantern-natural': [
    ['Smells like a fruit bowl when you open the bag.', 'Neha P.', 'Bengaluru', 'aeropress', 5],
    ['Too fruity for my dad, perfect for me.', 'Siddharth K.', 'Kochi', 'pour-over', 4],
  ],
  'shade-line': [
    ['Chocolate and almonds in a French press. Takes milk without disappearing.', 'Riya S.', 'Pune', 'french-press', 5],
    ['Our office moka pot coffee now.', 'Aditya N.', 'Gurugram', 'moka-pot', 4],
  ],
  'westwind-monsooned': [['Heavy, woody, zero sourness. Exactly what I want in a cappuccino.', 'Meher D.', 'Chennai', 'espresso', 5]],
  'night-shift-espresso': [['Strong, chocolatey, no burnt edge.', 'Farah A.', 'New Delhi', 'moka-pot', 5]],
  'filter-house-blend': [["Tastes like my grandmother's filter coffee, minus the chicory. I add a pinch myself.", 'Lakshmi V.', 'Mysuru', 'south-indian-filter', 5]],
};
const GENERIC_REVIEWS = (p) => [
  ['Fresh, roast date was within the week, and the grind was spot on for my brewer.', 'Demo reviewer', null, p.brewMethods?.[0], 5],
  ['Will reorder.', 'Demo reviewer', null, p.brewMethods?.[1] ?? p.brewMethods?.[0], 4],
];
const TEXTURE = ['Extra fine', 'Fine', 'Fine-medium', 'Medium-fine', 'Medium', 'Coarse', 'Extra coarse'];
const BEANS_PHOTO = 'https://images.unsplash.com/photo-1447933601403-0c6688de566e'; // Unsplash licence; credit in REVIEWS

/* ---- State ----------------------------------------------------------------- */
let P = null;
const st = { grind: null, size: null, qty: 1, fromContext: false };
const price = () => getSize(P, st.size).price;
const total = () => price() * st.qty;
const ready = () => isAccessory(P) || !!st.grind;
const soldOut = () => P.inStock === false;

/* ==========================================================================
   Templates
   ========================================================================== */
function crumbHTML() {
  const back = shopUrl({ brew: getBrewContext() && !isAccessory(P) ? getBrewContext() : null });
  return `<nav class="container pdp-crumb" aria-label="Breadcrumb">
    <a class="pdp-crumb__back" href="${esc(back)}">${icon('i-chevron-right', 16, 'icon--flip')}All coffee</a>
    <ol class="pdp-crumb__trail" role="list">
      <li><a href="${esc(url('shop.html'))}">Shop</a></li>
      <li><span aria-current="page">${esc(P.name)}</span></li>
    </ol>
  </nav>`;
}

const bandColour = () => (isAccessory(P) ? (P.image.accentColor ?? cssVar('--oat', '#EDE3D1')) : P.image.bagColor);
/* C-02: the band is the bag colour pushed 22 % toward Ink (CSS does the real
   oklch mix); this sRGB estimate only picks the line colour and the zone. */
const mixHex = (a, b, t) => {
  const [x, y] = [hexRgb(a), hexRgb(b)];
  return `#${x.map((v, i) => Math.round((v * (1 - t) + y[i] * t) * 255).toString(16).padStart(2, '0')).join('')}`;
};
const bandPaint = () => (isAccessory(P) ? bandColour() : mixHex(bandColour(), cssVar('--ink', '#2A1F17'), 0.22));
let bandTopo = '', bandLine = 'var(--ink)'; // reused by the slab's band lens (DESIGN §7.12)
function bandHTML() {
  const colour = bandColour();
  const paint = bandPaint();
  const paper = cssVar('--paper', '#F7F2E8'), ink = cssVar('--ink', '#2A1F17');
  const line = contrast(paint, paper) >= contrast(paint, ink) ? 'var(--paper)' : 'var(--ink)';
  const dark = oklabL(paint) < 0.4;
  const alt = P.origin?.altitudeM ?? [1200, 1400];
  const topo = contours(alt, `${P.slug}-band`, { w: 1440, h: 520, sx: 520, sy: 300, cx: 980, cy: 230, strokeWidth: 1.5 }).svg;
  bandTopo = topo.replace('<path ', '<path filter="url(#lensBlur)" ');
  bandLine = line;
  return `<div class="pdp-band bag-scope${isAccessory(P) ? ' pdp-band--flat' : ''}" style="--bag:${esc(colour)};--band-line:${line}"${dark ? ' data-zone="dark"' : ''} data-band>
    <div class="pdp-band__topo" aria-hidden="true">${topo}</div>
  </div>`;
}

/* C-02: the light pool under the bag lives on the band (never clipped by the
   gallery's scroller). Its centre follows the first slide's bag. */
function placePool() {
  const band = $('[data-band]');
  const bag = $('.pdp-slide__bag .bag') ?? $('.pdp-slide__bag');
  if (!band || !bag) return;
  const b = band.getBoundingClientRect(), r = bag.getBoundingClientRect();
  if (!r.width) return;
  band.style.setProperty('--pool-x', `${Math.round(r.left - b.left + r.width / 2)}px`);
  band.style.setProperty('--pool-y', `${Math.round(r.top - b.top + r.height * 0.55)}px`);
  band.style.setProperty('--pool-r', `${Math.round(Math.max(r.width, r.height) * 0.78)}px`);
}

/* C-12: altitude profile (side section of the hill, farm band shaded). Uses
   Fixer A's contours.js altitudeProfile() when it exists, else this fallback. */
function profileSVG(alt) {
  const [farmMin, farmMax] = alt;
  const min = Math.max(0, Math.floor((farmMin - 700) / 100) * 100);
  const max = Math.ceil((farmMax + 450) / 100) * 100;
  const opts = { min, max, farmMin, farmMax, color: 'currentColor', w: 340, h: 300 };
  if (typeof contourKit.altitudeProfile === 'function') {
    try {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const out = contourKit.altitudeProfile(svg, opts);
      const html = typeof out === 'string' ? out : (out?.outerHTML ?? svg.outerHTML);
      if (html && html.length > 40) return { svg: html, labels: '' };
    } catch { /* fall through to the local drawing */ }
  }
  const W = 400, H = 400, top = 64, base = 340;
  const y = (a) => base - ((a - min) / (max - min)) * (base - top);
  const r = (n) => Math.round(n * 10) / 10;
  // one asymmetric hill: long gentle western slope, steeper east face
  const ridge = `M0 ${base} C70 ${base - 6} 96 ${r(y(min + (max - min) * 0.42))} 150 ${r(y(min + (max - min) * 0.7))} S220 ${top} 248 ${top} S300 ${r(y(min + (max - min) * 0.55))} 330 ${r(y(min + (max - min) * 0.3))} S384 ${base - 4} ${W} ${base}`;
  const y0 = r(y(farmMax)), y1 = r(y(farmMin));
  const label = (a, yy, cls) => `<span class="pdp-profile__tick ${cls}" style="top:${((yy / H) * 100).toFixed(1)}%">${esc(format.formatAltitude([a, a]))}</span>`;
  return {
    svg: `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <defs><clipPath id="pdp-hill"><path d="${ridge} L${W} ${H} L0 ${H}Z"/></clipPath></defs>
      <rect x="0" y="${y0}" width="${W}" height="${r(y1 - y0)}" fill="currentColor" fill-opacity=".18" clip-path="url(#pdp-hill)"/>
      <path d="M0 ${y0}H${W}M0 ${y1}H${W}" stroke="currentColor" stroke-width="1" stroke-dasharray="3 5" opacity=".55" vector-effect="non-scaling-stroke"/>
      <path d="${ridge}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
      <path d="M0 ${base}H${W}" stroke="currentColor" stroke-width="1" opacity=".4" vector-effect="non-scaling-stroke"/>
    </svg>`,
    labels: label(farmMax, y0, 'pdp-profile__tick--hi') + label(farmMin, y1, 'pdp-profile__tick--lo'),
  };
}

function galleryHTML() {
  const alt = P.origin?.altitudeM;
  const slides = [
    `<div class="pdp-slide__bag">${bagHTML(P, { label: true })}</div>`,
  ];
  if (!isAccessory(P)) {
    slides.push(`<div class="pdp-slide__photo"><img src="${BEANS_PHOTO}?w=600&h=600&fit=crop&q=70&auto=format" srcset="${BEANS_PHOTO}?w=400&h=400&fit=crop&q=70&auto=format 400w, ${BEANS_PHOTO}?w=600&h=600&fit=crop&q=70&auto=format 600w, ${BEANS_PHOTO}?w=1000&h=1000&fit=crop&q=70&auto=format 1000w" sizes="(min-width: 1024px) 480px, 60vw" width="600" height="600" loading="lazy" decoding="async" alt="Freshly roasted coffee beans, close up"></div>`);
    const prof = profileSVG(alt ?? [1200, 1400]);
    slides.push(`<div class="pdp-slide__origin pdp-profile" role="img" aria-label="Altitude profile for ${esc(P.origin.region)}, ${esc(format.formatAltitude(alt))}">
      ${prof.svg}
      <span aria-hidden="true">${prof.labels}</span>
      <span class="pdp-slide__origin-tag" aria-hidden="true">${esc(P.origin.region.split(',')[0])} · ${esc(format.formatAltitude(alt))}</span>
    </div>`);
  }
  const n = slides.length;
  const many = n > 1;
  return `<section class="pdp-gallery" aria-roledescription="carousel" aria-label="${esc(P.name)} photos">
    <div class="pdp-gallery__track" data-track>
      ${slides.map((s, i) => `<div class="pdp-slide" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${n}"${i ? ' data-lazy' : ''}>${s}</div>`).join('')}
    </div>
    ${many ? `<div class="pdp-gallery__nav">
      <div class="pdp-dots" role="group" aria-label="Choose image">${slides.map((_, i) => `<button type="button" class="pdp-dot plate" data-go="${i}" aria-label="Show image ${i + 1} of ${n}"${i ? '' : ' aria-current="true"'}><span aria-hidden="true"></span></button>`).join('')}</div>
    </div>` : ''}
  </section>`;
}

/* ---- buy slab ---- */
function ratingHTML() {
  if (!P.rating || brand.features?.demoReviews === false) return '';
  const { value, count } = P.rating;
  return `<a class="pdp-rating" href="#reviews">${icon('i-star', 16, 'star')}<span aria-hidden="true">${value} · ${format.formatNumber(count)} reviews</span><span class="visually-hidden">Rated ${value} out of 5 from ${format.formatNumber(count)} reviews</span></a>`;
}
function roastHTML() {
  const i = ROAST_LEVELS.findIndex((r) => r.id === P.roastLevel);
  if (i < 0) return '';
  const r = ROAST_LEVELS[i];
  return `<p class="roast pdp-roast" role="img" aria-label="Roast: ${esc(r.label.toLowerCase())}, ${i + 1} of 4">
    <span class="pdp-roast__k" aria-hidden="true">Roast</span>
    <span class="roast__meter" aria-hidden="true">${ROAST_LEVELS.map((_, k) => `<span${k <= i ? ' class="is-on"' : ''}></span>`).join('')}</span>
    <span class="roast__label" aria-hidden="true">${esc(r.label)}</span>
  </p>`;
}
function titlePlate() {
  const process = PROCESSES.find((x) => x.id === P.process)?.label;
  const badges = (P.badges ?? []).slice(0, 2).map((b) => `<span class="badge badge--${esc(b)}">${esc(BADGES[b] ?? b)}</span>`);
  if (soldOut()) badges.unshift('<span class="badge badge--sold">Sold out</span>');
  return `<div class="pdp-plate plate pdp-plate--title">
    <h1 class="pdp-name" id="pdp-name">${esc(P.name)}</h1>
    ${P.tagline ? `<p class="pdp-tagline">${esc(P.tagline)}</p>` : ''}
    <div class="pdp-metarow">${badges.length ? `<p class="pdp-badges">${badges.slice(0, 2).join('')}</p>` : ''}${isAccessory(P) ? '' : `<p class="pdp-region">${esc(P.origin.region)}${process ? ` · ${esc(process)}` : ''}</p>`}${ratingHTML()}</div>
    ${P.notes?.length ? `<ul class="pcard__notes pdp-notes" aria-label="Tasting notes">${P.notes.map((n) => `<li class="note-pill">${esc(n)}</li>`).join('')}</ul>` : ''}
    ${roastHTML()}
    ${priceBlock()}
  </div>`;
}
function priceBlock() {
  const s = P.sizes[0];
  const sale = P.compareAtPrice && P.compareAtPrice > s.price;
  return `<div class="pdp-pricebox">
    <p class="pdp-price" data-price>${priceText()}</p>
    ${sale ? `<p class="pdp-was" data-was><span class="visually-hidden">Was ${format.formatPrice(P.compareAtPrice)}, now ${format.formatPrice(s.price)}</span><s aria-hidden="true">${format.formatPrice(P.compareAtPrice)}</s></p>` : ''}
    ${isAccessory(P) ? '' : '<p class="pdp-ground" data-ground></p>'}
  </div>`;
}
const priceText = () => {
  const s = getSize(P, st.size);
  return `${format.formatPrice(s.price)}${s.grams ? ` · ${esc(s.label)}` : ''}`;
};

function grindOptions() {
  const rec = P.brewMethods ?? [];
  const rank = (id) => { const i = rec.indexOf(id); return i >= 0 ? i : id === 'whole-bean' ? 50 : 60 + FINDER_OPTIONS.findIndex((g) => g.id === id); };
  return [...GRIND_OPTIONS].sort((a, b) => rank(a.id) - rank(b.id));
}
const isRecommended = (id) => (P.brewMethods ?? []).slice(0, 2).includes(id);
function grindPlate() {
  return `<div class="pdp-config__sec pdp-config__sec--grind" id="grind">
    <fieldset class="field-group pdp-grind" data-grind-group aria-describedby="grind-helper">
      <legend class="field-group__legend field-group__legend--display pdp-grind__legend">How will you brew it?</legend>
      <div class="pdp-grind__keyrow">
        <button type="button" class="text-btn text-btn--clay grind-helper__guide" data-grind-guide-open aria-haspopup="dialog" aria-controls="grind-sheet">Grind size guide</button>
      </div>
      <div class="grind-pills">${grindOptions().map((g) => {
        const rec = isRecommended(g.id);
        return `<label class="grind-pill">
          <input type="radio" name="grind" value="${g.id}"${g.id === st.grind ? ' checked' : ''} aria-label="${esc(`${g.label}, ${g.grind.toLowerCase()}${rec ? ', recommended' : ''}`)}">
          ${icon(`i-${g.id}`, 20)}<span class="grind-pill__label" aria-hidden="true">${esc(g.label)}</span><span class="grind-pill__grind" aria-hidden="true">${esc(g.grind)}</span>
          ${rec ? '<span class="pdp-rec-dot" aria-hidden="true" title="Recommended"></span>' : ''}
        </label>`;
      }).join('')}</div>
      <p class="field-msg pdp-grind__msg" data-grind-msg role="alert" hidden>${icon('i-x', 16)}<span>Pick how you'll brew it first</span></p>
      <div class="grind-helper" id="grind-helper">
        <p class="grind-helper__text" data-helper aria-live="polite"></p>
        <div class="grind-helper__row">
          ${(P.brewMethods ?? []).length ? '<p class="pdp-rec-key" aria-hidden="true"><span class="pdp-rec-dot"></span>Recommended</p>' : ''}
          <div class="grind-scale" data-scale aria-hidden="true">
            <span class="grind-scale__end">fine</span>
            <span class="grind-scale__dots">${TEXTURE.map((_, i) => `<span class="grind-scale__dot" style="--i:${i}"></span>`).join('')}</span>
            <span class="grind-scale__end">coarse</span>
          </div>
        </div>

      </div>
    </fieldset>
  </div>`;
}
function per100(s) { return s.grams ? (s.price / s.grams) * 100 : null; }
function sizePlate() {
  if (isAccessory(P) || P.sizes.length < 2) return '';
  const base = per100(P.sizes[0]);
  const limited = P.sizes.length < 3;
  return `<fieldset class="field-group pdp-size-group">
      <legend class="field-group__legend">Bag size</legend>
      <div class="size-cards pdp-sizes">${P.sizes.map((s, i) => {
        const p100 = per100(s);
        const save = i > 0 && base ? Math.round((1 - p100 / base) * 100) : 0;
        return `<label class="size-card">
          <input type="radio" name="size" value="${esc(s.label)}"${s.label === st.size ? ' checked' : ''}>
          <span class="size-card__label">${esc(s.label)}<span class="visually-hidden">,</span> <span class="pdp-size-price">${format.formatPrice(s.price)}</span></span>
          <span class="size-card__sub">${format.formatPer100g(s.price, s.grams)}</span>
          ${save > 0 ? `<span class="size-card__tag">Save ${save}%</span>` : ''}
          ${icon('i-check', 16, 'size-card__check')}
        </label>`;
      }).join('')}</div>
      ${limited ? `<p class="pdp-size-note">Limited lot: ${P.sizes.map((s) => s.label).join(' and ')} only.</p>` : ''}
    </fieldset>`;
}
function addPlate() {
  if (soldOut()) {
    return `<div class="pdp-config__sec pdp-config__sec--add">
      <button type="button" class="btn btn--lg btn--block lacquer pdp-add" id="pdp-add" aria-disabled="true" data-soldout>Sold out</button>
      <p class="pdp-sold-line">Back with the next harvest.</p>
    </div>`;
  }
  // R2-2: grind, size and quantity + Add are hairline sections of one config plate
  const size = sizePlate();
  return `${size ? `<div class="pdp-config__sec pdp-config__sec--size">${size}</div>` : ''}
  <div class="pdp-config__sec pdp-config__sec--add">
    <div class="pdp-addrow">
      <div class="stepper pdp-qty" role="group" aria-label="Quantity">
        <button type="button" class="stepper__btn" data-qty="-1" aria-label="Decrease quantity">${icon('i-minus', 18)}</button>
        <output class="stepper__value" data-qty-value aria-label="Quantity">1</output>
        <button type="button" class="stepper__btn" data-qty="1" aria-label="Increase quantity">${icon('i-plus', 18)}</button>
      </div>
      <button type="button" class="btn btn--lg lacquer squish pdp-add" id="pdp-add" data-add></button>
    </div>
    <p class="grind-helper__note pdp-notrec" data-not-rec aria-live="polite" hidden></p>
    <p class="pdp-qty-max" data-qty-max hidden>${esc(MAX)} bags is the most per order line. Need more? <a class="link" href="${esc(url('contact.html'))}">Write to us</a>.</p>
  </div>`;
}
function reassurePlate() {
  const items = isAccessory(P) ? [] : [[`i-clock`, `Roasted ${ROAST_DAY} · ships within ${brand.shipping?.dispatchHours ?? 48} hours`]];
  items.push(['i-bag', '<span data-ship-line></span>']);
  items.push(['i-check', `Fresh-or-replace promise: stale, damaged or wrongly ground? We'll send a new bag. <a class="link" href="${esc(url('contact.html#faq-returns'))}">How it works</a>`]);
  // R2-2: on Paper under the slab, not a plate inside it
  return `<ul class="pdp-reassure" role="list">${items.map(([i, t]) => `<li>${icon(i, 20)}<span>${t}</span></li>`).join('')}</ul>`;
}

function slabHTML() {
  const roast = lastRoast();
  const from = new Date(roast.getTime() + (P.restDays ?? 7) * DAY);
  // band lens: the rim refracts the band's own contours (glass.js data-lens-band)
  return `<div class="pdp-slab glass-baked glass--flood" data-slab data-sticky-lens data-lens-band=".pdp-band" style="--band-line:${bandLine}">
    <span class="lens lens--band" aria-hidden="true">${bandTopo}</span>
    ${titlePlate()}
    ${isAccessory(P) ? '' : slip(`roasted ${slipDay(roast)} · drink from ${slipDay(from)}`, 'pdp-slip')}
    <div class="pdp-plate plate pdp-plate--config">
      ${isAccessory(P) ? '' : grindPlate()}
      ${addPlate()}
    </div>
  </div>
  ${reassurePlate()}`;
}

/* ---- info (paper) ---- */
function profileHTML() {
  if (isAccessory(P)) {
    return `<section class="pdp-sec" aria-labelledby="about-h" data-reveal><h2 class="pdp-h2" id="about-h">About it</h2><p class="pdp-desc">${esc(P.description)}</p></section>`;
  }
  const rows = [['acidity', 'Acidity'], ['body', 'Body'], ['sweetness', 'Sweetness'], ['bitterness', 'Bitterness']];
  const drink = { black: 'Best: black', milk: 'Best: with milk', both: 'Best: black or with milk' }[P.drinkWith] ?? '';
  return `<section class="pdp-sec pdp-taste" aria-labelledby="taste-h" data-reveal>
    <p class="marker">No. 01 · Tasting notes</p>
    <h2 class="pdp-h2" id="taste-h">How it <em>tastes</em></h2>
    <p class="pdp-desc">${esc(P.description)}</p>
    <ul class="fbars" role="list">${rows.map(([k, l]) => {
      const v = P.profile?.[k] ?? 0;
      return `<li class="fbar"><span class="fbar__label">${l}</span><span class="fbar__cells" aria-hidden="true">${[1, 2, 3, 4, 5].map((i) => `<span${i <= v ? ' class="is-on"' : ''}></span>`).join('')}</span><span class="fbar__num"><span aria-hidden="true">${v} of 5</span><span class="visually-hidden">: ${v} out of 5</span></span></li>`;
    }).join('')}</ul>
    <p class="pdp-drink">${esc(drink)}</p>
  </section>`;
}

function freshHTML() {
  if (isAccessory(P)) return '';
  const roast = lastRoast();
  const days = Math.max(0, Math.round((new Date().setHours(0, 0, 0, 0) - roast.getTime()) / DAY));
  const rest = P.restDays ?? 7;
  const span = rest * 3;
  const caption = days < rest ? `Resting. At its best from day ${rest}.` : days <= 30 ? 'In its sweet spot.' : 'Still good. Brew it within the next few weeks.';
  const ago = days === 0 ? 'Roasted today' : days === 1 ? 'Roasted 1 day ago' : `Roasted ${days} days ago`;
  // dial: 120 px, 270° arc from 135°, ticks per day, arc to days/span, a tick at restDays
  const R = 50, C = 60, A0 = 135, SW = 270;
  const pt = (deg, r = R) => { const a = (deg * Math.PI) / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)]; };
  const arc = (from, to) => { const [x0, y0] = pt(from), [x1, y1] = pt(to); return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${R} ${R} 0 ${to - from > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`; };
  const frac = Math.min(1, days / span);
  const step = span > 30 ? 2 : 1;
  const ticks = Array.from({ length: Math.floor(span / step) + 1 }, (_, i) => {
    const deg = A0 + (SW * i * step) / span;
    const [x0, y0] = pt(deg, R + 5), [x1, y1] = pt(deg, R + 8);
    return `M${x0.toFixed(1)} ${y0.toFixed(1)}L${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }).join('');
  const rd = A0 + (SW * rest) / span;
  // C-14: "best from day N" is a Clay triangle outside the ring, Paper keyline
  const tri = [pt(rd, R + 3), pt(rd - 4.5, R + 12), pt(rd + 4.5, R + 12)].map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L');
  return `<section class="pdp-sec pdp-fresh" aria-labelledby="fresh-h" data-reveal>
    <h2 class="pdp-h3" id="fresh-h">Days since roast</h2>
    <div class="fresh">
      <div class="fresh__dial">
        <svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true" focusable="false">
          <path d="${arc(A0, A0 + SW)}" class="fresh__track"/>
          <path d="${ticks}" class="fresh__ticks"/>
          ${frac > 0 ? `<path d="${arc(A0, A0 + Math.max(2, SW * frac))}" class="fresh__arc"/>` : ''}
          <path d="M${tri}Z" class="fresh__rest"/>
        </svg>
        <p class="fresh__centre" aria-hidden="true"><span class="fresh__n">${days}</span><span>${days === 1 ? 'day' : 'days'}</span></p>
      </div>
      <div class="fresh__text">
        <p class="fresh__line"><strong>${ago}</strong> · best from day ${rest}</p>
        <p class="fresh__caption">${caption}</p>
        <p class="fresh__demo">Demo: roast date simulated from the weekly roast day.</p>
      </div>
    </div>
  </section>`;
}

function originHTML() {
  if (isAccessory(P)) return '';
  const o = P.origin;
  const alt = format.formatAltitude(o.altitudeM);
  const process = PROCESSES.find((x) => x.id === P.process)?.label ?? '';
  const rows = [
    ['Farm', P.type === 'blend' ? 'Multi-estate blend' : o.farm],
    ['Region', o.region],
    ['Country', o.country],
    ['Altitude', alt],
    ['Process', process],
    ['Varietal', (o.varietal ?? []).join(', ')],
    ['Harvest', o.harvest],
    ['Roasted', `Every ${ROAST_DAY}, in small batches`],
  ].filter(([, v]) => v);
  const c = contours(o.altitudeM, `${P.slug}-origin`, { w: 280, h: 280, cx: 132, cy: 140, sx: 96, sy: 84, strokeWidth: 1.25, peak: true, fit: 'xMidYMid meet' });
  const inRings = c.rings.filter((r) => r.in);
  const marks = [inRings[0], inRings.length > 1 ? inRings.at(-1) : null].filter(Boolean);
  // labels right of the mark, flipped to the left in the right half so they never leave the frame (I-9)
  const tick = (r) => `<span class="origin-art__tick${r.x / 280 > 0.55 ? ' origin-art__tick--flip' : ''}" style="left:${((r.x / 280) * 100).toFixed(1)}%;top:${((r.y / 280) * 100).toFixed(1)}%">${esc(format.formatAltitude([r.alt, r.alt]))}</span>`;
  return `<section class="pdp-sec pdp-origin" aria-labelledby="origin-h" data-reveal>
    <p class="marker">No. 02 · Origin</p>
    <h2 class="pdp-h2" id="origin-h">Where it's <em>from</em></h2>
    <div class="origin">
      <dl class="spec">${rows.map(([k, v]) => `<div class="spec__row"><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      <figure class="origin-art">
        <div class="origin-art__map" role="img" aria-label="${esc(`Contour sketch of the growing slope in ${o.region.split(',')[0]}, ${alt}`)}">
          ${c.svg}
          <span aria-hidden="true">${marks.map(tick).join('')}</span>
        </div>
        <figcaption class="margin-note origin-art__note">higher = slower ripening = more sweetness</figcaption>
      </figure>
    </div>
  </section>`;
}

function tipsHTML() {
  return `<section class="pdp-sec pdp-tips" id="brew-tips" aria-labelledby="tips-h" data-reveal tabindex="-1">
    <h2 class="pdp-h2" id="tips-h" data-tips-h>Brewing tips</h2>
    <div class="tips-card" data-tips></div>
  </section>`;
}
function tipsBody() {
  // C-03c: never an empty box. With no brewer chosen yet, show the first
  // recommended brewer's recipe, headed "For {brewer} · change".
  const chosen = st.grind && st.grind !== 'whole-bean' ? st.grind : null;
  const fallback = [...(P.brewMethods ?? []), ...GRIND_OPTIONS.map((g) => g.id)].find((id) => getBrewMethod(id));
  const pick = chosen ?? fallback;
  const m = pick && getBrewMethod(pick);
  const h = $('[data-tips-h]');
  if (!m) { h.textContent = 'Brewing tips'; return ''; }
  h.textContent = chosen ? `Brew it in your ${m.label}` : 'Brewing tips';
  const headLine = chosen
    ? '<span>Recipe at a glance</span>'
    : `<span>For ${esc(m.label)} · <a class="link" href="#grind" data-change-grind>change<span class="visually-hidden"> brewer</span></a></span>`;
  const d = m.display ?? {};
  const cells = [
    ['Coffee', `${m.recipe.dose}`, 'g'],
    ['Water', d.water ?? `${m.recipe.water} ml`, ''],
    ['Temperature', d.temp ?? `${m.recipe.tempC} °C`, ''],
    ['Time', d.time ?? m.recipe.time, ''],
  ];
  return `<div class="tips-card__head">${icon(`i-${m.id}`, 20)}${headLine}</div>
    <dl class="tips-cells">${cells.map(([l, v, u]) => `<div class="tips-cell"><dt>${l}</dt><dd><span class="tips-cell__n">${esc(v)}</span>${u ? `<span class="tips-cell__u"> ${u}</span>` : ''}</dd></div>`).join('')}
      <div class="tips-cell tips-cell--grind"><dt>Grind</dt><dd>${icon(`i-${m.id}`, 20)}<span><strong>${esc(m.grind)}</strong>, like ${esc(m.feel)}</span></dd></div>
    </dl>
    ${st.grind === 'whole-bean' ? `<p class="tips-card__line">Grinding at home? Grind it ${esc(m.grind.toLowerCase())}, like ${esc(m.feel)}, for a ${esc(m.label)}.</p>` : ''}
    ${m.method ? `<p class="tips-card__line">${esc(m.method)}</p>` : `<p class="tips-card__line">${esc(m.line)}</p>`}
    ${m.guide ? `<a class="link link--arrow" href="${esc(url(m.guide))}">Read the full ${esc(m.label)} guide <span aria-hidden="true">→</span></a>` : ''}`;
}

function reviewsHTML() {
  if (brand.features?.demoReviews === false) return '';
  const list = REVIEWS[P.slug] ?? GENERIC_REVIEWS(P);
  const stars = (n) => `<p class="review__stars" aria-hidden="true">${[1, 2, 3, 4, 5].map((i) => icon('i-star', 20, i <= n ? 'star' : 'is-off')).join('')}</p>`;
  return `<section class="pdp-sec pdp-reviews" id="reviews" aria-labelledby="reviews-h" data-reveal tabindex="-1">
    <h2 class="pdp-h2" id="reviews-h">What brewers say</h2>
    <p class="reviews__label">Demo reviews for illustration</p>
    ${P.rating ? `<p class="pdp-reviews__sum">${icon('i-star', 20, 'star')}<span>${P.rating.value} average from ${format.formatNumber(P.rating.count)} reviews</span></p>` : ''}
    <ul class="pdp-reviews__list" role="list">${list.map(([q, name, city, brew, n]) => `<li><figure class="review">
      ${stars(n)}<span class="visually-hidden">${n} out of 5 stars</span>
      <blockquote class="review__quote"><p>${esc(q)}</p></blockquote>
      <figcaption class="review__who"><strong>${esc(name)}${city ? `, ${esc(city)}` : ''}</strong>${brew && getGrind(brew) ? `<span>Brewed with ${esc(getGrind(brew).label)}</span>` : ''}</figcaption>
    </figure></li>`).join('')}</ul>
  </section>`;
}

function related() {
  const pool = PRODUCTS.filter((x) => x.slug !== P.slug && x.inStock !== false);
  const score = (x) => (x.roastLevel === P.roastLevel ? 2 : 0) + (x.noteFamilies ?? []).filter((f) => (P.noteFamilies ?? []).includes(f)).length;
  return pool.map((x) => [x, score(x)]).sort((a, b) => b[1] - a[1] || (a[0].featured ?? 99) - (b[0].featured ?? 99)).slice(0, 4).map(([x]) => x);
}
function relatedHTML() {
  return `<section class="container pdp-related" aria-labelledby="related-h" data-reveal>
    <h2 class="pdp-h2" id="related-h">You might also like</h2>
    <div data-related></div>
  </section>`;
}
const renderRelated = () => {
  const host = $('[data-related]');
  if (!host) return;
  const list = related();
  host.closest('.pdp-related').hidden = !list.length; // C-23: no empty rail in a 1-product catalogue
  host.innerHTML = list.length ? renderProductList(list, { rail: true, label: 'Related coffees', brew: isAccessory(P) ? undefined : st.grind ?? undefined }) : '';
};

function grindGuideHTML() {
  return `<table class="grind-table grind-table--sheet">
    <caption class="visually-hidden">Grind size by brewer</caption>
    <thead><tr><th scope="col">Brewer</th><th scope="col">Grind</th><th scope="col">Feels like</th><th scope="col">Brew time</th></tr></thead>
    <tbody>${FINDER_OPTIONS.map((g) => {
      const m = getBrewMethod(g.id);
      return `<tr><th scope="row"><span class="grind-table__brewer">${icon(`i-${g.id}`, 20)}${esc(g.label)}</span></th><td>${esc(g.grind)}</td><td>${g.feel ? esc(cap(g.feel)) : 'Grind at home'}</td><td>${m ? esc(m.display?.time ?? m.recipe.time) : '–'}</td></tr>`;
    }).join('')}</tbody>
  </table>
  <p class="grind-sheet__more"><a class="link link--arrow" href="${esc(url('guides/index.html#grind-chart'))}">See the full grind chart <span aria-hidden="true">→</span></a></p>`;
}

/* ==========================================================================
   Live updates
   ========================================================================== */
function updateBuy() {
  if (!P) return;
  const g = st.grind && getGrind(st.grind);
  const priceEl = $('[data-price]');
  if (priceEl) priceEl.innerHTML = priceText();
  const was = $('[data-was]');
  if (was) was.hidden = st.size !== P.sizes[0].label;
  const ground = $('[data-ground]');
  if (ground) {
    ground.innerHTML = g
      ? `${g.id === 'whole-bean' ? 'Sent as whole beans' : `Ground for ${esc(g.label)}`} · <a class="link" href="#grind" data-change-grind>change<span class="visually-hidden"> grind</span></a>`
      : '';
    ground.hidden = !g;
  }
  // helper (COPY §4.5)
  const helper = $('[data-helper]');
  if (helper) {
    helper.classList.toggle('is-intro', !g);
    if (!g) helper.innerHTML = "Not sure? Pick the gadget you own and we'll grind to match it. Grinding at home? Choose Whole bean.";
    else if (g.id === 'whole-bean') helper.innerHTML = `Whole bean → <strong>not ground</strong>. Grind just before brewing for the best flavour. <a class="link" href="${esc(url('guides/index.html#grind-chart'))}">Grind chart</a>`;
    else {
      const m = getBrewMethod(g.id);
      helper.innerHTML = `${esc(g.label)} → <strong>${esc(g.grind.toLowerCase())}</strong>, like ${esc(g.feel)}. ${esc(m?.hint ?? '')} <a class="link" href="#brew-tips" data-to-tips>See the recipe <span aria-hidden="true">↓</span></a>`;
    }
    const scale = $('[data-scale]');
    const idx = g ? TEXTURE.findIndex((t) => t.toLowerCase() === g.grind.toLowerCase()) : -1;
    scale.hidden = idx < 0;
    $$('.grind-scale__dot', scale).forEach((d, i) => d.classList.toggle('is-on', i === idx));
    const nr = $('[data-not-rec]');
    const top = getGrind(P.brewMethods?.[0]);
    const show = g && g.id !== 'whole-bean' && !(P.brewMethods ?? []).includes(g.id) && top;
    nr.hidden = !show;
    if (show) nr.textContent = `We'll grind it for ${g.label}, though this one shines more in a ${top.label}.`;
  }
  // add button
  const add = $('[data-add]');
  if (add && !add.hasAttribute('aria-busy') && !add.classList.contains('is-added')) {
    if (ready()) { add.removeAttribute('aria-disabled'); add.textContent = `Add to cart · ${format.formatPrice(total())}`; }
    else { add.setAttribute('aria-disabled', 'true'); add.innerHTML = CHOOSE; }
  }
  const qv = $('[data-qty-value]');
  if (qv) qv.textContent = String(st.qty);
  const dec = $('[data-qty="-1"]'), inc = $('[data-qty="1"]');
  const dis = (b, on) => { if (!b) return; if (on) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled'); };
  dis(dec, st.qty <= 1);
  dis(inc, st.qty >= MAX);
  updateShipLine();
  updateAddbar();
  const tips = $('[data-tips]');
  if (tips) tips.innerHTML = tipsBody();
}
function updateShipLine() {
  const el = $('[data-ship-line]');
  if (!el) return;
  const fs = cart.freeShipping();
  const t = format.formatPrice(fs.threshold);
  el.textContent = cart.isEmpty() ? `Free shipping over ${t}` : fs.qualified ? 'Your order ships free.' : `Free shipping over ${t}. You're ${format.formatPrice(fs.gap)} away.`;
}

/* ---- add ---- */
function pointToGrind() {
  const group = $('[data-grind-group]');
  if (!group) return;
  const msg = $('[data-grind-msg]');
  msg.hidden = true;
  setTimeout(() => { msg.hidden = false; }, 30); // re-insert so role=alert re-announces
  group.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
  ($('input[name="grind"]:checked', group) ?? $('input[name="grind"]', group)).focus({ preventScroll: true });
}
function doAdd(btn) {
  if (!P || soldOut()) return;
  if (!ready()) { pointToGrind(); return; }
  if (btn.hasAttribute('aria-busy')) return;
  const label = btn.textContent;
  btn.setAttribute('aria-busy', 'true');
  btn.textContent = 'Adding…';
  setTimeout(() => {
    btn.removeAttribute('aria-busy');
    const res = cart.add({ slug: P.slug, size: st.size, grind: isAccessory(P) ? null : st.grind, qty: st.qty });
    if (!res.ok) {
      btn.textContent = label;
      toast("That didn't work. Please try again.", { actionLabel: 'Try again', onAction: () => doAdd(btn) });
      return;
    }
    btn.classList.add('is-added');
    btn.innerHTML = `${icon('i-check', 20)}Added`;
    setTimeout(() => { btn.classList.remove('is-added'); updateBuy(); }, 1200);
    confirmAdd(res, btn);
  }, reducedMotion() ? 0 : 280);
}

/* ---- sticky add bar (< 1024 px) ---- */
const bar = () => $('[data-addbar]');
let barOut = false;      // inline Add has scrolled above the viewport
let barSuppressed = false; // the capsule came back (scroll up): hide the bar
function setBar(on, { silent = false } = {}) {
  const b = bar();
  if (!b) return;
  const was = b.classList.contains('is-visible');
  b.classList.toggle('is-visible', on);
  b.inert = !on;
  b.setAttribute('aria-hidden', String(!on));
  document.documentElement.classList.toggle('addbar-on', on);
  // C-18: focus scrolled into view must clear the bar (WCAG 2.4.11)
  if (on) {
    const clear = b.offsetHeight + (parseFloat(getComputedStyle(b).bottom) || 0) + 16; // transform-proof
    document.documentElement.style.scrollPaddingBottom = `${Math.round(clear)}px`;
  } else document.documentElement.style.removeProperty('scroll-padding-bottom');
  if (on) requestAnimationFrame(() => alignLens(b));
  if (!silent && was !== on) document.dispatchEvent(new CustomEvent('hn:addbar', { detail: { visible: on } }));
}
/* C-03b: two short lines, each on one line. Line 1: name · price. Line 2: size
   and grind (the grind only once chosen; the button asks for it otherwise). */
function updateAddbar() {
  const b = bar();
  if (!b || !P) return;
  const info = $('[data-addbar-info]', b);
  const g = st.grind && getGrind(st.grind);
  const s = getSize(P, st.size);
  const sub = [s.grams ? s.label : null, !isAccessory(P) && g ? g.label : null].filter(Boolean);
  info.innerHTML = `<span class="addbar__l1"><span class="addbar__name">${esc(P.name)}</span> · <strong class="addbar__price">${format.formatPrice(total())}</strong></span>${sub.length ? `<span class="addbar__l2">${esc(sub.join(' · '))}</span>` : ''}`;
  const btn = $('[data-addbar-btn]', b);
  if (btn.hasAttribute('aria-busy') || btn.classList.contains('is-added')) return;
  if (soldOut()) { btn.textContent = 'Sold out'; btn.setAttribute('aria-disabled', 'true'); btn.dataset.soldout = ''; }
  else if (ready()) { btn.textContent = 'Add to cart'; btn.removeAttribute('aria-disabled'); }
  else { btn.innerHTML = CHOOSE; btn.setAttribute('aria-disabled', 'true'); }
}
const CHOOSE = 'Choose a grind <span aria-hidden="true">↑</span>';
function initAddbar() {
  const b = bar();
  const inline = $('#pdp-add');
  if (!b || !inline || !('IntersectionObserver' in window)) return;
  const mq = matchMedia('(max-width: 1023.98px)');
  b.hidden = false;
  setBar(false, { silent: true });
  updateAddbar();
  const sync = () => {
    if (!mq.matches) { if (b.classList.contains('is-visible')) setBar(false); return; }
    setBar(barOut && !barSuppressed);
  };
  new IntersectionObserver(([e]) => {
    barOut = !e.isIntersecting && e.boundingClientRect.top < 0;
    if (!barOut) barSuppressed = false;
    sync();
  }, { threshold: 0 }).observe(inline);
  // the capsule reappears on scroll up (shell): hide the bar (never both)
  document.addEventListener('hn:capsule', (e) => {
    if (!e.detail?.visible || !b.classList.contains('is-visible')) return;
    barSuppressed = true;
    setBar(false, { silent: true });
  });
  // scrolling down again brings the bar back (the shell re-hides the capsule)
  let last = scrollY, tick = false;
  addEventListener('scroll', () => {
    if (tick) return;
    tick = true;
    requestAnimationFrame(() => {
      tick = false;
      const y = scrollY;
      if (barSuppressed && barOut && y > last + 8) { barSuppressed = false; sync(); }
      last = y;
    });
  }, { passive: true });
  mq.addEventListener?.('change', sync);
  $('[data-addbar-btn]', b).addEventListener('click', (e) => {
    const btn = e.currentTarget;
    if (!ready() && !soldOut()) { pointToGrind(); return; }
    doAdd(btn);
  });
}

/* ---- desktop: the sticky buy column is capped to the viewport in CSS (C-01:
   max-block-size + its own scroll), so it never slides under the capsule.
   Here only the band pool follows the bag on resize. ---- */
function initStickySlab() {
  placePool();
  let raf = 0;
  addEventListener('resize', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(placePool); }, { passive: true });
  document.fonts?.ready.then(placePool);
}

/* ---- gallery ---- */
function initGallery() {
  const track = $('[data-track]');
  if (!track) return;
  const dots = $$('[data-go]');
  const pos = $('[data-gallery-pos]');
  const n = track.children.length;
  const current = () => Math.round(track.scrollLeft / (track.clientWidth || 1));
  let last = 0;
  const update = () => {
    const i = Math.min(n - 1, Math.max(0, current()));
    if (i === last && dots[i]?.getAttribute('aria-current')) return;
    last = i;
    dots.forEach((d, k) => { if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
    if (pos) pos.textContent = `${i + 1} / ${n}`;
  };
  let raf = 0;
  track.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); }, { passive: true });
  for (const d of dots) d.addEventListener('click', () => {
    track.scrollTo({ left: Number(d.dataset.go) * track.clientWidth, behavior: reducedMotion() ? 'auto' : 'smooth' });
  });
}

/* ---- head: unique title + meta per product (COPY §4) ---- */
function setMeta() {
  const roast = ROAST_LEVELS.find((r) => r.id === P.roastLevel)?.label.toLowerCase();
  const title = isAccessory(P) ? `${P.name} | ${brand.shortName}` : `${P.name}, ${roast} roast coffee | ${brand.shortName}`;
  let desc;
  if (isAccessory(P)) desc = `${P.tagline} ${P.description}`.slice(0, 155).replace(/\s+\S*$/, '…');
  else {
    const process = PROCESSES.find((x) => x.id === P.process)?.label.toLowerCase();
    const [a, b, c] = P.notes.map((x) => x.toLowerCase());
    const make = (region) => `${P.name} from ${region}: ${a}, ${b} and ${c}. ${cap(roast)} roast, ${process} process, ground to order. From ${format.formatPrice(P.sizes[0].price)} / ${P.sizes[0].label}.`;
    desc = make(P.origin.region);
    if (desc.length > 155) desc = make(P.origin.region.split(',')[0]);
  }
  document.title = title;
  const setM = (sel, attr, v) => { let m = document.head.querySelector(sel); if (!m) { m = document.createElement('meta'); m.setAttribute(attr[0], attr[1]); document.head.append(m); } m.setAttribute('content', v); };
  setM('meta[name="description"]', ['name', 'description'], desc);
  setM('meta[property="og:title"]', ['property', 'og:title'], title.replace(/ \| .*$/, ''));
  setM('meta[property="og:description"]', ['property', 'og:description'], desc);
  setM('meta[property="og:type"]', ['property', 'og:type'], 'product');
}

/* ---- not found (COPY §4.13) ---- */
function renderNotFound(root) {
  document.title = `Coffee not found | ${brand.name}`;
  const robots = document.createElement('meta');
  robots.name = 'robots'; robots.content = 'noindex';
  document.head.append(robots);
  const best = (brand.bestsellers ?? []).map(getProduct).filter(Boolean);
  root.innerHTML = `<div class="container pdp-missing">
    <p class="marker">No. 404 · Not found</p>
    <h1 class="pdp-missing__title" tabindex="-1">We couldn't find that coffee.</h1>
    <p class="pdp-missing__line">It may have sold out for the season, or the link has a typo. Here's what people are buying instead.</p>
    <p><a class="btn btn--lg lacquer squish" href="${esc(url('shop.html'))}">Shop coffee</a></p>
    ${slip('even our best roasts cool down', 'pdp-missing__slip')}
    <section class="pdp-missing__best" aria-labelledby="missing-best-h">
      <h2 class="pdp-h2" id="missing-best-h">Bestsellers</h2>
      ${renderProductList(best.length ? best : PRODUCTS.slice(0, 4), { label: 'Bestsellers' })}
    </section>
  </div>`;
  root.removeAttribute('aria-busy');
  $('[data-addbar]')?.remove();
}

/* ==========================================================================
   Boot
   ========================================================================== */
registerPage('product', ({ params }) => {
  const root = $('[data-pdp]');
  const p = getProduct(params.get('c') ?? '');
  if (!p) { renderNotFound(root); requestAnimationFrame(refreshGlass); return; }
  P = p;
  const ctx = isAccessory(P) ? null : getBrewContext(); // ?brew → brewPref → none
  st.grind = ctx && getGrind(ctx) ? ctx : null;
  st.fromContext = !!st.grind;
  st.size = P.sizes[0].label;
  setMeta();

  root.innerHTML = `${crumbHTML()}
    <div class="pdp-stage bag-scope${isAccessory(P) ? ' pdp-stage--acc' : ''}" style="--bag:${esc(bandColour())}">
      ${bandHTML()}
      <div class="container pdp-grid">
        ${galleryHTML()}
        <div class="pdp-buy">${slabHTML()}</div>
        <div class="pdp-info">${profileHTML()}${freshHTML()}${originHTML()}${isAccessory(P) ? '' : tipsHTML()}</div>
      </div>
      <div class="container pdp-wide">${reviewsHTML()}</div>
    </div>
    ${relatedHTML()}`;
  root.removeAttribute('aria-busy');
  // C-19: the capsule lane tint takes the product colour (contract 2: .lane-tint reads these)
  const tint = bandColour();
  document.documentElement.style.setProperty('--lane-tint', tint);
  document.documentElement.style.setProperty('--lane-tint-2', `color-mix(in oklch, ${tint} 55%, var(--paper))`);
  $('[data-grind-guide]').innerHTML = grindGuideHTML();

  // events
  root.addEventListener('change', (e) => {
    const t = e.target;
    if (t.name === 'grind') {
      st.grind = t.value;
      $('[data-grind-msg]').hidden = true;
      cart.setBrewPref(st.grind); // the rest of the session follows it (SITEMAP §3.3)
      const u = new URL(location.href);
      u.searchParams.set('brew', st.grind);
      try { history.replaceState(null, '', u); } catch { /* sandboxed */ }
      updateBuy();
      renderRelated();
    }
    if (t.name === 'size') { st.size = t.value; updateBuy(); }
  });
  root.addEventListener('click', (e) => {
    const t = e.target;
    const q = t.closest('[data-qty]');
    if (q) {
      if (q.getAttribute('aria-disabled') === 'true') {
        if (Number(q.dataset.qty) > 0) $('[data-qty-max]').hidden = false;
        return;
      }
      st.qty = Math.min(MAX, Math.max(1, st.qty + Number(q.dataset.qty)));
      $('[data-qty-max]').hidden = st.qty < MAX;
      updateBuy();
      return;
    }
    if (t.closest('[data-add]')) { doAdd(t.closest('[data-add]')); return; }
    if (t.closest('[data-change-grind]')) { e.preventDefault(); pointToGrindQuiet(); return; }
    if (t.closest('[data-to-tips]')) {
      e.preventDefault();
      const s = $('#brew-tips');
      s.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
      s.focus({ preventScroll: true });
      return;
    }
    const gg = t.closest('[data-grind-guide-open]');
    if (gg) { openSheet($('#grind-sheet'), gg); requestAnimationFrame(() => $('#grind-sheet .sheet__close')?.focus()); }
  });
  cart.on('change', updateShipLine);

  updateBuy();
  renderRelated();
  initGallery();
  initAddbar();
  initStickySlab();
  requestAnimationFrame(refreshGlass);
  document.addEventListener('hn:field-ready', () => requestAnimationFrame(refreshGlass));
});

function pointToGrindQuiet() {
  const group = $('[data-grind-group]');
  group.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
  ($('input[name="grind"]:checked', group) ?? $('input[name="grind"]', group)).focus({ preventScroll: true });
}
