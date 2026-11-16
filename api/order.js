// Thank-you page helper: GET /api/order?session_id=cs_… returns the downloads for a paid checkout.
// Without a valid paid session it returns { paid: false }, so the files are never listed publicly.
const { filesFor } = require('./_lib/catalog.js');
const { fulfilPrint, hasPrint } = require('./_lib/print.js');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  const id = String((req.query && req.query.session_id) || '');
  const secret = (process.env.STRIPE_SECRET_KEY || '').trim();
  if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(id) || !secret) return res.status(200).json({ paid: false });

  try {
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions/' + id + '?expand[]=payment_intent', { headers: { Authorization: 'Bearer ' + secret } });
    const s = await r.json();
    if (!r.ok || s.status !== 'complete' || s.payment_status === 'unpaid') return res.status(200).json({ paid: false });
    const { lang, keys, files } = filesFor(s);
    // paperback: send it to the printer now if the webhook hasn't already
    let print = null;
    if (hasPrint(s)) { try { print = (await fulfilPrint(s)).status; } catch (e) { console.error('print from thank-you page failed:', e.message); print = 'failed'; } }
    return res.status(200).json({
      paid: true,
      lang,
      items: keys,
      value: (s.amount_total || 0) / 100,
      currency: (s.currency || 'usd').toUpperCase(),
      files,
      print,
    });
  } catch (e) {
    console.error('order lookup failed:', e.message);
    return res.status(200).json({ paid: false, error: 'lookup failed' });
  }
};
