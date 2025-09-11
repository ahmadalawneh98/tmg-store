// /api/categories.js (supports list + optional get-one via ?id=)
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.status(204).end();
  }

  const API_BASE = 'https://api.easy-orders.net/api/v1/external-apps/categories';
  const API_KEY = process.env.EASY_ORDERS_API_KEY;

  // ✅ اختيارياً: دعم جلب تصنيف واحد بالـ id
  const { id } = req.query;
  if (id) {
    try {
      const url = `${API_BASE}/${encodeURIComponent(String(id))}`;
      console.log('[CategoriesProxy:get-one] →', url);

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

  // قائمة التصنيفات
  try {
    const url = new URL(API_BASE + '/'); // لاحظ السلاش الأخيرة للتماشي مع أساسك السابق
    const { filter, filters } = req.query;

    const appendFilter = (val) => url.searchParams.append('filter', val);
    if (Array.isArray(filter)) filter.forEach(appendFilter);
    else if (typeof filter === 'string') appendFilter(filter);

    if (Array.isArray(filters)) filters.forEach(appendFilter);
    else if (typeof filters === 'string') appendFilter(filters);

    console.log('[CategoriesProxy:list] →', url.toString());
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
