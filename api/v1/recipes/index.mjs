// api/v1/recipes/index.mjs
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

export const config = { runtime: 'nodejs' }; // fuerza runtime Node.js (no Edge)

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  try {
    // Ruta al JSON (ajústala si tu archivo mueve de sitio)
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const filePath = path.join(__dirname, '../../../data/peruvian_recipes.json');

    const raw = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    let items = Array.isArray(parsed) ? parsed : (parsed.items || []);

    // Parseo de query
    const url = new URL(req.url, `http://${req.headers.host}`);
    const q = url.searchParams;

    const region = (q.get('region') || '').toLowerCase();
    if (region) items = items.filter(r => (r.region || '').toLowerCase() === region);

    const slug = (q.get('slug') || '').toLowerCase();
    if (slug) items = items.filter(r => (r.slug || '').toLowerCase() === slug);

    const limit = parseInt(q.get('limit') || '0', 10);
    if (limit > 0) items = items.slice(0, limit);

    res.status(200).json({ version: 'v1', total: items.length, items });
  } catch (err) {
    console.error('recipes/index error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
