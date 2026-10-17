/* pages/notfound.js: 404 (DESIGN §8.10): the bestsellers list. */
import { registerPage, brand } from '../main.js';
import { PRODUCTS, getProduct } from '../../../data/products.js';
import { renderProductList } from '../components/product-card.js';
import { refreshGlass } from '../glass.js';

registerPage('notfound', () => {
  const host = document.querySelector('[data-bestsellers]');
  if (!host) return;
  const list = (brand.bestsellers ?? []).map(getProduct).filter(Boolean);
  const items = list.length ? list : PRODUCTS.filter((p) => p.badges?.includes('bestseller')).slice(0, 4);
  host.innerHTML = renderProductList(items, { heading: 'h3', label: 'Bestsellers', badge: false });
  requestAnimationFrame(refreshGlass);
});
