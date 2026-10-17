/* Brew methods: the one canonical list shared by the finder chips, Shop
   filters, the grind selector, the cart grind <select> and the guides.
   Source: SITEMAP.md §0 + §5, COPY.md §4.5 (helper lines) and §6.3 (recipes).

   recipe: dose g, water ml (espresso = g out), tempC (cold brew 4 = fridge),
   time "m:ss" (cold brew "16:00:00"). Use display.* for human strings where
   the raw value would read oddly (cold brew time/temperature).            */

export const BREW_METHODS = [
  {
    id: 'espresso', label: 'Espresso', grind: 'Fine', feel: 'powdered sugar',
    hint: 'Pull 25–30 seconds.',
    line: 'Short, intense and syrupy. Needs a grinder you trust or beans we grind fine.',
    recipe: { dose: 18, water: 36, tempC: 93, time: '0:28' },
    display: { water: '36 g out', temp: '93 °C', time: '25–30 s' },
    method: 'Dose 18 g into the basket, level and tamp. Aim for 36 g of espresso in 25–30 seconds. Too fast and sour: grind finer. Too slow and bitter: grind coarser.',
    guide: null,
  },
  {
    id: 'moka-pot', label: 'Moka pot', grind: 'Fine-medium', feel: 'fine sand',
    hint: 'Off the heat when it starts to sputter.',
    line: "Stovetop strength. Start with hot water so the coffee doesn't stew.",
    recipe: { dose: 16, water: 160, tempC: 95, time: '4:30' },
    display: { water: '160 ml hot water', temp: 'Just off the boil', time: '4–5 min' },
    method: 'Fill the base with hot water to just below the valve. Fill the basket level without pressing. Brew on medium-low heat with the lid open, and take it off the heat as soon as it starts to sputter.',
    guide: null,
  },
  {
    id: 'aeropress', label: 'AeroPress', grind: 'Medium-fine', feel: 'table salt',
    hint: 'Steep about 2 minutes.',
    line: 'Quick, clean and travel-proof. Steep, stir, press.',
    recipe: { dose: 15, water: 230, tempC: 89, time: '2:00' },
    display: { water: '230 ml', temp: '88–90 °C', time: '2:00' },
    method: 'Add coffee and 230 ml water, stir 3 times, cap and steep until 1:30. Press slowly for 30 seconds. Top up with hot water if you like it longer.',
    guide: null,
  },
  {
    id: 'pour-over', label: 'Pour-over', grind: 'Medium-fine', feel: 'table salt',
    hint: 'Total brew about 3 minutes.',
    line: 'Clean, bright and sweet. A cone, a paper filter and three minutes of slow pouring.',
    recipe: { dose: 15, water: 250, tempC: 93, time: '2:45' },
    display: { water: '250 g', temp: '93 °C', time: '2:45' },
    method: null,
    guide: 'guides/pour-over.html',
  },
  {
    id: 'south-indian-filter', label: 'South Indian filter', grind: 'Fine-medium', feel: 'fine sand',
    hint: 'Let it drip 15–20 minutes.',
    line: 'A slow-drip decoction for milky, sweet filter coffee.',
    recipe: { dose: 20, water: 110, tempC: 95, time: '15:00' },
    display: { water: '110 ml', temp: '95 °C', time: '15–20 min drip' },
    method: 'Add coffee to the upper chamber, set the press disc on top, and pour in water just off the boil. Close and leave it to drip. Mix 1 part decoction with 2–3 parts hot milk and sugar to taste.',
    guide: null,
  },
  {
    id: 'french-press', label: 'French press', grind: 'Coarse', feel: 'sea salt',
    hint: 'Steep 4 minutes.',
    line: 'The most forgiving brewer there is. Full body, no sludge, four minutes.',
    recipe: { dose: 30, water: 500, tempC: 94, time: '4:00' },
    display: { water: '500 g', temp: '94 °C', time: '4:00' },
    method: null,
    guide: 'guides/french-press.html',
  },
  {
    id: 'cold-brew', label: 'Cold brew', grind: 'Extra coarse', feel: 'cracked peppercorns',
    hint: 'Steep 16–18 hours in the fridge.',
    line: 'Steep overnight in the fridge. Smooth, low in acid, keeps for a week.',
    recipe: { dose: 100, water: 1000, tempC: 4, time: '16:00:00' },
    display: { water: '1 litre cold water', temp: 'Fridge', time: '16–18 h' },
    method: 'Stir coffee into cold water in a jar, cover and refrigerate 16–18 hours. Strain through a paper filter. Dilute 1:1 with water or milk over ice.',
    guide: null,
  },
];

/** Grind options = whole bean + the 7 brewers (labelled by brewer, not micron). */
export const GRIND_OPTIONS = [
  { id: 'whole-bean', label: 'Whole bean', grind: 'Not ground', feel: null, chipLine: 'I grind at home' },
  ...BREW_METHODS.map((m) => ({ id: m.id, label: m.label, grind: m.grind, feel: m.feel, chipLine: m.grind })),
];

const byId = new Map(BREW_METHODS.map((m) => [m.id, m]));
const grindById = new Map(GRIND_OPTIONS.map((g) => [g.id, g]));

/** @returns the brew method object or undefined */
export const getBrewMethod = (id) => byId.get(id);
/** @returns the grind option (incl. whole-bean) or undefined */
export const getGrind = (id) => grindById.get(id);
/** Label for a grind id; null/undefined (accessories) → "One size" is the caller's job. */
export const grindLabel = (id) => grindById.get(id)?.label ?? '';
export const isValidGrind = (id) => grindById.has(id);
