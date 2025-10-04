import { dataRecipes } from "./api/mealdb.js";

const log = (...a) => console.log("[detail]", ...a);
const el = (s) => document.querySelector(s);

async function getRecipeBySlug(slug) {
  try {
    const bySlug = await dataRecipes({ slug });
    if (Array.isArray(bySlug) && bySlug.length) {
      const match = bySlug.find(r => (r.slug || "").toLowerCase() === slug.toLowerCase());
      if (match) return match;
    }
  } catch (e) {
    log("API slug query failed; fallback to all", e);
  }
  const all = await dataRecipes();
  return all.find(r => (r.slug || "").toLowerCase() === slug.toLowerCase());
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
  return data2; // { calories, carbs, fat, protein, ... (strings) }
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

  const kcal = r.nutrition?.kcal ?? "—";
  const p = r.nutrition?.protein_g ?? "—";
  const f = r.nutrition?.fat_g ?? "—";
  const c = r.nutrition?.carbs_g ?? "—";
  const imgSrc = (r.image && r.image.trim() !== "") ? r.image : "/img/prueba.jpg";
  const ytQuery = encodeURIComponent(r.youtube_query || `${r.name} recipe`);
  const wikiTitle = r.wikipedia_title ? encodeURIComponent(r.wikipedia_title) : encodeURIComponent(r.name);
  const wikiLang = r.wikipedia_lang_pref || "en";

  root.innerHTML = `
    <div class="detail-grid">
      <div>
        <img class="hero-img" src="${imgSrc}" alt="${r.name}">
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
      <img src="${x.image && x.image.trim() !== "" ? x.image : "/img/prueba.jpg"}" alt="${x.name}">
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

async function initDetail() {
  const root = el("#detail-root");
  if (!root) { console.error("#detail-root no existe"); return; }

  const params = new URLSearchParams(location.search);
  const slug = (params.get("slug") || "").trim();
  log("slug:", slug);

  if (!slug) { renderError("Missing recipe slug. Ej: detail.html?slug=ceviche"); return; }

  try {
    root.innerHTML = `<p>Loading recipe…</p>`;

    const recipe = await getRecipeBySlug(slug);
    log("recipe:", recipe);
    renderDetail(recipe);

    const extraBox = el("#extra-nutrition");
    if (extraBox && recipe?.name) {
      extraBox.hidden = false;
      extraBox.innerHTML = `<h3>Nutrition (from API)</h3><p>Loading nutrition…</p>`;

      try {
        const nutri = await fetchNutritionFromSpoonacular(recipe.name);
        if (nutri) {
          extraBox.innerHTML = `
            <h3 >Nutrition</h3>
            <ul >
              <li>Calories: ${nutri.calories}</li>
              <li>Carbs: ${nutri.carbs}</li>
              <li>Fat: ${nutri.fat}</li>
              <li>Protein: ${nutri.protein}</li>
            </ul>
            <small style="opacity:.7">Source: Spoonacular</small>
          `;
        } else {
          extraBox.innerHTML = `<h3>Nutrition</h3><p>No data found.</p>`;
        }
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
