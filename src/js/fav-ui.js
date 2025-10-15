import { toggleFavorite, isFavorite, updateFavCount } from './storage.js';

let favUiBound = false;

export function enableFavoriteButtons() {
  // Sincroniza aria-pressed en botones ya presentes (si hay)
  document.querySelectorAll('[data-fav-btn]').forEach(btn => {
    const id = btn.getAttribute('data-recipe-id');
    btn.setAttribute('aria-pressed', String(isFavorite(id)));
  });

  if (favUiBound) return;
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-fav-btn]');
    if (!btn) return;
    console.log('[fav-ui] fav click');

    const id    = btn.getAttribute('data-recipe-id');
    const name  = btn.getAttribute('data-recipe-name') || btn.textContent.trim();
    const thumb = btn.getAttribute('data-recipe-thumb') || '';
    const source= btn.getAttribute('data-recipe-source') || location.pathname;

    const added = toggleFavorite({ id, name, thumb, source });
    btn.setAttribute('aria-pressed', String(added));
    const label = btn.querySelector('[data-fav-text]');
    if (label) label.textContent = added ? 'Added' : 'Add to Favorites';
    btn.classList.toggle('is-fav', added);
    updateFavCount();
  });
  favUiBound = true;
  console.log('[fav-ui] fav listener ON');
}
