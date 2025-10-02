const URL_RECIPES = '/data/peruvian_recipes.json';

export async function dataRecipes() {
  const res = await fetch(URL_RECIPES, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  const json = await res.json();
  if (!json?.items || !Array.isArray(json.items)) {
    throw new Error('Invalid JSON shape: expected { items: [] }');
  }
  return json.items;
}

export async function renderFeatured() {
  const grid = document.querySelector('#featured-grid');
  if (!grid) return;
  grid.innerHTML = '';

  try {
    const items = await dataRecipes();
    items.slice(0,3).forEach(r => {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
      <div class="card-container">
        <img  class="img-recipes" src="${r.image}" alt="img de prueba" loading="lazy">
        <h3>${r.name}</h3>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    console.error('renderFeatured error:', err);
    grid.innerHTML = `<p role="alert">Could not load recipes. Please try again.</p>`;
  }
}

if (document.readyState !== 'loading') renderFeatured();
else document.addEventListener('DOMContentLoaded', renderFeatured);
