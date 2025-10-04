import { dataRecipes } from "./mealdb.js";

function normRegion(val) {
  if (!val) return null;
  const s = String(val).trim().toLowerCase();
  if (s === "costa") return "coast";
  if (s === "selva") return "jungle";
  if (s === "sierra") return "highlands";
  if (s === "nacional" || s === "national") return "national";
  return s;
}

function labelRegion(r) {
  const map = { coast: "Coast", jungle: "Jungle", highlands: "Highlands", national: "National" };
  return map[r] ?? (r ? r.charAt(0).toUpperCase() + r.slice(1) : "");
}

const ORDER = ["coast", "jungle", "highlands", "national"];

const state = {
  all: [],
  regions: [],
  current: null,
};

function renderFilters() {
  const $filters = document.querySelector("#regions-filters");
  if (!$filters) return;

  $filters.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.className = `filter-btn ${!state.current ? "active" : ""}`;
  allBtn.textContent = "All";
  allBtn.dataset.region = "";
  $filters.appendChild(allBtn);

  state.regions.forEach((reg) => {
    const btn = document.createElement("button");
    btn.className = `filter-btn ${state.current === reg ? "active" : ""}`;
    btn.textContent = labelRegion(reg);
    btn.dataset.region = reg;
    $filters.appendChild(btn);
  });

  $filters.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    const region = btn.dataset.region || null;
    setRegion(region, { push: true });
  });
}

function renderGrid() {
  const $title = document.querySelector("#current-region-title");
  const $grid = document.querySelector("#categories-grid");
  const $filters = document.querySelectorAll(".filter-btn");
  if (!$grid || !$title) return;

  $filters.forEach((b) => {
    if ((b.dataset.region || "") === (state.current || "")) b.classList.add("active");
    else b.classList.remove("active");
  });

  $title.textContent = state.current ? `Region: ${labelRegion(state.current)}` : "All regions";

  const list = state.current
    ? state.all.filter((r) => normRegion(r.region) === state.current)
    : state.all;

  if (!list.length) {
    $grid.innerHTML = `<p class="empty">No recipes found${state.current ? ` for ${labelRegion(state.current)}` : ""}.</p>`;
    return;
  }

  // Cada card recibe data-slug, tabindex y role para accesibilidad
  $grid.innerHTML = list
    .map(
      (r) => `
      <article class="card" data-slug="${encodeURIComponent(r.slug)}" tabindex="0" role="button" aria-label="View ${r.name}">
        <div class="categories">
          <img src="${r.image && r.image.trim() !== '' ? r.image : '/img/prueba.jpg'}"
               alt="${r.name}" loading="lazy">
          <h3>${r.name}</h3>
          <ul>
            <li><strong>Category:</strong> ${r.category}</li>
            <li><strong>Calories:</strong> ${r.nutrition?.kcal ?? "-"} kcal</li>
            <li><strong>Protein:</strong> ${r.nutrition?.protein_g ?? "-"} g</li>
            <li><strong>Fat:</strong> ${r.nutrition?.fat_g ?? "-"} g</li>
            <li><strong>Carbs:</strong> ${r.nutrition?.carbs_g ?? "-"} g</li>
          </ul>
          <a class="btn" href="/detail.html?slug=${encodeURIComponent(r.slug)}">View Recipe</a>
        </div>
      </article>
    `
    )
    .join("");

  // Evita que el click en el botón burbujee y dispare el click de la card
  $grid.querySelectorAll(".card .btn").forEach((a) => {
    a.addEventListener("click", (e) => e.stopPropagation());
  });
}

// Delegación: hace clic en la card → navega al detalle
function attachCardNavigation() {
  const $grid = document.querySelector("#categories-grid");
  if (!$grid) return;

  // Click con mouse/touch
  $grid.addEventListener("click", (e) => {
    const card = e.target.closest("article.card[data-slug]");
    if (!card) return;
    const slug = card.getAttribute("data-slug");
    if (slug) location.href = `/detail.html?slug=${slug}`;
  });

  // Teclado: Enter o Espacio
  $grid.addEventListener("keydown", (e) => {
    const card = e.target.closest("article.card[data-slug]");
    if (!card) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const slug = card.getAttribute("data-slug");
      if (slug) location.href = `/detail.html?slug=${slug}`;
    }
  });
}

function setRegion(region, { push = false } = {}) {
  state.current = region;

  const url = new URL(location.href);
  if (region) url.searchParams.set("region", region);
  else url.searchParams.delete("region");
  if (push) history.pushState({ region }, "", url);

  renderGrid();
}

async function init() {
  state.all = await dataRecipes();

  const present = new Set(
    state.all.map((r) => normRegion(r.region)).filter(Boolean)
  );

  // Muestra SIEMPRE todas las regiones en este orden
  state.regions = ORDER.slice();

  const params = new URLSearchParams(location.search);
  const initialRegion = normRegion(params.get("region"));
  state.current = initialRegion && ORDER.includes(initialRegion) ? initialRegion : null;

  renderFilters();
  renderGrid();
  attachCardNavigation(); // ← añade navegación por card

  window.addEventListener("popstate", (e) => {
    const region =
      (e.state && e.state.region) ||
      normRegion(new URL(location.href).searchParams.get("region"));
    setRegion(region || null, { push: false });
  });
}

if (document.readyState !== "loading") {
  init().catch((e) => console.error(e));
} else {
  document.addEventListener("DOMContentLoaded", () =>
    init().catch((e) => console.error(e))
  );
}
