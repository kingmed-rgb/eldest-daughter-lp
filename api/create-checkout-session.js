// Creates a Stripe Embedded Checkout session, so buyers pay without leaving the page
// (TikTok's in-app browser interrupts links to buy.stripe.com).
// The only secret is STRIPE_SECRET_KEY (Vercel → Settings → Environment Variables):
// a sandbox key (sk_test_/rk_test_) on Preview, the live key on Production.
// Opening this URL in a browser (GET) reports whether checkout is set up, never the key.

const PUBLISHABLE_KEYS = {
  test: 'pk_test_51TciBvAdg9H16Q68jtRwiJRpIP2Ir6mdcl4myj1ryN9flLJn1N8AyVIzhOm7EcJ5QRU345220KT5AommW0EpkWO600G3M9F7D8',
  live: 'pk_live_51TciB1AsMiI0w2mO6D6OjO4WepQjTUOb6cbxogZrvy6Hxm4cHf6cQjhvlDXaineb8A21VtGWFXZHIv3UiZTiawRv00ecjNtsMq',
};

// What each page sells. Amounts are in cents (USD).
const PRODUCTS = {
  en: { name: 'The Eldest Daughter Healing Bundle', amount: 1200, thankYou: '/get-xk7f2' },
  es: { name: 'Síndrome de la hija mayor (ebook)', amount: 900, thankYou: '/get-xk7f2' },
};

function keyMode(secret) {
  if (/^(sk|rk)_live_/.test(secret)) return 'live';
  if (/^(sk|rk)_test_/.test(secret)) return 'test';
  return null;
}

async function stripe(path, secret, method = 'GET', body) {
  const res = await fetch('https://api.stripe.com/v1/' + path, {
    method,
    headers: {
      Authorization: 'Bearer ' + secret,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data.error && data.error.message) || 'Stripe request failed');
  return data;
}

function readLang(req) {
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const lang = (body && body.lang) || (req.query && req.query.lang);
  return PRODUCTS[lang] ? lang : 'en';
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const secret = (process.env.STRIPE_SECRET_KEY || '').trim();
  const mode = keyMode(secret);

  if (req.method === 'GET') {
    const status = { keyFound: Boolean(secret), keyMode: mode || (secret ? 'unrecognised key format' : 'none') };
    if (mode) {
      try { await stripe('balance', secret); status.stripeReachable = true; status.ready = true; }
      catch (err) { status.stripeError = err.message; status.ready = false; }
    } else status.ready = false;
    return res.status(200).json(status);
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!mode) return res.status(503).json({ error: 'Checkout is not configured' }); // page falls back to the payment link

  const lang = readLang(req);
  const product = PRODUCTS[lang];
  const host = req.headers['x-forwarded-host'] || req.headers.host;

  try {
    const session = await stripe('checkout/sessions', secret, 'POST', {
      ui_mode: 'embedded_page',
      mode: 'payment',
      locale: lang === 'es' ? 'es-419' : 'en',
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][unit_amount]': String(product.amount),
      'line_items[0][price_data][product_data][name]': product.name,
      'metadata[page]': lang,
      // The thank-you page reads session_id to deduplicate the Purchase event.
      return_url: 'https://' + host + product.thankYou + '?session_id={CHECKOUT_SESSION_ID}',
    });
    return res.status(200).json({ clientSecret: session.client_secret, publishableKey: PUBLISHABLE_KEYS[mode] });
  } catch (err) {
    console.error('checkout session failed:', err.message);
    return res.status(502).json({ error: 'Could not start checkout: ' + err.message });
  }
};
