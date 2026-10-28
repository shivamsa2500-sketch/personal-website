/* dewby hero: three wobbly 3D jelly blobs (one per routine step) that float
   around the hero photo, lean toward the pointer and squish when tapped.
   Progressive enhancement: if WebGL or three.js is missing, the photo stays as is. */
(() => {
  const stage = document.querySelector(".hero__stage");
  const hero = document.querySelector(".hero");
  if (!stage || !hero || !window.THREE) return;

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const T = window.THREE;

  let renderer;
  try {
    renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  } catch (e) {
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.domElement.setAttribute("aria-hidden", "true");
  stage.appendChild(renderer.domElement);

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 12);

  scene.add(new T.HemisphereLight(0xffffff, 0x3a2a3a, 0.6));
  const key = new T.DirectionalLight(0xffffff, 0.9);
  key.position.set(-4, 6, 8);
  scene.add(key);
  const rim = new T.DirectionalLight(0xffe07a, 0.7);
  rim.position.set(6, -2, -4);
  scene.add(rim);
  const spark = new T.PointLight(0xffffff, 0.5, 30);
  spark.position.set(2, 3, 6);
  scene.add(spark);

  // x/y are fractions of the visible stage (-0.5..0.5), so layout follows the box size.
  const SPECS = [
    { color: 0xe8412c, r: 1.05, x: -0.34, y: 0.3, z: 0.6, seed: 0.0 },  // Jelly Cleanser
    { color: 0xff9ec4, r: 0.9, x: 0.36, y: 0.02, z: 1.2, seed: 2.1 },   // Barrier Cream
    { color: 0xc6e83a, r: 0.78, x: -0.24, y: -0.36, z: 1.6, seed: 4.7 }, // SPF 40 Stick
    { color: 0xffe07a, r: 0.32, x: 0.24, y: 0.4, z: 0.2, seed: 6.3 },
    { color: 0xfff4e2, r: 0.22, x: 0.3, y: -0.38, z: 2.0, seed: 8.8 },
  ];

  const blobs = SPECS.map((s) => {
    const geo = new T.IcosahedronGeometry(s.r, s.r > 0.5 ? 24 : 10);
    const base = Float32Array.from(geo.attributes.position.array);
    const mat = new T.MeshPhysicalMaterial({
      color: s.color,
      roughness: 0.3,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    });
    const mesh = new T.Mesh(geo, mat);
    scene.add(mesh);
    return {
      ...s, mesh, geo, base,
      home: new T.Vector3(),
      squash: 0, squashV: 0,          // spring for the tap squish
      drop: reduce ? 1 : 0,           // 0..1 entrance progress
    };
  });

  let visW = 1, visH = 1;
  function layout() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    visH = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    visW = visH * camera.aspect;
    const scale = Math.min(1, camera.aspect * 1.05, Math.max(0.6, w / 640));
    blobs.forEach((b) => {
      b.home.set(b.x * visW, b.y * visH, b.z);
      b.mesh.scale.setScalar(scale);
      b.fit = scale;
    });
  }
  new ResizeObserver(layout).observe(stage);
  layout();

  // Cheap layered-sine "noise" keeps the wobble organic without a noise library.
  function wobble(b, t) {
    const pos = b.geo.attributes.position;
    const a = pos.array, src = b.base;
    const amp = 0.09 + b.squash * 0.05;
    for (let i = 0; i < a.length; i += 3) {
      const x = src[i], y = src[i + 1], z = src[i + 2];
      const n =
        Math.sin(x * 2.1 + t * 1.3 + b.seed) * Math.cos(y * 1.7 + t * 1.1) +
        Math.sin(z * 2.4 + t * 0.9 + b.seed * 0.5) * 0.6;
      const k = 1 + n * amp;
      a[i] = x * k;
      a[i + 1] = y * k;
      a[i + 2] = z * k;
    }
    pos.needsUpdate = true;
    b.geo.computeVertexNormals();
  }

  const pointer = new T.Vector2(0, 0);
  const target = new T.Vector2(0, 0);
  const ray = new T.Raycaster();

  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    target.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
  });
  hero.addEventListener("pointerleave", () => target.set(0, 0));

  // Tap a blob to squish it. Listens on the hero so the canvas never blocks links.
  hero.addEventListener("pointerdown", (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
    const ndc = new T.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(blobs.map((b) => b.mesh))[0];
    if (!hit) return;
    const b = blobs.find((x) => x.mesh === hit.object);
    b.squashV += 9;
    if (reduce) settle();
  });

  // Reduced motion: no ambient animation, but a tapped blob still springs back.
  function settle() {
    render(0, 0.016);
    if (blobs.some((b) => Math.abs(b.squash) > 0.002 || Math.abs(b.squashV) > 0.02)) requestAnimationFrame(settle);
  }

  const media = document.querySelector(".hero__media img");

  function render(t, dt) {
    pointer.lerp(target, Math.min(1, dt * 4));
    blobs.forEach((b, i) => {
      // entrance: drop from above with an overshoot, staggered after the headline
      if (b.drop < 1) b.drop = Math.min(1, b.drop + dt * 1.4 * (t > 0.35 + i * 0.12 ? 1 : 0));
      const d = b.drop;
      const ease = d === 0 ? 0 : 1 - Math.pow(2, -10 * d) * Math.cos(d * 9);
      const fall = (1 - ease) * visH * 0.9;

      // spring for squish
      b.squashV += (-b.squash * 60 - b.squashV * 7) * dt;
      b.squash += b.squashV * dt;

      const depth = 0.25 + b.z * 0.2; // nearer blobs follow the pointer more
      const bob = reduce ? 0 : Math.sin(t * 0.9 + b.seed) * 0.12;
      b.mesh.position.set(
        b.home.x + pointer.x * depth,
        b.home.y + pointer.y * depth * 0.7 + bob + fall,
        b.home.z
      );
      const sq = b.squash * 0.35;
      const f = b.fit * (d === 0 ? 0.001 : 1);
      b.mesh.scale.set(f * (1 + sq), f * (1 - sq), f * (1 + sq));
      b.mesh.rotation.set(t * 0.15 + b.seed, t * 0.2 + b.seed, 0);
      if (!reduce || b.squash) wobble(b, reduce ? b.seed : t);
    });
    if (media && !reduce) {
      media.style.transform = `perspective(900px) rotateY(${pointer.x * 6}deg) rotateX(${pointer.y * -5}deg)`;
    }
    renderer.render(scene, camera);
  }

  if (reduce) {
    blobs.forEach((b) => wobble(b, b.seed));
    render(0, 0.016);
    new ResizeObserver(() => render(0, 0.016)).observe(stage);
    return;
  }

  // Only animate while the hero is on screen and the tab is visible.
  let running = false, last = 0, t0 = 0;
  function loop(now) {
    if (!running) return;
    const s = now / 1000;
    if (!t0) t0 = s;
    const dt = Math.min(0.05, last ? s - last : 0.016);
    last = s;
    render(s - t0, dt);
    requestAnimationFrame(loop);
  }
  function setRunning(on) {
    if (on === running) return;
    running = on;
    last = 0;
    if (on) requestAnimationFrame(loop);
  }
  let onScreen = true;
  new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    setRunning(onScreen && !document.hidden);
  }).observe(hero);
  document.addEventListener("visibilitychange", () => setRunning(onScreen && !document.hidden));
  setRunning(true);
})();
