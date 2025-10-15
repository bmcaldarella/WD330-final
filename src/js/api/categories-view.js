// src/js/api/categories-view.js
import { dataRecipes } from "./mealdb.js";

// --- Helpers de ruta/asset (soporta despliegue en subcarpeta) ---
const BASE = (import.meta?.env?.BASE_URL) ? import.meta.env.BASE_URL : '/';
const asset = (p) => `${BASE}${String(p).replace(/^\/+/, '')}`;

// --- Región / etiquetas ---
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

// --- Normalización de texto (búsqueda) ---
function normText(t = "") {
  return String(t)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "");
}

// ✅ Imagen segura con fallback real a /img/logo.png
function safeImage(src) {
  return (typeof src === "string" && src.trim() !== "") ? src : asset('img/logo.png');
}

const ORDER = ["coast", "jungle", "highlands", "national"];

const state = {
  all: [],
  regions: [],
  current: null,
  search: "",
};

// ================= UI =================
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

// 🔎 Searchbar (usa HTML existente)
function setupSearchBar() {
  const form = document.getElementById("recipe-search-form");
  const input = document.getElementById("recipe-search");
  const clear = document.getElementById("recipe-search-clear");
  if (!form || !input) return;

  const params = new URLSearchParams(location.search);
  const q = (params.get("q") || "").trim();
  if (q) { state.search = q; input.value = q; }

  let t;
  input.addEventListener("input", () => {
    clear?.toggleAttribute("hidden", input.value.length === 0);
    clearTimeout(t);
    t = setTimeout(() => setSearch(input.value, { push: true }), 200);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    setSearch(input.value, { push: true });
  });

  clear?.addEventListener("click", () => {
    input.value = "";
    input.focus();
    setSearch("", { push: true });
  });

  clear?.toggleAttribute("hidden", input.value.length === 0);
}

// Lista filtrada
function getFilteredList() {
  const byRegion = state.current
    ? state.all.filter((r) => normRegion(r.region) === state.current)
    : state.all;

  if (!state.search) return byRegion;

  const needle = normText(state.search);
  return byRegion.filter((r) => normText(r.name).includes(needle));
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

  const suffix = state.search ? ` • “${state.search}”` : "";
  $title.textContent = state.current
    ? `Region: ${labelRegion(state.current)}${suffix}`
    : `All regions${suffix}`;

  const list = getFilteredList();
  if (!list.length) {
    $grid.innerHTML = `<p class="empty">No recipes found${state.current ? ` for ${labelRegion(state.current)}` : ""}${state.search ? ` matching “${state.search}”` : ""}.</p>`;
    return;
  }

  // 🧠 Fallback doble: safeImage + onerror (404)
  $grid.innerHTML = list.map((r) => `
    <article class="card" data-slug="${encodeURIComponent(r.slug)}" tabindex="0" role="button" aria-label="View ${r.name}">
      <div class="categories">
        <img
          src="${safeImage(r.image)}"
          alt="${r.name}"
          loading="lazy"
          onerror="this.onerror=null; this.src='${asset('img/logo.png')}';"
        >
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
  `).join("");

  $grid.querySelectorAll(".card .btn").forEach((a) => {
    a.addEventListener("click", (e) => e.stopPropagation());
  });
}

function attachCardNavigation() {
  const $grid = document.querySelector("#categories-grid");
  if (!$grid) return;

  $grid.addEventListener("click", (e) => {
    const card = e.target.closest("article.card[data-slug]");
    if (!card) return;
    const slug = card.getAttribute("data-slug");
    if (slug) location.href = `/detail.html?slug=${slug}`;
  });

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

// ===== Estado / URL =====
function setRegion(region, { push = false } = {}) {
  state.current = region;
  const url = new URL(location.href);
  if (region) url.searchParams.set("region", region);
  else url.searchParams.delete("region");
  if (state.search) url.searchParams.set("q", state.search);
  else url.searchParams.delete("q");
  if (push) history.pushState({ region, q: state.search }, "", url);
  renderGrid();
}
function setSearch(q, { push = false } = {}) {
  state.search = (q || "").trim();
  const url = new URL(location.href);
  if (state.current) url.searchParams.set("region", state.current);
  else url.searchParams.delete("region");
  if (state.search) url.searchParams.set("q", state.search);
  else url.searchParams.delete("q");
  if (push) history.pushState({ region: state.current, q: state.search }, "", url);
  renderGrid();
}

// ===== Init =====
async function init() {
  state.all = await dataRecipes();
  state.regions = ORDER.slice();

  const params = new URLSearchParams(location.search);
  const initialRegion = normRegion(params.get("region"));
  const q = (params.get("q") || "").trim();

  state.current = initialRegion && ORDER.includes(initialRegion) ? initialRegion : null;
  state.search = q;

  renderFilters();
  setupSearchBar();
  renderGrid();
  attachCardNavigation();

  window.addEventListener("popstate", (e) => {
    const region =
      (e.state && e.state.region) ||
      normRegion(new URL(location.href).searchParams.get("region"));
    const query =
      (e.state && e.state.q) ||
      (new URL(location.href).searchParams.get("q") || "");
    state.current = region || null;
    state.search = query || "";
    const input = document.getElementById("recipe-search");
    if (input) input.value = state.search;
    renderGrid();
  });
}

if (document.readyState !== "loading") {
  init().catch((e) => console.error(e));
} else {
  document.addEventListener("DOMContentLoaded", () =>
    init().catch((e) => console.error(e))
  );
}
