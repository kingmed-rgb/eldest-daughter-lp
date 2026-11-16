// Sends a paid paperback order to Lulu (print on demand), once per checkout.
// Called from the thank-you page lookup (api/order.js) and from the Stripe webhook, whichever runs first.
// Once sent, the Lulu print job id is saved on the Stripe payment (metadata.lulu).
const { PRINT } = require('./catalog.js');
const { lulu } = require('./lulu.js');

const ALERT_INBOX = 'eldestdaughterbook@gmail.com';

async function stripe(path, method = 'GET', body) {
  const headers = { Authorization: 'Bearer ' + (process.env.STRIPE_SECRET_KEY || '').trim() };
  if (body) headers['Content-Type'] = 'application/x-www-form-urlencoded';
  const res = await fetch('https://api.stripe.com/v1/' + path, { method, headers, body: body ? new URLSearchParams(body).toString() : undefined });
  const data = await res.json();
  if (!res.ok) throw new Error((data.error && data.error.message) || 'Stripe request failed');
  return data;
}

const hasPrint = (session) => String((session.metadata && session.metadata.items) || '').split(',').includes('print');

// the address: typed in our pop-up and saved on the payment (pi.shipping), or collected by stripe (older orders)
function shippingOf(session, pi) {
  const ci = session.collected_information || {};
  const ps = (pi && pi.shipping) || null;
  const sd = ci.shipping_details || session.shipping_details || ps || {};
  const cd = session.customer_details || {};
  return { name: sd.name || cd.name || '', address: sd.address || cd.address || {}, phone: (ps && ps.phone) || cd.phone || '', email: cd.email || session.customer_email || '' };
}

// The address block Lulu expects.
function luluAddress({ name, address: a, phone, email }) {
  return {
    name, street1: a.line1, street2: a.line2 || undefined, city: a.city, state_code: a.state || undefined,
    country_code: String(a.country || '').toUpperCase(), postcode: a.postal_code, phone_number: phone || undefined, email: email || undefined,
  };
}

function lineItem(ref) {
  return {
    external_id: ref, title: PRINT.title, quantity: 1,
    printable_normalization: { pod_package_id: PRINT.podPackageId, cover: { source_url: PRINT.cover }, interior: { source_url: PRINT.interior } },
  };
}

// The full print job for a paid checkout.
function jobFor(session, pi) {
  const ship = shippingOf(session, pi);
  const addr = luluAddress(ship);
  if (!PRINT.countries.includes(addr.country_code)) throw new Error('we do not ship printed books to ' + (addr.country_code || 'an unknown country'));
  if (!addr.phone_number) throw new Error('no phone number on the order (lulu needs one for delivery)');
  return {
    external_id: session.id, contact_email: ship.email || ALERT_INBOX,
    line_items: [lineItem(session.id)], shipping_address: addr, shipping_level: PRINT.shippingLevel,
    production_delay: PRINT.productionDelayMinutes,
  };
}

async function alert(subject, text) {
  try {
    const { resend, fromAddress } = require('../stripe-webhook.js');
    await resend('emails', 'POST', { from: await fromAddress('en'), to: [ALERT_INBOX], subject, text });
  } catch (e) { console.error('print alert email failed:', e.message); }
}

const describe = (r) => {
  const d = r && r.data; if (!d) return 'no response';
  return typeof d === 'string' ? d : JSON.stringify(d).slice(0, 600);
};

// Find a job we already created for this checkout (protects against double printing).
async function existingJob(ref) {
  const r = await lulu('/print-jobs/?external_id=' + encodeURIComponent(ref));
  const list = (r.ok && r.data && (r.data.results || r.data)) || [];
  return Array.isArray(list) ? list.find((j) => j && j.external_id === ref) : null;
}

// session: a paid Checkout Session (payment_intent expanded or as an id)
async function fulfilPrint(session) {
  if (!hasPrint(session)) return { status: 'none' };
  if (!(process.env.LULU_CLIENT_KEY || '').trim()) return { status: 'not_configured' };

  const piId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent && session.payment_intent.id;
  const pi = typeof session.payment_intent === 'object' && session.payment_intent ? session.payment_intent : (piId ? await stripe('payment_intents/' + piId) : null);
  if (pi && pi.metadata && pi.metadata.lulu) return { status: 'sent', job: pi.metadata.lulu };

  const mark = (k, v) => piId ? stripe('payment_intents/' + piId, 'POST', { [`metadata[${k}]`]: String(v) }).catch((e) => console.error('mark failed:', e.message)) : null;
  const buyer = (session.customer_details && session.customer_details.email) || '';

  try {
    const found = await existingJob(session.id);
    if (found) { await mark('lulu', found.id); return { status: 'sent', job: found.id }; }

    let job;
    try { job = jobFor(session, pi); } catch (e) {
      if (!(pi && pi.metadata && pi.metadata.print_alerted)) {
        await alert('printed order needs attention: ' + session.id, `couldn't send this paperback order to lulu.\n\nreason: ${e.message}\ncheckout: ${session.id}\nbuyer: ${buyer}\n\nplace it by hand in lulu, or refund it in stripe.`);
        await mark('print_alerted', '1');
      }
      return { status: 'failed', error: e.message };
    }

    // Sandbox Stripe (preview site): only ask Lulu for a price, never create a print job.
    if (/^(sk|rk)_test_/.test((process.env.STRIPE_SECRET_KEY || '').trim())) {
      const q = await lulu('/print-job-cost-calculations/', 'POST', { line_items: [{ page_count: PRINT.pageCount, pod_package_id: PRINT.podPackageId, quantity: 1 }], shipping_address: job.shipping_address, shipping_option: PRINT.shippingLevel });
      await alert('print test: lulu quote ' + (q.ok ? 'ok' : 'failed'), `test from the preview site (sandbox payment). nothing was printed or charged.\n\nlulu says (HTTP ${q.status}):\n${describe(q)}`);
      return { status: q.ok ? 'validated' : 'failed' };
    }

    const r = await lulu('/print-jobs/', 'POST', job);
    if (r.ok && r.data && r.data.id) {
      await mark('lulu', r.data.id);
      console.log('print job created', JSON.stringify({ session: session.id, job: r.data.id, country: job.shipping_address.country_code }));
      return { status: 'sent', job: r.data.id };
    }
    throw new Error('lulu HTTP ' + r.status + ': ' + describe(r));
  } catch (e) {
    console.error('print order failed', JSON.stringify({ session: session.id, reason: e.message }));
    if (!(pi && pi.metadata && pi.metadata.print_alerted)) {
      await alert('printed order needs attention: ' + session.id, `lulu didn't accept this paperback order.\n\nreason: ${e.message}\ncheckout: ${session.id}\nbuyer: ${buyer}\n\ncommon causes: no payment card on file in the lulu developer account, or an address lulu can't use.\nfix it, then reload the buyer's thank-you page, or place it by hand in lulu.`);
      await mark('print_alerted', '1');
    }
    return { status: 'failed', error: e.message };
  }
}

module.exports = { fulfilPrint, jobFor, lineItem, luluAddress, hasPrint };
