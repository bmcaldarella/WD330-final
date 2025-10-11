const JSON_URL = new URL("./data/peruvian_recipes.json", window.location.href).toString();

export async function dataRecipes(params = {}) {
  const res = await fetch(JSON_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);

  const json = await res.json();

  let items = Array.isArray(json) ? json : (json?.items ?? []);
  if (!Array.isArray(items)) {
    throw new Error("Invalid JSON shape: expected { items: [] } or []");
  }

  const region = (params.region || "").toLowerCase();
  if (region) items = items.filter(r => (r.region || "").toLowerCase() === region);

  const slug = (params.slug || "").toLowerCase();
  if (slug) items = items.filter(r => (r.slug || "").toLowerCase() === slug);

  const limit = parseInt(params.limit ?? "0", 10);
  if (Number.isFinite(limit) && limit > 0) items = items.slice(0, limit);

  return items;
}

export async function renderFeatured() {
  const grid = document.querySelector("#featured-grid");
  if (!grid) return;
  grid.innerHTML = "";

  try {
    const items = await dataRecipes({ limit: 3 });

    items.forEach((r) => {
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        <div class="card-container">
          <img class="img-recipes" src="${r.image}" alt="${r.name || "Featured recipe"}" loading="lazy">
          <h3>${r.name ?? "Untitled recipe"}</h3>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    console.error("renderFeatured error:", err);
    grid.innerHTML = `<p role="alert">Could not load recipes. Please try again.</p>`;
  }
}

if (document.readyState !== "loading") renderFeatured();
else document.addEventListener("DOMContentLoaded", renderFeatured);
