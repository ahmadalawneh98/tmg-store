// /api/categories.js
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.status(204).end();
  }

  const API_BASE = 'https://api.easy-orders.net/api/v1/external-apps/categories/';
  const API_KEY = process.env.EASY_ORDERS_API_KEY;

  const { filter } = req.query; // NOTE: اسم الباراميتر filter
  const url = new URL(API_BASE);

  // ادعم تكرار filter
  if (Array.isArray(filter)) {
    filter.forEach(f => url.searchParams.append('filter', f));
  } else if (typeof filter === 'string') {
    url.searchParams.append('filter', filter);
  }

  try {
    const r = await fetch(url.toString(), {
      headers: {
        'Api-Key': API_KEY,                 // ← مهم
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
