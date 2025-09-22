export const config = {
  api: { bodyParser: true }, // نحتاج JSON جاهز
};

const OK = (res, data = { ok: true }) => res.status(200).json(data);
const NG = (res, code = 400, msg = 'Bad Request') => res.status(code).json({ ok: false, error: msg });

export default async function handler(req, res) {
  if (req.method !== 'POST') return NG(res, 405, 'Method Not Allowed');

  // أمان بسيط: توقّع token بالـ query
  const token = req.query.token;
  if (!token || token !== process.env.WEBHOOK_TOKEN) return NG(res, 401, 'Unauthorized');

  const payload = req.body || {};
  // عادة بيكون في payload.id أو payload.order_id
  const orderId = payload.id || payload.order_id;

  // ممكن تلوّج وتكمل معالجة حسب حاجتك
  console.log('[EasyOrders webhook] payload:', payload);

  // (اختياري) تجيب تفاصيل الطلب وتخزنها/تحدّثها:
  if (orderId) {
    try {
      const r = await fetch(`${process.env.EASYORDERS_BASE}/orders/${orderId}`, {
        headers: { 'Api-Key': process.env.EASYORDERS_API_KEY }
      });
      const order = await r.json();
      console.log('[EasyOrders webhook] fetched order:', order);

      // مثال: تضيف Note — فعّل عند حاجتك
      /*
      await fetch(`${process.env.EASYORDERS_BASE}/order-notes`, {
        method: 'POST',
        headers: {
          'Api-Key': process.env.EASYORDERS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order_id: orderId,
          type: 'public',
          note: 'Received via webhook'
        })
      });
      */
    } catch (e) {
      console.error('Webhook post-fetch error:', e);
      // نبقي الاستجابة 200 عشان EasyOrders ما يعيد المحاولة بلا نهاية
    }
  }

  return OK(res);
}
