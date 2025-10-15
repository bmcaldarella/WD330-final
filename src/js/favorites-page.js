import { getFavorites, removeFavorite, updateFavCount, onFavoritesChange } from './storage.js';

console.log('[favorites] init');

function recipeUrl(fav) {                            // (1) recibe el objeto entero
  if (fav.slug) return `/detail.html?slug=${encodeURIComponent(fav.slug)}`;
  return `/detail.html?id=${encodeURIComponent(fav.id)}`;   // (2) fallback por id
}

function cardTemplate(r) {
  const thumb = r.thumb || '/img/placeholder.png';
  const safeName = r.name || 'Recipe';
  const href = recipeUrl(r);                         
  return `
    <article class="card fav-card" data-id="${r.id}">
      <img src="${thumb}" alt="" width="180" height="120" loading="lazy" />
      <div class="content">
        <h3>${safeName}</h3>
        <div class="actions">
          <a class="btn" href="${href}">View</a>
          <button class="btn-outline" data-remove="${r.id}">Remove</button>
        </div>
      </div>
    </article>
  `;
}

function renderList() {
  const host = document.getElementById('favorites-list');
  const empty = document.getElementById('favorites-empty');
  if (!host || !empty) {
    console.warn('[favorites] Falta #favorites-list o #favorites-empty en el HTML');
    return;
  }

  const list = getFavorites();
  console.log('[favorites] render', list);
  host.innerHTML = '';

  if (!list.length) {
    empty.hidden = false;
    updateFavCount();
    return;
  }

  empty.hidden = true;
  list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  for (const r of list) {
    const li = document.createElement('li');
    li.innerHTML = cardTemplate(r);
    host.appendChild(li);
  }

  updateFavCount();
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-remove]');
  if (!btn) return;
  const id = btn.getAttribute('data-remove');
  removeFavorite(id);
  renderList();
});

onFavoritesChange(() => renderList());
renderList();
