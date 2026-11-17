// Private: the "paperback is here" announcement to past buyers. Locked with BACKFILL_TOKEN, POST only.
//   { "mode": "test" }                          → one copy to the shop inbox, subject starts with [test]
//   { "mode": "send", "to": ["a@b.com", ...] }  → one email per person (nobody sees the others), in batches of 100
// The list is sent with the request and never stored on the site. Each person gets it once
// (Resend idempotency key per batch + duplicates removed).
const crypto = require('crypto');
const { resend, fromAddress } = require('./stripe-webhook.js');

const SHOP_INBOX = 'eldestdaughterbook@gmail.com';
const SITE = 'https://www.eldestdaughtercore.com';
const OFFER = SITE + '/?utm_source=email&utm_medium=email&utm_campaign=paperback_launch#offer';
const LULU = 'https://svc.lulu.com/?items=7b70f9a7-35db-4ac7-9567-97395e911aeb';
const IMAGE = SITE + '/images/email-paperback-v3.jpg'; // new name for each version: cloudflare keeps images for a year

function tokenOk(given) {
  const want = (process.env.BACKFILL_TOKEN || '').trim();
  if (!want || !given) return false;
  return crypto.timingSafeEqual(crypto.createHash('sha256').update(String(given)).digest(), crypto.createHash('sha256').update(want).digest());
}

const SUBJECT = 'the eldest daughter workbook is now in paperback 📖';
const PREHEADER = 'the same workbook, printed. the ebook comes with it.';

function email() {
  const p = (t, extra = '') => `<tr><td style="padding:0 0 16px;${extra}">${t}</td></tr>`;
  const btn = (href, label, dark = true) => `<tr><td style="padding:0 0 16px"><a href="${href}" style="display:block;background:${dark ? '#6B0F28' : '#FEF7EC'};color:${dark ? '#FEF7EC' : '#6B0F28'};border:1.5px solid #6B0F28;text-decoration:none;font-family:Georgia,serif;font-size:16px;font-weight:600;padding:15px 18px;border-radius:10px;text-align:center">${label} &rarr;</a></td></tr>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#FEF7EC">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${PREHEADER}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FEF7EC"><tr><td align="center" style="padding:24px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;font-family:Georgia,serif;color:#2B1218;font-size:17px;line-height:1.6">
<tr><td style="padding:8px 0 30px;border-bottom:1px solid #EBDCCD"><a href="${OFFER}"><img src="${IMAGE}" width="560" alt="your healing starts here. the eldest daughter workbook, now in print." style="display:block;width:100%;max-width:560px;height:auto;border:0"></a></td></tr>
<tr><td style="height:28px;line-height:28px;font-size:0">&nbsp;</td></tr>
${p('hi,')}
${p('you bought the eldest daughter workbook, and so many of you have asked me the same thing: <em>"is there a printed version?"</em>')}
${p('there is now.')}
${p("it's the same workbook, printed as a paperback you can write in, underline, and keep close. the ebook comes with it, so you can start tonight while the book is on its way.")}
${p('📦 <strong>free shipping to the us, uk, canada and australia</strong> · arrives in about 2 weeks')}
${btn(OFFER, 'get the paperback')}
${p('<strong>living somewhere else?</strong> you can order it here instead, with shipping to your country added at checkout:', 'padding-top:6px')}
${btn(LULU, 'order for other countries', false)}
${p("no pressure at all. what you already have is yours forever. i just wanted you to be the first to know.")}
${p('with love,<br>anna', 'padding-bottom:24px')}
<tr><td style="border-top:1px solid #EBDCCD;padding:16px 0 0;color:#5E434A;font-size:13px;line-height:1.5">you're getting this because you bought from eldest daughter core. reply "unsubscribe" and you won't get emails like this again.</td></tr>
</table></td></tr></table></body></html>`;
  const text = ['hi,', '', 'you bought the eldest daughter workbook, and so many of you have asked me the same thing: "is there a printed version?"', '', 'there is now.', '',
    "it's the same workbook, printed as a paperback you can write in, underline, and keep close. the ebook comes with it, so you can start tonight while the book is on its way.", '',
    'free shipping to the us, uk, canada and australia · arrives in about 2 weeks', 'get the paperback: ' + OFFER, '',
    'living somewhere else? you can order it here instead, with shipping to your country added at checkout:', LULU, '',
    'no pressure at all. what you already have is yours forever. i just wanted you to be the first to know.', '', 'with love,', 'anna', '',
    "you're getting this because you bought from eldest daughter core. reply \"unsubscribe\" and you won't get emails like this again."].join('\n');
  return { html, text };
}

function readBody(req) {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  return b || {};
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  if (!tokenOk((req.query || {}).token)) return res.status(404).json({ error: 'not found' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const body = readBody(req);
  const { html, text } = email();
  const from = await fromAddress('en');
  const base = { from, reply_to: SHOP_INBOX, html, text, headers: { 'List-Unsubscribe': '<mailto:' + SHOP_INBOX + '?subject=unsubscribe>' }, tags: [{ name: 'campaign', value: 'paperback_launch' }] };

  try {
    if (body.mode === 'test') {
      const sent = await resend('emails', 'POST', Object.assign({}, base, { to: [SHOP_INBOX], subject: '[test] ' + SUBJECT }));
      return res.status(200).json({ test_sent_to: SHOP_INBOX, id: sent.id });
    }
    if (body.mode === 'send') {
      const ok = /^[^\s@,;]+@[^\s@,;]+\.[a-z]{2,}$/i;
      const list = [...new Set((Array.isArray(body.to) ? body.to : []).map((e) => String(e).trim().toLowerCase()).filter((e) => ok.test(e)))];
      if (!list.length) return res.status(400).json({ error: 'no valid recipients' });
      let sent = 0; const failed = [];
      for (let i = 0; i < list.length; i += 100) {
        const chunk = list.slice(i, i + 100);
        try {
          const r = await resend('emails/batch', 'POST', chunk.map((to) => Object.assign({}, base, { to: [to], subject: SUBJECT })), 'paperback-launch-' + crypto.createHash('sha256').update(chunk.join(',')).digest('hex').slice(0, 24));
          sent += ((r && r.data) || []).length || chunk.length;
        } catch (e) { failed.push({ from: i, count: chunk.length, error: e.message }); }
      }
      console.log('paperback launch sent', JSON.stringify({ recipients: list.length, sent, failed: failed.length }));
      return res.status(200).json({ recipients: list.length, sent, failed });
    }
    return res.status(400).json({ error: 'mode must be test or send' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

module.exports.email = email;
