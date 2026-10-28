// dewby demo store: product data, bag, the shop page filters and the product page.

const PRODUCTS = [
  {
    id: "jelly-cleanser",
    name: "Jelly Cleanser",
    category: "Cleanse",
    price: 14,
    size: "150 ml",
    tile: "var(--butter)",
    band: "tomato",
    img: "img/p01.webp",
    gallery: [
      ["img/p01.webp", "Jelly Cleanser bottle on a yellow background"],
      ["img/f01.webp", "Jelly Cleanser next to half a grapefruit and a swirl of clear jelly"],
      ["img/f08.webp", "Man with cleanser foam on his face holding the bottle"],
      ["img/f02.webp", "Mirror selfie holding the Jelly Cleanser"],
    ],
    line: "Squish it, lather it, rinse it. Takes off sunscreen without the squeaky feeling.",
    keys: "Glycerin, oat and green tea",
    about:
      "A clear jelly that turns into a soft lather the second it meets water. It lifts sunscreen, makeup and the day's grime, then rinses clean with no tight, stripped feeling. pH balanced and gentle enough for twice a day.",
    ingredients: [
      ["Glycerin", "Pulls water into skin so it stays soft after rinsing."],
      ["Colloidal oat", "Calms redness and itchiness."],
      ["Green tea extract", "An antioxidant that helps settle oily skin."],
      ["Coco-glucoside", "A mild, sugar-based cleanser that makes the lather."],
    ],
    howTo: [
      "Wet your face with lukewarm water.",
      "Squish a grape-sized blob between your palms until it foams.",
      "Massage over your face for 30 seconds, then rinse.",
    ],
    when: "Morning and night",
    rating: 4.8,
    count: 1284,
    reviews: [
      ["Maya", "Combination skin", 5, "Feels like washing my face with a gummy bear. My skin's never been this calm."],
      ["Jordan", "Oily skin", 5, "Lathers way more than you'd think. Rinses off with zero tight feeling."],
      ["Ines", "Sensitive skin", 4, "Gentle and doesn't sting my eyes. I wish the bottle were a little bigger."],
    ],
  },
  {
    id: "barrier-cream",
    name: "Barrier Cream",
    category: "Treat",
    price: 18,
    size: "50 ml",
    tile: "var(--cobalt)",
    band: "bubblegum",
    img: "img/p02.webp",
    gallery: [
      ["img/p02.webp", "Pink Barrier Cream jar on a blue background"],
      ["img/f06.webp", "Laughing woman holding the Barrier Cream jar"],
      ["img/f04.webp", "Close-up of pink gel-cream swirled on a yellow surface"],
      ["img/f07.webp", "Barrier Cream on a bathroom shelf with the other dewby products"],
    ],
    line: "A bouncy gel-cream that sinks in fast and keeps skin calm all day.",
    keys: "Ceramides, squalane and panthenol",
    about:
      "A wobbly pink gel-cream that melts in like water and leaves skin cushioned, not greasy. Ceramides patch up a stressed skin barrier, so it suits dry, sensitive and breakout-prone skin alike. Works under makeup and SPF.",
    ingredients: [
      ["Ceramides", "Rebuild the skin's barrier so it holds on to moisture."],
      ["Squalane", "A light oil that softens without clogging pores."],
      ["Panthenol", "Vitamin B5. Soothes and helps skin recover."],
      ["Hyaluronic acid", "Adds a quick hit of bounce and hydration."],
    ],
    howTo: [
      "Start on clean skin, after the Jelly Cleanser.",
      "Scoop a pea-sized amount and warm it between your fingertips.",
      "Pat it over your face and neck until it sinks in.",
    ],
    when: "Morning and night",
    rating: 4.9,
    count: 962,
    reviews: [
      ["Ava", "Dry skin", 5, "The texture is ridiculous in the best way. My flaky patches are gone."],
      ["Leo", "Oily skin", 5, "First moisturiser that doesn't make me shiny by noon."],
      ["Kim", "Sensitive skin", 5, "Calmed down a reaction from another product in two days."],
    ],
  },
  {
    id: "spf-stick",
    name: "SPF 40 Stick",
    category: "Protect",
    price: 22,
    size: "15 g",
    tile: "var(--bubblegum)",
    band: "lime",
    img: "img/p03.webp",
    gallery: [
      ["img/p03.webp", "Lime-green SPF 40 Stick on a pink background"],
      ["img/f05.webp", "Hand holding the SPF 40 Stick over a bathroom sink"],
      ["img/f03.webp", "SPF 40 Stick on pastel steps with the cleanser and cream"],
    ],
    line: "Clear sunscreen you can swipe on over makeup. No white cast.",
    keys: "Broad-spectrum SPF 40 and aloe",
    about:
      "A clear, glide-on sunscreen stick for top-ups through the day. It goes on invisible on every skin tone, doesn't smudge makeup and fits in a jeans pocket. Water-resistant for 40 minutes.",
    ingredients: [
      ["Broad-spectrum UV filters", "SPF 40 protection from UVA and UVB rays."],
      ["Aloe vera", "Cools and soothes skin in the sun."],
      ["Vitamin E", "An antioxidant that helps defend against sun stress."],
      ["Jojoba esters", "Help the stick glide on smoothly."],
    ],
    howTo: [
      "Swipe 4 times across each part of your face as the last step of your morning routine.",
      "Pat it in with your fingertips if you like.",
      "Reapply every 2 hours in the sun, right over makeup.",
    ],
    when: "Morning, then every 2 hours outside",
    rating: 4.7,
    count: 811,
    reviews: [
      ["Priya", "Dry skin", 5, "I swipe it over my makeup at lunch. No white streaks, ever."],
      ["Noah", "Normal skin", 4, "Great for running. Doesn't sting when I sweat."],
      ["Zoe", "Oily skin", 5, "Not greasy at all, which is a first for sunscreen."],
    ],
  },
  {
    id: "lip-jelly",
    name: "Lip Jelly",
    category: "Treat",
    price: 10,
    size: "12 ml",
    tile: "var(--tomato)",
    band: "butter",
    badge: "New",
    img: "img/p04.webp",
    gallery: [["img/p04.webp", "Butter-yellow Lip Jelly tube on a red background"]],
    line: "A slippery, glossy balm that actually stays put.",
    keys: "Shea, castor oil and vitamin E",
    about:
      "A clear, glossy lip balm with a jelly feel. Shea and castor oil keep lips soft for hours, and it isn't sticky, so your hair won't glue itself to your mouth on a windy day.",
    ingredients: [
      ["Shea butter", "Rich moisture for dry, chapped lips."],
      ["Castor oil", "Gives the glossy finish and locks in softness."],
      ["Vitamin E", "Helps cracked lips recover."],
    ],
    howTo: [
      "Squeeze a little onto your fingertip or straight onto your lips.",
      "Wear it alone, or on top of lipstick for shine.",
      "Reapply whenever your lips feel dry.",
    ],
    when: "Any time",
    rating: 4.6,
    count: 204,
    reviews: [
      ["Ella", "Dry lips", 5, "The shine lasts way longer than other balms I've tried."],
      ["Ravi", "Normal lips", 4, "Not sticky at all. I keep one in every bag."],
    ],
  },
  {
    id: "sleep-mask",
    name: "Sleep Jelly Mask",
    category: "Treat",
    price: 20,
    size: "75 ml",
    tile: "var(--lime)",
    band: "cobalt",
    img: "img/p05.webp",
    gallery: [["img/p05.webp", "Blue Sleep Jelly Mask jar on a lime-green background"]],
    line: "Put it on before bed and wake up plump. No rinsing.",
    keys: "Hyaluronic acid and peptides",
    about:
      "A cooling overnight jelly you leave on while you sleep. Hyaluronic acid and peptides work through the night, so you wake up with skin that looks rested and bouncy. Use it 2 or 3 nights a week, or every night in winter.",
    ingredients: [
      ["Hyaluronic acid", "Holds up to 1,000 times its weight in water for plump skin."],
      ["Peptides", "Support firmness and smoothness over time."],
      ["Niacinamide", "Evens out skin tone and calms redness."],
      ["Cucumber water", "Cools and refreshes tired skin."],
    ],
    howTo: [
      "Cleanse, then use the Barrier Cream as usual.",
      "Spread a thin layer of the mask over your face as the last step.",
      "Leave it on overnight and rinse off in the morning.",
    ],
    when: "Night, 2 or 3 times a week",
    rating: 4.8,
    count: 377,
    reviews: [
      ["Hana", "Dry skin", 5, "I look like I slept 10 hours even when I didn't."],
      ["Chris", "Combination skin", 5, "Doesn't come off on my pillow, which I was worried about."],
    ],
  },
  {
    id: "routine-set",
    name: "The Routine",
    category: "Sets",
    price: 48,
    was: 54,
    size: "Cleanser, cream and SPF",
    tile: "var(--cream)",
    band: "tomato",
    badge: "Save $6",
    img: "img/p06.webp",
    gallery: [
      ["img/p06.webp", "The Routine set: cleanser, cream and SPF stick together"],
      ["img/f03.webp", "The three products on pastel steps against a blue wall"],
      ["img/f07.webp", "The three products on a small bathroom shelf"],
    ],
    line: "All three steps in one box, for $6 less than buying them separately.",
    keys: "Jelly Cleanser, Barrier Cream and SPF 40 Stick",
    about:
      "Everything you need for a full routine: cleanse with the Jelly Cleanser, moisturise with the Barrier Cream and protect with the SPF 40 Stick. Full-size products in a recyclable box.",
    ingredients: [
      ["Jelly Cleanser, 150 ml", "Glycerin, oat and green tea."],
      ["Barrier Cream, 50 ml", "Ceramides, squalane and panthenol."],
      ["SPF 40 Stick, 15 g", "Broad-spectrum UV filters and aloe."],
    ],
    howTo: [
      "Cleanse with the Jelly Cleanser and rinse.",
      "Pat on the Barrier Cream.",
      "In the morning, finish with the SPF 40 Stick.",
    ],
    when: "Morning and night (SPF in the morning)",
    rating: 4.9,
    count: 518,
    reviews: [
      ["Sam", "Sensitive skin", 5, "Finally a shelf I don't hide when people come over."],
      ["Maria", "Combination skin", 5, "Took all the guesswork out. Three steps and I'm done."],
      ["Tom", "Oily skin", 4, "Great value. I'd love a travel-size version."],
    ],
  },
];

const byId = (id) => PRODUCTS.find((p) => p.id === id);
const productUrl = (p) => `product.html?id=${p.id}`;

/* ---------- Bag ---------- */

function readBag() {
  try {
    return JSON.parse(localStorage.getItem("dewby-bag")) || [];
  } catch {
    return [];
  }
}

function writeBag(items) {
  try {
    localStorage.setItem("dewby-bag", JSON.stringify(items));
  } catch {
    /* storage unavailable: the count still updates for this page view */
  }
}

let bag = readBag();

function renderBagCount(bump) {
  document.querySelectorAll(".bag-count").forEach((el) => {
    el.textContent = bag.length;
    if (bump) {
      el.classList.remove("bump");
      void el.offsetWidth;
      el.classList.add("bump");
    }
  });
  document.querySelectorAll(".bag-btn").forEach((btn) => {
    btn.setAttribute("aria-label", `Bag, ${bag.length} ${bag.length === 1 ? "item" : "items"}`);
  });
}

let toastTimer;
function toast(message) {
  const el = document.querySelector(".toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

function addToBag(id, qty = 1) {
  const product = byId(id);
  if (!product) return;
  for (let i = 0; i < qty; i++) bag.push(id);
  writeBag(bag);
  renderBagCount(true);
  toast(qty > 1 ? `Added ${qty} × ${product.name} to your bag` : `Added ${product.name} to your bag`);
}

document.addEventListener("click", (event) => {
  const add = event.target.closest("[data-add]");
  if (add) {
    const qtyInput = add.dataset.qty && document.querySelector(add.dataset.qty);
    addToBag(add.dataset.add, qtyInput ? Number(qtyInput.value) || 1 : 1);
  }

  const bagBtn = event.target.closest(".bag-btn");
  if (bagBtn) {
    toast(
      bag.length
        ? `${bag.length} ${bag.length === 1 ? "item" : "items"} in your bag. Checkout isn't part of this demo.`
        : "Your bag is empty. Add something squishy.",
    );
  }
});

renderBagCount(false);

/* ---------- Shared pieces ---------- */

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const priceHTML = (p, cls) =>
  `<span class="${cls}">$${p.price}${p.was ? `<s><span class="visually-hidden">was </span>$${p.was}</s>` : ""}</span>`;

const starsHTML = (rating) => {
  const full = Math.round(rating);
  return `<span class="stars" role="img" aria-label="${rating} out of 5 stars">${"★".repeat(full)}<span class="stars__off">${"★".repeat(5 - full)}</span></span>`;
};

const cardHTML = (p, i, headingLevel = "h2") => `
  <li class="card enter" style="--i:${i}">
    <a class="card__media" href="${productUrl(p)}" style="--tile:${p.tile}" tabindex="-1" aria-hidden="true">
      <img src="${p.img}" alt="" width="896" height="1200" loading="${i < 3 ? "eager" : "lazy"}">
      ${p.badge ? `<span class="card__badge">${p.badge}</span>` : ""}
    </a>
    <div class="card__body">
      <${headingLevel} class="card__title"><a href="${productUrl(p)}">${p.name}</a></${headingLevel}>
      <p class="card__line">${p.line}</p>
      <p class="card__meta">${p.size}. ${p.keys}.</p>
      <div class="card__buy">
        ${priceHTML(p, "card__price")}
        <button class="btn btn--small" type="button" data-add="${p.id}">Add to bag<span class="visually-hidden">: ${p.name}</span></button>
      </div>
    </div>
  </li>`;

/* ---------- Shop page ---------- */

const grid = document.querySelector("#product-grid");

if (grid) {
  const chips = [...document.querySelectorAll(".chip")];
  const sort = document.querySelector("#sort");
  const count = document.querySelector("#result-count");
  const params = new URLSearchParams(location.search);
  let filter = params.get("type") || "All";

  function render() {
    let items = PRODUCTS.filter((p) => filter === "All" || p.category === filter);
    if (sort.value === "low") items = [...items].sort((a, b) => a.price - b.price);
    if (sort.value === "high") items = [...items].sort((a, b) => b.price - a.price);

    chips.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.filter === filter)));
    count.textContent = `${items.length} ${items.length === 1 ? "product" : "products"}`;
    grid.innerHTML = items.length
      ? items.map((p, i) => cardHTML(p, i)).join("")
      : `<li class="empty">Nothing in ${filter} yet. <button class="btn btn--small" type="button" data-filter-reset>Show everything</button></li>`;
  }

  chips.forEach((chip) =>
    chip.addEventListener("click", () => {
      filter = chip.dataset.filter;
      const url = new URL(location.href);
      if (filter === "All") url.searchParams.delete("type");
      else url.searchParams.set("type", filter);
      history.replaceState(null, "", url);
      render();
    }),
  );
  sort.addEventListener("change", render);
  grid.addEventListener("click", (e) => {
    if (e.target.closest("[data-filter-reset]")) {
      filter = "All";
      render();
    }
  });

  if (!chips.some((c) => c.dataset.filter === filter)) filter = "All";
  render();
}

/* ---------- Product page ---------- */

const pdp = document.querySelector("#pdp");

if (pdp) {
  const p = byId(new URLSearchParams(location.search).get("id"));

  if (!p) {
    document.title = "Product not found · dewby";
    pdp.innerHTML = `
      <section class="pdp-missing wrap">
        <h1 class="display">Can't find that one</h1>
        <p>The link may be old, or the product isn't in the range anymore. Everything we make is on the Shop all page.</p>
        <a class="btn" href="shop.html">Shop all products</a>
      </section>`;
  } else {
    document.title = `${p.name} · dewby`;
    document.querySelector('meta[name="description"]').setAttribute("content", `${p.name}, ${p.size}. ${p.line}`);
    const others = PRODUCTS.filter((o) => o.id !== p.id && o.category !== "Sets").slice(0, 3);
    const multi = p.gallery.length > 1;

    pdp.style.setProperty("--band", `var(--${p.band})`);
    // Cream text only passes contrast on cobalt; every other band keeps ink text.
    pdp.classList.toggle("pdp--dark", p.band === "cobalt");

    pdp.innerHTML = `
      <nav class="crumbs wrap" aria-label="Breadcrumb">
        <ol>
          <li><a href="shop.html">Shop all</a></li>
          <li><a href="shop.html?type=${p.category}">${p.category}</a></li>
          <li aria-current="page">${p.name}</li>
        </ol>
      </nav>

      <section class="pdp-top wrap" aria-labelledby="pdp-title">
        <div class="gallery">
          <div class="gallery__main" style="--tile:${p.tile}">
            <img id="gallery-main" src="${p.gallery[0][0]}" alt="${esc(p.gallery[0][1])}" width="896" height="1200" fetchpriority="high">
            ${p.badge ? `<span class="card__badge">${p.badge}</span>` : ""}
          </div>
          ${
            multi
              ? `<div class="gallery__thumbs" role="group" aria-label="Product photos">
              ${p.gallery
                .map(
                  ([src, alt], i) => `
                <button class="thumb" type="button" data-src="${src}" data-alt="${esc(alt)}" aria-pressed="${i === 0}" aria-label="Show photo ${i + 1} of ${p.gallery.length}: ${esc(alt)}">
                  <img src="${src}" alt="" width="896" height="1200" loading="lazy">
                </button>`,
                )
                .join("")}
            </div>`
              : ""
          }
        </div>

        <div class="buybox">
          <h1 class="display buybox__title" id="pdp-title">${p.name}</h1>
          <a class="buybox__rating" href="#reviews">${starsHTML(p.rating)} ${p.rating} from ${p.count.toLocaleString()} reviews</a>
          <p class="lede">${p.line}</p>
          <p class="buybox__size">${p.size}</p>
          <div class="buybox__buy">
            ${priceHTML(p, "price")}
            <div class="qty">
              <button type="button" class="qty__btn" data-step="-1" aria-label="Decrease quantity">−</button>
              <label class="visually-hidden" for="qty">Quantity</label>
              <input id="qty" type="number" inputmode="numeric" min="1" max="9" value="1">
              <button type="button" class="qty__btn" data-step="1" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <button class="btn btn--lime btn--wide" type="button" data-add="${p.id}" data-qty="#qty">Add to bag</button>
          <ul class="buybox__claims">
            <li>Fragrance-free</li>
            <li>Derm-checked</li>
            <li>Vegan</li>
          </ul>
          <p class="buybox__about">${p.about}</p>
        </div>
      </section>

      <section class="pdp-band pdp-ingredients" aria-labelledby="ing-title">
        <div class="wrap pdp-band__grid">
          <h2 class="display" id="ing-title">${p.category === "Sets" ? "What's inside" : "What's in it"}</h2>
          <dl class="ingredients">
            ${p.ingredients.map(([name, what]) => `<div><dt>${name}</dt><dd>${what}</dd></div>`).join("")}
          </dl>
        </div>
      </section>

      <section class="pdp-how wrap" aria-labelledby="how-title">
        <div class="pdp-how__head">
          <h2 class="display" id="how-title">How to use it</h2>
          <p class="pdp-how__when">${p.when}</p>
        </div>
        <ol class="how">
          ${p.howTo.map((s, i) => `<li><span class="how__num" aria-hidden="true">${i + 1}</span><p>${s}</p></li>`).join("")}
        </ol>
      </section>

      <section class="pdp-reviews" id="reviews" aria-labelledby="rev-title">
        <div class="wrap">
          <div class="pdp-reviews__head">
            <h2 class="display" id="rev-title">Reviews</h2>
            <p class="pdp-reviews__score"><span class="pdp-reviews__num">${p.rating}</span> ${starsHTML(p.rating)}<br>from ${p.count.toLocaleString()} reviews</p>
          </div>
          <ul class="reviews">
            ${p.reviews
              .map(
                ([name, skin, stars, text]) => `
              <li class="review">
                ${starsHTML(stars)}
                <blockquote><p>"${text}"</p></blockquote>
                <p class="review__who">${name}, ${skin.toLowerCase()}</p>
              </li>`,
              )
              .join("")}
          </ul>
        </div>
      </section>

      <section class="pdp-more wrap" aria-labelledby="more-title">
        <h2 class="display" id="more-title">Goes well with</h2>
        <ul class="grid">${others.map((o, i) => cardHTML(o, i, "h3")).join("")}</ul>
      </section>`;

    const main = document.querySelector("#gallery-main");
    const thumbs = [...document.querySelectorAll(".thumb")];
    thumbs.forEach((t) =>
      t.addEventListener("click", () => {
        main.src = t.dataset.src;
        main.alt = t.dataset.alt;
        thumbs.forEach((x) => x.setAttribute("aria-pressed", String(x === t)));
      }),
    );

    const qty = document.querySelector("#qty");
    document.querySelectorAll(".qty__btn").forEach((b) =>
      b.addEventListener("click", () => {
        qty.value = Math.min(9, Math.max(1, (Number(qty.value) || 1) + Number(b.dataset.step)));
      }),
    );
    qty.addEventListener("change", () => {
      qty.value = Math.min(9, Math.max(1, Math.round(Number(qty.value)) || 1));
    });
  }
}
