/* Product catalogue: 12 coffees + 3 accessories + shared lookups.
   Source of truth: COPY.md §13.3 (coffees), §13.4 (accessories), §13.5 (lookups).
   Generated verbatim from COPY.md; edit here for a rebrand's catalogue.

   - Prices are whole numbers in the display currency (brand.currency).
   - sizes[0] is the default size. Accessories have one size "One size" and no grind.
   - rating values are [DEMO] (demo: true).
   - image.photo null → render the shared SVG bag template filled with bagColor.
   - Accessories: shortName + pack are the compact title / meta used in the
     free-shipping nudge; forGrinds (optional) limits the nudge to carts with a
     coffee ground for one of those brewers (no forGrinds = suits anyone).
   - The cart stores { slug, size, grind, qty } only; prices are always
     re-read from here (store.js). */

export { BREW_METHODS, GRIND_OPTIONS, getBrewMethod, getGrind, grindLabel } from './brew-methods.js';

export const PRODUCTS = [
  {
    "id": "hn-001",
    "slug": "cloudline-washed",
    "name": "Cloudline",
    "type": "single-origin",
    "tagline": "Orange zest and jaggery, bright but never sharp.",
    "description": "Grown under jackfruit and rosewood shade on a slope that sits in cloud most mornings. Washed and dried slowly on raised beds, it tastes like orange zest stirred into jaggery, with a cocoa-nib finish that keeps it round. Our easiest way into light roasts.",
    "sizes": [
      {
        "label": "250 g",
        "grams": 250,
        "price": 17
      },
      {
        "label": "500 g",
        "grams": 500,
        "price": 32
      },
      {
        "label": "1 kg",
        "grams": 1000,
        "price": 60
      }
    ],
    "compareAtPrice": null,
    "roastLevel": "light",
    "notes": [
      "Orange zest",
      "Jaggery",
      "Cocoa nib"
    ],
    "noteFamilies": [
      "fruity",
      "caramel"
    ],
    "profile": {
      "acidity": 4,
      "body": 2,
      "sweetness": 4,
      "bitterness": 1
    },
    "drinkWith": "black",
    "process": "washed",
    "origin": {
      "farm": "Mistgate Estate",
      "region": "Chikmagalur, Karnataka",
      "country": "India",
      "altitudeM": [
        1250,
        1450
      ],
      "varietal": [
        "SLN 795",
        "Chandragiri"
      ],
      "harvest": "2025–26",
      "mapPin": {
        "x": 34,
        "y": 52,
        "lat": 13.32,
        "lng": 75.77
      }
    },
    "brewMethods": [
      "pour-over",
      "aeropress",
      "french-press",
      "cold-brew"
    ],
    "badges": [
      "bestseller"
    ],
    "restDays": 7,
    "image": {
      "bagColor": "#D9822B",
      "photo": null,
      "alt": "Cloudline coffee bag with an amber label"
    },
    "gallery": [],
    "rating": {
      "value": 4.7,
      "count": 318,
      "demo": true
    },
    "inStock": true,
    "featured": 1,
    "addedOn": "2026-03-02"
  },
  {
    "id": "hn-002",
    "slug": "paper-lantern-natural",
    "name": "Paper Lantern",
    "type": "single-origin",
    "tagline": "Blueberry and red grape, like a fruit bowl.",
    "description": "Whole cherries dry on raised beds for about three weeks, and the fruit's sugars soak into the seed. Expect blueberry and red grape up front and a cacao finish that keeps it from tasting like juice. Lovely through a pour-over, wild as cold brew.",
    "sizes": [
      {
        "label": "250 g",
        "grams": 250,
        "price": 20
      },
      {
        "label": "500 g",
        "grams": 500,
        "price": 37
      },
      {
        "label": "1 kg",
        "grams": 1000,
        "price": 69
      }
    ],
    "compareAtPrice": null,
    "roastLevel": "light",
    "notes": [
      "Blueberry",
      "Red grape",
      "Cacao"
    ],
    "noteFamilies": [
      "fruity",
      "chocolatey"
    ],
    "profile": {
      "acidity": 3,
      "body": 3,
      "sweetness": 5,
      "bitterness": 1
    },
    "drinkWith": "black",
    "process": "natural",
    "origin": {
      "farm": "Sandalgrove Estate",
      "region": "Biligiri Hills, Karnataka",
      "country": "India",
      "altitudeM": [
        1300,
        1500
      ],
      "varietal": [
        "Selection 9",
        "Catuai"
      ],
      "harvest": "2025–26",
      "mapPin": {
        "x": 44,
        "y": 68,
        "lat": 11.99,
        "lng": 77.14
      }
    },
    "brewMethods": [
      "pour-over",
      "aeropress",
      "cold-brew",
      "french-press"
    ],
    "badges": [
      "new",
      "staff-pick"
    ],
    "restDays": 10,
    "image": {
      "bagColor": "#6E3A6B",
      "photo": null,
      "alt": "Paper Lantern coffee bag with a plum label"
    },
    "gallery": [],
    "rating": {
      "value": 4.8,
      "count": 96,
      "demo": true
    },
    "inStock": true,
    "featured": 5,
    "addedOn": "2026-09-20"
  },
  {
    "id": "hn-003",
    "slug": "slow-honey-coorg",
    "name": "Slow Honey",
    "type": "single-origin",
    "tagline": "Apricot and honeycomb with a black-tea finish.",
    "description": "The cherry skin comes off, but some of the sticky fruit stays on while the beans dry, which is what 'honey process' means. The result is syrupy and gentle: ripe apricot, honeycomb, and a clean black-tea finish. Good black, still good with a splash of milk.",
    "sizes": [
      {
        "label": "250 g",
        "grams": 250,
        "price": 19
      },
      {
        "label": "500 g",
        "grams": 500,
        "price": 35
      },
      {
        "label": "1 kg",
        "grams": 1000,
        "price": 65
      }
    ],
    "compareAtPrice": null,
    "roastLevel": "medium",
    "notes": [
      "Apricot",
      "Honeycomb",
      "Black tea"
    ],
    "noteFamilies": [
      "fruity",
      "caramel"
    ],
    "profile": {
      "acidity": 3,
      "body": 3,
      "sweetness": 4,
      "bitterness": 2
    },
    "drinkWith": "black",
    "process": "honey",
    "origin": {
      "farm": "Seven Wells Estate",
      "region": "Kodagu (Coorg), Karnataka",
      "country": "India",
      "altitudeM": [
        1100,
        1300
      ],
      "varietal": [
        "SLN 795",
        "Kent"
      ],
      "harvest": "2025–26",
      "mapPin": {
        "x": 32,
        "y": 64,
        "lat": 12.42,
        "lng": 75.74
      }
    },
    "brewMethods": [
      "pour-over",
      "aeropress",
      "french-press"
    ],
    "badges": [],
    "restDays": 7,
    "image": {
      "bagColor": "#E0A43A",
      "photo": null,
      "alt": "Slow Honey coffee bag with a honey-gold label"
    },
    "gallery": [],
    "rating": {
      "value": 4.6,
      "count": 141,
      "demo": true
    },
    "inStock": true,
    "featured": 9,
    "addedOn": "2026-06-10"
  },
  {
    "id": "hn-004",
    "slug": "lab-batch-07-anaerobic",
    "name": "Lab Batch 07",
    "type": "single-origin",
    "tagline": "Strawberry jam and hibiscus. A small, strange lot.",
    "description": "Whole cherries are sealed in tanks without oxygen for 72 hours before they dry, which slows fermentation and builds intense fruit. It drinks like strawberry jam with hibiscus and a rose-petal finish. Only a few hundred kilos exist, so it's here until it's gone.",
    "sizes": [
      {
        "label": "250 g",
        "grams": 250,
        "price": 26
      },
      {
        "label": "500 g",
        "grams": 500,
        "price": 49
      }
    ],
    "compareAtPrice": null,
    "roastLevel": "light",
    "notes": [
      "Strawberry jam",
      "Hibiscus",
      "Rose"
    ],
    "noteFamilies": [
      "fruity",
      "floral"
    ],
    "profile": {
      "acidity": 4,
      "body": 2,
      "sweetness": 4,
      "bitterness": 1
    },
    "drinkWith": "black",
    "process": "experimental",
    "origin": {
      "farm": "Pinegrove smallholder group",
      "region": "Araku Valley, Andhra Pradesh",
      "country": "India",
      "altitudeM": [
        950,
        1150
      ],
      "varietal": [
        "SLN 795",
        "Chandragiri"
      ],
      "harvest": "2025–26",
      "mapPin": {
        "x": 78,
        "y": 18,
        "lat": 18.33,
        "lng": 82.87
      }
    },
    "brewMethods": [
      "pour-over",
      "aeropress",
      "cold-brew"
    ],
    "badges": [
      "limited",
      "new"
    ],
    "restDays": 14,
    "image": {
      "bagColor": "#C2185B",
      "photo": null,
      "alt": "Lab Batch 07 coffee bag with a raspberry-pink label"
    },
    "gallery": [],
    "rating": {
      "value": 4.9,
      "count": 38,
      "demo": true
    },
    "inStock": true,
    "featured": 11,
    "addedOn": "2026-10-01"
  },
  {
    "id": "hn-005",
    "slug": "highland-bloom-ethiopia",
    "name": "Highland Bloom",
    "type": "single-origin",
    "tagline": "Jasmine, lemon and bergamot. Tea-like and floral.",
    "description": "Grown above 1,950 metres by smallholders who bring their cherries to a single washing station. Washed and sun-dried, it's delicate and tea-like, with jasmine on the nose, lemon in the middle and bergamot at the end. Brew it as pour-over and let it cool a little.",
    "sizes": [
      {
        "label": "250 g",
        "grams": 250,
        "price": 25
      },
      {
        "label": "500 g",
        "grams": 500,
        "price": 46
      },
      {
        "label": "1 kg",
        "grams": 1000,
        "price": 86
      }
    ],
    "compareAtPrice": null,
    "roastLevel": "light",
    "notes": [
      "Jasmine",
      "Lemon",
      "Bergamot"
    ],
    "noteFamilies": [
      "floral",
      "fruity"
    ],
    "profile": {
      "acidity": 5,
      "body": 2,
      "sweetness": 3,
      "bitterness": 1
    },
    "drinkWith": "black",
    "process": "washed",
    "origin": {
      "farm": "Ilili Hill washing station",
      "region": "Guji, Oromia",
      "country": "Ethiopia",
      "altitudeM": [
        1950,
        2200
      ],
      "varietal": [
        "Ethiopian landrace varieties"
      ],
      "harvest": "2025–26",
      "mapPin": null
    },
    "brewMethods": [
      "pour-over",
      "aeropress",
      "cold-brew"
    ],
    "badges": [
      "staff-pick"
    ],
    "restDays": 10,
    "image": {
      "bagColor": "#E8C547",
      "photo": null,
      "alt": "Highland Bloom coffee bag with a lemon-yellow label"
    },
    "gallery": [],
    "rating": {
      "value": 4.8,
      "count": 74,
      "demo": true
    },
    "inStock": true,
    "featured": 6,
    "addedOn": "2026-07-15"
  },
  {
    "id": "hn-006",
    "slug": "copper-bend-colombia",
    "name": "Copper Bend",
    "type": "single-origin",
    "tagline": "Red apple, panela and milk chocolate.",
    "description": "A family farm on a steep bend of the Andes, picking only ripe red cherries over several passes each harvest. It's the kind of coffee that pleases everyone: crisp red apple, panela sweetness and a milk-chocolate finish. Equally happy as pour-over or a medium-bodied espresso.",
    "sizes": [
      {
        "label": "250 g",
        "grams": 250,
        "price": 22
      },
      {
        "label": "500 g",
        "grams": 500,
        "price": 40
      },
      {
        "label": "1 kg",
        "grams": 1000,
        "price": 75
      }
    ],
    "compareAtPrice": null,
    "roastLevel": "medium",
    "notes": [
      "Red apple",
      "Panela",
      "Milk chocolate"
    ],
    "noteFamilies": [
      "fruity",
      "caramel",
      "chocolatey"
    ],
    "profile": {
      "acidity": 3,
      "body": 3,
      "sweetness": 4,
      "bitterness": 2
    },
    "drinkWith": "black",
    "process": "washed",
    "origin": {
      "farm": "Finca Alto del Cedro",
      "region": "Huila",
      "country": "Colombia",
      "altitudeM": [
        1600,
        1850
      ],
      "varietal": [
        "Caturra",
        "Castillo"
      ],
      "harvest": "2025 main crop",
      "mapPin": null
    },
    "brewMethods": [
      "pour-over",
      "aeropress",
      "espresso",
      "french-press"
    ],
    "badges": [],
    "restDays": 7,
    "image": {
      "bagColor": "#B5651D",
      "photo": null,
      "alt": "Copper Bend coffee bag with a copper label"
    },
    "gallery": [],
    "rating": {
      "value": 4.6,
      "count": 122,
      "demo": true
    },
    "inStock": true,
    "featured": 8,
    "addedOn": "2026-05-05"
  },
  {
    "id": "hn-007",
    "slug": "shade-line",
    "name": "Shade Line",
    "type": "single-origin",
    "tagline": "Dark chocolate and almond. Great black or with milk.",
    "description": "From an old estate where pepper vines climb the shade trees between coffee rows. Roasted a little darker to bring out dark chocolate, toasted almond and brown sugar, with almost no sourness. The coffee we hand to anyone who says they 'just want good coffee'.",
    "sizes": [
      {
        "label": "250 g",
        "grams": 250,
        "price": 16
      },
      {
        "label": "500 g",
        "grams": 500,
        "price": 29
      },
      {
        "label": "1 kg",
        "grams": 1000,
        "price": 54
      }
    ],
    "compareAtPrice": null,
    "roastLevel": "medium-dark",
    "notes": [
      "Dark chocolate",
      "Toasted almond",
      "Brown sugar"
    ],
    "noteFamilies": [
      "chocolatey",
      "caramel"
    ],
    "profile": {
      "acidity": 2,
      "body": 4,
      "sweetness": 3,
      "bitterness": 3
    },
    "drinkWith": "both",
    "process": "washed",
    "origin": {
      "farm": "Old Pepper Estate",
      "region": "Bababudangiri, Karnataka",
      "country": "India",
      "altitudeM": [
        1150,
        1350
      ],
      "varietal": [
        "SLN 795",
        "Kent"
      ],
      "harvest": "2025–26",
      "mapPin": {
        "x": 36,
        "y": 49,
        "lat": 13.42,
        "lng": 75.73
      }
    },
    "brewMethods": [
      "french-press",
      "moka-pot",
      "south-indian-filter",
      "aeropress",
      "espresso"
    ],
    "badges": [
      "bestseller"
    ],
    "restDays": 5,
    "image": {
      "bagColor": "#5B4636",
      "photo": null,
      "alt": "Shade Line coffee bag with a dark cocoa-brown label"
    },
    "gallery": [],
    "rating": {
      "value": 4.8,
      "count": 412,
      "demo": true
    },
    "inStock": true,
    "featured": 2,
    "addedOn": "2026-01-12"
  },
  {
    "id": "hn-008",
    "slug": "pepper-vine-shevaroy",
    "name": "Pepper Vine",
    "type": "single-origin",
    "tagline": "Black pepper, clove and dark cocoa. Warming.",
    "description": "A honey-processed lot from the Shevaroy Hills, roasted medium-dark until the spice comes forward. Black pepper and clove on the first sip, dark cocoa underneath, and a long, warming finish. Superb in a moka pot or as South Indian filter coffee with hot milk.",
    "sizes": [
      {
        "label": "250 g",
        "grams": 250,
        "price": 16
      },
      {
        "label": "500 g",
        "grams": 500,
        "price": 30
      },
      {
        "label": "1 kg",
        "grams": 1000,
        "price": 57
      }
    ],
    "compareAtPrice": null,
    "roastLevel": "medium-dark",
    "notes": [
      "Black pepper",
      "Clove",
      "Dark cocoa"
    ],
    "noteFamilies": [
      "spiced",
      "chocolatey"
    ],
    "profile": {
      "acidity": 2,
      "body": 4,
      "sweetness": 3,
      "bitterness": 3
    },
    "drinkWith": "both",
    "process": "honey",
    "origin": {
      "farm": "Greyfern Estate",
      "region": "Shevaroy Hills, Tamil Nadu",
      "country": "India",
      "altitudeM": [
        1200,
        1450
      ],
      "varietal": [
        "Cauvery",
        "SLN 795"
      ],
      "harvest": "2025–26",
      "mapPin": {
        "x": 56,
        "y": 72,
        "lat": 11.8,
        "lng": 78.22
      }
    },
    "brewMethods": [
      "french-press",
      "moka-pot",
      "south-indian-filter",
      "aeropress"
    ],
    "badges": [],
    "restDays": 6,
    "image": {
      "bagColor": "#3E6B48",
      "photo": null,
      "alt": "Pepper Vine coffee bag with a forest-green label"
    },
    "gallery": [],
    "rating": {
      "value": 4.5,
      "count": 87,
      "demo": true
    },
    "inStock": true,
    "featured": 10,
    "addedOn": "2026-04-12"
  },
  {
    "id": "hn-009",
    "slug": "toffee-road-brazil",
    "name": "Toffee Road",
    "type": "single-origin",
    "tagline": "Toffee and hazelnut. Smooth, sweet, low in acid.",
    "description": "Grown on the flat, sunny plateaus of Brazil's Cerrado and dried in the cherry on open patios. It's soft and sweet: toffee, hazelnut and cocoa powder, with very little acidity. A dependable everyday cup that makes a creamy espresso and a mellow cold brew.",
    "sizes": [
      {
        "label": "250 g",
        "grams": 250,
        "price": 18
      },
      {
        "label": "500 g",
        "grams": 500,
        "price": 33
      },
      {
        "label": "1 kg",
        "grams": 1000,
        "price": 62
      }
    ],
    "compareAtPrice": 19,
    "roastLevel": "medium-dark",
    "notes": [
      "Toffee",
      "Hazelnut",
      "Cocoa powder"
    ],
    "noteFamilies": [
      "caramel",
      "chocolatey"
    ],
    "profile": {
      "acidity": 1,
      "body": 4,
      "sweetness": 4,
      "bitterness": 2
    },
    "drinkWith": "both",
    "process": "natural",
    "origin": {
      "farm": "Fazenda Pedra Alta",
      "region": "Cerrado Mineiro, Minas Gerais",
      "country": "Brazil",
      "altitudeM": [
        950,
        1150
      ],
      "varietal": [
        "Yellow Bourbon",
        "Mundo Novo"
      ],
      "harvest": "2025",
      "mapPin": null
    },
    "brewMethods": [
      "espresso",
      "moka-pot",
      "french-press",
      "south-indian-filter",
      "cold-brew"
    ],
    "badges": [],
    "restDays": 6,
    "image": {
      "bagColor": "#A86B3C",
      "photo": null,
      "alt": "Toffee Road coffee bag with a toffee-brown label"
    },
    "gallery": [],
    "rating": {
      "value": 4.6,
      "count": 159,
      "demo": true
    },
    "inStock": true,
    "featured": 12,
    "addedOn": "2026-02-20"
  },
  {
    "id": "hn-010",
    "slug": "westwind-monsooned",
    "name": "Westwind Monsooned",
    "type": "single-origin",
    "tagline": "Cedar and molasses. Heavy, earthy, almost no acid.",
    "description": "After harvest, the beans spend the monsoon in open-sided warehouses on the coast, swelling in the damp sea wind. That old Malabar tradition strips away acidity and leaves a heavy, earthy cup of cedar, dark molasses and nutmeg. Built for milk, moka pots and strong filter coffee.",
    "sizes": [
      {
        "label": "250 g",
        "grams": 250,
        "price": 15
      },
      {
        "label": "500 g",
        "grams": 500,
        "price": 28
      },
      {
        "label": "1 kg",
        "grams": 1000,
        "price": 52
      }
    ],
    "compareAtPrice": null,
    "roastLevel": "dark",
    "notes": [
      "Cedar",
      "Dark molasses",
      "Nutmeg"
    ],
    "noteFamilies": [
      "spiced",
      "bold"
    ],
    "profile": {
      "acidity": 1,
      "body": 5,
      "sweetness": 2,
      "bitterness": 4
    },
    "drinkWith": "milk",
    "process": "monsooned",
    "origin": {
      "farm": "Multi-estate, monsooned on the coast",
      "region": "Malabar Coast, Karnataka",
      "country": "India",
      "altitudeM": [
        1000,
        1300
      ],
      "varietal": [
        "Kent",
        "SLN 795"
      ],
      "harvest": "2025–26",
      "mapPin": {
        "x": 24,
        "y": 56,
        "lat": 12.9,
        "lng": 74.95
      }
    },
    "brewMethods": [
      "espresso",
      "moka-pot",
      "south-indian-filter",
      "french-press",
      "cold-brew"
    ],
    "badges": [
      "bestseller"
    ],
    "restDays": 4,
    "image": {
      "bagColor": "#2F5D62",
      "photo": null,
      "alt": "Westwind Monsooned coffee bag with a deep teal label"
    },
    "gallery": [],
    "rating": {
      "value": 4.7,
      "count": 266,
      "demo": true
    },
    "inStock": true,
    "featured": 3,
    "addedOn": "2025-11-18"
  },
  {
    "id": "hn-011",
    "slug": "night-shift-espresso",
    "name": "Night Shift",
    "type": "blend",
    "tagline": "Our espresso blend. Cocoa and molasses, built for milk.",
    "description": "Washed Chikmagalur arabica for sweetness, natural Brazil for body, and a little washed Indian robusta for crema and punch. Pulled as espresso it's bittersweet cocoa and molasses; in a flat white it reads like a hazelnut chocolate bar. Also excellent in a moka pot.",
    "sizes": [
      {
        "label": "250 g",
        "grams": 250,
        "price": 14
      },
      {
        "label": "500 g",
        "grams": 500,
        "price": 27
      },
      {
        "label": "1 kg",
        "grams": 1000,
        "price": 50
      }
    ],
    "compareAtPrice": null,
    "roastLevel": "dark",
    "notes": [
      "Bittersweet cocoa",
      "Molasses",
      "Roasted hazelnut"
    ],
    "noteFamilies": [
      "bold",
      "chocolatey"
    ],
    "profile": {
      "acidity": 1,
      "body": 5,
      "sweetness": 2,
      "bitterness": 4
    },
    "drinkWith": "milk",
    "process": "washed",
    "origin": {
      "farm": "Multi-estate blend",
      "region": "Chikmagalur, Karnataka + Cerrado Mineiro, Brazil",
      "country": "India, Brazil",
      "altitudeM": [
        800,
        1350
      ],
      "varietal": [
        "SLN 795",
        "Yellow Bourbon",
        "Robusta (CxR)"
      ],
      "harvest": "2025–26",
      "mapPin": {
        "x": 34,
        "y": 52,
        "lat": 13.32,
        "lng": 75.77
      }
    },
    "brewMethods": [
      "espresso",
      "moka-pot",
      "aeropress"
    ],
    "badges": [
      "bestseller"
    ],
    "restDays": 7,
    "image": {
      "bagColor": "#1F2A44",
      "photo": null,
      "alt": "Night Shift coffee bag with a midnight-blue label"
    },
    "gallery": [],
    "rating": {
      "value": 4.7,
      "count": 389,
      "demo": true
    },
    "inStock": true,
    "featured": 4,
    "addedOn": "2025-10-05"
  },
  {
    "id": "hn-012",
    "slug": "filter-house-blend",
    "name": "Filter House",
    "type": "blend",
    "tagline": "For South Indian filter coffee. Jaggery and malt.",
    "description": "A blend of two Karnataka estates, roasted for the slow drip of a steel filter and a generous pour of hot milk. Jaggery, malted biscuit and cocoa, with enough body to stand up to sugar. It's 100% coffee with no chicory, so add your own if you like it the old way.",
    "sizes": [
      {
        "label": "250 g",
        "grams": 250,
        "price": 12
      },
      {
        "label": "500 g",
        "grams": 500,
        "price": 23
      },
      {
        "label": "1 kg",
        "grams": 1000,
        "price": 43
      }
    ],
    "compareAtPrice": null,
    "roastLevel": "medium-dark",
    "notes": [
      "Jaggery",
      "Malted biscuit",
      "Cocoa"
    ],
    "noteFamilies": [
      "caramel",
      "chocolatey"
    ],
    "profile": {
      "acidity": 1,
      "body": 4,
      "sweetness": 4,
      "bitterness": 3
    },
    "drinkWith": "milk",
    "process": "washed",
    "origin": {
      "farm": "Multi-estate blend",
      "region": "Chikmagalur and Kodagu, Karnataka",
      "country": "India",
      "altitudeM": [
        1000,
        1400
      ],
      "varietal": [
        "SLN 795",
        "Robusta (CxR)"
      ],
      "harvest": "2025–26",
      "mapPin": {
        "x": 33,
        "y": 58,
        "lat": 12.87,
        "lng": 75.75
      }
    },
    "brewMethods": [
      "south-indian-filter",
      "moka-pot",
      "french-press"
    ],
    "badges": [
      "staff-pick"
    ],
    "restDays": 4,
    "image": {
      "bagColor": "#8C2F1B",
      "photo": null,
      "alt": "Filter House coffee bag with a brick-red label"
    },
    "gallery": [],
    "rating": {
      "value": 4.6,
      "count": 204,
      "demo": true
    },
    "inStock": true,
    "featured": 7,
    "addedOn": "2026-08-08"
  }
];

export const ACCESSORIES = [
  {
    "id": "hn-acc-01",
    "slug": "cone-dripper-02",
    "name": "Ceramic cone dripper, size 02",
    "shortName": "Cone dripper 02",
    "pack": "Ceramic",
    "forGrinds": ["pour-over"],
    "type": "accessory",
    "tagline": "The dripper from our pour-over guide. Brews 1–2 cups.",
    "description": "A glazed ceramic cone with spiral ribs and a single wide hole, so the speed of the brew comes from your grind and pour. Fits size 02 paper filters and sits on most mugs and servers. Warm it with hot water before brewing.",
    "sizes": [
      {
        "label": "One size",
        "grams": null,
        "price": 40
      }
    ],
    "compareAtPrice": null,
    "badges": [],
    "image": {
      "accentColor": "#EDE3D1",
      "photo": null,
      "alt": "Cream ceramic cone dripper with spiral ribs inside"
    },
    "inStock": true,
    "addedOn": "2026-01-10"
  },
  {
    "id": "hn-acc-02",
    "slug": "paper-filters-02-100",
    "name": "Paper filters, size 02 (100 pack)",
    "shortName": "Paper filters 02",
    "pack": "100 pack",
    "forGrinds": ["pour-over"],
    "type": "accessory",
    "tagline": "Unbleached cone filters. A hundred mornings' worth.",
    "description": "Unbleached paper cone filters sized for 02 drippers. Rinse each one with hot water before brewing to wash out the paper taste. Compostable.",
    "sizes": [
      {
        "label": "One size",
        "grams": null,
        "price": 7
      }
    ],
    "compareAtPrice": null,
    "badges": [],
    "image": {
      "accentColor": "#C9B48F",
      "photo": null,
      "alt": "Stack of unbleached paper cone filters"
    },
    "inStock": true,
    "addedOn": "2026-01-10"
  },
  {
    "id": "hn-acc-03",
    "slug": "field-mug-300",
    "name": "Field mug, 300 ml",
    "shortName": "Field mug",
    "pack": "300 ml",
    "type": "accessory",
    "tagline": "A heavy stoneware mug that keeps coffee warm longer.",
    "description": "Thick-walled stoneware with a speckled oat glaze and a wide handle you can fit three fingers through. Holds a full pour-over or a generous filter coffee. Dishwasher and microwave safe.",
    "sizes": [
      {
        "label": "One size",
        "grams": null,
        "price": 19
      }
    ],
    "compareAtPrice": null,
    "badges": [
      "new"
    ],
    "image": {
      "accentColor": "#24493D",
      "photo": null,
      "alt": "Speckled stoneware mug in pine green with a wide handle"
    },
    "inStock": true,
    "addedOn": "2026-09-01"
  }
];

export const ROAST_LEVELS = [
  { id: 'light', label: 'Light', description: 'Bright and fruity, best black' },
  { id: 'medium', label: 'Medium', description: 'Balanced and sweet' },
  { id: 'medium-dark', label: 'Medium-dark', description: 'Chocolatey, good with or without milk' },
  { id: 'dark', label: 'Dark', description: 'Bold and heavy, made for milk' },
];

export const PROCESSES = [
  { id: 'washed', label: 'Washed', description: 'Fruit removed before drying. Clean and crisp.' },
  { id: 'natural', label: 'Natural', description: 'Dried inside the fruit. Jammy and sweet.' },
  { id: 'honey', label: 'Honey', description: 'Some fruit left on while drying. Rounded and syrupy.' },
  { id: 'monsooned', label: 'Monsooned', description: 'Aged in coastal monsoon winds. Low acid, earthy.' },
  { id: 'experimental', label: 'Experimental', description: 'Controlled fermentations. Wild and expressive.' },
];

export const NOTE_FAMILIES = [
  { id: 'fruity', label: 'Fruity & bright' },
  { id: 'floral', label: 'Floral' },
  { id: 'chocolatey', label: 'Chocolatey & nutty' },
  { id: 'caramel', label: 'Caramel & sweet' },
  { id: 'spiced', label: 'Spiced' },
  { id: 'bold', label: 'Bold & strong' },
];

/* Price buckets on the 250 g (default size) price. Labels are built at render
   time with format.js so the currency symbol comes from brand.config.js:
   use priceBucketLabel(bucket) from format.js. */
export const PRICE_BUCKETS = [
  { id: 'under-15', max: 14 },
  { id: '15-20', min: 15, max: 20 },
  { id: 'over-20', min: 21 },
];

export const DRINK_WITH = [
  { id: 'black', label: 'Black', cardLine: 'Best black' },
  { id: 'milk', label: 'With milk', cardLine: 'Great with milk' },
  { id: 'both', label: 'Either', cardLine: 'Black or with milk' },
];

export const BADGES = { bestseller: 'Bestseller', new: 'New', limited: 'Limited', 'staff-pick': 'Staff pick' };

/* ---- Lookup helpers -------------------------------------------------- */
export const ALL_ITEMS = [...PRODUCTS, ...ACCESSORIES];
const bySlug = new Map(ALL_ITEMS.map((p) => [p.slug, p]));

/** Coffee or accessory by slug, or undefined. */
export const getProduct = (slug) => bySlug.get(slug);
/** Size object { label, grams, price } for a product + size label (defaults to sizes[0]). */
export const getSize = (product, label) =>
  product?.sizes.find((s) => s.label === label) ?? (label == null ? product?.sizes[0] : undefined);
export const isAccessory = (p) => p?.type === 'accessory';
/** Default-size price (used for "from" prices and price buckets). */
export const basePrice = (p) => p.sizes[0].price;
/** Does a coffee match a drink-with filter? "both" matches either. */
export const matchesDrink = (p, id) => p.drinkWith === id || p.drinkWith === 'both';
/** Does a coffee fall in a price bucket id? */
export const inPriceBucket = (p, id) => {
  const b = PRICE_BUCKETS.find((x) => x.id === id);
  if (!b) return false;
  const v = basePrice(p);
  return (b.min == null || v >= b.min) && (b.max == null || v <= b.max);
};
/** Coffees that list a brew method, ranked by its position in brewMethods. */
export const coffeesForBrew = (brewId) =>
  PRODUCTS.filter((p) => p.brewMethods.includes(brewId))
    .sort((a, b) => a.brewMethods.indexOf(brewId) - b.brewMethods.indexOf(brewId) || (a.featured ?? 99) - (b.featured ?? 99));
