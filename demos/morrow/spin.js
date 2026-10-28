// Morrow hero: the real cup on a turntable, as frames from a Flow (Veo) video.
// It turns slowly on its own; drag to spin it, and scrolling past the hero turns it too.
(() => {
  const stage = document.querySelector("[data-spin]");
  const canvas = stage?.querySelector("canvas");
  if (!stage || !canvas) return;

  const FRAMES = Number(stage.dataset.frames);
  const src = (i) => stage.dataset.src.replace("{n}", String(i).padStart(3, "0"));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = canvas.getContext("2d");

  // Load the frames; the poster image covers the stage until they're ready.
  const imgs = new Array(FRAMES);
  let ready = 0;
  const load = (i) =>
    new Promise((res) => {
      const im = new Image();
      im.decoding = "async";
      im.onload = () => {
        imgs[i] = im;
        ready += 1;
        res();
      };
      im.onerror = res;
      im.src = src(i);
    });
  // Every 6th frame first so a coarse spin works early, then fill the gaps.
  const order = [...Array(FRAMES).keys()].sort((a, b) => (a % 6) - (b % 6) || a - b);
  (async () => {
    for (let k = 0; k < order.length; k += 8) await Promise.all(order.slice(k, k + 8).map(load));
    stage.classList.add("is-live");
  })();

  let angle = 0; // in frames
  let vel = 0;
  let dragging = false;
  let lastX = 0;
  let scrollTurn = 0;

  const hero = stage.closest("section");
  addEventListener(
    "scroll",
    () => {
      const r = hero.getBoundingClientRect();
      scrollTurn = Math.min(1, Math.max(0, -r.top / r.height)) * FRAMES * 0.45; // ~160° as the hero leaves
    },
    { passive: true },
  );

  stage.addEventListener("pointerdown", (e) => {
    dragging = true;
    lastX = e.clientX;
    vel = 0;
    try {
      stage.setPointerCapture(e.pointerId);
    } catch {}
    stage.classList.add("is-dragging");
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    // Dragging across the whole stage turns the cup about one full revolution.
    const step = (dx / stage.clientWidth) * FRAMES * -1;
    angle += step;
    vel = step;
  });
  const release = () => {
    dragging = false;
    stage.classList.remove("is-dragging");
  };
  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);

  stage.tabIndex = 0;
  stage.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") vel = -FRAMES / 60;
    else if (e.key === "ArrowRight") vel = FRAMES / 60;
    else return;
    e.preventDefault();
  });

  function resize() {
    const r = stage.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  // Draw a frame with object-fit: cover.
  function draw(im, alpha) {
    if (!im) return;
    const cw = canvas.width;
    const ch = canvas.height;
    const s = Math.max(cw / im.naturalWidth, ch / im.naturalHeight);
    const w = im.naturalWidth * s;
    const h = im.naturalHeight * s;
    ctx.globalAlpha = alpha;
    ctx.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h);
  }
  // Nearest loaded frame at or before i (frames arrive out of order).
  const near = (i) => {
    for (let k = 0; k < FRAMES; k++) {
      const im = imgs[(i - k + FRAMES) % FRAMES];
      if (im) return im;
    }
    return null;
  };

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(stage);

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(64, now - last) / 1000;
    last = now;
    if (visible && ready) {
      if (!dragging) {
        vel *= 0.93;
        angle += vel + (reduce ? 0 : dt * (FRAMES / 14)); // one revolution every ~14s
      }
      const pos = (((angle + scrollTurn) % FRAMES) + FRAMES) % FRAMES;
      const i = Math.floor(pos);
      const f = pos - i;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      draw(near(i), 1);
      // Blend toward the next frame so motion between frames stays continuous.
      if (imgs[(i + 1) % FRAMES] && f > 0.01) draw(imgs[(i + 1) % FRAMES], f);
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
