// /api/categories.js  (TEMP ONLY - not secure)
const API_KEY = 'c27632d4-d811-40a7-bbaa-bc41ad1f98d2';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.status(204).end();
  }

  const API_BASE = 'https://api.easy-orders.net/api/v1/external-apps/categories/';
  const { filters } = req.query;

  const url = new URL(API_BASE);
  if (Array.isArray(filters)) {
    filters.forEach(f => url.searchParams.append('filter', f));
  } else if (typeof filters === 'string') {
    url.searchParams.append('filter', filters);
  }

  try {
    const r = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    });

    const body = await r.text();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.status(r.status).send(body);
  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: 'Proxy failed', detail: String(e) });
  }
}
