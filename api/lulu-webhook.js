// Lulu tells us when a paperback's print job changes status (webhook topic PRINT_JOB_STATUS_CHANGED).
// We don't trust the notification itself: we read the job back from Lulu with our own keys and act on that.
//   SHIPPED                      -> email the buyer their tracking link (once per order)
//   REJECTED / CANCELED / ERROR  -> alert email to the shop inbox (once per job and status)
// Registered with Lulu through /api/print-check?action=webhook (see there).
const { lulu } = require('./_lib/lulu.js');
const { stripeGet, resend, fromAddress } = require('./stripe-webhook.js');

const SHOP_INBOX = 'eldestdaughterbook@gmail.com';
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function readRaw(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(JSON.stringify(req.body));
  if (typeof req.body === 'string') return Promise.resolve(req.body);
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', () => resolve(''));
  });
}

// Tracking details from a shipped print job (status messages first, then the line item itself).
function trackingOf(job) {
  const st = (job.status && job.status.line_item_statuses) || [];
  const m = (st.find((s) => s && s.name === 'SHIPPED') || {}).messages || {};
  const li = (job.line_items || [])[0] || {};
  const urls = [].concat(m.tracking_urls || li.tracking_urls || []).filter(Boolean);
  const id = [].concat(m.tracking_id || li.tracking_id || [])[0] || '';
  return { url: urls[0] || '', id: String(id || ''), carrier: m.carrier_name || li.carrier_name || '' };
}

function shippedEmail(name, t) {
  const first = String(name || '').trim().split(/\s+/)[0] || '';
  const hello = first ? 'hi ' + first.toLowerCase() + ',' : 'hi,';
  const intro = 'your paperback of the eldest daughter workbook has left the printer and is on its way to you 📦';
  const how = t.url ? 'you can follow it here:' : (t.id ? 'your tracking number' + (t.carrier ? ' (' + t.carrier + ')' : '') + ' is ' + t.id + '.' : 'it usually arrives within one to two weeks.');
  const note = 'tracking can take a day to show the first update. the ebook from your first email is yours too, so you can keep going until the book arrives.';
  const help = "if anything looks off with the delivery, just reply to this email.";
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#FEF7EC">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">your book is on its way. tracking inside.</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FEF7EC"><tr><td align="center" style="padding:32px 20px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;font-family:Georgia,serif;color:#2B1218;font-size:17px;line-height:1.6">
<tr><td style="padding:0 0 16px">${esc(hello)}</td></tr>
<tr><td style="padding:0 0 16px">${esc(intro)}</td></tr>
<tr><td style="padding:0 0 ${t.url ? 12 : 16}px">${esc(how)}</td></tr>
${t.url ? `<tr><td style="padding:0 0 16px"><a href="${esc(t.url)}" style="display:block;background:#4D0619;color:#FEF7EC;text-decoration:none;font-family:Georgia,serif;font-size:16px;font-weight:600;padding:15px 18px;border-radius:10px;text-align:center">track my book &rarr;</a></td></tr>` : ''}
${t.url && t.id ? `<tr><td style="padding:0 0 16px;color:#5E434A;font-size:15px">tracking number${t.carrier ? ' (' + esc(t.carrier) + ')' : ''}: ${esc(t.id)}</td></tr>` : ''}
<tr><td style="padding:0 0 16px">${esc(note)}</td></tr>
<tr><td style="padding:0 0 16px;color:#5E434A;font-size:15px">${esc(help)}</td></tr>
<tr><td style="padding:0 0 24px">with love,<br>anna</td></tr>
<tr><td style="border-top:1px solid #EBDCCD;padding:16px 0 0;color:#5E434A;font-size:13px">${esc(SHOP_INBOX)}</td></tr>
</table></td></tr></table></body></html>`;
  const text = [hello, '', intro, '', how, ...(t.url ? [t.url] : []), ...(t.url && t.id ? ['tracking number' + (t.carrier ? ' (' + t.carrier + ')' : '') + ': ' + t.id] : []), '', note, help, '', 'with love,', 'anna'].join('\n');
  return { subject: 'your book is on its way 📦', html, text };
}

async function stripePost(path, body) {
  const res = await fetch('https://api.stripe.com/v1/' + path, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + (process.env.STRIPE_SECRET_KEY || '').trim(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data.error && data.error.message) || 'Stripe request failed');
  return data;
}

// Acts on one print job, read fresh from Lulu. Returns what it did.
async function handleJob(jobId, { force = false } = {}) {
  const r = await lulu('/print-jobs/' + encodeURIComponent(jobId) + '/');
  if (!r.ok || !r.data || !r.data.id) return { ignored: 'job not found' };
  const job = r.data;
  const status = (job.status && job.status.name) || '';
  const ref = String(job.external_id || '');
  if (!/^cs_(live|test)_/.test(ref)) return { ignored: 'not a shop order', status };   // e.g. our cancelled test jobs

  const session = await stripeGet('checkout/sessions/' + encodeURIComponent(ref) + '?expand[]=payment_intent');
  const pi = session.payment_intent && typeof session.payment_intent === 'object' ? session.payment_intent : null;
  const meta = (pi && pi.metadata) || {};
  const mark = (k, v) => (pi ? stripePost('payment_intents/' + pi.id, { ['metadata[' + k + ']']: String(v) }).catch((e) => console.error('mark failed', e.message)) : null);

  if (status === 'SHIPPED') {
    if (meta.shipped_email && !force) return { status, already: meta.shipped_email };
    const to = (session.customer_details && session.customer_details.email) || session.customer_email || (job.shipping_address && job.shipping_address.email);
    if (!to) throw new Error('no buyer email for ' + ref);
    const name = (job.shipping_address && job.shipping_address.name) || (session.customer_details && session.customer_details.name);
    const t = trackingOf(job);
    const e = shippedEmail(name, t);
    const sent = await resend('emails', 'POST', {
      from: await fromAddress('en'), to: [to], reply_to: SHOP_INBOX, subject: e.subject, html: e.html, text: e.text,
      tags: [{ name: 'type', value: 'shipped' }],
    }, 'shipped-' + ref + (force ? '-' + Date.now() : ''));
    await mark('shipped_email', sent.id);
    if (t.id) await mark('tracking', (t.carrier ? t.carrier + ' ' : '') + t.id);
    console.log('shipped email sent', JSON.stringify({ session: ref, job: job.id, email_id: sent.id, tracking: !!t.url }));
    return { status, sent: sent.id, tracking: t };
  }

  if (['REJECTED', 'CANCELED', 'ERROR'].includes(status)) {
    const key = 'print_' + status.toLowerCase() + '_alerted';
    if (meta[key]) return { status, already: true };
    const buyer = (session.customer_details && session.customer_details.email) || '';
    await resend('emails', 'POST', {
      from: await fromAddress('en'), to: [SHOP_INBOX], subject: 'paperback order ' + status.toLowerCase() + ' at lulu: ' + ref,
      text: `lulu changed this paperback order to ${status}.\n\nlulu says: ${(job.status && job.status.message) || '-'}\nprint job: ${job.id}\ncheckout: ${ref}\nbuyer: ${buyer}\n\nopen the job in lulu (developers.lulu.com → print jobs) to see why. you may need to place it again or refund the buyer in stripe.`,
    }, 'print-' + status + '-' + job.id);
    await mark(key, '1');
    return { status, alerted: true };
  }
  return { status };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  let payload = {};
  try { payload = JSON.parse(await readRaw(req)); } catch (e) { return res.status(200).json({ ignored: 'not json' }); }
  const id = payload && payload.data && payload.data.id;
  if (payload.topic !== 'PRINT_JOB_STATUS_CHANGED' || !id) return res.status(200).json({ ignored: 'not a print job update' });
  try {
    const out = await handleJob(id);
    return res.status(200).json(out);
  } catch (e) {
    console.error('lulu webhook failed', JSON.stringify({ job: id, reason: e.message }));
    return res.status(500).json({ error: e.message }); // lulu retries
  }
};

module.exports.handleJob = handleJob;
module.exports.trackingOf = trackingOf;
module.exports.shippedEmail = shippedEmail;
