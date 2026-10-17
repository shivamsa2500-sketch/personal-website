/* format.js: every number the user reads goes through here, so the currency
   symbol, grouping and locale always come from brand.config.js.
   No DOM. Safe to import in Node. */

import brand from '../../brand.config.js';

const { code, locale } = brand.currency;

const money = new Intl.NumberFormat(locale, {
  style: 'currency',
  currency: code,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const unit = new Intl.NumberFormat(locale, {
  style: 'currency',
  currency: code,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const num = new Intl.NumberFormat(locale);

/** 32 → "$32" (whole units in the brand currency). */
export const formatPrice = (n) => money.format(Math.round(Number(n) || 0));

/** Plain number with locale grouping: 1500 → "1,500". */
export const formatNumber = (n) => num.format(n);

/** "from $17" for cards (default size price). */
export const formatFrom = (price) => `from ${formatPrice(price)}`;

/** Price per 100 g, e.g. (32, 500) → "$6.40 / 100 g". Returns '' when grams is null. */
export const formatPer100g = (price, grams) =>
  grams ? `${unit.format((price / grams) * 100)} / 100 g` : '';

/** Altitude range [1250, 1450] → "1,250–1,450 m"; [1300,1300] → "1,300 m". */
export const formatAltitude = ([min, max]) =>
  min === max ? `${formatNumber(min)} m` : `${formatNumber(min)}–${formatNumber(max)} m`;

/** Price bucket label from data/products.js PRICE_BUCKETS. */
export const priceBucketLabel = (b) => {
  if (b.min == null) return `Under ${formatPrice(b.max + 1)}`;
  if (b.max == null) return `Over ${formatPrice(b.min - 1)}`;
  return `${formatPrice(b.min)}–${formatPrice(b.max)}`;
};

/** Cart icon label per COPY.md §1.2. */
export const cartCountLabel = (n) =>
  n === 0 ? 'Cart, empty' : n === 1 ? 'Cart, 1 item' : `Cart, ${n} items`;

/** Replace {tokens} in a copy string: fill('Hi {name}', { name: 'A' }). */
export const fill = (str, vars) => str.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));

/** Announcement bar text with the threshold formatted. short: the < 480 px line. */
export const announcementText = ({ short = false } = {}) =>
  fill((short && brand.announcementShort) || brand.announcement, {
    threshold: formatPrice(brand.freeShippingThreshold),
    dispatchHours: String(brand.shipping?.dispatchHours ?? 48),
  });

export const currencySymbol = brand.currency.symbol;
