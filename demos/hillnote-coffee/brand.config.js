/* ==========================================================================
   BRAND CONFIG  ·  REBRAND FILE 1 of 2
   --------------------------------------------------------------------------
   Everything brand-specific that is NOT visual lives here: name, money,
   shipping rules, contact details, socials, cafés and feature flags.
   Visual brand (colours, fonts, radii) lives in REBRAND FILE 2:
   site/assets/css/tokens.css (look for "REBRAND HERE").

   Rules for the build:
   - No page or script may hard-code the brand name, currency symbol,
     shipping threshold, contact details or café data. Read them from here.
   - Prices are whole numbers in the display currency (18 = $18).
   - Values marked [DEMO] are fictional and must be replaced for a real
     client. Values marked [CONFIRM] must be checked by the client.

   Loaded as an ES module:  import brand from '/brand.config.js';
   ========================================================================== */

const brand = {
  /* ---- Identity -------------------------------------------------------- */
  name: 'Hillnote Coffee Roasters',
  shortName: 'Hillnote',
  tagline: 'Coffee from the hills, roasted this week.',
  footerBlurb:
    'Small-batch specialty coffee from Indian hills and a few favourite farms abroad. Roasted every week, ground for your brewer.',
  logoSvg: 'assets/img/logo.svg', // wordmark (Graphics Designer owns the file)
  markSvg: 'assets/img/mark.svg', // square mark, also used as the favicon
  orderPrefix: 'HN', // order numbers look like HN-123456
  productIdPrefix: 'hn-', // ids in data/products.js
  storagePrefix: 'hn-', // localStorage / sessionStorage key prefix
  demoStore: true, // shows "Demo store" notices, disables checkout payment

  /* ---- Money ----------------------------------------------------------- */
  currency: { code: 'USD', symbol: '$', locale: 'en-US' },
  taxesIncluded: true,

  /* ---- Shipping (SITEMAP §6 #4) --------------------------------------- */
  freeShippingThreshold: 50, // standard shipping is free at or above this subtotal
  shippingFlat: 6, // standard shipping below the threshold
  shippingExpress: 12, // express, any order size
  shipping: {
    standardDays: '3–5 working days',
    expressDays: '1–2 working days',
    dispatchHours: 48,
  },
  shipCountry: 'India',

  /* ---- Roasting + time ------------------------------------------------- */
  roastDay: 1, // weekly roast weekday, 0 = Sunday … 6 = Saturday (1 = Monday). PDP roast slip, freshness dial, footer note.
  timeZone: 'Asia/Kolkata', // IANA zone for café hours ("Open now"); a café may override with its own timeZone.
  // Checkout state / UT list. [CONFIRM: serviceable areas]
  regions: [
    'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
    'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa',
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka',
    'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
    'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim',
    'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  ],
  returnsWindowDays: 7, // [CONFIRM]

  /* ---- Cart rules ------------------------------------------------------ */
  cart: {
    maxQtyPerLine: 10,
    undoMs: 5000, // Remove → Undo toast lifetime (pauses on hover/focus in the UI)
  },

  /* ---- Announcement bar ------------------------------------------------ */
  // {threshold} is replaced with the formatted freeShippingThreshold.
  announcement: 'Free shipping over {threshold} · Roasted every week, shipped within {dispatchHours} hours',
  // One-line version for phones (< 480 px), same tokens.
  announcementShort: 'Free shipping over {threshold} · Roasted weekly',

  /* ---- Contact [DEMO] [CONFIRM: real details at rebrand] --------------- */
  contact: {
    email: 'hello@example.com',
    emailNote: 'Replies within 1 working day',
    phone: '+91 00000 00000',
    phoneHref: 'tel:+910000000000',
    whatsapp: 'https://wa.me/910000000000',
    hours: 'Mon–Sat, 9:00–18:00 IST',
    hoursNote: 'Closed on Sundays and public holidays',
  },

  /* ---- Social [CONFIRM: real handles] ---------------------------------- */
  // icon = id of a symbol in the icon sprite (Graphics Designer).
  social: [
    { label: 'Instagram', url: 'https://instagram.com/', icon: 'instagram' },
    { label: 'YouTube', url: 'https://youtube.com/', icon: 'youtube' },
    { label: 'WhatsApp', url: 'https://wa.me/910000000000', icon: 'whatsapp' },
  ],

  /* ---- Cafés [DEMO] (COPY.md §10.4) ------------------------------------
     Kept here (not in data/) because café locations are brand facts that
     change on rebrand. hours: open/close "HH:MM" 24h; open:null = Closed.
     days use Mon Tue Wed Thu Fri Sat Sun, single or ranges with "–".
     mapX/mapY = % position on the illustrative India map SVG.            */
  cafes: [
    {
      id: 'blr-indiranagar',
      name: 'Hillnote Indiranagar',
      city: 'Bengaluru',
      address: '22, 4th Cross Road, Indiranagar, Bengaluru 560038',
      lat: 12.9719, lng: 77.6412,
      mapX: 41, mapY: 82,
      phone: '+91 80 0000 0101',
      hours: [
        { days: 'Mon–Fri', open: '07:30', close: '21:00' },
        { days: 'Sat–Sun', open: '08:00', close: '22:00' },
      ],
      amenities: ['Wi-Fi', 'Brew bar', 'Beans to buy', 'Outdoor seating'],
      blurb: 'Our first café. A long brew bar, a reading corner, and the full menu of beans.',
    },
    {
      id: 'blr-roastery',
      name: 'Hillnote Roastery Café',
      city: 'Bengaluru',
      address: 'Unit 9, Old Mill Road, Whitefield, Bengaluru 560066',
      lat: 12.9698, lng: 77.75,
      mapX: 43, mapY: 83,
      phone: '+91 80 0000 0102',
      hours: [
        { days: 'Tue–Sun', open: '09:00', close: '18:00' },
        { days: 'Mon', open: null, close: null },
      ],
      amenities: ['Roastery view', 'Brew bar', 'Beans to buy', 'Saturday cuppings'],
      blurb: 'Watch the roaster through the glass. Free public cupping every Saturday at 11:00.',
    },
    {
      id: 'bom-bandra',
      name: 'Hillnote Bandra',
      city: 'Mumbai',
      address: 'Shop 3, Hill View Building, Station Road, Bandra West, Mumbai 400050',
      lat: 19.0544, lng: 72.8406,
      mapX: 22, mapY: 57,
      phone: '+91 22 0000 0103',
      hours: [{ days: 'Mon–Sun', open: '08:00', close: '22:30' }],
      amenities: ['Wi-Fi', 'Brew bar', 'Beans to buy'],
      blurb: 'A narrow, bright café a short walk from the station. Cold brew on tap all year.',
    },
    {
      id: 'del-lajpat',
      name: 'Hillnote Lajpat Nagar',
      city: 'New Delhi',
      address: '7, Central Market Road, Lajpat Nagar II, New Delhi 110024',
      lat: 28.5677, lng: 77.2433,
      mapX: 38, mapY: 24,
      phone: '+91 11 0000 0104',
      hours: [
        { days: 'Mon–Fri', open: '08:00', close: '21:00' },
        { days: 'Sat–Sun', open: '09:00', close: '22:00' },
      ],
      amenities: ['Wi-Fi', 'Brew bar', 'Beans to buy', 'Step-free access'],
      blurb: 'Two floors above the market. The upstairs table is the best seat for a slow pour-over.',
    },
    {
      id: 'pnq-koregaon',
      name: 'Hillnote Koregaon Park',
      city: 'Pune',
      address: '11, Lane 5, Koregaon Park, Pune 411001',
      lat: 18.5362, lng: 73.894,
      mapX: 25, mapY: 61,
      phone: '+91 20 0000 0105',
      hours: [
        { days: 'Mon–Fri', open: '07:30', close: '20:30' },
        { days: 'Sat–Sun', open: '08:00', close: '21:30' },
      ],
      amenities: ['Wi-Fi', 'Brew bar', 'Beans to buy', 'Garden seating'],
      blurb: 'A garden café under a rain tree. Bring a laptop on weekdays, a friend on weekends.',
    },
  ],

  /* ---- Home merchandising --------------------------------------------- */
  bestsellers: ['cloudline-washed', 'shade-line', 'westwind-monsooned', 'night-shift-espresso'],
  // Home hero: the three fanned bags (left, middle, right). The middle bag's
  // contours draw the hero panel's glass zone. Falls back to the top 3 featured.
  heroBags: ['cloudline-washed', 'paper-lantern-natural', 'westwind-monsooned'],

  /* ---- Feature flags --------------------------------------------------- */
  features: {
    cart: {
      // CLIENT TIE-BREAK 2026-10-16: first add of a session opens the drawer,
      // later adds show the status island. false = island on every add.
      openDrawerOnFirstAdd: true,
      nudge: true, // "Add this for free shipping" suggestion in the drawer
    },
    announcementBar: true,
    reduceTransparencySwitch: true, // mobile menu + desktop footer switch
    demoReviews: true, // shows [DEMO] ratings with a "Demo reviews" label
    brewTimer: true, // guide step timer (progressive enhancement)
  },
};

export default brand;
