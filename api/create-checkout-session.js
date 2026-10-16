// Creates a Stripe Embedded Checkout session for the healing bundle.
// The only secret is STRIPE_SECRET_KEY (set in Vercel → Settings → Environment Variables).
// Its prefix picks the matching publishable key and product below, so the
// branch preview can run on sandbox keys while production runs on live keys.

const STRIPE = {
  test: {
    publishableKey: 'pk_test_51TciBvAdg9H16Q68jtRwiJRpIP2Ir6mdcl4myj1ryN9flLJn1N8AyVIzhOm7EcJ5QRU345220KT5AommW0EpkWO600G3M9F7D8',
    productId: 'prod_VSBd3sUwhATLaK',
  },
  live: {
    publishableKey: 'pk_live_51TciB1AsMiI0w2mO6D6OjO4WepQjTUOb6cbxogZrvy6Hxm4cHf6cQjhvlDXaineb8A21VtGWFXZHIv3UiZTiawRv00ecjNtsMq',
    productId: '', // live product id goes here before launch
  },
};

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

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.STRIPE_SECRET_KEY || '';
  const mode = secret.startsWith('sk_live_') ? 'live' : secret.startsWith('sk_test_') ? 'test' : null;
  const cfg = mode && STRIPE[mode];
  if (!cfg || !cfg.productId || cfg.publishableKey.includes('REPLACE')) {
    // The page falls back to the payment link when this happens.
    return res.status(503).json({ error: 'Checkout is not configured' });
  }

  try {
    const product = await stripe('products/' + cfg.productId, secret);
    const price = typeof product.default_price === 'string' ? product.default_price : product.default_price && product.default_price.id;
    if (!price) throw new Error('Product has no default price');

    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const session = await stripe('checkout/sessions', secret, 'POST', {
      ui_mode: 'embedded',
      mode: 'payment',
      'line_items[0][price]': price,
      'line_items[0][quantity]': '1',
      // The thank-you page reads session_id to deduplicate the Purchase event.
      return_url: 'https://' + host + '/get-xk7f2?session_id={CHECKOUT_SESSION_ID}',
    });

    return res.status(200).json({ clientSecret: session.client_secret, publishableKey: cfg.publishableKey });
  } catch (err) {
    console.error('checkout session failed:', err.message);
    return res.status(502).json({ error: 'Could not start checkout' });
  }
};
