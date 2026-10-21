/* ==========================================================================
   PACKAGES  ·  REBRAND FILE 2 of 3  [DEMO]
   --------------------------------------------------------------------------
   No prices here on purpose: the owner has not set prices yet, so every
   package says "Get a quote". Example price ranges for the quote builder
   live in data/quote.js and are clearly labelled "example" on the page.
   ========================================================================== */

export const packages = [
  {
    id: 'signature',
    name: 'Signature Wash',
    level: 'Maintenance',
    blurb: 'For cars already in good shape that need a deep, safe clean.',
    time: 'About 3 hours',
    includes: [
      'Snow foam and two-bucket hand wash',
      'Wheels, tires and arches deep cleaned',
      'Iron and tar decontamination',
      'Interior vacuum and wipe-down',
      'Spray sealant, about 3 months',
    ],
  },
  {
    id: 'correction',
    name: 'Gloss Correction',
    level: 'Most booked',
    featured: true,
    blurb: 'One or two polishing stages for swirls, haze and dull paint.',
    time: 'About 1 day',
    includes: [
      'Everything in Signature Wash',
      'Clay bar and paint depth readings',
      '1 to 2 stage machine polish',
      'Removes most swirls and light scratches',
      'Paint sealant, about 12 months',
    ],
  },
  {
    id: 'ceramic',
    name: 'Ceramic Shield',
    level: 'Full protection',
    blurb: 'Full correction, then a hard ceramic coating that lasts for years.',
    time: '2 to 3 days',
    includes: [
      'Multi-stage paint correction',
      'Ceramic coating on all paint',
      'Wheel faces and glass coated',
      'Leather and trim protection',
      'Care guide and first upkeep wash',
    ],
  },
];

export const packageById = (id) => packages.find((p) => p.id === id);
