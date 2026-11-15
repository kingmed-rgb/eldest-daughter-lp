// One-off: send the download email to buyers who paid before the webhook existed.
// Protected by BACKFILL_TOKEN (Vercel env). Each payment is marked in Stripe after its
// email goes out (metadata.delivery_email), so running this again never emails anyone twice.
//
//   GET ?token=…&dry=1            list who would get an email (emails masked)
//   GET ?token=…&max=10           send up to 10, oldest first; run again until remaining is 0
//   optional &since=2026-10-23    start date (UTC)

const crypto = require('crypto');
const { sendFor, stripeGet, languageOf } = require('./stripe-webhook.js');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mask = (e) => (e ? e.replace(/^(.).*?(.)?@/, (m, a, b) => a + '***' + (b || '') + '@') : null);

function tokenOk(given) {
  const want = (process.env.BACKFILL_TOKEN || '').trim();
  if (!want || !given) return false;
  const a = crypto.createHash('sha256').update(String(given)).digest();
  const b = crypto.createHash('sha256').update(want).digest();
  return crypto.timingSafeEqual(a, b);
}

async function paidSessionsSince(since) {
  const out = [];
  let after;
  for (let page = 0; page < 20; page++) {
    const q = new URLSearchParams({ limit: '100', status: 'complete', 'created[gte]': String(since) });
    q.append('expand[]', 'data.payment_intent.latest_charge');
    if (after) q.set('starting_after', after);
    const list = await stripeGet('checkout/sessions?' + q.toString());
    out.push(...list.data);
    if (!list.has_more || !list.data.length) break;
    after = list.data[list.data.length - 1].id;
  }
  return out.sort((a, b) => a.created - b.created);
}

function classify(s) {
  const pi = s.payment_intent && typeof s.payment_intent === 'object' ? s.payment_intent : null;
  const charge = pi && pi.latest_charge && typeof pi.latest_charge === 'object' ? pi.latest_charge : null;
  const email = (s.customer_details && s.customer_details.email) || s.customer_email;
  if (s.mode !== 'payment' || s.payment_status !== 'paid') return 'not paid';
  if (!email) return 'no email';
  if (charge && (charge.refunded || charge.amount_refunded > 0)) return 'refunded';
  if (pi && pi.metadata && pi.metadata.delivery_email) return 'already emailed';
  return 'to send';
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  const q = req.query || {};
  if (!tokenOk(q.token)) return res.status(404).json({ error: 'not found' });

  const since = Math.floor(Date.parse((q.since || '2026-10-23') + 'T00:00:00Z') / 1000);
  const max = Math.min(Math.max(parseInt(q.max, 10) || 10, 1), 25);

  try {
    const sessions = await paidSessionsSince(since);
    const rows = sessions.map((s) => ({
      session: s.id,
      date: new Date(s.created * 1000).toISOString().slice(0, 10),
      lang: languageOf(s),
      amount: s.amount_total / 100,
      email: mask((s.customer_details && s.customer_details.email) || s.customer_email),
      state: classify(s),
      _s: s,
    }));
    const todo = rows.filter((r) => r.state === 'to send');
    const counts = rows.reduce((m, r) => ((m[r.state] = (m[r.state] || 0) + 1), m), {});
    const clean = (r) => { const { _s, ...rest } = r; return rest; };

    if (q.dry) return res.status(200).json({ dryRun: true, since: new Date(since * 1000).toISOString().slice(0, 10), counts, toSend: todo.map(clean), others: rows.filter((r) => r.state !== 'to send').map(clean) });

    const results = [];
    for (const r of todo.slice(0, max)) {
      try {
        const sent = await sendFor(r._s, { late: true });
        results.push({ ...clean(r), sent: sent.id });
      } catch (e) {
        // 409 = Resend already sent this session's email in the last 24h (e.g. by the webhook).
        results.push({ ...clean(r), error: e.message });
      }
      await sleep(700); // Resend allows ~2 requests/second
    }
    return res.status(200).json({ sent: results.filter((x) => x.sent).length, failed: results.filter((x) => x.error).length, remaining: Math.max(todo.length - results.length, 0), results });
  } catch (err) {
    console.error('backfill failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
