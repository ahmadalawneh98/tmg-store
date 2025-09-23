// /api/orders.js — use /api/v1/orders (no external-apps)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const API_BASE =
      process.env.EASYORDERS_BASE || 'https://api.easy-orders.net/api/v1'; // 👈 بدون external-apps
    const API_KEY =
      process.env.EASYORDERS_API_KEY || process.env.EASY_ORDERS_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ ok: false, error: 'Missing API key' });
    }

    const orderData = req.body || {};
    const url = `${API_BASE}/orders`; // 👈 المسار الصحيح

    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Api-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    const text = await r.text();
    let payload; try { payload = JSON.parse(text); } catch { payload = { raw: text }; }

    if (!r.ok) {
      return res.status(r.status).json({
        ok: false,
        error: 'Create order failed',
        status: r.status,
        url,
        response: payload,
      });
    }

    return res.status(r.status).json(payload);
  } catch (e) {
    console.error('Order create error:', e);
    return res.status(500).json({ ok: false, error: 'Failed to create order', detail: String(e) });
  }
}
