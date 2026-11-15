// The Pattern Audit: one-click upsell on the thank-you page.
//
//   GET  /api/audit?session_id=cs_…             → { available, spotsLeft, price }
//   POST /api/audit { action:'buy', session_id }  → charges the card saved at checkout (once per checkout)
//   POST /api/audit { action:'confirm', session_id, payment_intent } → after a bank (3-D Secure) step
//   POST /api/audit { action:'intake', session_id, answers:[{s,q,a}] } → sends the questionnaire to the inbox
//
// Everything is checked against Stripe, so only the person holding a paid checkout session can use it.
const { AUDIT, languageOf } = require('./_lib/catalog.js');
const { resend, fromAddress, REPLY_TO } = require('./stripe-webhook.js');

const PUBLISHABLE_KEYS = {
  test: 'pk_test_51TciBvAdg9H16Q68jtRwiJRpIP2Ir6mdcl4myj1ryN9flLJn1N8AyVIzhOm7EcJ5QRU345220KT5AommW0EpkWO600G3M9F7D8',
  live: 'pk_live_51TciB1AsMiI0w2mO6D6OjO4WepQjTUOb6cbxogZrvy6Hxm4cHf6cQjhvlDXaineb8A21VtGWFXZHIv3UiZTiawRv00ecjNtsMq',
};
const secret = () => (process.env.STRIPE_SECRET_KEY || '').trim();
const mode = () => (/^(sk|rk)_live_/.test(secret()) ? 'live' : 'test');

async function stripe(path, method = 'GET', body, idem) {
  const headers = { Authorization: 'Bearer ' + secret() };
  if (body) headers['Content-Type'] = 'application/x-www-form-urlencoded';
  if (idem) headers['Idempotency-Key'] = idem;
  const res = await fetch('https://api.stripe.com/v1/' + path, { method, headers, body: body ? new URLSearchParams(body).toString() : undefined });
  const data = await res.json();
  if (!res.ok) { const e = new Error((data.error && data.error.message) || 'Stripe request failed'); e.stripe = data.error || {}; throw e; }
  return data;
}

const validId = (id) => /^cs_(live|test)_[A-Za-z0-9]+$/.test(String(id || ''));

async function paidSession(id) {
  const q = new URLSearchParams(); q.append('expand[]', 'payment_intent');
  const s = await stripe('checkout/sessions/' + id + '?' + q.toString());
  if (s.status !== 'complete' || s.payment_status === 'unpaid') return null;
  return s;
}

// The audit payment is linked on the original order (instant), with a search fallback.
async function auditFor(session) {
  const pi = session.payment_intent && typeof session.payment_intent === 'object' ? session.payment_intent : null;
  const linked = pi && pi.metadata && pi.metadata.audit;
  if (linked) { const a = await stripe('payment_intents/' + linked); if (a.status === 'succeeded') return a; }
  const r = await stripe('payment_intents/search?query=' + encodeURIComponent(`metadata['kind']:'audit' AND metadata['session']:'${session.id}'`));
  return (r.data || []).find((p) => p.status === 'succeeded') || null;
}

async function soldThisWeek() {
  const since = Math.floor(Date.now() / 1000) - 7 * 86400;
  const r = await stripe('payment_intents/search?limit=100&query=' + encodeURIComponent(`metadata['kind']:'audit' AND status:'succeeded' AND created>${since}`));
  return (r.data || []).length;
}

const savedCard = (s) => {
  const pi = s.payment_intent && typeof s.payment_intent === 'object' ? s.payment_intent : null;
  const pm = pi && (typeof pi.payment_method === 'string' ? pi.payment_method : pi.payment_method && pi.payment_method.id);
  return s.customer && pm ? { customer: s.customer, pm } : null;
};

const EMAIL = {
  en: {
    bought: { subject: 'your pattern audit: next step', body: (link) => `you're in. your pattern audit spot is saved.\n\nthe next step is a short questionnaire (about 8 minutes): your family, your pattern, and one real moment where you're stuck.\n\nif you didn't finish it on the thank-you page, it's here:\n${link}\n\nyou'll hear from me within 48 hours of sending it.\n\nwith love,\nanna` },
    got: { subject: 'got it: your pattern audit', body: () => `got it. i'm reading what you sent, and you'll hear from me within 48 hours.\n\nwith love,\nanna` },
  },
  es: {
    bought: { subject: 'tu lectura de patrón: siguiente paso', body: (link) => `listo. tu lugar para la lectura de tu patrón está apartado.\n\nel siguiente paso es un cuestionario corto (unos 8 minutos): tu familia, tu patrón y un momento real donde estás atorada.\n\nsi no lo terminaste en la página de gracias, está aquí:\n${link}\n\nte respondo en menos de 48 horas desde que lo mandes.\n\ncon cariño,\nanna` },
    got: { subject: 'lo recibí: tu lectura de patrón', body: () => `lo recibí. ya lo estoy leyendo y te respondo en menos de 48 horas.\n\ncon cariño,\nanna` },
  },
};

const QUESTIONNAIRE = { en: 'https://www.eldestdaughtercore.com/get-xk7f2?session_id=', es: 'https://www.hijamayor.com/gracias?session_id=' };

async function mail(lang, to, which, idem, sessionId) {
  const e = EMAIL[lang][which];
  return resend('emails', 'POST', { from: await fromAddress(lang), to: [to], reply_to: REPLY_TO, subject: e.subject, text: e.body(QUESTIONNAIRE[lang] + sessionId) }, idem);
}

// Turn the questionnaire answers into a readable email, grouped by section.
function formatAnswers(list) {
  if (!Array.isArray(list)) return '';
  let out = '', section = '';
  for (const item of list.slice(0, 60)) {
    const sec = String(item.s || '').slice(0, 80), q = String(item.q || '').slice(0, 300), a = String(item.a || '').trim().slice(0, 3000);
    if (sec !== section) { out += `\n== ${sec.toUpperCase()} ==\n\n`; section = sec; }
    out += `${q}\n→ ${a || '(skipped)'}\n\n`;
  }
  return out.trim();
}

function body(req) {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  return b || {};
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  if (!secret()) return res.status(200).json({ available: false });

  try {
    if (req.method === 'GET') {
      const id = req.query && req.query.session_id;
      if (!validId(id)) return res.status(200).json({ available: false });
      const s = await paidSession(id);
      if (!s) return res.status(200).json({ available: false });
      const bought = await auditFor(s);
      if (bought) return res.status(200).json({ available: false, bought: true });
      if (!savedCard(s)) return res.status(200).json({ available: false });
      const left = AUDIT.weeklySpots - (await soldThisWeek());
      return res.status(200).json({ available: left > 0, spotsLeft: Math.max(left, 0), price: AUDIT.amount / 100 });
    }
    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'method not allowed' }); }

    const b = body(req);
    if (!validId(b.session_id)) return res.status(400).json({ error: 'bad session' });
    const s = await paidSession(b.session_id);
    if (!s) return res.status(400).json({ error: 'not paid' });
    const lang = languageOf(s);
    const email = (s.customer_details && s.customer_details.email) || s.customer_email;

    if (b.action === 'buy') {
      const already = await auditFor(s);
      if (already) return res.status(200).json({ ok: true, email });
      const card = savedCard(s);
      if (!card) return res.status(400).json({ error: 'no saved card' });
      if ((await soldThisWeek()) >= AUDIT.weeklySpots) return res.status(409).json({ error: 'full' });
      let pi;
      try {
        pi = await stripe('payment_intents', 'POST', {
          amount: String(AUDIT.amount), currency: 'usd', customer: card.customer, payment_method: card.pm,
          off_session: 'true', confirm: 'true', description: AUDIT.name[lang],
          'metadata[kind]': 'audit', 'metadata[session]': s.id, 'metadata[page]': lang,
          ...(email ? { receipt_email: email } : {}),
        }, 'audit-' + s.id);
      } catch (e) {
        // The bank wants the buyer to confirm (3-D Secure): hand the page what it needs to show that step.
        const p = e.stripe && e.stripe.payment_intent;
        if (p && p.status === 'requires_action') return res.status(200).json({ requiresAction: true, clientSecret: p.client_secret, publishableKey: PUBLISHABLE_KEYS[mode()] });
        console.error('audit charge failed:', e.message);
        return res.status(402).json({ error: 'declined' });
      }
      if (pi.status === 'requires_action') return res.status(200).json({ requiresAction: true, clientSecret: pi.client_secret, publishableKey: PUBLISHABLE_KEYS[mode()] });
      if (pi.status !== 'succeeded') return res.status(402).json({ error: 'not completed' });
      const orig = s.payment_intent && s.payment_intent.id;
      if (orig) await stripe('payment_intents/' + orig, 'POST', { 'metadata[audit]': pi.id }).catch((e) => console.error('link audit failed:', e.message));
      if (email) await mail(lang, email, 'bought', 'audit-bought-' + s.id, s.id).catch((e) => console.error('audit email failed:', e.message));
      console.log('audit sold', JSON.stringify({ session: s.id, pi: pi.id, lang }));
      return res.status(200).json({ ok: true, email });
    }

    if (b.action === 'confirm') {
      // After the bank confirmation step: verify the payment belongs to this order and succeeded.
      if (!/^pi_[A-Za-z0-9]+$/.test(String(b.payment_intent || ''))) return res.status(400).json({ error: 'bad payment' });
      const pi = await stripe('payment_intents/' + b.payment_intent);
      if (pi.metadata.kind !== 'audit' || pi.metadata.session !== s.id || pi.status !== 'succeeded') return res.status(402).json({ error: 'not completed' });
      const orig = s.payment_intent && s.payment_intent.id;
      if (orig) await stripe('payment_intents/' + orig, 'POST', { 'metadata[audit]': pi.id }).catch(() => {});
      if (email) await mail(lang, email, 'bought', 'audit-bought-' + s.id, s.id).catch(() => {});
      return res.status(200).json({ ok: true, email });
    }

    if (b.action === 'intake') {
      const text = b.answers ? formatAnswers(b.answers) : String(b.text || '').trim().slice(0, 8000);
      if (text.length < 20) return res.status(400).json({ error: 'too short' });
      const paid = await auditFor(s);
      if (!paid) return res.status(403).json({ error: 'audit not purchased' });
      await resend('emails', 'POST', {
        from: await fromAddress(lang), to: [AUDIT.inbox], reply_to: email || undefined,
        subject: `pattern audit (${lang}) · ${email || s.id}`,
        text: `new pattern audit (questionnaire)\n\nbuyer: ${email || 'unknown'}\nlanguage: ${lang}\npaid: ${new Date(paid.created * 1000).toISOString()}\nreply within 48 hours (just reply to this email)\n\n---\n\n${text}`,
      });
      if (email) await mail(lang, email, 'got', 'audit-got-' + s.id, s.id).catch((e) => console.error('audit email failed:', e.message));
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'unknown action' });
  } catch (err) {
    console.error('audit error:', err.message);
    return res.status(500).json({ error: 'something went wrong' });
  }
};
