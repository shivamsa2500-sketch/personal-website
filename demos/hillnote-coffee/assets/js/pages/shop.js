/* pages/shop.js: Shop / collection (DESIGN §7.14, §8.2 · DESIGN-DECISIONS 2 + 5 ·
   SITEMAP §3.2 · COPY §3). Frontend Dev #2.

   State lives in the URL (history.replaceState), so Back, refresh and shared
   links work:  ?brew=french-press&milk=milk&roast=light,medium&sort=price-asc
     brew     the brew CONTEXT (single; chip row, brew banner). It also counts
              as a value of the "Brew method" facet and sets quick-add grind.
     method   extra brew-method facet values (multi)
     roast · taste · milk · process · price   multi, OR within, AND across
     sort     omitted when it is the default ('best' with brew, else 'featured')

   Hooks for the Motion Dev: [data-reveal] on the grind helper; the compact
   capsule tools carry .capsule__tools and capsule[data-tools="compact"]. */
import { registerPage, cart, format, brand, shopUrl, url, getBrewContext } from '../main.js';
import { PRODUCTS, ROAST_LEVELS, PROCESSES, NOTE_FAMILIES, PRICE_BUCKETS, matchesDrink, inPriceBucket, basePrice } from '../../../data/products.js';
import { BREW_METHODS, getGrind, getBrewMethod } from '../../../data/brew-methods.js';
import { renderProductCard } from '../components/product-card.js';
import { esc, icon, FINDER_OPTIONS } from '../components/ui.js';
import { openSheet, closeSheet, announce, setCapsuleTools, setCapsuleCompact } from '../shell.js';
import { refreshGlass } from '../glass.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const plural = (n) => (n === 1 ? '1 coffee' : `${n} coffees`);

/* ---- Facets, in SITEMAP order ------------------------------------------ */
const FACETS = [
  { key: 'method', title: 'Brew method', values: BREW_METHODS.map((m) => ({ id: m.id, label: m.label })), test: (p, v) => p.brewMethods.includes(v) },
  { key: 'roast', title: 'Roast level', values: ROAST_LEVELS.map((r) => ({ id: r.id, label: r.label, help: r.description })), test: (p, v) => p.roastLevel === v, meter: true },
  { key: 'taste', title: 'Taste notes', values: NOTE_FAMILIES.map((n) => ({ id: n.id, label: n.label })), test: (p, v) => p.noteFamilies?.includes(v) },
  { key: 'milk', title: 'How you drink it', values: [{ id: 'black', label: 'Black' }, { id: 'milk', label: 'With milk' }], test: (p, v) => matchesDrink(p, v) },
  { key: 'process', title: 'Process', values: PROCESSES.map((x) => ({ id: x.id, label: x.label, help: x.description })), test: (p, v) => p.process === v },
  { key: 'price', title: `Price (${'250 g'})`, values: PRICE_BUCKETS.map((b) => ({ id: b.id, label: format.priceBucketLabel(b) })), test: (p, v) => inPriceBucket(p, v) },
];
const FACET = Object.fromEntries(FACETS.map((f) => [f.key, f]));

const SORTS = [
  { id: 'featured', label: 'Featured' },
  { id: 'best', label: 'Best for my brewer', needsBrew: true },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'roast-asc', label: 'Roast: light to dark' },
  { id: 'roast-desc', label: 'Roast: dark to light' },
  { id: 'newest', label: 'Newest' },
];
const roastIdx = (p) => ROAST_LEVELS.findIndex((r) => r.id === p.roastLevel);

/* ---- State --------------------------------------------------------------- */
const state = { brew: null, sort: null, f: Object.fromEntries(FACETS.map((f) => [f.key, new Set()])) };
const history = []; // snapshots before each change ("Clear the last filter")
const hasBrewer = () => !!state.brew && state.brew !== 'whole-bean';
const defaultSort = () => (hasBrewer() ? 'best' : 'featured');
const sortId = () => {
  const s = state.sort ?? defaultSort();
  return s === 'best' && !hasBrewer() ? 'featured' : s;
};
/** The method facet's effective values: the brew context counts as one. */
const methodSet = () => {
  const s = new Set(state.f.method);
  if (hasBrewer()) s.add(state.brew);
  return s;
};
const activeSet = (key) => (key === 'method' ? methodSet() : state.f[key]);
const snapshot = () => ({ brew: state.brew, sort: state.sort, f: Object.fromEntries(FACETS.map((f) => [f.key, [...state.f[f.key]]])) });
const restore = (s) => {
  state.brew = s.brew;
  state.sort = s.sort;
  for (const f of FACETS) state.f[f.key] = new Set(s.f[f.key]);
};

function readUrl() {
  const q = new URLSearchParams(location.search);
  // ?brew= wins, then the saved brewPref (Director decision 2026-10-17): the
  // banner shows the brewer that quick add will grind for. "All" clears it.
  const b = getBrewContext();
  state.brew = b && getGrind(b) ? b : null;
  for (const f of FACETS) {
    const ok = new Set(f.values.map((v) => v.id));
    state.f[f.key] = new Set((q.get(f.key) ?? '').split(',').filter((v) => ok.has(v)));
  }
  if (hasBrewer()) state.f.method.delete(state.brew);
  const s = q.get('sort');
  state.sort = SORTS.some((x) => x.id === s) ? s : null;
}
function writeUrl() {
  const params = { brew: state.brew };
  for (const f of FACETS) params[f.key] = [...state.f[f.key]].join(',');
  if (state.sort && state.sort !== defaultSort()) params.sort = state.sort;
  const next = shopUrl(params);
  if (next !== location.href) history_replace(next);
}
const history_replace = (href) => { try { window.history.replaceState(null, '', href); } catch { /* sandboxed */ } };

/* ---- Filtering ------------------------------------------------------------ */
function passes(p, skip) {
  for (const f of FACETS) {
    if (f.key === skip) continue;
    const set = activeSet(f.key);
    if (set.size && ![...set].some((v) => f.test(p, v))) return false;
  }
  return true;
}
const results = () => sortList(PRODUCTS.filter((p) => passes(p)));
function sortList(list) {
  const s = sortId();
  const feat = (p) => p.featured ?? 99;
  const rank = (p) => { const i = p.brewMethods.indexOf(state.brew); return i < 0 ? 99 : i; };
  const by = {
    featured: (a, b) => feat(a) - feat(b),
    best: (a, b) => rank(a) - rank(b) || feat(a) - feat(b),
    'price-asc': (a, b) => basePrice(a) - basePrice(b) || feat(a) - feat(b),
    'price-desc': (a, b) => basePrice(b) - basePrice(a) || feat(a) - feat(b),
    'roast-asc': (a, b) => roastIdx(a) - roastIdx(b) || feat(a) - feat(b),
    'roast-desc': (a, b) => roastIdx(b) - roastIdx(a) || feat(a) - feat(b),
    newest: (a, b) => String(b.addedOn).localeCompare(String(a.addedOn)),
  }[s];
  return [...list].sort((a, b) => (a.inStock === false) - (b.inStock === false) || by(a, b));
}
/** Count for a facet value: other facets applied, this value alone in its facet. */
const countFor = (f, v) => PRODUCTS.filter((p) => passes(p, f.key) && f.test(p, v)).length;
/** The 2 nearest matches when nothing fits: most facets satisfied, then featured. */
function nearest() {
  const score = (p) => FACETS.reduce((n, f) => {
    const set = activeSet(f.key);
    return n + (!set.size || [...set].some((v) => f.test(p, v)) ? 1 : 0);
  }, 0);
  return PRODUCTS.filter((p) => p.inStock !== false)
    .map((p) => [p, score(p)])
    .sort((a, b) => b[1] - a[1] || (a[0].featured ?? 99) - (b[0].featured ?? 99))
    .slice(0, 2).map(([p]) => p);
}
const activeCount = () => FACETS.reduce((n, f) => n + activeSet(f.key).size, 0) + (state.brew === 'whole-bean' ? 1 : 0);

/* ---- Rendering: header, banner, context ---------------------------------- */
function renderHead() {
  const g = state.brew && getGrind(state.brew);
  const title = $('[data-shop-title]');
  const intro = $('[data-shop-intro]');
  const desc = document.querySelector('meta[name="description"]');
  if (g && state.brew === 'whole-bean') {
    title.textContent = 'Whole-bean coffee';
    intro.textContent = 'Twelve coffees, roasted weekly. Filter by brewer, roast or taste, or just tap "Add" and pick your grind.';
    document.title = `Whole-bean coffee | ${brand.name}`;
  } else if (g) {
    title.innerHTML = `Coffee for <em>${esc(g.label)}</em>`;
    intro.textContent = `Sorted by how well each one suits a ${g.label}. The top picks are marked.`;
    document.title = `Coffee for ${g.label} | ${brand.name}`;
    desc?.setAttribute('content', `Coffees that suit your ${g.label}, ground ${g.grind.toLowerCase()} to order and roasted every week. Free shipping over ${format.formatPrice(brand.freeShippingThreshold)}.`);
  } else {
    title.textContent = 'All coffee';
    intro.textContent = `${PRODUCTS.length === 12 ? 'Twelve' : PRODUCTS.length} coffees, roasted weekly. Filter by brewer, roast or taste, or just tap "Add" and pick your grind.`;
    document.title = `Shop specialty coffee | ${brand.name}`;
    desc?.setAttribute('content', 'Shop single-origin coffees and blends by brewer, roast, taste and price. Every bag roasted weekly, ground to order and shipped within 48 hours.');
  }

  $('[data-shop]').toggleAttribute('data-has-brew', !!g);
  // brew context notice (COPY §3.2)
  const ctx = $('[data-brew-context]');
  const gl = $('[data-brew-grindline]');
  if (gl) {
    // C-09 (≥ 1024, CSS-gated): one sentence under the banner replaces the Oat notice
    const m = g && getBrewMethod(g.id);
    gl.hidden = !g;
    gl.innerHTML = !g ? '' : g.id === 'whole-bean'
      ? "We'll send these as whole beans. Grind them just before brewing."
      : `We'll grind these for ${esc(g.label)}: ${esc(g.grind.toLowerCase())}, like ${esc(g.feel)}.${m?.guide ? ` <a class="link link--arrow" href="${esc(url(m.guide))}">How to brew ${esc(g.label)} <span aria-hidden="true">→</span></a>` : ''}`;
  }
  if (!g) { ctx.hidden = true; ctx.innerHTML = ''; }
  else {
    const m = getBrewMethod(g.id);
    const line = g.id === 'whole-bean'
      ? `We'll send these as <strong>whole beans</strong>. Grind them just before brewing.`
      : `We'll grind these for <strong>${esc(g.label)}</strong> (${esc(g.grind.toLowerCase())}, like ${esc(g.feel)}).`;
    ctx.innerHTML = `${icon(`i-${g.id}`, 24, 'brew-context__icon')}
      <p class="brew-context__text">${line}</p>
      <p class="brew-context__actions"><button type="button" class="text-btn text-btn--clay" data-change-brewer aria-controls="bb-brew-list">Change brewer</button>${m?.guide ? `<a class="link link--arrow" href="${esc(url(m.guide))}">How to brew ${esc(g.label)} <span aria-hidden="true">→</span></a>` : ''}</p>`;
    ctx.hidden = false;
  }
}

/* Brew banner: "For [French press ▾] · [with milk ▾]" (single choice listboxes) */
const BREW_OPTS = () => [{ id: '', label: 'any brewer' }, ...FINDER_OPTIONS.map((g) => ({ id: g.id, label: g.id === 'whole-bean' ? 'whole beans' : g.label }))];
const MILK_OPTS = [{ id: '', label: 'black or milk' }, { id: 'black', label: 'black' }, { id: 'milk', label: 'with milk' }];
const milkValue = () => (state.f.milk.size === 1 ? [...state.f.milk][0] : '');
function renderBanner() {
  const set = (name, opts, value) => {
    const root = $(`[data-bb="${name}"]`);
    const cur = opts.find((o) => o.id === value) ?? opts[0];
    $('[data-bb-value]', root).textContent = cur.label;
    $('.bb-list', root).innerHTML = opts.map((o, i) =>
      `<li role="option" id="bb-${name}-${i}" data-value="${esc(o.id)}" aria-selected="${o.id === cur.id}">${icon('i-check', 16, 'bb-list__check')}<span>${esc(o.label.charAt(0).toUpperCase() + o.label.slice(1))}</span></li>`).join('');
  };
  set('brew', BREW_OPTS(), state.brew ?? '');
  set('milk', MILK_OPTS, milkValue());
  $('[data-brew-banner]').hidden = false;
}
function wireBanner() {
  for (const root of $$('[data-bb]')) {
    const name = root.dataset.bb;
    const btn = $('.bb-control__btn', root);
    const list = $('.bb-list', root);
    const opts = () => $$('[role="option"]', list);
    let active = 0;
    const setActive = (i) => {
      const o = opts();
      active = (i + o.length) % o.length;
      o.forEach((el, k) => el.classList.toggle('is-active', k === active));
      list.setAttribute('aria-activedescendant', o[active].id);
      o[active].scrollIntoView({ block: 'nearest' });
    };
    const open = () => {
      closeAllBanner(root);
      list.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      root.classList.add('is-open');
      setActive(Math.max(0, opts().findIndex((o) => o.getAttribute('aria-selected') === 'true')));
      list.focus({ preventScroll: true });
    };
    const close = (focus = true) => {
      if (list.hidden) return;
      list.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      root.classList.remove('is-open');
      if (focus) btn.focus({ preventScroll: true });
    };
    root._close = close;
    root._open = open;
    const choose = (i) => {
      const v = opts()[i]?.dataset.value ?? '';
      close();
      if (name === 'brew') setBrew(v || null);
      else change(() => { state.f.milk = new Set(v ? [v] : []); });
    };
    btn.addEventListener('click', () => (list.hidden ? open() : close()));
    btn.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(); } });
    list.addEventListener('click', (e) => { const o = e.target.closest('[role="option"]'); if (o) choose(opts().indexOf(o)); });
    list.addEventListener('keydown', (e) => {
      const k = e.key;
      if (k === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
      else if (k === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
      else if (k === 'Home') { e.preventDefault(); setActive(0); }
      else if (k === 'End') { e.preventDefault(); setActive(opts().length - 1); }
      else if (k === 'Enter' || k === ' ') { e.preventDefault(); choose(active); }
      else if (k === 'Escape') { e.preventDefault(); close(); }
      else if (k === 'Tab') close(false);
    });
    list.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget)) close(false); });
  }
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('[data-bb]') && !e.target.closest('[data-change-brewer]')) closeAllBanner(); });
  // "Change brewer" in the context notice opens the brewer listbox
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-change-brewer]')) return;
    const root = $('[data-bb="brew"]');
    root.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
    root._open();
  });
}
const closeAllBanner = (except) => $$('[data-bb]').forEach((r) => { if (r !== except) r._close?.(false); });

/* Brewer chip row: All + 8 (aria-pressed) */
function renderChips() {
  const row = $('[data-chip-row]');
  const chip = (id, label, ico) => `<li><button type="button" class="brew-chip brew-chip--paper squish" data-brew-chip="${esc(id)}" aria-pressed="${(state.brew ?? '') === id}">${ico ? icon(`i-${ico}`, 20) : ''}<span>${esc(label)}</span></button></li>`;
  if (!row.children.length) {
    row.innerHTML = chip('', 'All') + FINDER_OPTIONS.map((g) => chip(g.id, g.label, g.id)).join('');
  } else {
    for (const b of $$('[data-brew-chip]', row)) b.setAttribute('aria-pressed', String((state.brew ?? '') === b.dataset.brewChip));
  }
  // C-11: roving tabindex, one tab stop (the pressed chip); arrows move
  const chips = $$('[data-brew-chip]', row);
  const cur = chips.find((b) => b.getAttribute('aria-pressed') === 'true') ?? chips[0];
  const keep = chips.find((b) => b === document.activeElement) ?? cur;
  chips.forEach((b) => { b.tabIndex = b === keep ? 0 : -1; });
}
function wireChipKeys() {
  const row = $('[data-chip-row]');
  row.addEventListener('keydown', (e) => {
    const chips = $$('[data-brew-chip]', row);
    const i = chips.indexOf(document.activeElement);
    if (i < 0) return;
    const to = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: chips.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    const next = chips[(to + chips.length) % chips.length];
    chips.forEach((b) => { b.tabIndex = b === next ? 0 : -1; });
    next.focus({ preventScroll: true });
    next.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
  });
}

/* ---- Rendering: facets (sheet + sidebar share one markup) ---------------- */
function facetsHTML(scope) {
  return FACETS.map((f, i) => {
    const open = true; // C-10: every facet starts open (all have ≤ 6 options); <details> still collapses
    return `<details class="facet" data-facet="${f.key}"${open ? ' open' : ''}>
      <summary class="facet__summary"><span class="facet__title">${esc(f.title)}</span><span class="facet__n" data-facet-n></span>${icon('i-chevron-down', 20, 'facet__chev')}</summary>
      <fieldset class="facet__body">
        <legend class="visually-hidden">${esc(f.title)}</legend>
        ${f.meter ? '<p class="visually-hidden">Roast level, from light to dark</p>' : ''}
        ${f.values.map((v, k) => `<label class="facet-row">
          <input class="facet-row__input" type="checkbox" name="${scope}-${f.key}" value="${esc(v.id)}" data-key="${f.key}">
          <span class="facet-row__box" aria-hidden="true">${icon('i-check', 16)}</span>
          ${f.meter ? `<span class="facet-row__meter roast__meter" aria-hidden="true">${ROAST_LEVELS.map((_, j) => `<span${j <= k ? ' class="is-on"' : ''}></span>`).join('')}</span>` : ''}
          <span class="facet-row__text"><span class="facet-row__label">${esc(v.label)}</span>${v.help ? `<span class="facet-row__help">${esc(v.help)}</span>` : ''}</span>
          <span class="facet-row__count"><span data-count-n>(0)</span><span class="visually-hidden" data-none>, no matches</span></span>
        </label>`).join('')}
      </fieldset>
    </details>`;
  }).join('');
}
function syncFacets() {
  for (const form of $$('[data-facets]')) {
    for (const f of FACETS) {
      const set = activeSet(f.key);
      const group = $(`[data-facet="${f.key}"]`, form);
      $('[data-facet-n]', group).textContent = set.size ? `(${set.size})` : '';
      for (const input of $$('input', group)) {
        const v = input.value;
        const n = countFor(f, v);
        input.checked = set.has(v);
        const dead = n === 0 && !input.checked;
        input.disabled = dead;
        const row = input.closest('.facet-row');
        row.classList.toggle('is-dead', dead);
        $('[data-count-n]', row).textContent = `(${n})`;
        $('[data-none]', row).hidden = !dead;
      }
    }
  }
}

/* ---- Rendering: toolbar, chips, results ---------------------------------- */
function renderToolbar(n) {
  const a = activeCount();
  const fl = a ? `Filter (${a})` : 'Filter';
  $('[data-filter-label]').textContent = fl;
  const sLabel = SORTS.find((s) => s.id === sortId())?.label ?? 'Featured';
  $('[data-sort-label]').textContent = `Sort: ${sLabel}`;
  $('[data-count]').textContent = plural(n);
  const sel = $('[data-sort-select]');
  sel.innerHTML = SORTS.filter((s) => !s.needsBrew || hasBrewer()).map((s) => `<option value="${s.id}"${s.id === sortId() ? ' selected' : ''}>${esc(s.label)}</option>`).join('');
  // sheet footer (COPY §3.5)
  const show = $('[data-show-count]');
  if (n === 0) { show.textContent = 'No matches. Clear a filter'; show.removeAttribute('data-sheet-close'); show.dataset.clearOne = ''; }
  else { show.textContent = `Show ${plural(n)}`; show.setAttribute('data-sheet-close', ''); delete show.dataset.clearOne; }
  for (const b of $$('[data-clear-all]')) if (b.closest('.shop-side') || b.closest('.filter-sheet')) b.hidden = a === 0 && !state.brew;
  // compact capsule tools
  const cf = $('[data-cap-filter-label]');
  if (cf) cf.textContent = fl;
  // sort sheet radios (rebuilt only while closed, so focus never drops)
  const sortSheet = $('#sort-sheet');
  if (sortSheet.open) { for (const r of $$('input[name="sort"]', sortSheet)) r.checked = r.value === sortId(); return; }
  $('[data-sort-list]').innerHTML = '<legend class="visually-hidden">Sort coffees by</legend>' + SORTS.filter((s) => !s.needsBrew || hasBrewer()).map((s) =>
    `<label class="sort-row"><input type="radio" name="sort" value="${s.id}"${s.id === sortId() ? ' checked' : ''}><span class="sort-row__dot" aria-hidden="true"></span><span>${esc(s.label)}</span></label>`).join('');
}

function chipLabel(key, v) {
  if (key === 'brew') return getGrind(v)?.label ?? v;
  return FACET[key].values.find((x) => x.id === v)?.label ?? v;
}
function renderActive() {
  const items = [];
  if (state.brew) items.push(['brew', state.brew]);
  for (const f of FACETS) for (const v of state.f[f.key]) items.push([f.key, v]);
  const box = $('[data-active-chips]');
  box.hidden = items.length === 0;
  $('[data-shop]').toggleAttribute('data-has-active', items.length > 0);
  $('[data-shop]').toggleAttribute('data-only-brew', items.length === 1 && items[0][0] === 'brew');
  $('[data-active-list]').innerHTML = items.map(([k, v]) => {
    const l = chipLabel(k, v);
    return `<li><button type="button" class="active-chip squish" data-remove="${k}:${esc(v)}" aria-label="Remove filter: ${esc(l)}"><span aria-hidden="true">${esc(l)}</span>${icon('i-x', 16)}</button></li>`;
  }).join('') + (items.length ? `<li><button type="button" class="text-btn text-btn--clay active-chips__clear" data-clear-all>Clear all</button></li><li class="active-chips__count" aria-hidden="true">${plural(results().length)}</li>` : '');
}

function renderResults(list) {
  const host = $('[data-results]');
  const empty = $('[data-empty]');
  host.removeAttribute('aria-busy');
  // "Best for {brewer}" ribbons: the two best fits for this brewer overall
  const ribbons = new Set(hasBrewer() ? PRODUCTS.filter((p) => p.inStock !== false && p.brewMethods.includes(state.brew))
    .sort((a, b) => a.brewMethods.indexOf(state.brew) - b.brewMethods.indexOf(state.brew) || (a.featured ?? 99) - (b.featured ?? 99))
    .slice(0, 2).map((p) => p.slug) : []);
  const cardBrew = state.brew ?? undefined; // undefined → card falls back to brewPref
  if (!list.length) {
    host.innerHTML = '';
    host.hidden = true;
    empty.hidden = false;
    $('[data-empty-chips]').innerHTML = FINDER_OPTIONS.map((g) =>
      `<li><button type="button" class="brew-chip brew-chip--paper squish" data-empty-brew="${g.id}">${icon(`i-${g.id}`, 20)}<span>${esc(g.label)}</span></button></li>`).join('');
    $('[data-empty-near]').innerHTML = `<div class="plist"><ul class="pgrid" role="list" aria-label="Closest matches">${nearest().map((p) => renderProductCard(p, { brew: cardBrew })).join('')}</ul></div>`;
  } else {
    empty.hidden = true;
    host.hidden = false;
    host.innerHTML = `<div class="plist"><ul class="pgrid" role="list" aria-label="Coffees">${list.map((p) => renderProductCard(p, { brew: cardBrew, ribbon: ribbons.has(p.slug) })).join('')}</ul></div>`;
  }
  requestAnimationFrame(refreshGlass);
}

function renderGrindTable() {
  const tb = $('[data-grind-table] tbody');
  tb.innerHTML = FINDER_OPTIONS.map((g) => `<tr>
    <th scope="row"><span class="grind-table__brewer">${icon(`i-${g.id}`, 20)}${esc(g.label)}</span></th>
    <td>${esc(g.grind)}</td>
    <td>${g.feel ? esc(g.feel.charAt(0).toUpperCase() + g.feel.slice(1)) : 'Grind at home'}</td>
  </tr>`).join('');
}

/* ---- Update cycle ---------------------------------------------------------- */
let liveTimer;
function render({ announceCount = true } = {}) {
  const list = results();
  renderHead();
  renderBanner();
  renderChips();
  syncFacets();
  renderToolbar(list.length);
  renderActive();
  renderResults(list);
  writeUrl();
  if (announceCount) {
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => announce(`${plural(list.length)} shown`), 500);
  }
  return list;
}
function change(mutate) {
  history.push(snapshot());
  if (history.length > 30) history.shift();
  mutate();
  return render();
}
function setBrew(id) {
  if ((state.brew ?? null) === (id ?? null)) return;
  change(() => {
    state.brew = id && getGrind(id) ? id : null;
    if (hasBrewer()) state.f.method.delete(state.brew);
    if (state.sort === 'best' && !hasBrewer()) state.sort = null;
  });
  // the brew context is the session's brewPref (SITEMAP §3.3); "All" clears it
  cart.setBrewPref(state.brew);
}
function toggle(key, v, on) {
  change(() => {
    if (key === 'method' && hasBrewer() && v === state.brew && !on) { state.brew = null; cart.setBrewPref(null); return; }
    if (key === 'brew') { state.brew = null; cart.setBrewPref(null); return; }
    const s = state.f[key];
    if (on ?? !s.has(v)) s.add(v); else s.delete(v);
  });
}
function clearAll() {
  change(() => {
    for (const f of FACETS) state.f[f.key].clear();
    state.brew = null;
    state.sort = null;
  });
  cart.setBrewPref(null);
}
/** "Clear the last filter": undo the most recent change, else drop the last value. */
function undoLast() {
  if (history.length) {
    restore(history.pop());
    cart.setBrewPref(state.brew);
    return render();
  }
  // arrived from a link (no history): drop the one value whose removal frees the most coffees
  let best = null;
  const base = snapshot();
  const candidates = [...(state.brew ? [['brew', state.brew]] : []), ...FACETS.flatMap((f) => [...state.f[f.key]].map((v) => [f.key, v]))];
  for (const [k, v] of candidates) {
    if (k === 'brew') state.brew = null; else state.f[k].delete(v);
    const n = PRODUCTS.filter((p) => passes(p)).length;
    if (!best || n >= best.n) best = { k, v, n };
    restore(base);
  }
  if (best) {
    if (best.k === 'brew') { state.brew = null; cart.setBrewPref(null); } else state.f[best.k].delete(best.v);
  }
  return render();
}

/* ---- Compact Shop capsule (DESIGN §7.2): Menu · mark · Filter (n) · Sort · Cart.
   shell.js owns the capsule (setCapsuleTools / setCapsuleCompact); the page
   supplies the two plates and says when the toolbar has scrolled under the
   capsule. Mobile/tablet only (desktop has the sidebar). */
function initCompactCapsule() {
  const toolbar = $('[data-toolbar]');
  if (!toolbar || !('IntersectionObserver' in window)) return;
  const tools = setCapsuleTools(`<button type="button" class="capsule__tool plate squish" data-open-filters aria-haspopup="dialog" aria-controls="filter-sheet">${icon('i-filter', 20)}<span data-cap-filter-label>Filter</span></button>
    <button type="button" class="capsule__tool plate squish" data-open-sort aria-haspopup="dialog" aria-controls="sort-sheet" aria-label="Sort">Sort</button>`);
  if (!tools) return;
  const mq = matchMedia('(max-width: 1023.98px)');
  let past = false;
  const apply = () => {
    $('[data-cap-filter-label]', tools).textContent = $('[data-filter-label]').textContent;
    setCapsuleCompact(past && mq.matches, { fallbackFocus: $('[data-open-filters]', toolbar) });
  };
  const io = new IntersectionObserver(([e]) => {
    past = !e.isIntersecting && e.boundingClientRect.top < 80;
    apply();
  }, { root: null, rootMargin: '-80px 0px 0px 0px', threshold: 0 });
  io.observe(toolbar);
  mq.addEventListener?.('change', apply);
  apply();
}

/* ---- Wiring ---------------------------------------------------------------- */
function wire() {
  const filterSheet = $('#filter-sheet');
  const sortSheet = $('#sort-sheet');

  document.addEventListener('click', (e) => {
    const t = e.target;
    const of = t.closest('[data-open-filters]');
    if (of) { openSheet(filterSheet, of); requestAnimationFrame(() => $('.sheet__close', filterSheet)?.focus()); return; }
    const os = t.closest('[data-open-sort]');
    if (os) { openSheet(sortSheet, os); requestAnimationFrame(() => ($('input:checked', sortSheet) ?? $('input', sortSheet))?.focus()); return; }
    const chip = t.closest('[data-brew-chip]');
    if (chip) { setBrew(chip.dataset.brewChip || null); return; }
    const rm = t.closest('[data-remove]');
    if (rm) {
      const [k, v] = rm.dataset.remove.split(':');
      const list = $('[data-active-list]');
      const idx = $$('[data-remove]', list).indexOf(rm);
      toggle(k, v, false);
      // keep focus in the chip row (next chip, else the filter button)
      const next = $$('[data-remove]', list)[idx] ?? $$('[data-remove]', list)[idx - 1] ?? $('[data-open-filters]');
      next?.focus({ preventScroll: true });
      return;
    }
    if (t.closest('[data-clear-all]')) {
      const inSheet = t.closest('.filter-sheet');
      clearAll();
      (inSheet ? $('.sheet__close', filterSheet) : $('[data-open-filters]'))?.focus({ preventScroll: true });
      return;
    }
    if (t.closest('[data-undo-last]')) {
      const list = undoLast();
      if (list.length) $('#results-title').setAttribute('tabindex', '-1'), $('#results-title').focus();
      return;
    }
    const eb = t.closest('[data-empty-brew]');
    if (eb) {
      change(() => { for (const f of FACETS) state.f[f.key].clear(); state.brew = eb.dataset.emptyBrew; state.sort = null; });
      cart.setBrewPref(state.brew);
      $('#results-title').setAttribute('tabindex', '-1');
      $('#results-title').focus();
      return;
    }
    if (t.closest('[data-clear-one]')) { undoLast(); }
  });

  for (const form of $$('[data-facets]')) {
    form.addEventListener('change', (e) => {
      const i = e.target;
      if (!i.matches('input[type="checkbox"]')) return;
      toggle(i.dataset.key, i.value, i.checked);
    });
    form.addEventListener('submit', (e) => e.preventDefault());
  }
  $('[data-sort-select]').addEventListener('change', (e) => change(() => { state.sort = e.target.value; }));
  // applies on change; closes on a tap/click or Enter/Space (arrow keys only move)
  sortSheet.addEventListener('change', (e) => {
    if (e.target.name !== 'sort') return;
    change(() => { state.sort = e.target.value; });
  });
  sortSheet.addEventListener('click', (e) => {
    if (e.target.closest('.sort-row') && e.detail > 0) setTimeout(() => closeSheet(sortSheet), 0);
  });
  sortSheet.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.name === 'sort') {
      e.preventDefault();
      if (!e.target.checked) { e.target.checked = true; e.target.dispatchEvent(new Event('change', { bubbles: true })); }
      closeSheet(sortSheet);
    }
  });
}

registerPage('shop', () => {
  readUrl();
  for (const form of $$('[data-facets]')) form.innerHTML = facetsHTML(form.dataset.facets);
  renderGrindTable();
  wire();
  wireBanner();
  wireChipKeys();
  render({ announceCount: false });
  if (state.brew) cart.setBrewPref(state.brew);
  initCompactCapsule();
});
