// /api/orders.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const API_BASE = process.env.EASYORDERS_BASE || "https://api.easy-orders.net/api/v1";
    const API_KEY = process.env.EASYORDERS_API_KEY;

    // البيانات اللي جايه من front-end (cart, customer info, ...)
    const orderData = req.body;

    // إرسال الطلب إلى EasyOrders
    const r = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Api-Key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    const result = await r.json();

    return res.status(r.status).json(result);
  } catch (e) {
    console.error('Order create error:', e);
    return res.status(500).json({ ok: false, error: 'Failed to create order', detail: String(e) });
  }
}
