// src/js/storage.js
const KEY = 'pf:favorites';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) ?? []; }
  catch { return []; }
}
function write(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
  document.dispatchEvent(new CustomEvent('pf:favorites:changed', { detail: { count: list.length, list } }));
}
export function getFavorites() { return read(); }
export function isFavorite(id) { return read().some(it => it.id === String(id)); }

export function toggleFavorite(recipeOrId) {
  const id = String(typeof recipeOrId === 'object' ? recipeOrId.id : recipeOrId);
  const list = read();
  const idx = list.findIndex(it => it.id === id);
  if (idx >= 0) { list.splice(idx, 1); } 
  else {
    const r = typeof recipeOrId === 'object' ? recipeOrId : { id, name: `Recipe #${id}` };
    list.push({ id: String(r.id), name: r.name, thumb: r.thumb ?? '', source: r.source ?? '' });
  }
  write(list);
  return idx < 0; // true si quedó agregado
}

export function removeFavorite(id) {
  write(read().filter(it => it.id !== String(id)));
}

export function updateFavCount() {
  const count = read().length;
  const badge = document.getElementById('fav-count');
  const link  = document.getElementById('favorites-link');
  if (badge) badge.textContent = `(${count})`;
  if (link) link.setAttribute('aria-label', `Favorites, ${count} item${count===1?'':'s'}`);
}

export function onFavoritesChange(cb) {
  document.addEventListener('pf:favorites:changed', (e) => cb(e.detail));
}
