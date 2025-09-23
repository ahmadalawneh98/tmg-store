// /api/orders.js — single-read parsing + env fallbacks
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    // استخدم أي اسم متاح للمفتاح + المسار الصحيح
    const API_BASE =
      process.env.EASYORDERS_BASE ||
      'https://api.easy-orders.net/api/v1/external-apps';
    const API_KEY =
      process.env.EASYORDERS_API_KEY ||        // بدون underscore
      process.env.EASY_ORDERS_API_KEY;         // مع underscore

    if (!API_KEY) {
      return res.status(500).json({
        ok: false,
        error: 'Missing API key',
        detail: 'Set EASYORDERS_API_KEY or EASY_ORDERS_API_KEY in Vercel env.',
      });
    }

    const orderData = req.body || {};

    const r = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Api-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    // ✅ اقرأ مرة واحدة كنص، ثم حاول JSON.parse
    const text = await r.text();
    let payload;
    try { payload = JSON.parse(text); } catch { payload = { raw: text }; }

    if (!r.ok) {
      return res.status(r.status).json({
        ok: false,
        error: 'Create order failed',
        status: r.status,
        response: payload,
      });
    }

    return res.status(r.status).json(payload);
  } catch (e) {
    console.error('Order create error:', e);
    return res.status(500).json({
      ok: false,
      error: 'Failed to create order',
      detail: String(e),
    });
  }
}
