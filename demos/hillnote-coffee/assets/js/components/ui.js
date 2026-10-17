/* components/ui.js: tiny string-template helpers shared by the shell and
   every page module. No DOM work at import time.

   import { esc, icon, lens, brewerChip, brewerTile, marginNote, slip } from './components/ui.js';
*/
import { url, shopUrl } from '../main.js';
import { GRIND_OPTIONS } from '../../../data/brew-methods.js';

/** HTML-escape any value for text or attribute context. */
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Decorative sprite icon: icon('i-plus', 20). Always aria-hidden; label the control. */
export const icon = (id, size = 24, cls = '') =>
  `<svg class="icon${cls ? ` ${cls}` : ''}" width="${size}" height="${size}" aria-hidden="true" focusable="false"><use href="${url('assets/img/icons.svg')}#${id}"/></svg>`;

/** First child of every glass object (DESIGN §2.3). mods: 'fixed' | 'thin' | 'round' (space-separated). */
export const lens = (mods = '') =>
  `<span class="lens${mods.split(' ').filter(Boolean).map((m) => ` lens--${m}`).join('')}" aria-hidden="true"><svg><use href="#field" filter="url(#lensBlur)"/></svg></span>`;

/** The 8 grind options in finder order (whole bean last, as COPY §1.2 lists them). */
export const FINDER_OPTIONS = [...GRIND_OPTIONS.filter((g) => g.id !== 'whole-bean'), GRIND_OPTIONS.find((g) => g.id === 'whole-bean')];
const ORDER = ['espresso', 'moka-pot', 'aeropress', 'pour-over', 'south-indian-filter', 'french-press', 'cold-brew', 'whole-bean'];
FINDER_OPTIONS.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));

/** Brewer chip (link): icon + label. variant 'plate' (inside the hero tray) or 'paper' (on paper, strong edge). */
export const brewerChip = (g, variant = 'paper') =>
  `<a class="brew-chip brew-chip--${variant} squish" href="${esc(shopUrl({ brew: g.id }))}">${icon(`i-${g.id}`, 20)}<span>${esc(g.label)}</span></a>`;

/** Solid Paper brewer tile (menu, finder popover, Home finder): icon 28 + label + grind word. */
export const brewerTile = (g) =>
  `<a class="brew-tile squish" href="${esc(shopUrl({ brew: g.id }))}">${icon(`i-${g.id}`, 28)}<span class="brew-tile__label">${esc(g.label)}</span><span class="brew-tile__grind">${esc(g.chipLine)}</span></a>`;

/** Margin note (paper). Desktop: margin column; < 768: inline with a Clay rule. */
export const marginNote = (text, cls = '') => `<p class="margin-note${cls ? ` ${cls}` : ''}">${esc(text)}</p>`;

/** Paper slip (a note on glass). */
export const slip = (text, cls = '') => `<p class="slip${cls ? ` ${cls}` : ''}">${esc(text)}</p>`;
