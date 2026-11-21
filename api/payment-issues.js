// Private, read-only: recent payments that did not go through, and why. Locked with BACKFILL_TOKEN.
//   /api/payment-issues?token=...            last 3 days
//   /api/payment-issues?token=...&days=7
// Lists failed payment attempts (with the bank's decline reason) and checkouts that were started but never paid,
// with the buyer's email when Stripe has one, so a reminder can be sent by hand. Nothing is changed or sent.
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
async function all(path, max = 5) {
  const out = []; let after = null;
  for (let i = 0; i < max; i++) {
    const r = await stripe(path + (after ? '&starting_after=' + after : ''));
    out.push(...r.data); if (!r.has_more) break; after = r.data[r.data.length - 1].id;
  }
  return out;
}
const iso = (t) => new Date(t * 1000).toISOString().slice(0, 16).replace('T', ' ');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  const q = req.query || {};
  if (!tokenOk(q.token)) return res.status(404).json({ error: 'not found' });
  const days = Math.min(30, Math.max(1, parseInt(q.days, 10) || 3));
  const since = Math.floor(Date.now() / 1000) - days * 86400;
  try {
    // failed card attempts
    const charges = await all('charges?limit=100&created[gte]=' + since);
    const failed = charges.filter((c) => c.status === 'failed').map((c) => ({
      when: iso(c.created), amount: c.amount / 100, currency: c.currency,
      reason: c.outcome && (c.outcome.seller_message || c.outcome.reason), decline_code: (c.outcome && c.outcome.reason) || c.failure_code,
      failure_message: c.failure_message, network_status: c.outcome && c.outcome.network_status, risk: c.outcome && c.outcome.risk_level,
      card: c.payment_method_details && c.payment_method_details.card ? { brand: c.payment_method_details.card.brand, country: c.payment_method_details.card.country, wallet: (c.payment_method_details.card.wallet || {}).type || null } : null,
      email: (c.billing_details && c.billing_details.email) || c.receipt_email || null,
      payment_intent: c.payment_intent,
      later_paid: false,
    }));
    // checkouts started and not paid (only those where the buyer typed an email)
    const sessions = await all('checkout/sessions?limit=100&created[gte]=' + since);
    const paidPI = new Set(sessions.filter((s) => s.payment_status === 'paid').map((s) => s.payment_intent));
    const paidEmails = new Set(sessions.filter((s) => s.payment_status === 'paid').map((s) => ((s.customer_details || {}).email || '').toLowerCase()).filter(Boolean));
    failed.forEach((f) => { f.later_paid = paidPI.has(f.payment_intent) || (f.email && paidEmails.has(f.email.toLowerCase())); });
    const unpaid = sessions.filter((s) => s.status !== 'complete').map((s) => {
      const email = (s.customer_details && s.customer_details.email) || s.customer_email || null;
      return { when: iso(s.created), status: s.status, amount: (s.amount_total || 0) / 100, items: (s.metadata || {}).items, page: (s.metadata || {}).page, source: (s.metadata || {}).source, email, later_paid: !!(email && paidEmails.has(email.toLowerCase())) };
    }).filter((s) => s.email);
    return res.status(200).json({ days, failed_payments: failed, unfinished_checkouts_with_email: unpaid, paid_checkouts: paidEmails.size });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
