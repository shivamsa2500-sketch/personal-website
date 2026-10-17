/* components/bag.js: the SVG bag (GRAPHICS §3.3). Needs the page sprite
   (`#bag`, `#bag-label`, `#bag-window`, `#bag-rim`, injected by shell.js
   from assets/img/bag.svg).

   bagHTML(product, { label = true, decorative = false, cls = '' }) → '<figure class="bag bag-scope" …>'
     label: true     full paper label + live HTML name/roast (>= 160 px wide;
                     below 160 px the label shrinks to the contour window)
            'micro'  as true, but 120-159 px bags keep a 2-line name at >= 8 px
            false    contour window only (cart thumbs, nudge, quick-add)
   Dark bags (OKLCH L < 0.4) get a 1 px rim + warm top-left specular (A-07).
*/
import { contours } from '../contours.js';
import { ROAST_LEVELS, isAccessory } from '../../../data/products.js';
import { esc } from './ui.js';

const cache = new Map();
function topo(p) {
  // fit 'meet' with a 6 % inset: rings never cut flat at the window edge (A-10)
  if (!cache.has(p.slug)) cache.set(p.slug, contours(p.origin?.altitudeM ?? [1200, 1400], p.slug, { w: 92, h: 50, fit: 'meet', inset: 0.06 }).path);
  return cache.get(p.slug);
}

/* OKLCH lightness of a #rgb / #rrggbb colour (null for anything else) */
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function oklchL(hex) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) return null;
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
  const [r, g, b] = [0, 2, 4].map((i) => lin(parseInt(h.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const mm = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return 0.2104542553 * l + 0.793617785 * mm - 0.0040720468 * s;
}

export function bagHTML(p, { label = true, decorative = false, cls = '' } = {}) {
  const acc = isAccessory(p);
  const colour = acc ? (p.image.accentColor ?? 'var(--oat)') : p.image.bagColor;
  const roast = ROAST_LEVELS.find((r) => r.id === p.roastLevel)?.label;
  const a11y = decorative ? 'aria-hidden="true"' : `role="img" aria-label="${esc(p.image.alt)}"`;
  const L = oklchL(colour);
  const dark = L !== null && L < 0.4;
  const classes = ['bag', 'bag-scope', label === 'micro' && 'bag--micro', dark && 'bag--dark', /\bpcard__bag\b/.test(cls) && 'bag--well', cls].filter(Boolean).join(' ');
  const paper = acc ? '' : label
    ? '<use class="bag__lab bag__lab--full" href="#bag-label"/><use class="bag__lab" href="#bag-window"/>'
    : '<use class="bag__lab" href="#bag-window"/>';
  return `<figure class="${classes}" style="--bag:${esc(colour)}">
    <svg class="bag__art" viewBox="0 0 200 260" ${a11y} focusable="false"><use href="#bag"/>${paper}${acc ? '' : `<svg class="bag__topo" x="54" y="112" width="92" height="50" viewBox="0 0 92 50">${topo(p)}</svg>`}${dark ? '<use class="bag__rim" href="#bag-rim"/>' : ''}</svg>${
      label && !acc ? `<span class="bag__label" aria-hidden="true"><span class="bag__name">${esc(p.name)}</span>${roast ? `<span class="bag__roast">${esc(roast)} roast</span>` : ''}</span>` : ''}
  </figure>`;
}
