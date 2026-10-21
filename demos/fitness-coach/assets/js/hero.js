/* Hero video: one source per device (matchMedia), poster swap, reduced-motion
   fallback, pause control, off-screen pause, and the hero-to-content scroll. */
import brand from '../../brand.config.js';
import { $, reducedMotion } from './ui.js';

export function initHero() {
  const hero = $('[data-hero]');
  const video = $('[data-hero-video]');
  const toggle = $('[data-hero-toggle]');
  const label = $('[data-hero-toggle-label]');
  if (!hero || !video) return;

  const m = brand.media;
  const wideMq = window.matchMedia(m.wideQuery);
  const rmMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused = false;
  let visible = true;
  let current = '';

  // No licensed video configured (or it fails to load): show the built-in
  // hero art instead, hide the play/pause control and the video description.
  const desc = $('[data-hero-video-desc]');
  const noVideo = () => {
    hero.classList.add('no-video');
    hero.classList.remove('is-playing');
    toggle.hidden = true;
    if (desc) desc.hidden = true;
    video.removeAttribute('poster');
    video.removeAttribute('src');
    video.hidden = true;
    current = '';
  };
  const hasVideo = !!(m.heroVideo || m.heroVideoWide);

  const setState = (playing) => {
    hero.classList.toggle('is-paused', !playing);
    toggle.setAttribute('aria-pressed', String(!playing));
    label.textContent = playing ? 'Pause background video' : 'Play background video';
  };

  function pick() {
    const wide = wideMq.matches;
    const src = (wide ? m.heroVideoWide : m.heroVideo) || m.heroVideoWide || m.heroVideo;
    const poster = (wide ? m.heroPosterWide : m.heroPoster) || '';
    hero.dataset.layout = wide ? 'wide' : 'tall';
    if (!src) { noVideo(); return; }
    if (poster && video.getAttribute('poster') !== poster) video.setAttribute('poster', poster);
    if (rmMq.matches && !video.dataset.userStarted) {
      // Reduced motion: poster only, no autoplay, nothing downloaded until asked.
      video.removeAttribute('autoplay');
      if (current) { video.pause(); video.removeAttribute('src'); video.load(); current = ''; }
      setState(false);
      return;
    }
    if (src === current) return;
    current = src;
    const wasPlaying = !userPaused;
    video.src = src;
    video.load();
    if (wasPlaying) play(); else setState(false);
  }

  function play() {
    const p = video.play();
    if (p && p.then) p.then(() => setState(true)).catch(() => setState(false));
    else setState(true);
  }

  video.addEventListener('error', noVideo);
  video.addEventListener('playing', () => { hero.classList.add('is-playing'); setState(true); });
  video.addEventListener('pause', () => setState(false));

  toggle.addEventListener('click', () => {
    if (video.paused) {
      userPaused = false;
      video.dataset.userStarted = '1';
      if (!current) { current = (wideMq.matches ? m.heroVideoWide : m.heroVideo) || m.heroVideoWide || m.heroVideo; if (!current) return; video.src = current; }
      play();
    } else {
      userPaused = true;
      video.pause();
    }
  });

  if (hasVideo) {
    wideMq.addEventListener('change', pick);
    rmMq.addEventListener('change', pick);
    pick();
  } else {
    noVideo();
  }

  // Save battery: pause when the hero is off screen, resume when back.
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (!current) return;
    if (!visible) video.pause();
    else if (!userPaused) play();
  }, { threshold: 0.05 }).observe(hero);

  // Hero-to-content: content drifts up and fades, video eases back as you scroll.
  const content = $('[data-hero-content]');
  const media = $('[data-hero-media]');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      if (reducedMotion()) { content.style.transform = ''; content.style.opacity = ''; media.style.transform = ''; return; }
      const h = hero.offsetHeight || 1;
      const p = Math.min(1, Math.max(0, window.scrollY / h));
      content.style.transform = `translate3d(0, ${(-p * 64).toFixed(1)}px, 0)`;
      content.style.opacity = String(1 - p * 0.9);
      media.style.transform = `scale(${(1 + p * 0.06).toFixed(4)})`;
      hero.style.setProperty('--hero-p', p.toFixed(3));
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Entrance
  requestAnimationFrame(() => hero.classList.add('is-in'));
}
