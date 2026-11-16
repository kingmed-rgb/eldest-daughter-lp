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
const { lulu } = require('./_lib/lulu.js');

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
  const t = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
  const a = body.ship && typeof body.ship === 'object' ? body.ship : {};
  // paperback: the shipping address the buyer typed in the pop-up (step "where should we send it?")
  const ship = { name: t(a.name, 80), line1: t(a.line1, 120), line2: t(a.line2, 120), city: t(a.city, 80), state: t(a.state, 40).toUpperCase(),
    postal: t(a.postal, 20).toUpperCase(), country: t(a.country, 2).toUpperCase(), phone: t(a.phone, 30).replace(/[^\d+]/g, '') };
  return { lang: L, poems: body.poems === true, journal: body.journal === true, print: body.format === 'print' && PRINT.enabled && !!OFFERS[L].print, wantsPrint: body.format === 'print', ship };
}

// Checks the paperback address before payment. Returns null when fine, else { field, error } for the buyer.
async function addressProblem(ship) {
  if (!PRINT.countries.includes(ship.country)) return { field: 'country', error: "we don't ship the paperback to this country yet." };
  if (ship.name.length < 2) return { field: 'name', error: 'please enter the full name for the parcel.' };
  if (ship.line1.length < 3) return { field: 'line1', error: 'please enter the street address.' };
  if (ship.city.length < 2) return { field: 'city', error: 'please enter the city.' };
  if (['US', 'CA', 'AU'].includes(ship.country) && !ship.state) return { field: 'state', error: 'please choose the state or province.' };
  if (ship.postal.length < 3) return { field: 'postal', error: 'please enter the postal code.' };
  if (ship.phone.replace(/\D/g, '').length < 7) return { field: 'phone', error: 'please enter a phone number (the courier uses it for delivery).' };
  // live site: ask lulu if it can deliver there (catches wrong postal codes before the buyer pays)
  if (!(process.env.LULU_CLIENT_KEY || '').trim()) return null;
  try {
    const r = await lulu('/print-job-cost-calculations/', 'POST', {
      line_items: [{ page_count: PRINT.pageCount, pod_package_id: PRINT.podPackageId, quantity: 1 }],
      shipping_address: { name: ship.name, street1: ship.line1, street2: ship.line2 || undefined, city: ship.city, state_code: ship.state || undefined,
        country_code: ship.country, postcode: ship.postal, phone_number: ship.phone },
      shipping_option: PRINT.shippingLevel,
    });
    if (r.ok) return null;
    const e = ((((r.data || {}).shipping_address || {}).detail || {}).errors || [])[0] || {};
    console.log('paperback address refused by lulu', JSON.stringify({ country: ship.country, lulu: JSON.stringify(r.data).slice(0, 300) }));
    if (e.path === 'postcode') return { field: 'postal', error: 'please check the postal code.' };
    if (e.path === 'state' || e.path === 'state_code') return { field: 'state', error: 'please check the state or province.' };
    if (e.path === 'city') return { field: 'city', error: 'please check the city.' };
    if (e.path === 'phone_number') return { field: 'phone', error: 'please check the phone number.' };
    return { field: 'line1', error: "the printer couldn't use this address. please check it." };
  } catch (err) {
    return null; // lulu unreachable: don't block the sale, the order is checked again when it's sent to print
  }
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

  const { lang, poems, journal, print, wantsPrint, ship } = readBody(req);
  // never charge a different product than the one shown: paperback asked for while it's switched off
  if (wantsPrint && !print) return res.status(409).json({ error: 'paperback not available yet' });
  if (print) { const bad = await addressProblem(ship); if (bad) return res.status(400).json(bad); }
  const offer = OFFERS[lang];
  const items = [print ? 'print' : 'main'].concat(poems ? ['poems'] : [], journal ? ['journal'] : []);
  const host = req.headers['x-forwarded-host'] || req.headers.host;

  const params = {
    ui_mode: 'embedded_page',
    mode: 'payment',
    locale: lang === 'es' ? 'es-419' : 'en',
    'metadata[page]': lang,
    'metadata[items]': items.join(','),
    // The thank-you page reads session_id to show the right downloads and count the purchase once.
    return_url: 'https://' + host + THANK_YOU[lang] + '?session_id={CHECKOUT_SESSION_ID}',
  };
  if (print) {
    // paperback: the address was entered (and checked) in the pop-up before payment; it rides on the payment
    // (payment_intent.shipping), so stripe's form only asks for email + card
    const sh = 'payment_intent_data[shipping]';
    params[sh + '[name]'] = ship.name;
    params[sh + '[phone]'] = ship.phone;
    params[sh + '[address][line1]'] = ship.line1;
    if (ship.line2) params[sh + '[address][line2]'] = ship.line2;
    params[sh + '[address][city]'] = ship.city;
    if (ship.state) params[sh + '[address][state]'] = ship.state;
    params[sh + '[address][postal_code]'] = ship.postal;
    params[sh + '[address][country]'] = ship.country;
    params['metadata[ship_country]'] = ship.country;
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
