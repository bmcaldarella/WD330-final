
// src/js/nav.js
let navBound = false;

export function initNav() {
  if (navBound) return;

  const btn = document.querySelector('.menu-toggle');
  const nav = document.getElementById('primary-nav');
  if (!btn || !nav) {
    console.warn('[nav] header aún no está listo');
    return; // se llamará otra vez desde main tras el inject
  }

  const close = () => {
    btn.setAttribute('aria-expanded', 'false');
    nav.classList.remove('open');
  };

  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    nav.classList.toggle('open', !open);
  });

  // Cierra al tocar un link del menú
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) close();
  });

  // Cierra con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  navBound = true;
  console.log('[nav] bound');
}
