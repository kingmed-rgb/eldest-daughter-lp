// Paperback shipping at cost, worldwide.
// The checkout form calls this once the buyer's shipping address is complete. We ask Lulu what shipping that
// address costs (their mail level, plus the tax Lulu adds on it) and put that price on the Stripe checkout session.
// Body: { checkout_session_id, shipping_details: { name, address: { line1, line2, city, state, postal_code, country } } }
// Answers in the shape Stripe's runServerUpdate expects: { type: 'object', value: {...} } or { type: 'error', message }.
const { PRINT } = require('./_lib/catalog.js');
const { lulu } = require('./_lib/lulu.js');

async function stripe(path, method = 'GET', body) {
  const res = await fetch('https://api.stripe.com/v1/' + path, {
    method,
    headers: { Authorization: 'Bearer ' + (process.env.STRIPE_SECRET_KEY || '').trim(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body ? new URLSearchParams(body).toString() : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data.error && data.error.message) || 'Stripe request failed');
  return data;
}

const fail = (res, message) => res.status(200).json({ type: 'error', message });

// Lulu's error answer, in a sentence the buyer can act on.
function luluProblem(r) {
  const d = (r && r.data) || {};
  const errs = (((d.shipping_address || {}).detail || {}).errors) || [];
  const e = errs[0];
  if (e && e.path === 'recipient_tax_id') return "we can't ship the paperback to this country yet. the digital workbook is available instantly.";
  if (e && e.path === 'state') return 'please choose your state, province or region.';
  if (e && e.path === 'postcode') return 'please check your postal code.';
  return "we couldn't calculate shipping to this address. please check it, or email eldestdaughterbook@gmail.com and we'll help.";
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ type: 'error', message: 'method not allowed' });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  const id = String(body.checkout_session_id || '');
  const ship = body.shipping_details || {};
  const a = ship.address || ship; // stripe sends { name, address: {...} }
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) return fail(res, 'invalid checkout');
  const country = String(a.country || '').toUpperCase();
  if (!PRINT.countries.includes(country)) return fail(res, "we can't ship the paperback to this country yet. the digital workbook is available instantly.");

  try {
    // only open paperback checkouts can be priced
    const session = await stripe('checkout/sessions/' + encodeURIComponent(id));
    if (session.status !== 'open') return fail(res, 'this checkout has expired. please close it and start again.');
    if (!String((session.metadata && session.metadata.items) || '').split(',').includes('print')) return fail(res, 'invalid checkout');

    const address = {
      name: ship.name || undefined, street1: a.line1 || '-', street2: a.line2 || undefined, city: a.city || '-',
      state_code: a.state || undefined, country_code: country, postcode: a.postal_code || undefined,
      phone_number: (session.customer_details && session.customer_details.phone) || '5555555555', // lulu needs one to quote
    };
    const items = [{ page_count: PRINT.pageCount, pod_package_id: PRINT.podPackageId, quantity: 1 }];
    // preview site (sandbox stripe, no lulu keys): a sample price so the checkout can be tried end to end
    const sandbox = /^cs_test_/.test(id) && !(process.env.LULU_CLIENT_KEY || '').trim();
    const [cost, options] = sandbox
      ? [{ ok: true, data: { shipping_cost: { total_cost_incl_tax: { US: '6.19', GB: '5.22' }[country] || '19.64' } } }, null]
      : await Promise.all([
      lulu('/print-job-cost-calculations/', 'POST', { line_items: items, shipping_address: address, shipping_option: PRINT.shippingLevel }),
      lulu('/shipping-options/', 'POST', { line_items: items, shipping_address: address, currency: 'USD' }).catch(() => null),
    ]);
    if (!cost.ok) {
      console.log('shipping quote refused', JSON.stringify({ session: id, country, lulu: JSON.stringify(cost.data).slice(0, 300) }));
      return fail(res, luluProblem(cost));
    }
    const shipping = Number(cost.data.shipping_cost && cost.data.shipping_cost.total_cost_incl_tax);
    if (!(shipping >= 0)) return fail(res, "we couldn't calculate shipping right now. please try again in a moment.");
    const amount = Math.round(shipping * 100);

    const update = {
      'shipping_options[0][shipping_rate_data][type]': 'fixed_amount',
      'shipping_options[0][shipping_rate_data][display_name]': 'tracked shipping',
      'shipping_options[0][shipping_rate_data][fixed_amount][amount]': String(amount),
      'shipping_options[0][shipping_rate_data][fixed_amount][currency]': 'usd',
      'metadata[shipping_quote]': (amount / 100).toFixed(2) + ' ' + country,
    };
    // delivery estimate from lulu, in business days (printing + transit)
    const mail = options && options.ok && Array.isArray(options.data) ? options.data.find((o) => o.level === PRINT.shippingLevel) : null;
    if (mail && mail.total_days_min && mail.total_days_max) {
      update['shipping_options[0][shipping_rate_data][delivery_estimate][minimum][unit]'] = 'business_day';
      update['shipping_options[0][shipping_rate_data][delivery_estimate][minimum][value]'] = String(mail.total_days_min);
      update['shipping_options[0][shipping_rate_data][delivery_estimate][maximum][unit]'] = 'business_day';
      update['shipping_options[0][shipping_rate_data][delivery_estimate][maximum][value]'] = String(mail.total_days_max);
    }
    await stripe('checkout/sessions/' + encodeURIComponent(id), 'POST', update);
    return res.status(200).json({ type: 'object', value: { succeeded: true, shipping: amount } });
  } catch (e) {
    console.error('shipping quote failed', JSON.stringify({ session: id, country, reason: e.message }));
    return fail(res, "we couldn't calculate shipping right now. please try again in a moment.");
  }
};
