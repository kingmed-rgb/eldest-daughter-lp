// Private: send ONE "your order didn't go through" reminder to a buyer whose payment failed or who left checkout.
//   POST /api/remind   header x-key: <BACKFILL_TOKEN>   body { "email": "...", "lang": "en" | "es", "dry": true? }
// Refuses if that email has paid in the last 7 days, and never sends twice to the same person on the same day.
const crypto = require('crypto');
const { resend, fromAddress } = require('./stripe-webhook.js');

const SHOP_INBOX = 'eldestdaughterbook@gmail.com';
const LINK = { en: 'https://www.eldestdaughtercore.com/?utm_source=email&utm_campaign=payment_reminder#offer', es: 'https://www.hijamayor.com/?utm_source=email&utm_campaign=payment_reminder#offer' };
const COPY = {
  en: { subject: "your order didn't go through 🤍", pre: 'your copy is still waiting for you.',
    lines: ['hi,', "it looks like your order for the eldest daughter workbook didn't go through. the card number had a small typo, it happens to everyone, especially on a phone.", 'your copy is still waiting for you here:'],
    button: 'finish my order', after: ['if typing a card feels fiddly, apple pay or google pay at checkout is one tap.', 'with love,<br>anna'] },
  es: { subject: 'tu pedido no se completó 🤍', pre: 'tu copia te sigue esperando.',
    lines: ['hola,', 'parece que tu pedido del cuaderno de la hija mayor no se completó. el número de la tarjeta tenía un pequeño error, le pasa a todo el mundo, sobre todo en el celular.', 'tu copia te sigue esperando aquí:'],
    button: 'terminar mi pedido', after: ['si escribir la tarjeta es incómodo, apple pay o google pay en el pago es un solo toque.', 'con cariño,<br>anna'] },
};

function tokenOk(given) {
  const want = (process.env.BACKFILL_TOKEN || '').trim();
  if (!want || !given) return false;
  return crypto.timingSafeEqual(crypto.createHash('sha256').update(String(given)).digest(), crypto.createHash('sha256').update(want).digest());
}
async function paidRecently(email) {
  const since = Math.floor(Date.now() / 1000) - 7 * 86400;
  const r = await fetch('https://api.stripe.com/v1/checkout/sessions?limit=100&status=complete&created[gte]=' + since, { headers: { Authorization: 'Bearer ' + (process.env.STRIPE_SECRET_KEY || '').trim() } });
  const d = await r.json();
  if (!r.ok) throw new Error((d.error && d.error.message) || 'Stripe request failed');
  return (d.data || []).some((s) => s.payment_status === 'paid' && ((s.customer_details || {}).email || '').toLowerCase() === email);
}
function render(c, link) {
  const p = (t) => `<tr><td style="padding:0 0 16px">${t}</td></tr>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#FEF7EC">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${c.pre}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FEF7EC"><tr><td align="center" style="padding:32px 20px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;font-family:Georgia,serif;color:#2B1218;font-size:17px;line-height:1.6">
${c.lines.map(p).join('')}
<tr><td style="padding:0 0 20px"><a href="${link}" style="display:block;background:#6B0F28;color:#FEF7EC;text-decoration:none;font-family:Georgia,serif;font-size:16px;font-weight:600;padding:15px 18px;border-radius:10px;text-align:center">${c.button} &rarr;</a></td></tr>
${c.after.map(p).join('')}
</table></td></tr></table></body></html>`;
  const text = [...c.lines, link, '', ...c.after.map((t) => t.replace('<br>', '\n'))].join('\n\n');
  return { html, text };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!tokenOk(req.headers['x-key'])) return res.status(404).json({ error: 'not found' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } } b = b || {};
  const email = String(b.email || '').trim().toLowerCase();
  if (!/^[^\s@,;]+@[^\s@,;]+\.[a-z]{2,}$/i.test(email)) return res.status(400).json({ error: 'valid email required' });
  const lang = b.lang === 'es' ? 'es' : 'en', c = COPY[lang], { html, text } = render(c, LINK[lang]);
  try {
    if (await paidRecently(email)) return res.status(200).json({ sent: false, reason: 'already paid in the last 7 days' });
    if (b.dry) return res.status(200).json({ sent: false, dry: true, to: email, subject: c.subject, text });
    const day = new Date().toISOString().slice(0, 10);
    const sent = await resend('emails', 'POST', { from: await fromAddress(lang), to: [email], reply_to: SHOP_INBOX, subject: c.subject, html, text, tags: [{ name: 'type', value: 'payment_reminder' }] },
      'remind-' + crypto.createHash('sha256').update(email + day).digest('hex').slice(0, 24));
    console.log('payment reminder sent', JSON.stringify({ id: sent.id, lang }));
    return res.status(200).json({ sent: true, id: sent.id, to: email });
  } catch (e) { return res.status(500).json({ error: e.message }); }
};
