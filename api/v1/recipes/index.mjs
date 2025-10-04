import data from '../../../data/peruvian_recipes.json' assert { type: 'json' };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url, `http://${req.headers.host}`);
  const q = url.searchParams;

  // filtro simple: ?limit= ?region= ?slug=
  let items = data.items || [];

  const region = (q.get('region') || '').toLowerCase();
  if (region) items = items.filter(r => (r.region || '').toLowerCase() === region);

  const slug = (q.get('slug') || '').toLowerCase();
  if (slug) items = items.filter(r => (r.slug || '').toLowerCase() === slug);

  const limit = parseInt(q.get('limit') || '0', 10);
  if (limit > 0) items = items.slice(0, limit);

  res.status(200).json({ version: 'v1', total: items.length, items });
}
