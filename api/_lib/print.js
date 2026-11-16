// Sends a paid paperback order to Bookvault (print on demand), once per checkout.
// Called from the thank-you page lookup (api/order.js) and from the Stripe webhook, whichever runs first.
// Once sent, the Bookvault order number is saved on the Stripe payment (metadata.bookvault).
const { PRINT } = require('./catalog.js');

const BV = 'https://api.bookvault.app/v4/';
const ALERT_INBOX = 'eldestdaughterbook@gmail.com';

async function stripe(path, method = 'GET', body) {
  const headers = { Authorization: 'Bearer ' + (process.env.STRIPE_SECRET_KEY || '').trim() };
  if (body) headers['Content-Type'] = 'application/x-www-form-urlencoded';
  const res = await fetch('https://api.stripe.com/v1/' + path, { method, headers, body: body ? new URLSearchParams(body).toString() : undefined });
  const data = await res.json();
  if (!res.ok) throw new Error((data.error && data.error.message) || 'Stripe request failed');
  return data;
}

async function bookvault(path, method = 'GET', body) {
  const res = await fetch(BV + path, {
    method,
    headers: { 'x-bookvault-api-key': (process.env.BOOKVAULT_API_KEY || '').trim(), 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch (e) { data = { message: text }; }
  return { ok: res.ok, status: res.status, data };
}

const hasPrint = (session) => String((session.metadata && session.metadata.items) || '').split(',').includes('print');

function shippingOf(session) {
  const ci = session.collected_information || {};
  const sd = ci.shipping_details || session.shipping_details || {};
  const a = sd.address || (session.customer_details && session.customer_details.address) || {};
  return { name: sd.name || (session.customer_details && session.customer_details.name) || '', address: a };
}

// The order Bookvault receives. Printed in the buyer's own country, so no customs declaration is needed.
function orderFor(session) {
  const { name, address: a } = shippingOf(session);
  const country = String(a.country || '').toUpperCase();
  const partner = PRINT.partner[country];
  if (!partner) throw new Error('we do not ship printed books to ' + (country || 'an unknown country'));
  const email = (session.customer_details && session.customer_details.email) || session.customer_email || undefined;
  return {
    docRef: session.id,
    custRef: email,
    address: {
      addressee: name, address1: a.line1, address2: a.line2 || undefined, town: a.city,
      county: a.state || undefined, countryCode: country, postCode: a.postal_code,
      email, telNumber: (session.customer_details && session.customer_details.phone) || undefined,
    },
    orderLines: [{ lineNumber: 1, isbn: PRINT.sku, quantity: 1 }],
    dispatchRequest: { requestedService: PRINT.service },
    productionLevel: 'Standard',
    partner,
  };
}

async function alert(subject, text) {
  try {
    const { resend, fromAddress } = require('../stripe-webhook.js');
    await resend('emails', 'POST', { from: await fromAddress('en'), to: [ALERT_INBOX], subject, text });
  } catch (e) { console.error('print alert email failed:', e.message); }
}

// session: a paid Checkout Session (payment_intent expanded or as an id)
async function fulfilPrint(session) {
  if (!hasPrint(session)) return { status: 'none' };
  if (!(process.env.BOOKVAULT_API_KEY || '').trim()) return { status: 'not_configured' };

  const piId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent && session.payment_intent.id;
  const pi = typeof session.payment_intent === 'object' && session.payment_intent ? session.payment_intent : (piId ? await stripe('payment_intents/' + piId) : null);
  if (pi && pi.metadata && pi.metadata.bookvault) return { status: 'sent', podRef: pi.metadata.bookvault };

  // Already placed (e.g. the webhook and the thank-you page ran at the same time)? Look it up by our reference.
  const existing = await bookvault('order?type=DocRef&value=' + encodeURIComponent(session.id));
  const existingRef = existing.ok && existing.data && (existing.data.podRef || existing.data.PodRef);
  if (existingRef) {
    if (piId) await stripe('payment_intents/' + piId, 'POST', { 'metadata[bookvault]': String(existingRef) }).catch(() => {});
    return { status: 'sent', podRef: existingRef };
  }

  let order;
  try { order = orderFor(session); } catch (e) {
    await alert('printed order needs attention: ' + session.id, `couldn't send this paperback order to bookvault.\n\nreason: ${e.message}\ncheckout: ${session.id}\nbuyer: ${(session.customer_details && session.customer_details.email) || ''}\n\nplace it by hand in bookvault, or refund it in stripe.`);
    return { status: 'failed', error: e.message };
  }

  // Sandbox Stripe (preview site): only ask Bookvault to validate the order, never place it.
  if (/^(sk|rk)_test_/.test((process.env.STRIPE_SECRET_KEY || '').trim())) {
    const v = await bookvault('order/validate?type=FullButPayment', 'POST', order);
    const valid = v.ok && v.data && (v.data.valid === true || v.data.Valid === true);
    const msgs = (v.data && (v.data.messages || v.data.Messages)) || (v.data && v.data.message) || '';
    await alert('print test: bookvault ' + (valid ? 'accepted' : 'did not accept') + ' the order', `this was a test from the preview site (sandbox payment). nothing was printed or charged.\n\nresult: ${valid ? 'VALID' : 'NOT VALID (HTTP ' + v.status + ')'}\nbookvault says: ${typeof msgs === 'string' ? msgs : JSON.stringify(msgs)}\n\norder that would be sent:\n${JSON.stringify(order, null, 2)}`);
    return { status: valid ? 'validated' : 'failed', error: valid ? undefined : JSON.stringify(msgs) };
  }

  const res = await bookvault('order', 'POST', order);
  const podRef = res.ok && res.data && (res.data.podRef || res.data.PodRef);
  if (podRef) {
    if (piId) await stripe('payment_intents/' + piId, 'POST', { 'metadata[bookvault]': String(podRef) }).catch((e) => console.error('mark print sent failed:', e.message));
    console.log('print order placed', JSON.stringify({ session: session.id, podRef, partner: order.partner }));
    return { status: 'sent', podRef };
  }

  const reason = (res.data && (res.data.message || res.data.Message)) || ('HTTP ' + res.status);
  console.error('print order failed', JSON.stringify({ session: session.id, status: res.status, reason }));
  // Alert once per order, not on every page reload.
  if (piId && !(pi && pi.metadata && pi.metadata.bookvault_alerted)) {
    await alert('printed order needs attention: ' + session.id, `bookvault didn't accept this paperback order.\n\nreason: ${reason}\ncheckout: ${session.id}\nbuyer: ${order.custRef || ''}\nship to: ${order.address.addressee}, ${order.address.address1}, ${order.address.town} ${order.address.postCode}, ${order.address.countryCode}\n\ncommon causes: no payment card on file in bookvault, or an address bookvault can't use.\nfix it, then reload the buyer's thank-you page or place it by hand in bookvault.`);
    await stripe('payment_intents/' + piId, 'POST', { 'metadata[bookvault_alerted]': '1' }).catch(() => {});
  }
  return { status: 'failed', error: reason };
}

module.exports = { fulfilPrint, orderFor, hasPrint, bookvault };
