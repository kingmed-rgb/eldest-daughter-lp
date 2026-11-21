// Private: send one paid checkout to Meta's Conversions API as a TEST event (Events Manager -> Test events).
//   /api/meta-test?token=...&session=cs_live_...&code=TEST12345
// Locked with BACKFILL_TOKEN. With a test code, Meta shows it under Test events only and does not count it.
const crypto = require('crypto');
const { sendPurchase } = require('./_lib/meta.js');
const { stripeGet } = require('./stripe-webhook.js');

function tokenOk(given) {
  const want = (process.env.BACKFILL_TOKEN || '').trim();
  if (!want || !given) return false;
  return crypto.timingSafeEqual(crypto.createHash('sha256').update(String(given)).digest(), crypto.createHash('sha256').update(want).digest());
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  const q = req.query || {};
  if (!tokenOk(q.token)) return res.status(404).json({ error: 'not found' });
  if (!/^TEST\w+$/.test(q.code || '')) return res.status(400).json({ error: 'code=TEST... from Events Manager -> Test events is required' });
  if (!/^cs_(live|test)_\w+$/.test(q.session || '')) return res.status(400).json({ error: 'session=cs_... required' });
  try {
    const s = await stripeGet('checkout/sessions/' + q.session);
    const out = await sendPurchase(s, { testCode: q.code });
    return res.status(200).json(out);
  } catch (e) { return res.status(500).json({ error: e.message }); }
};
