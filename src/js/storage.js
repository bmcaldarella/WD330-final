const KEY = 'pf:favorites';

export function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? [];
  } catch { return []; }
}

export function isFavorite(id) {
  return getFavorites().includes(String(id));
}

export function toggleFavorite(id) {
  id = String(id);
  const list = getFavorites();
  const i = list.indexOf(id);
  if (i >= 0) list.splice(i, 1);
  else list.push(id);
  localStorage.setItem(KEY, JSON.stringify(list));
  updateFavCount();
  announceFavChange(i < 0);
  return i < 0;
}

export function updateFavCount() {
  const el = document.querySelector('#fav-count');
  if (el) el.textContent = `(${getFavorites().length})`;
}

function announceFavChange(added) {
}
