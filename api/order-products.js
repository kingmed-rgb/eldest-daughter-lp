// Private, read-only: what each paid order actually contained, read from Stripe (product names on the checkout),
// so buyers can be split by language from the product itself instead of guessing from the price.
// Locked with BACKFILL_TOKEN.   /api/order-products?token=...&since=2026-01-01
const crypto = require('crypto');

function tokenOk(given) {
  const want = (process.env.BACKFILL_TOKEN || '').trim();
  if (!want || !given) return false;
  return crypto.timingSafeEqual(crypto.createHash('sha256').update(String(given)).digest(), crypto.createHash('sha256').update(want).digest());
}

async function stripe(path) {
  const res = await fetch('https://api.stripe.com/v1/' + path, { headers: { Authorization: 'Bearer ' + (process.env.STRIPE_SECRET_KEY || '').trim() } });
  const data = await res.json();
  if (!res.ok) throw new Error((data.error && data.error.message) || 'Stripe request failed');
  return data;
}

// Spanish products are named in Spanish (síndrome de la hija mayor, querida hija mayor, el diario de la hija mayor...)
const isSpanish = (name) => /s[ií]ndrome|hija mayor|diario de la|querida|poemas|libro/i.test(name);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  const q = req.query || {};
  if (!tokenOk(q.token)) return res.status(404).json({ error: 'not found' });
  const since = /^\d{4}-\d{2}-\d{2}$/.test(q.since || '') ? Math.floor(new Date(q.since + 'T00:00:00Z') / 1000) : 0;
  try {
    const sessions = [];
    let after = null;
    for (let page = 0; page < 30; page++) {
      const list = await stripe('checkout/sessions?limit=100&status=complete' + (since ? '&created[gte]=' + since : '') + (after ? '&starting_after=' + after : ''));
      sessions.push(...list.data.filter((s) => s.payment_status === 'paid'));
      if (!list.has_more) break;
      after = list.data[list.data.length - 1].id;
    }
    const orders = [];
    for (let i = 0; i < sessions.length; i += 8) {
      const batch = await Promise.all(sessions.slice(i, i + 8).map(async (s) => {
        const items = await stripe('checkout/sessions/' + s.id + '/line_items?limit=20').catch(() => ({ data: [] }));
        const products = items.data.map((li) => li.description || (li.price && li.price.product) || '?');
        const lang = (s.metadata && s.metadata.page) || (products.some(isSpanish) ? 'es' : products.length ? 'en' : 'unknown');
        return {
          session: s.id, date: new Date(s.created * 1000).toISOString().slice(0, 10), amount: (s.amount_total || 0) / 100,
          email: (s.customer_details && s.customer_details.email) || s.customer_email || '', products, lang,
          paperback: products.some((p) => /paperback/i.test(p)), payment_link: s.payment_link || '',
        };
      }));
      orders.push(...batch);
    }
    const counts = {};
    for (const o of orders) counts[o.lang] = (counts[o.lang] || 0) + 1;
    return res.status(200).json({ orders: orders.length, counts, list: orders });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
