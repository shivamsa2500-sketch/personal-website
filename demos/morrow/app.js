// Morrow Coffee: the Morning Entry, loyalty stamps and small interactions.

// Shop location used for sunrise (US east coast) and opening day for the entry number.
const LAT = 40.7;
const LNG = -74.0;
const TZ = "America/New_York"; // everything is shown in the shop's time, wherever the visitor is
const OPENED = Date.UTC(2026, 2, 28); // No. 0001 was 28 Mar 2026

const pad = (n, w = 2) => String(n).padStart(w, "0");

// Date/time parts as the shop sees them.
function shopParts(d) {
  const p = {};
  new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, year: "numeric", month: "numeric", day: "numeric",
    weekday: "short", hour: "numeric", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(d).forEach(({ type, value }) => { p[type] = value; });
  return p;
}
const fmtTime = (d) => {
  const p = shopParts(d);
  return `${+p.hour % 12 || 12}:${p.minute}`;
};

// NOAA sunrise approximation, accurate to a minute or two. `date` is a UTC midnight for the shop's day.
function sunrise(date) {
  const rad = Math.PI / 180;
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const day = Math.floor((date - start) / 864e5);
  const g = ((2 * Math.PI) / 365) * (day - 1);
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const ha = Math.acos(Math.cos(90.833 * rad) / (Math.cos(LAT * rad) * Math.cos(decl)) - Math.tan(LAT * rad) * Math.tan(decl)) / rad;
  const utcMinutes = 720 - 4 * (LNG + ha) - eqTime;
  const d = new Date(date);
  d.setUTCMinutes(utcMinutes);
  return d;
}

function morningEntry() {
  const now = new Date();
  const p = shopParts(now);
  const today = new Date(Date.UTC(+p.year, +p.month - 1, +p.day));
  const no = Math.max(1, Math.round((today - OPENED) / 864e5));
  const wd = p.weekday;
  const mon = today.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  const dd = +p.day;
  const rise = sunrise(today);

  document.querySelectorAll("[data-entry]").forEach((el) => {
    el.querySelector("[data-entry-no]").textContent = `No. ${pad(no, 4)}`;
    el.querySelector("[data-entry-date]").textContent = `${wd} ${dd} ${mon}`;
    el.querySelector("[data-entry-sun]").textContent = `Sunrise ${fmtTime(rise)}`;
  });

  const line = document.querySelector("[data-today-line]");
  if (line) {
    line.textContent = now > rise
      ? `Sunrise was ${fmtTime(rise)}. The kettle was on at 6:30.`
      : `Sunrise is at ${fmtTime(rise)}. The kettle's already on.`;
  }

  // Weekdays 6:30–2:00, weekends 7:00–3:00.
  const state = document.querySelector("[data-open-state]");
  if (state) {
    const weekend = wd === "Sat" || wd === "Sun";
    const mins = +p.hour * 60 + +p.minute;
    const [open, close] = weekend ? [420, 900] : [390, 840];
    state.textContent = mins < open ? "Opening soon" : mins < close ? "Kettle's on" : "See you tomorrow";
  }
}

// Ten mornings: each stamp lifts the sun a little higher above the line.
function stamps() {
  const list = document.querySelector(".loyalty__stamps");
  if (!list) return;
  const filled = 6;
  for (let i = 0; i < 10; i++) {
    const rise = 0.6 + (i / 9) * 1.4; // 0 = set, 1 = half, 2 = full
    const cy = 30 + 20 - rise * 20;
    const li = document.createElement("li");
    li.className = "stamp";
    li.innerHTML = `
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <clipPath id="st${i}"><rect x="-2" y="-20" width="44" height="50" /></clipPath>
        <circle cx="20" cy="${cy}" data-cy="${cy}" r="12.4" clip-path="url(#st${i})" fill="${i < filled ? "var(--daybreak)" : "rgba(43,29,21,0.12)"}" />
        <line x1="0" x2="40" y1="30" y2="30" stroke="var(--roast)" stroke-width="1" />
      </svg>
      <span class="mono">${pad(i + 1)}</span>`;
    li.setAttribute("aria-label", `Stamp ${i + 1}${i < filled ? ", collected" : ""}`);
    list.append(li);
  }
}

// Split [data-words] lines into words so scroll can light them one at a time.
function splitWords() {
  document.querySelectorAll("[data-words]").forEach((el) => {
    const target = el.querySelector("em") || el;
    target.innerHTML = target.textContent
      .trim()
      .split(/\s+/)
      .map((w) => `<span class="word">${w}</span>`)
      .join(" ");
  });
}

// Motion: slow, sunrise-like, driven by scroll. Nothing bounces.
function motion() {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { gsap, ScrollTrigger } = window;

  if (reduce || !gsap || !ScrollTrigger) {
    const set = () => root.style.setProperty("--progress", (scrollY / Math.max(1, root.scrollHeight - innerHeight)).toFixed(4));
    addEventListener("scroll", set, { passive: true });
    set();
    return;
  }

  root.classList.add("motion");
  gsap.registerPlugin(ScrollTrigger);
  const q = (s) => gsap.utils.toArray(s);

  // Smooth scroll, kept in step with ScrollTrigger.
  let lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  q('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const el = id === "#top" ? 0 : document.querySelector(id);
      if (el === null || !lenis) return;
      e.preventDefault();
      // The open phone menu pushes the page down; close it first so the target is measured in place.
      closeMenu();
      requestAnimationFrame(() => {
        const head = document.querySelector(".site-header").offsetHeight;
        // Absolute target from the real page position, so a layout shift can't leave it stale.
        const y = el === 0 ? 0 : el.getBoundingClientRect().top + scrollY - head;
        lenis.scrollTo(Math.max(0, y), {
          duration: 1.8,
          onComplete: () => el && el.focus && el.matches("main, [tabindex]") && el.focus({ preventScroll: true }),
        });
      });
    }),
  );

  // Page progress: the header sun and the drifting window light.
  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (s) => root.style.setProperty("--progress", s.progress.toFixed(4)),
  });

  // Intro: the headline rises out of its line, the stage opens like a blind.
  gsap.from(".hero__title em", { yPercent: 115, duration: 1.5, ease: "expo.out", stagger: 0.12, delay: 0.1 });
  gsap.from(".hero__copy > [data-intro], .hero__ctas", { y: 26, opacity: 0, duration: 1.2, ease: "power3.out", stagger: 0.08, delay: 0.45 });
  gsap.from(".hero__stage", { clipPath: "inset(100% 0% 0% 0%)", duration: 1.7, ease: "expo.inOut" });
  gsap.from(".hours-card", { y: 30, opacity: 0, duration: 1, ease: "power3.out", delay: 1.2 });
  const stage = document.querySelector(".hero__stage");
  ScrollTrigger.create({
    trigger: ".hero",
    start: "top top",
    end: "bottom top",
    onUpdate: (s) => stage.style.setProperty("--hero", s.progress.toFixed(3)),
  });
  gsap.to(".hero__copy", { yPercent: -18, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  // Sunrise band: the photo opens from a thin horizon, then the line lights up word by word.
  const band = gsap.timeline({ scrollTrigger: { trigger: ".band", start: "top top", end: "bottom bottom", scrub: 0.6 } });
  band
    .to(".band__frame", { clipPath: "inset(0% 0% 0% 0%)", ease: "power2.inOut", duration: 0.55 })
    .to(".band__frame img", { scale: 1, ease: "none", duration: 1 }, 0)
    .to(".band__line .word", { opacity: 1, stagger: 0.06, duration: 0.1, ease: "none" }, 0.5);

  // Other lines light up as you read them.
  q("[data-words]").filter((el) => !el.closest(".band")).forEach((el) => {
    gsap.to(el.querySelectorAll(".word"), {
      opacity: 1,
      duration: 0.9,
      stagger: 0.07,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 92%", once: true },
    });
  });

  // Section rules draw themselves; titles slide up behind them.
  q("[data-head]").forEach((h) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: h, start: "top 88%" } });
    tl.fromTo(h, { "--draw": 0 }, { "--draw": 1, duration: 1.4, ease: "expo.out" })
      .from(h.children, { y: 30, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.07 }, 0.1);
  });

  q("[data-rise]").forEach((el) =>
    gsap.from(el, { y: 60, opacity: 0, duration: 1.3, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } }),
  );

  // Images open from the bottom like a rising blind, settle from a slow zoom and keep drifting.
  const mm = gsap.matchMedia();
  const revealMedia = (m) => {
    const img = m.querySelector("img");
    gsap.fromTo(m, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: m, start: "top 90%" } });
    gsap.fromTo(img, { scale: 1.35 }, { scale: 1.08, duration: 2.2, ease: "expo.out", scrollTrigger: { trigger: m, start: "top 90%" } });
    gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: "none", scrollTrigger: { trigger: m, start: "top bottom", end: "bottom top", scrub: true } });
  };
  q(".media").filter((m) => !m.closest(".room")).forEach(revealMedia);

  q("[data-speed]").forEach((el) =>
    gsap.to(el, { yPercent: parseFloat(el.dataset.speed) * -100, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } }),
  );

  // The room: pinned, walked through sideways on larger screens.
  mm.add("(min-width: 821px)", () => {
    const track = document.querySelector("[data-track]");
    const dist = () => track.scrollWidth - innerWidth;
    const walk = gsap.to(track, {
      x: () => -dist(),
      ease: "none",
      scrollTrigger: { trigger: ".room__pin", pin: true, start: "top top", end: () => "+=" + dist(), scrub: 0.8, invalidateOnRefresh: true },
    });
    q(".room__panel").forEach((p, i) => {
      const img = p.querySelector("img");
      gsap.set(img, { scale: 1.25 });
      gsap.fromTo(img, { xPercent: -8 }, { xPercent: 8, ease: "none", scrollTrigger: { trigger: p, containerAnimation: walk, start: "left right", end: "right left", scrub: true } });
      gsap.from(p, {
        y: i % 2 ? 80 : 40,
        rotateY: -14,
        opacity: 0.25,
        transformPerspective: 1000,
        ease: "power2.out",
        scrollTrigger: { trigger: p, containerAnimation: walk, start: "left 95%", end: "left 55%", scrub: true },
      });
    });
  });
  mm.add("(max-width: 820px)", () => {
    q(".room .media").forEach(revealMedia);
  });

  // Regulars: cards tip up into place one after another.
  gsap.from(".regular", {
    y: 90,
    rotateX: -22,
    opacity: 0,
    transformOrigin: "50% 100%",
    duration: 1.4,
    ease: "expo.out",
    stagger: 0.1,
    scrollTrigger: { trigger: ".regulars", start: "top 85%" },
  });

  // 3D tilt under the pointer.
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    q("[data-tilt]").forEach((card) => {
      const el = card.classList.contains("regular") ? card.querySelector(".media") : card;
      const rx = gsap.quickTo(el, "rotateX", { duration: 0.6, ease: "power3.out" });
      const ry = gsap.quickTo(el, "rotateY", { duration: 0.6, ease: "power3.out" });
      gsap.set(el, { transformPerspective: 900 });
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        rx(((e.clientY - r.top) / r.height - 0.5) * -8);
        ry(((e.clientX - r.left) / r.width - 0.5) * 10);
      });
      card.addEventListener("pointerleave", () => {
        rx(0);
        ry(0);
      });
    });
  }

  // Ticker: drifts on its own, runs faster while you scroll.
  const track = document.querySelector(".ticker__track");
  if (track) {
    track.innerHTML += track.innerHTML;
    let x = 0;
    let boost = 0;
    let half = 0;
    addEventListener("resize", () => (half = 0));
    const tracker = ScrollTrigger.create({ trigger: ".ticker", start: "top bottom", end: "bottom top" });
    gsap.ticker.add((t, dt) => {
      const v = Math.abs(tracker.getVelocity());
      boost += (Math.min(v / 60, 14) - boost) * 0.08;
      x -= (0.6 + boost) * (dt / 16.7);
      if (!half) half = track.scrollWidth / 2;
      if (-x >= half) x += half;
      track.style.transform = `translate3d(${x}px,0,0)`;
    });
  }

  // Loyalty: the suns rise one after another.
  const circles = q(".stamp circle");
  if (circles.length) {
    gsap.set(circles, { attr: { cy: 56 } });
    gsap.to(circles, {
      attr: { cy: (i, el) => el.dataset.cy },
      duration: 1.4,
      ease: "power3.out",
      stagger: 0.12,
      scrollTrigger: { trigger: ".loyalty", start: "top 75%" },
    });
  }

  // Footer: the sun sets behind the line as you reach the end.
  gsap.fromTo(".footer__sun", { "--set": -0.9 }, { "--set": 0.6, ease: "none", scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true } });

  // Active nav link.
  q(".nav__links a").forEach((a) => {
    const sec = document.querySelector(a.getAttribute("href"));
    if (!sec) return;
    ScrollTrigger.create({ trigger: sec, start: "top 50%", end: "bottom 50%", toggleClass: { targets: a, className: "is-active" } });
  });

  addEventListener("load", () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

function closeMenu() {
  const btn = document.querySelector(".nav__toggle");
  const panel = document.getElementById("mobile-nav");
  if (!panel || panel.hidden) return;
  btn.setAttribute("aria-expanded", "false");
  panel.hidden = true;
}

function nav() {
  const btn = document.querySelector(".nav__toggle");
  const panel = document.getElementById("mobile-nav");
  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
    panel.hidden = open;
  });
  // Without smooth scrolling, links still close the menu.
  panel.addEventListener("click", (e) => {
    if (e.target.tagName === "A") closeMenu();
  });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) {
      closeMenu();
      btn.focus();
    }
  });
  // The phone menu has no place on a wide screen.
  matchMedia("(min-width: 821px)").addEventListener("change", (m) => m.matches && closeMenu());
}

function shop() {
  const add = document.querySelector("[data-add]");
  const msg = document.querySelector("[data-added]");
  let count = 0;
  add?.addEventListener("click", () => {
    count += 1;
    msg.textContent = `Added · ${count} in your bag (demo shop, nothing is charged)`;
  });

  const form = document.querySelector("[data-signup]");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    form.querySelector("[data-signup-msg]").textContent = "Demo form: nothing was sent. On a live site this goes to the owner's mailing list.";
    form.reset();
  });
}

morningEntry();
stamps();
splitWords();
nav();
shop();
motion();
