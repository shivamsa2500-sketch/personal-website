/* Coach portraits: a photo from brand.media, or a placeholder in brand colours. */
import brand from '../../brand.config.js';
import { esc } from './ui.js';

export function portraitHtml(c, size = 'card', { lazy = true } = {}) {
  const p = c.portrait || {};
  const cls = `portrait portrait--${size}`;
  if (p.photo && brand.media[p.photo]) {
    const big = brand.media[p.photo];
    const small = brand.media[p.photoSmall] || big;
    const src = size === 'mini' ? small : big;
    const alt = size === 'mini' ? '' : esc(p.alt || c.name);
    return `<span class="${cls} portrait--photo" ${size === 'mini' ? 'aria-hidden="true"' : ''}><img src="${src}" ${size === 'mini' ? '' : `srcset="${small} 560w, ${big} 900w" sizes="(min-width: 1024px) 40vw, 90vw"`} width="900" height="1264" alt="${alt}" ${lazy ? 'loading="lazy"' : ''} decoding="async" style="object-position:${p.position || '50% 30%'};${size === 'mini' ? '' : `--zoom:${p.zoom || 1};--zoom-origin:${p.zoomOrigin || '50% 40%'}`}"></span>`;
  }
  const [a, b] = p.gradient || ['#26262b', '#0f0f11'];
  return `<span class="${cls} portrait--placeholder" style="--pa:${a};--pb:${b}" ${size === 'mini' ? 'aria-hidden="true"' : 'role="img" aria-label="Placeholder portrait for ' + esc(c.name) + '"'}>
    <svg class="portrait__shape" viewBox="0 0 200 260" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMax slice"><circle cx="100" cy="92" r="40" fill="currentColor"/><path d="M28 260c6-62 36-100 72-100s66 38 72 100z" fill="currentColor"/></svg>
    <span class="portrait__initials" aria-hidden="true">${esc(c.initials)}</span>
  </span>`;
}
