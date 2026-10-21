/* Packages grid + reviews, rendered from data/*.js */
import { $, emit } from './ui.js';
import { packages } from '../../data/packages.js';
import { reviews } from '../../data/reviews.js';

const icon = (id, w = 20, h = 20) => `<svg width="${w}" height="${h}" aria-hidden="true" focusable="false"><use href="#${id}"/></svg>`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function initPackages() {
  const grid = $('[data-packages]');
  if (grid) {
    grid.innerHTML = packages.map((p, i) => `
      <li class="pkg${p.featured ? ' pkg--featured' : ''}" data-reveal style="--i:${i}">
        <span class="pkg__level">${esc(p.level)}</span>
        <h3 class="pkg__name">${esc(p.name)}</h3>
        <p class="pkg__blurb">${esc(p.blurb)}</p>
        <p class="pkg__time">${icon('i-clock', 18, 18)}${esc(p.time)}</p>
        <ul class="pkg__list" role="list">${p.includes.map((t) => `<li>${icon('i-check', 18, 18)}${esc(t)}</li>`).join('')}</ul>
        <p class="pkg__price">Price on request</p>
        <a class="btn ${p.featured ? 'btn--accent' : 'btn--ghost'} btn--lg btn--block pkg__cta" href="#quote" data-pick-package="${p.id}">Get a quote<span class="visually-hidden"> for ${esc(p.name)}</span>${icon('i-arrow')}</a>
      </li>`).join('');
    // Mobile row: start centred on the featured package so both neighbours peek in
    const centreFeatured = () => {
      const f = grid.querySelector('.pkg--featured');
      if (f && grid.scrollWidth > grid.clientWidth) grid.scrollLeft = f.offsetLeft - (grid.clientWidth - f.offsetWidth) / 2;
    };
    centreFeatured();
    window.addEventListener('load', centreFeatured, { once: true });
    grid.addEventListener('click', (e) => {
      const a = e.target.closest('[data-pick-package]');
      if (a) emit('pick-package', a.dataset.pickPackage);
    });
  }

  const list = $('[data-reviews]');
  if (list) {
    list.innerHTML = reviews.map((r, i) => {
      const initials = r.name.split(/\s+/).map((w) => w[0]).join('').replace('.', '');
      const stars = Array.from({ length: 5 }, (_, k) => `<svg width="18" height="18" class="${k < r.stars ? '' : 'off'}" aria-hidden="true" focusable="false"><use href="#i-star"/></svg>`).join('');
      return `<li class="review" data-reveal style="--i:${i % 3}">
        <p class="review__stars" role="img" aria-label="${r.stars} out of 5 stars">${stars}</p>
        <blockquote class="review__text" style="margin:0"><p>“${esc(r.text)}”</p></blockquote>
        <p class="review__who"><span class="review__avatar" aria-hidden="true">${esc(initials)}</span><span><span class="review__name">${esc(r.name)}</span><br><span class="review__car">${esc(r.car)}</span></span></p>
      </li>`;
    }).join('');
  }
}
