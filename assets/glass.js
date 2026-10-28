// Moves the specular highlight on glass surfaces to follow the pointer.
const glass = document.querySelectorAll('.policy,.top,.rows,.steps>div,.card,.plan,.hello,.feature-body,.next-up,.form,.next,.pill');
if (matchMedia('(hover: hover)').matches) {
  glass.forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });
}
