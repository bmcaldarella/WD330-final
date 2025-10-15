// src/js/detail-page.js
import { dataRecipes } from "./api/mealdb.js";
import { isFavorite } from "./storage.js";
import { enableFavoriteButtons } from "./fav-ui.js";

const log = (...a) => console.log("[detail]", ...a);
const el = (s) => document.querySelector(s);

// --- Rutas/asset seguras (soporta subcarpeta con Vite) ---
const BASE = (import.meta?.env?.BASE_URL) ? import.meta.env.BASE_URL : '/';
const asset = (p) => `${BASE}${String(p).replace(/^\/+/, '')}`;
const safeImage = (src) => (typeof src === "string" && src.trim() !== "") ? src : asset('img/logo.png');

async function getRecipe({ slug, id }) {
  try {
    if (slug) {
      const bySlug = await dataRecipes({ slug });
      if (Array.isArray(bySlug) && bySlug.length) {
        const m = bySlug.find(r => (r.slug || "").toLowerCase() === slug.toLowerCase());
        if (m) return m;
      }
    }
    if (id) {
      const byId = await dataRecipes({ id });
      if (Array.isArray(byId) && byId.length) {
        const m = byId.find(r => String(r.id) === String(id));
        if (m) return m;
      }
    }
  } catch (e) {
    log("direct query failed; fallback to all", e);
  }
  const all = await dataRecipes();
  if (slug) {
    const m = all.find(r => (r.slug || "").toLowerCase() === slug.toLowerCase());
    if (m) return m;
  }
  if (id) {
    const m = all.find(r => String(r.id) === String(id));
    if (m) return m;
  }
  return null;
}

async function fetchNutritionFromSpoonacular(recipeName) {
  const API_KEY = "b9f0ee181d8145178341b2cdc986f2db";
  const searchUrl = `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(recipeName)}&number=1&apiKey=${API_KEY}`;

  const res1 = await fetch(searchUrl);
  if (!res1.ok) throw new Error(`Spoonacular search failed: ${res1.status}`);
  const data1 = await res1.json();
  const hit = data1.results?.[0];
  if (!hit?.id) return null;

  const nutriUrl = `https://api.spoonacular.com/recipes/${hit.id}/nutritionWidget.json?apiKey=${API_KEY}`;
  const res2 = await fetch(nutriUrl);
  if (!res2.ok) throw new Error(`Spoonacular nutrition failed: ${res2.status}`);
  const data2 = await res2.json();
  return data2;
}

function fmtMins(n){ return (typeof n === "number" && !Number.isNaN(n)) ? `${n} min` : "—"; }
function safeJoin(arr){ return Array.isArray(arr) ? arr.join(", ") : "—"; }

function renderError(msg){
  const root = el("#detail-root");
  if (root) root.innerHTML = `<p role="alert" style="opacity:.9">${msg}</p>`;
}

function renderDetail(r){
  const root = el("#detail-root");
  if (!root) return;
  if (!r) { renderError("Recipe not found."); return; }

  // ✅ imagen principal con fallback + onerror
  const imgSrc = safeImage(r.image);
  const ytQuery   = encodeURIComponent(r.youtube_query || `${r.name} recipe`);
  const wikiTitle = r.wikipedia_title ? encodeURIComponent(r.wikipedia_title) : encodeURIComponent(r.name);
  const wikiLang  = r.wikipedia_lang_pref || "en";

  // ⭐ botón de favoritos
  const favId = r.id || r.slug;
  const favActive = isFavorite(favId);
  const favBtn = `
    <button type="button"
            class="btn ghost fav-btn ${favActive ? 'is-fav' : ''}"
            data-fav-btn
            data-recipe-id="${favId}"
            data-recipe-slug="${r.slug || ''}"
            data-recipe-name="${r.name}"
            data-recipe-thumb="${imgSrc}"
            aria-pressed="${favActive}">
      <span aria-hidden="true">⭐</span>
      <span data-fav-text>${favActive ? 'Added' : 'Add to Favorites'}</span>
    </button>
  `;

  // 📤 botón de compartir
  const shareBtn = `
    <button type="button" class="btn ghost" data-share-btn>
      <span aria-hidden="true">📤</span>
      <span>Share</span>
    </button>
  `;

  root.innerHTML = `
    <div class="detail-grid">
      <div class="container-detail">
        <img class="hero-img"
             src="${imgSrc}"
             alt="${r.name}"
             onerror="this.onerror=null; this.src='${asset('img/logo.png')}';">
      </div>
      <div>
        <h1 style="margin:.2rem 0 0.2rem">${r.name}</h1>
        <div class="meta-chips">
          <span class="chip">${r.region ?? "—"}</span>
          <span class="chip">${r.category ?? "—"}</span>
          <span class="chip">${r.difficulty ?? "—"}</span>
          <span class="chip">Servings: ${r.servings ?? "—"}</span>
        </div>
        <div class="facts">
          <span class="chip">Prep: ${fmtMins(r.prep_time_min)}</span>
          <span class="chip">Cook: ${fmtMins(r.cook_time_min)}</span>
          <span class="chip">Total: ${fmtMins(r.total_time_min)}</span>
          <span class="chip">Tags: ${safeJoin(r.tags)}</span>
        </div>

        <div class="btnbar">
          <a class="btn" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${ytQuery}">Watch on YouTube</a>
          <a class="btn ghost" target="_blank" rel="noopener" href="https://${wikiLang}.wikipedia.org/wiki/${wikiTitle}">Wikipedia</a>
          <a class="btn ghost" target="_blank" rel="noopener" href="https://www.google.com/search?q=${encodeURIComponent(r.name)}+recipe">Search on Google</a>
          ${shareBtn}
          ${favBtn}
        </div>

        <div class="two-col">
          <div class="card-pane">
            <h3>Ingredients</h3>
            <ul>
              ${
                Array.isArray(r.ingredients) && r.ingredients.length
                  ? r.ingredients.map(i => {
                      const qty = (i.quantity ?? "").toString();
                      const unit = i.unit ?? "";
                      const name = i.name ?? "";
                      const note = i.notes ? ` <em>(${i.notes})</em>` : "";
                      const left = [qty, unit].filter(Boolean).join(" ");
                      return `<li>${left ? `<strong>${left}</strong> — ` : ""}${name}${note}</li>`;
                    }).join("")
                  : "<li>—</li>"
              }
            </ul>
          </div>
          <div class="card-pane">
            <h3>Steps</h3>
            ${
              Array.isArray(r.steps) && r.steps.length
                ? `<ol>${r.steps.map(s => `<li>${s}</li>`).join("")}</ol>`
                : "<p>—</p>"
            }
          </div>
        </div>

        <div class="two-col">
          <div class="card-pane">
            <h3>Allergens</h3>
            <div class="facts">
              ${
                Array.isArray(r.allergens) && r.allergens.length
                  ? r.allergens.map(a => `<span class="chip">${a}</span>`).join("")
                  : "<span class='chip'>None listed</span>"
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function attachAlsoFromRegion(r, all) {
  const sec = el("#also-root");
  const grid = el("#also-grid");
  if (!sec || !grid || !r) return;

  const region = (r.region || "").toLowerCase();
  const also = (all || []).filter(x => (x.slug !== r.slug) && ((x.region||"").toLowerCase() === region)).slice(0, 6);
  if (!also.length) return;

  sec.hidden = false;
  grid.innerHTML = also.map(x => `
    <article class="also-card" data-slug="${encodeURIComponent(x.slug)}" tabindex="0" role="button" aria-label="View ${x.name}">
      <img
        src="${safeImage(x.image)}"
        alt="${x.name}"
        onerror="this.onerror=null; this.src='${asset('img/logo.png')}';">
      <h4>${x.name}</h4>
    </article>
  `).join("");

  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".also-card[data-slug]");
    if (!card) return;
    location.href = `/detail.html?slug=${card.getAttribute("data-slug")}`;
  });
  grid.addEventListener("keydown", (e) => {
    const card = e.target.closest(".also-card[data-slug]");
    if (!card) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      location.href = `/detail.html?slug=${card.getAttribute("data-slug")}`;
    }
  });
}

let shareHandlerBound = false;

async function initDetail() {
  const root = el("#detail-root");
  if (!root) { console.error("#detail-root no existe"); return; }

  const params = new URLSearchParams(location.search);
  const slug = (params.get("slug") || "").trim();
  const id   = (params.get("id")   || "").trim();
  log("slug:", slug, "id:", id);

  if (!slug && !id) { renderError("Missing recipe id/slug."); return; }

  try {
    root.innerHTML = `<p>Loading recipe…</p>`;

    const recipe = await getRecipe({ slug, id });
    log("recipe:", recipe);
    renderDetail(recipe);

    // Botones de favoritos (estado/aria-pressed)
    enableFavoriteButtons();

    // 📤 Share (delegado, una sola vez)
    if (!shareHandlerBound) {
      document.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-share-btn]');
        if (!btn) return;

        // Construye URL compartible
        const url = new URL(location.href);
        url.searchParams.set('utm_source', 'share');
        url.searchParams.set('utm_medium', 'button');
        const shareUrl = url.toString();

        const title = `Recipe: ${recipe.name}`;
        const text  = `Check out this Peruvian recipe: ${recipe.name}`;

        if (navigator.share) {
          try {
            await navigator.share({ title, text, url: shareUrl });
            return;
          } catch (err) {
            console.debug('[share] fallback:', err?.message);
          }
        }

        try {
          await navigator.clipboard.writeText(shareUrl);
          btn.innerHTML = '✅ Copied!';
          setTimeout(() => (btn.innerHTML = '<span aria-hidden="true">📤</span><span>Share</span>'), 1500);
          return;
        } catch (_) {
          const encoded = encodeURIComponent(shareUrl);
          const textEnc = encodeURIComponent(`Check out this recipe: ${recipe.name}`);
          // Último fallback: WhatsApp (puedes cambiar por tu preferido)
          window.open(`https://api.whatsapp.com/send?text=${textEnc}%20${encoded}`, '_blank');
        }
      });
      shareHandlerBound = true;
    }

    // (Opcional) Nutrición extra
    const extraBox = el("#extra-nutrition");
    if (extraBox && recipe?.name) {
      extraBox.hidden = false;
      extraBox.innerHTML = `<h3>Nutrition (from API)</h3><p>Loading nutrition…</p>`;
      try {
        const nutri = await fetchNutritionFromSpoonacular(recipe.name);
        extraBox.innerHTML = nutri ? `
            <h3>Nutrition</h3>
            <ul>
              <li>Calories: ${nutri.calories}</li>
              <li>Carbs: ${nutri.carbs}</li>
              <li>Fat: ${nutri.fat}</li>
              <li>Protein: ${nutri.protein}</li>
            </ul>
            <small style="opacity:.7">Source: Spoonacular</small>
        ` : `<h3>Nutrition</h3><p>No data found.</p>`;
      } catch (e) {
        console.error("Spoonacular error:", e);
        extraBox.innerHTML = `<h3>Nutrition</h3><p>Error loading nutrition.</p>`;
      }
    }

    const all = await dataRecipes();
    attachAlsoFromRegion(recipe, all);

  } catch (err) {
    console.error("detail error:", err);
    renderError("Error loading recipe.");
  }
}

export { initDetail };

if (document.readyState !== "loading") initDetail();
else document.addEventListener("DOMContentLoaded", initDetail);
