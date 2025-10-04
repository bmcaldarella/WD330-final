import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, "../../../data/peruvian_recipes.json");

let DATA = null;
function getData() {
  if (!DATA) {
    const json = JSON.parse(readFileSync(dataPath, "utf-8"));
    DATA = json.items ?? json; // acepta {items: []} o []
  }
  return DATA;
}

const norm = (s) =>
  s?.toString().toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "");

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=120");

  const {
    q, ingredient, category, region, difficulty, tag,
    time_lte, time_gte, page = "1", limit = "20",
  } = req.query;

  let list = getData();

  // Búsqueda libre
  if (q) {
    const term = norm(q);
    list = list.filter(r =>
      norm(r.name)?.includes(term) ||
      norm(r.slug)?.includes(term) ||
      r.tags?.some(t => norm(t).includes(term)) ||
      r.ingredients?.some(i => norm(i.name).includes(term))
    );
  }

  // Filtros
  if (ingredient) {
    const term = norm(ingredient);
    list = list.filter(r => r.ingredients?.some(i => norm(i.name).includes(term)));
  }
  if (category)   list = list.filter(r => norm(r.category)   === norm(category));
  if (region)     list = list.filter(r => norm(r.region)     === norm(region));
  if (difficulty) list = list.filter(r => norm(r.difficulty) === norm(difficulty));
  if (tag)        list = list.filter(r => r.tags?.some(t => norm(t) === norm(tag)));

  // Tiempo (usa total_time_min del dataset)
  if (time_lte)   list = list.filter(r => Number(r.total_time_min ?? 0) <= Number(time_lte));
  if (time_gte)   list = list.filter(r => Number(r.total_time_min ?? 0) >= Number(time_gte));

  // Paginación
  const p = Math.max(1, parseInt(page, 10));
  const l = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const start = (p - 1) * l;
  const items = list.slice(start, start + l);

  return res.status(200).json({
    version: "v1",
    total: list.length,
    page: p,
    limit: l,
    items
  });
}
