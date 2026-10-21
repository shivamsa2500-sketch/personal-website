/* ==========================================================================
   QUOTE BUILDER  ·  REBRAND FILE 3 of 3  [DEMO: EXAMPLE NUMBERS ONLY]
   --------------------------------------------------------------------------
   These ranges are made up for a demo business. The page labels every
   result "Example estimate". Replace with the client's real prices, or set
   `showNumbers: false` to show "We'll quote within a day" instead.
   Range = (package base x size multiplier) + add-ons, rounded to $10.
   ========================================================================== */

export const quote = {
  showNumbers: true,
  currency: '$',
  sizes: [
    { id: 'coupe', label: 'Coupe / hatch', factor: 0.9 },
    { id: 'sedan', label: 'Sedan', factor: 1 },
    { id: 'suv', label: 'SUV / crossover', factor: 1.2 },
    { id: 'truck', label: 'Truck / van', factor: 1.35 },
  ],
  base: {
    signature: [120, 180],
    correction: [450, 720],
    ceramic: [1100, 1800],
  },
  addons: [
    { id: 'interior', label: 'Interior deep clean', range: [90, 150] },
    { id: 'wheels', label: 'Wheels-off ceramic', range: [150, 260] },
    { id: 'glass', label: 'Glass coating', range: [60, 90] },
    { id: 'engine', label: 'Engine bay detail', range: [50, 80] },
  ],
};
