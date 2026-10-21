/* ==========================================================================
   BRAND CONFIG  ·  REBRAND FILE 1 of 3
   --------------------------------------------------------------------------
   Everything brand-specific that is NOT visual and NOT package/price data
   lives here: name, contact, media paths and feature flags.
   - Visual brand (colours, fonts, radii, spacing): assets/css/tokens.css
     (look for "REBRAND HERE").
   - Packages, quote prices and reviews: data/packages.js, data/quote.js,
     data/reviews.js. The packages grid, quote builder and booking form all
     read from those files, so they always agree.

   Values marked [DEMO] are fictional and must be replaced for a real client.
   No service area, city or address is shown anywhere on purpose.

   Loaded as an ES module:  import brand from './brand.config.js';
   ========================================================================== */

const brand = {
  /* ---- Identity [DEMO] ------------------------------------------------- */
  name: 'Mirrorline Detail Studio',
  shortName: 'Mirrorline',
  tagline: 'Mirror finish. Every panel.',
  footerBlurb: 'A paint correction and ceramic coating studio. Hand washed, machine polished and coated by appointment.',
  bookingRefPrefix: 'ML', // booking references look like ML-4821

  /* ---- Contact [DEMO] -------------------------------------------------- */
  contact: {
    phone: '(555) 014-2290',
    phoneHref: 'tel:+15550142290',
    email: 'hello@example.com',
    hours: 'Mon to Sat · 8 am to 6 pm',
  },

  /* ---- Media -------------------------------------------------------------
     Every visual on this demo is our own SVG/CSS render (no photos), so
     there is nothing unlicensed to swap. For a real client, these are the
     photos to shoot or license, and where each one goes:
       heroPhoto      hero, wide 3/4 shot of a finished black car under
                      studio light (3000 x 2000, plus a 1200 x 1800 crop)
       beforePhoto    before/after slider, swirled paint close-up
       afterPhoto     before/after slider, same panel after correction
                      (same angle and light as beforePhoto)
       stagePhotos    optional, one per stage: foam wash, polisher on
                      paint, coating applied/water beading, final reveal
     Leave a key as null to keep the SVG render.                          */
  media: {
    heroPhoto: null,
    beforePhoto: null,
    afterPhoto: null,
  },

  /* ---- Feature flags --------------------------------------------------- */
  features: {
    demoNotices: true,       // "Demo" / "Example" labels
    autoSweepSlider: true,   // before/after slider sweeps once on first view (good for filming)
  },
};

export default brand;
