/* map-india.js: the stylised India outline behind the illustrative maps
   (R2-3). The outline lives in assets/img/map-india.svg (#india); pages show
   it through <use>, cropped by a viewBox, and place pins with project() so
   the pins and the coastline share one coordinate space.
   Projection (same as the SVG): x = (lng - 68) * 20, y = (37.5 - lat) * 21.5. */
const SRC = new URL('../img/map-india.svg', import.meta.url).href;

/** viewBox crops in outline units: [x, y, w, h] */
export const BOX_SOUTH = [70, 300, 360, 396];   // the peninsula, 400 : 440 (Home farm map)
export const BOX_INDIA = [-10, -10, 620, 720];  // the whole country (Cafés map)

export const toXY = (lat, lng) => [(lng - 68) * 20, (37.5 - lat) * 21.5];

/** Pin position in % of a w × h frame showing `box` with xMidYMid meet. */
export function project(lat, lng, box, w = box[2], h = box[3]) {
  const [X, Y] = toXY(lat, lng);
  const s = Math.min(w / box[2], h / box[3]);
  const ox = (w - box[2] * s) / 2, oy = (h - box[3] * s) / 2;
  return { x: ((ox + (X - box[0]) * s) / w) * 100, y: ((oy + (Y - box[1]) * s) / h) * 100 };
}

export const outlineSVG = (box, cls = '') => `<svg class="map-india ${cls}" viewBox="${box.join(' ')}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false"><use href="${SRC}#india" width="600" height="700"></use></svg>`;
