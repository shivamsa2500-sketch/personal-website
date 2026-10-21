/* ==========================================================================
   BRAND CONFIG  ·  REBRAND FILE 1 of 3
   --------------------------------------------------------------------------
   Everything brand-specific that is NOT visual and NOT schedule data lives
   here: name, contact, media paths and feature flags.
   - Visual brand (colours, fonts, radii, spacing): assets/css/tokens.css
     (look for "REBRAND HERE").
   - Coaches, services, classes and availability: data/coaches.js and
     data/schedule.js. The schedule, coach profiles, free-trial picker and
     booking flow all read from those two files, so they always agree.

   Values marked [DEMO] are fictional and must be replaced for a real client.
   No service area, city or address is shown anywhere on purpose.

   Loaded as an ES module:  import brand from './brand.config.js';
   ========================================================================== */

const brand = {
  /* ---- Identity [DEMO] ------------------------------------------------- */
  name: 'Forgeline Coaching',
  shortName: 'Forgeline',
  tagline: 'Get strong. Stay strong.',
  footerBlurb: 'A small strength coaching studio. Four coaches, one plan that fits your week, and progress you can see on paper.',
  bookingRefPrefix: 'FL', // booking references look like FL-4821
  storagePrefix: 'fl-', // localStorage key prefix (demo bookings + free-trial lock)

  /* ---- Contact [DEMO] -------------------------------------------------- */
  contact: {
    email: 'hello@example.com',
    emailNote: 'Replies within one working day',
  },

  /* ---- Media -------------------------------------------------------------
     The published demo ships WITHOUT photos or video: media-placeholder/ is
     unlicensed reference media and is git-ignored, so it never goes live.
     With usePlaceholderMedia: false the site requests no media at all and
     shows its built-in brand graphics instead (hero art, quote-band art,
     initials portraits). Set it to true only for a local preview or filming
     with the placeholder files present. For a real client, put licensed files
     in assets/media/ and point the paths below at them.
     - heroVideo / heroPoster: vertical cut, used below 900 px wide (portrait)
     - heroVideoWide / heroPosterWide: wide cut with no baked-in captions,
       used at 900 px and up, or in landscape
     The hero script picks ONE source with matchMedia, so each device only
     downloads one video. Any missing key falls back to the brand graphic. */
  usePlaceholderMedia: false,
  placeholderMedia: {
    heroVideo: 'media-placeholder/hero.mp4',
    heroPoster: 'media-placeholder/hero-poster.jpg',
    heroVideoWide: 'media-placeholder/hero-desktop.mp4',
    heroPosterWide: 'media-placeholder/hero-desktop-poster.jpg',
    // Section photos (web copies made from gym-floor.jpg and bench-spot.jpg)
    gymFloor: 'media-placeholder/gym-floor-940.webp',
    gymFloorSmall: 'media-placeholder/gym-floor-600.webp',
    benchSpot: 'media-placeholder/bench-spot-900.webp',
    benchSpotSmall: 'media-placeholder/bench-spot-560.webp',
  },
  media: {
    wideQuery: '(min-width: 900px), (orientation: landscape)',
  },

  /* ---- Feature flags --------------------------------------------------- */
  features: {
    demoNotices: true, // "Demo" labels on bookings, samples and the footer
    oneTrialPerVisitor: true, // free-trial lock (localStorage, demo only)
    resetDemoLink: true, // small "Reset demo data" link, handy for filming
  },
};

if (brand.usePlaceholderMedia) Object.assign(brand.media, brand.placeholderMedia);

export default brand;
