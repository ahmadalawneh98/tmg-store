// /api/products.js (supports list + get-one via ?id=)
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.status(204).end();
  }

  const API_BASE = 'https://api.easy-orders.net/api/v1/external-apps/products';
  const API_KEY = process.env.EASY_ORDERS_API_KEY;

  // ✅ get-one by id (NO join here)
  const { id } = req.query;
  if (id) {
    try {
      const url = `${API_BASE}/${encodeURIComponent(String(id))}`; // ← no join
      console.log('[ProductsProxy:get-one] →', url);

      const r = await fetch(url, {
        headers: { 'Api-Key': API_KEY, 'Accept': 'application/json' }
      });
      const body = await r.text();

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
      return res.status(r.status).send(body);
    } catch (e) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(500).json({ error: 'Proxy failed (get-one)', detail: String(e) });
    }
  }

  // 🔁 products list with pass-through params
  try {
    const url = new URL(API_BASE);

    // pass basics
    const pass = ['page', 'limit', 'sort', 'fields', 'join'];
    for (const k of pass) if (req.query[k]) url.searchParams.set(k, String(req.query[k]));

    // support filter / filters
    const append = v => url.searchParams.append('filter', v);
    const { filter, filters } = req.query;
    if (Array.isArray(filter)) filter.forEach(append);
    else if (typeof filter === 'string') append(filter);
    if (Array.isArray(filters)) filters.forEach(append);
    else if (typeof filters === 'string') append(filters);

    // forward any other params (excluding ones already handled)
    for (const [k, v] of Object.entries(req.query)) {
      if (pass.includes(k) || k === 'filter' || k === 'filters' || k === 'id') continue;
      if (Array.isArray(v)) v.forEach(x => url.searchParams.append(k, x));
      else if (typeof v === 'string') url.searchParams.set(k, v);
    }

    console.log('[ProductsProxy:list] →', url.toString());
    const r = await fetch(url.toString(), {
      headers: { 'Api-Key': API_KEY, 'Accept': 'application/json' }
    });
    const body = await r.text();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.status(r.status).send(body);
  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: 'Proxy failed (list)', detail: String(e) });
  }
}
