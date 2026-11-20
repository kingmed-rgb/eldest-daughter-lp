// Creates a Stripe Embedded Checkout session, so buyers pay without leaving the page
// (TikTok's in-app browser interrupts links to buy.stripe.com).
// The only secret is STRIPE_SECRET_KEY (Vercel → Settings → Environment Variables):
// a sandbox key (sk_test_/rk_test_) on Preview, the live key on Production.
// Opening this URL in a browser (GET) reports whether checkout is set up, never the key.

const PUBLISHABLE_KEYS = {
  test: 'pk_test_51TciBvAdg9H16Q68jtRwiJRpIP2Ir6mdcl4myj1ryN9flLJn1N8AyVIzhOm7EcJ5QRU345220KT5AommW0EpkWO600G3M9F7D8',
  live: 'pk_live_51TciB1AsMiI0w2mO6D6OjO4WepQjTUOb6cbxogZrvy6Hxm4cHf6cQjhvlDXaineb8A21VtGWFXZHIv3UiZTiawRv00ecjNtsMq',
};

const { OFFERS, PRINT } = require('./_lib/catalog.js');

// Thank-you page per language (on the same domain the buyer came from).
const THANK_YOU = { en: '/get-xk7f2', es: '/gracias' };

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

function readBody(req) {
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  const lang = body.lang || (req.query && req.query.lang);
  const L = OFFERS[lang] ? lang : 'en';
  // where the buyer came from (set by the page): short, plain values only
  const clean = (v, n) => String(v == null ? '' : v).replace(/[^\w .:/@+-]/g, '').slice(0, n);
  const src = body.src && typeof body.src === 'object' ? body.src : {};
  const source = { src: clean(src.src, 40) || 'unknown', first: clean(src.first, 40), camp: clean(src.camp, 100), ad: clean(src.ad, 100), ref: clean(src.ref, 80), days: clean(src.days, 4) };
  return { source, lang: L, poems: body.poems === true, journal: body.journal === true, print: body.format === 'print' && PRINT.enabled && !!OFFERS[L].print, wantsPrint: body.format === 'print', audio: body.format === 'audio' && !!OFFERS[L].audio };
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

  const { lang, poems, journal, print, wantsPrint, audio, source } = readBody(req);
  // never charge a different product than the one shown: paperback asked for while it's switched off
  if (wantsPrint && !print) return res.status(409).json({ error: 'paperback not available yet' });
  const offer = OFFERS[lang];
  const items = [print ? 'print' : audio ? 'audio' : 'main'].concat(poems ? ['poems'] : [], journal ? ['journal'] : []);
  const host = req.headers['x-forwarded-host'] || req.headers.host;

  const params = {
    ui_mode: 'embedded_page',
    mode: 'payment',
    locale: lang === 'es' ? 'es-419' : 'en',
    'metadata[page]': lang,
    'metadata[items]': items.join(','),
    // traffic source of this purchase (reported by api/order-products.js)
    'metadata[source]': source.src,
    'metadata[first_source]': source.first,
    'metadata[campaign]': source.camp,
    'metadata[ad]': source.ad,
    'metadata[referrer]': source.ref,
    'metadata[days_to_buy]': source.days,
    // The thank-you page reads session_id to show the right downloads and count the purchase once.
    return_url: 'https://' + host + THANK_YOU[lang] + '?session_id={CHECKOUT_SESSION_ID}',
  };
  if (print) {
    // paperback: Stripe collects the shipping address (only countries we ship printed books to)
    PRINT.countries.forEach((c, i) => { params[`shipping_address_collection[allowed_countries][${i}]`] = c; });
    params['phone_number_collection[enabled]'] = 'true'; // the printer needs a phone number for delivery
  }
  items.forEach((k, i) => {
    params[`line_items[${i}][quantity]`] = '1';
    params[`line_items[${i}][price_data][currency]`] = 'usd';
    params[`line_items[${i}][price_data][unit_amount]`] = String(offer[k].amount);
    params[`line_items[${i}][price_data][product_data][name]`] = offer[k].name;
  });

  try {
    const session = await stripe('checkout/sessions', secret, 'POST', params);
    return res.status(200).json({ clientSecret: session.client_secret, publishableKey: PUBLISHABLE_KEYS[mode] });
  } catch (err) {
    console.error('checkout session failed:', err.message);
    return res.status(502).json({ error: 'Could not start checkout: ' + err.message });
  }
};
