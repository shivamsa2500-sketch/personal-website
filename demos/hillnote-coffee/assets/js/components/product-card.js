/* components/product-card.js: the ONE product card (DESIGN §7.9–7.11).

   One markup, two looks, chosen by container queries in components.css:
   - list container < 600 px  → ledger rows (mobile Shop, Home bestsellers)
   - list container ≥ 600 px  → glass-pocket cards in a 13em auto-fill grid
   - rails                     → pocket cards, fixed 220 px, scroll-snap

   API
     renderProductCard(product, opts) → '<li class="pcell">…</li>'
       opts.brew     grind id for brew context (default: getBrewContext()).
                     With it, + Add adds directly (250 g, that grind) and the
                     card link carries ?brew=. Pass null to force the sheet.
       opts.ribbon   true → "Best for {brewer}" ribbon (Shop: first 2 cards)
       opts.heading  'h2' | 'h3' (default) | 'h4'
       opts.badge    false → no badges on the well (e.g. a "Bestsellers" rail,
                     where every card would say "Bestseller"). Sold out still shows.
       opts.lazy     unused for SVG bags; kept for photo products later
     renderProductList(products, { rail, label, ...cardOpts }) → '<div class="plist">…</div>'
       rail: true → horizontal snap rail (Related, guides "Coffees for…")
       label: aria-label for the <ul> (optional)

   Behaviour: the "+ Add" pill is <button data-quick-add="{slug}"
   [data-brew="{grind}"]>. shell.js handles every click on the page through
   delegation, so pages only render markup (no binding needed).
*/
import { getBrewContext, productUrl, format } from '../main.js';
import { ROAST_LEVELS, PROCESSES, DRINK_WITH, BADGES, isAccessory } from '../../../data/products.js';
import { getGrind } from '../../../data/brew-methods.js';
import { esc, icon, lens } from './ui.js';
import { bagHTML } from './bag.js';
import { contours } from '../contours.js';

/* well contours: the coffee's own altitude rings, card-well zone (12 %) */
const wellTopo = new Map();
const topoFor = (p) => {
  if (isAccessory(p)) return '';
  if (!wellTopo.has(p.slug)) wellTopo.set(p.slug, contours(p.origin?.altitudeM ?? [1200, 1400], `${p.slug}-well`, { w: 200, h: 200, strokeWidth: 1.5 }).svg);
  return wellTopo.get(p.slug);
};

const roastIndex = (id) => ROAST_LEVELS.findIndex((r) => r.id === id);

export const regionShort = (p) =>
  isAccessory(p) ? 'Brew kit' : p.type === 'blend' ? 'Blend' : String(p.origin?.region ?? '').split(',')[0];
export const processLabel = (p) => PROCESSES.find((x) => x.id === p.process)?.label ?? '';

/** Roast meter (4 segments + label). Meaning lives in the label. */
export function roastMeter(p, { drink = true } = {}) {
  const i = roastIndex(p.roastLevel);
  if (i < 0) return '';
  const r = ROAST_LEVELS[i];
  const d = drink ? DRINK_WITH.find((x) => x.id === p.drinkWith)?.cardLine : '';
  return `<p class="roast" role="img" aria-label="Roast: ${esc(r.label.toLowerCase())} (${i + 1} of 4)${d ? `. ${esc(d)}` : ''}">
    <span class="roast__meter" aria-hidden="true">${ROAST_LEVELS.map((_, k) => `<span${k <= i ? ' class="is-on"' : ''}></span>`).join('')}</span>
    <span class="roast__label" aria-hidden="true">${esc(r.label)}${d ? ` · ${esc(d)}` : ''}</span>
  </p>`;
}

function priceHTML(p) {
  const s = p.sizes[0];
  const per = s.grams ? ` <span class="pcard__per">/ ${esc(s.label)}</span>` : '';
  if (p.compareAtPrice && p.compareAtPrice > s.price) {
    return `<p class="pcard__price"><span class="visually-hidden">Was ${format.formatPrice(p.compareAtPrice)}, now ${format.formatPrice(s.price)}</span><span aria-hidden="true"><span class="pcard__sale">${format.formatPrice(s.price)}</span> <s>${format.formatPrice(p.compareAtPrice)}</s>${per}</span></p>`;
  }
  return `<p class="pcard__price">${p.sizes.length > 1 ? 'from ' : ''}${format.formatPrice(s.price)}${per}</p>`;
}

/** The + Add pill (or Sold out). Exported so the PDP related rail / 404 can reuse it. */
export function addPill(p, brew) {
  if (p.inStock === false) {
    return `<button type="button" class="add-pill add-pill--sold" aria-disabled="true" aria-label="${esc(p.name)} is sold out">Sold out</button>`;
  }
  const g = !isAccessory(p) && brew ? getGrind(brew) : null;
  const label = g
    ? `Add ${p.name}, ${p.sizes[0].label}, ${g.id === 'whole-bean' ? 'whole bean' : `ground for ${g.label}`}`
    : `Add ${p.name} to cart`;
  return `<button type="button" class="add-pill lacquer squish" data-quick-add="${esc(p.slug)}"${g ? ` data-brew="${esc(g.id)}"` : ''} aria-label="${esc(label)}">${icon('i-plus', 16)}<span class="add-pill__text">Add</span></button>`;
}

/* The ribbon is a direct child of the card (not inside the aria-hidden well):
   it is read out, and in ledger rows it becomes a one-line tag above the name
   instead of wrapping inside the 80 px well. */
function ribbonHTML(ribbon, brew) {
  return ribbon && brew && getGrind(brew) && brew !== 'whole-bean' ? `<p class="ribbon">Best for ${esc(getGrind(brew).label)}</p>` : '';
}
function badgesHTML(p, show = true) {
  const out = [];
  const b = (show ? p.badges ?? [] : []).slice(0, 2).map((id) => `<span class="badge badge--${esc(id)}">${esc(BADGES[id] ?? id)}</span>`);
  if (p.inStock === false) b.unshift('<span class="badge badge--sold">Sold out</span>');
  if (b.length) out.push(`<span class="pcard__badges">${b.slice(0, 2).join('')}</span>`);
  return out.join('');
}

export function renderProductCard(p, { brew = getBrewContext(), ribbon = false, heading = 'h3', badge = true } = {}) {
  const href = productUrl(p.slug, isAccessory(p) ? null : brew);
  const sold = p.inStock === false;
  const H = /^h[2-5]$/.test(heading) ? heading : 'h3';
  const notes = (p.notes ?? []).slice(0, 3);
  const meta = [regionShort(p), processLabel(p)].filter(Boolean).join(' · ');
  // altitude: comparable spec for enthusiasts; pocket cards only (ledger rows hide it, B-25)
  const alt = !isAccessory(p) && p.type !== 'blend' && Array.isArray(p.origin?.altitudeM) ? format.formatAltitude(p.origin.altitudeM) : '';
  return `<li class="pcell">
  <article class="pcard bag-scope${sold ? ' is-sold' : ''}" style="--bag:${esc(isAccessory(p) ? (p.image.accentColor ?? '#EDE3D1') : p.image.bagColor)}" data-slug="${esc(p.slug)}">
    <a class="pcard__well glass-baked glass--well" href="${esc(href)}" tabindex="-1" aria-hidden="true">
      ${lens('thin')}
      <span class="pcard__topo" aria-hidden="true">${topoFor(p)}</span>
      ${bagHTML(p, { decorative: true, cls: 'pcard__bag' })}
      ${badgesHTML(p, badge !== false)}
    </a>
    ${ribbonHTML(ribbon, brew)}
    <div class="pcard__pocket glass-baked glass--card">
      ${lens()}
      <div class="pcard__plate plate">
        <${H} class="pcard__name"><a class="pcard__link" href="${esc(href)}">${esc(p.name)}</a></${H}>
        ${meta ? `<p class="pcard__meta">${esc(meta)}${alt ? `<span class="pcard__alt"> · ${esc(alt)}</span>` : ''}</p>` : ''}
        ${notes.length ? `<ul class="pcard__notes" aria-label="Tasting notes">${notes.map((n) => `<li class="note-pill">${esc(n)}</li>`).join('')}</ul>` : ''}
        ${roastMeter(p)}
        <div class="pcard__buy">${priceHTML(p)}${addPill(p, brew)}</div>
      </div>
    </div>
  </article>
</li>`;
}

export function renderProductList(products, { rail = false, label = '', ...opts } = {}) {
  const items = [...products].sort((a, b) => (a.inStock === false) - (b.inStock === false));
  return `<div class="plist${rail ? ' plist--rail' : ''}"><ul class="pgrid" role="list"${rail ? ' data-rail' : ''}${label ? ` aria-label="${esc(label)}"` : ''}>${items.map((p) => renderProductCard(p, opts)).join('')}</ul></div>`;
}
