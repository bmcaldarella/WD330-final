
const isLocal =
  location.hostname === "localhost" || location.hostname === "127.0.0.1";

const API_BASE = isLocal
  ? "http://localhost:3000/api/v1/recipes"
  : "/api/v1/recipes";

export async function dataRecipes(params = {}) {
  const qs = new URLSearchParams(params);
  const url = qs.toString() ? `${API_BASE}?${qs}` : API_BASE;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);

  const json = await res.json();
  if (!json?.items || !Array.isArray(json.items)) {
    throw new Error("Invalid API shape: expected { items: [] }");
  }
  return json.items;
}

export async function renderFeatured() {
  const grid = document.querySelector("#featured-grid"); 
  if (!grid) return;
  grid.innerHTML = "";

  try {
    const items = await dataRecipes({ limit: 3 });

    items.slice(0, 3).forEach((r) => {
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        <div class="card-container">
          <img class="img-recipes" src="${r.image}" alt="feature recipe" loading="lazy">
          <h3>${r.name}</h3>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    console.error("renderFeatured error:", err);
    grid.innerHTML =
      `<p role="alert">Could not load recipes. Please try again.</p>`;
  }
}

if (document.readyState !== "loading") renderFeatured();
else document.addEventListener("DOMContentLoaded", renderFeatured);
