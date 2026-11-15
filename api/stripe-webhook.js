// Stripe webhook → sends the download email with Resend after every paid checkout.
//
// Stripe destination URL:  https://eldestdaughtercore.com/api/stripe-webhook
// Events: checkout.session.completed, checkout.session.async_payment_succeeded
//
// Env (Vercel → Settings → Environment Variables):
//   STRIPE_SECRET_KEY      already set; used to re-fetch each event from Stripe, so a forged POST can't send mail
//   RESEND_API_KEY         Resend API key
//   STRIPE_WEBHOOK_SECRET  optional extra check (whsec_…); when set, the Stripe-Signature header must match
//   EMAIL_FROM / EMAIL_FROM_ES  optional overrides of the senders (defaults below)
//
// Opening this URL in a browser (GET) reports whether everything is set up, never the keys.

const crypto = require('crypto');

const REPLY_TO = 'eldestdaughterbook@gmail.com';
// Sender per language. Spanish uses hijamayor.com once that domain is verified in Resend,
// and falls back to the English sender until then.
const SENDERS = {
  en: { from: 'anna from eldest daughter core <anna@eldestdaughtercore.com>', domain: 'eldestdaughtercore.com' },
  es: { from: 'anna de hija mayor <anna@hijamayor.com>', domain: 'hijamayor.com' },
};

const EMAILS = {
  en: {
    subject: 'your eldest daughter healing bundle is here',
    preheader: 'your three downloads are inside. save this email.',
    hello: 'hi,',
    intro: "thank you for buying the eldest daughter healing bundle. here's everything, ready to download:",
    files: [
      ['the eldest daughter workbook', 'https://drive.google.com/file/d/1uST3jP6d1VloCdCvBEyCtvD2JTofDXpg/view?usp=sharing'],
      ['poems & letters', 'https://drive.google.com/file/d/1fmpT9Cs5dSTxVqiCkojP8w85hUxty_n2/view?usp=sharing'],
      ['inner child healing worksheet', 'https://drive.google.com/file/d/1-8AtRRz9L7xtuZoX6At3-qoCJh1JoTB_/view?usp=sharing'],
    ],
    late: "sorry this is so late. a problem on our side kept your download email from going out, and it's fixed now.",
    tip: "save this email so you can come back to the files anytime. start with chapter one, at your own pace.",
    help: "if a link doesn't open or anything feels off, just reply to this email.",
    signoff: 'with love,<br>anna',
  },
  es: {
    subject: 'tu ebook síndrome de la hija mayor ya está aquí',
    preheader: 'tu descarga está adentro. guarda este correo.',
    hello: 'hola,',
    intro: 'gracias por comprar síndrome de la hija mayor. aquí tienes tu ebook, listo para descargar:',
    files: [
      ['síndrome de la hija mayor (pdf)', 'https://drive.google.com/uc?export=download&id=11qYyNgbQSvzttHweeHf-WAbHuA7o4Jw9'],
    ],
    late: 'perdón por la demora. un error de nuestro lado impidió que te llegara el correo de descarga, y ya está resuelto.',
    tip: 'guarda este correo para volver al archivo cuando quieras. ve a tu ritmo.',
    help: 'si el enlace no abre o algo no funciona, responde a este correo.',
    signoff: 'con cariño,<br>anna',
  },
};

// ---------- helpers ----------

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

async function stripeGet(path) {
  const res = await fetch('https://api.stripe.com/v1/' + path, {
    headers: { Authorization: 'Bearer ' + (process.env.STRIPE_SECRET_KEY || '').trim() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data.error && data.error.message) || 'Stripe request failed');
  return data;
}

async function resend(path, method = 'GET', body, idempotencyKey) {
  const headers = { Authorization: 'Bearer ' + (process.env.RESEND_API_KEY || '').trim() };
  if (body) headers['Content-Type'] = 'application/json';
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  const res = await fetch('https://api.resend.com/' + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch (e) { data = { message: text }; }
  if (!res.ok) throw new Error('Resend ' + res.status + ': ' + (data.message || text));
  return data;
}

async function verifiedDomains() {
  const list = await resend('domains');
  return (list.data || []).filter((d) => d.status === 'verified').map((d) => d.name);
}

let domainsCache = { at: 0, list: null };
async function cachedDomains() {
  if (domainsCache.list && Date.now() - domainsCache.at < 10 * 60 * 1000) return domainsCache.list;
  domainsCache = { at: Date.now(), list: await verifiedDomains() };
  return domainsCache.list;
}

async function fromAddress(lang) {
  if (lang === 'es' && process.env.EMAIL_FROM_ES) return process.env.EMAIL_FROM_ES.trim();
  if (lang !== 'es' && process.env.EMAIL_FROM) return process.env.EMAIL_FROM.trim();
  const wanted = SENDERS[lang] || SENDERS.en;
  if (wanted === SENDERS.en) return SENDERS.en.from;
  try { if ((await cachedDomains()).includes(wanted.domain)) return wanted.from; } catch (e) { /* key can't list domains */ }
  return SENDERS.en.from;
}

function readRaw(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', () => resolve(''));
  });
}

function signatureOk(raw, header, secret) {
  if (!raw || !header) return false;
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=')).filter((p) => p.length === 2).map(([k, v]) => [k, v]));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > 300) return false;
  const expected = crypto.createHmac('sha256', secret).update(t + '.' + raw).digest('hex');
  return header.split(',').filter((p) => p.startsWith('v1=')).some((p) => {
    const sig = p.slice(3);
    return sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  });
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function renderEmail(c, late) {
  const buttons = c.files.map(([label, url]) =>
    `<tr><td style="padding:0 0 12px"><a href="${esc(url)}" style="display:block;background:#4D0619;color:#FEF7EC;text-decoration:none;font-family:Georgia,serif;font-size:16px;font-weight:600;padding:15px 18px;border-radius:10px;text-align:center">${esc(label)} &rarr;</a></td></tr>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#FEF7EC">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(c.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FEF7EC"><tr><td align="center" style="padding:32px 20px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;font-family:Georgia,serif;color:#2B1218;font-size:17px;line-height:1.6">
<tr><td style="padding:0 0 16px">${c.hello}</td></tr>
${late ? `<tr><td style="padding:0 0 16px">${esc(c.late)}</td></tr>` : ''}
<tr><td style="padding:0 0 20px">${esc(c.intro)}</td></tr>
${buttons}
<tr><td style="padding:8px 0 16px">${esc(c.tip)}</td></tr>
<tr><td style="padding:0 0 16px;color:#5E434A;font-size:15px">${esc(c.help)}</td></tr>
<tr><td style="padding:0 0 24px">${c.signoff}</td></tr>
<tr><td style="border-top:1px solid #EBDCCD;padding:16px 0 0;color:#5E434A;font-size:13px">${esc(REPLY_TO)}</td></tr>
</table></td></tr></table></body></html>`;
  const text = [c.hello, '', ...(late ? [c.late, ''] : []), c.intro, '', ...c.files.map(([l, u]) => l + ': ' + u), '', c.tip, c.help, '', c.signoff.replace('<br>', '\n')].join('\n');
  return { html, text };
}

function languageOf(session) {
  const page = session.metadata && session.metadata.page;
  if (EMAILS[page]) return page;
  if (session.locale && /^es/.test(session.locale)) return 'es';
  if (session.amount_total === 900) return 'es'; // Spanish payment link (no metadata)
  return 'en';
}

async function sendFor(session, { late = false } = {}) {
  const to = (session.customer_details && session.customer_details.email) || session.customer_email;
  if (!to) throw new Error('session ' + session.id + ' has no customer email');
  const lang = languageOf(session);
  const c = EMAILS[lang];
  const { html, text } = renderEmail(c, late);
  // One email per checkout session, even if Stripe retries or sends both events.
  const sent = await resend('emails', 'POST', {
    from: await fromAddress(lang), to: [to], reply_to: REPLY_TO, subject: c.subject, html, text,
    tags: [{ name: 'lang', value: lang }],
  }, 'delivery-' + session.id);
  console.log('delivery email sent', JSON.stringify({ session: session.id, lang, email_id: sent.id, late }));
  // Mark the payment in Stripe so a later resend never emails this buyer twice.
  const pi = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent && session.payment_intent.id;
  if (pi) {
    try { await stripePost('payment_intents/' + pi, { 'metadata[delivery_email]': sent.id }); }
    catch (e) { console.error('could not mark payment', pi, e.message); }
  }
  return sent;
}

// ---------- handler ----------

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const stripeReady = /^(sk|rk)_(live|test)_/.test((process.env.STRIPE_SECRET_KEY || '').trim());
  const resendReady = Boolean((process.env.RESEND_API_KEY || '').trim());

  if (req.method === 'GET') {
    const status = { stripeKey: stripeReady, resendKey: resendReady, webhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET), emailFrom: process.env.EMAIL_FROM || null };
    if (resendReady) {
      try { status.verifiedDomains = await verifiedDomains(); } catch (e) { status.resendError = e.message; }
      status.sender = await fromAddress('en');
      status.senderEs = await fromAddress('es');
    }
    status.ready = stripeReady && resendReady && Boolean(status.sender);
    return res.status(200).json(status);
  }
  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (!stripeReady || !resendReady) return res.status(503).json({ error: 'not configured' }); // Stripe retries for 3 days

  // Read the payload. Raw text is needed only for the optional signature check.
  let raw = '';
  let payload = req.body;
  if (payload === undefined || payload === null) { raw = await readRaw(req); try { payload = JSON.parse(raw); } catch (e) { payload = null; } }
  else if (Buffer.isBuffer(payload)) { raw = payload.toString('utf8'); payload = JSON.parse(raw); }
  else if (typeof payload === 'string') { raw = payload; payload = JSON.parse(raw); }

  const secret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();
  if (secret && raw && !signatureOk(raw, req.headers['stripe-signature'], secret)) {
    return res.status(400).json({ error: 'bad signature' });
  }

  const eventId = payload && payload.id;
  if (!eventId || !/^evt_/.test(eventId)) return res.status(400).json({ error: 'no event id' });

  try {
    // Trust only what Stripe itself returns for this id.
    const event = await stripeGet('events/' + encodeURIComponent(eventId));
    const session = event.data && event.data.object;
    const wanted = event.type === 'checkout.session.async_payment_succeeded'
      || (event.type === 'checkout.session.completed' && session.payment_status !== 'unpaid');
    if (!wanted || !session || session.object !== 'checkout.session') return res.status(200).json({ ignored: event.type });
    const sent = await sendFor(session);
    return res.status(200).json({ sent: true, email_id: sent.id });
  } catch (err) {
    console.error('delivery failed:', err.message);
    return res.status(500).json({ error: err.message }); // non-2xx → Stripe retries
  }
};

module.exports.sendFor = sendFor;
module.exports.stripeGet = stripeGet;
module.exports.languageOf = languageOf;
