// Meta Conversions API: tells Meta about a paid order from the server, so purchases count even when the
// buyer's browser blocks or never loads the pixel (iPhone tracking opt-out, closed app, ad blockers).
// Same event_id as the pixel's Purchase on the thank-you page (the checkout session id), so Meta counts it once.
// Needs META_CAPI_TOKEN (Events Manager -> pixel -> Settings -> Conversions API -> Generate access token).
// Optional META_TEST_EVENT_CODE sends events to Events Manager -> Test events instead of live data.
const crypto = require('crypto');

const PIXEL_ID = '4363206913920168';
const sha = (v) => (v ? crypto.createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex') : undefined);

function purchaseEvent(session) {
  const m = session.metadata || {};
  const cd = session.customer_details || {};
  const addr = cd.address || {};
  const email = cd.email || session.customer_email || '';
  const names = String(cd.name || '').trim().split(/\s+/);
  const items = String(m.items || 'main').split(',').filter(Boolean);
  const site = m.page === 'es' ? 'https://www.hijamayor.com/' : 'https://www.eldestdaughtercore.com/';
  const user = {
    em: email ? [sha(email)] : undefined,
    fn: names[0] ? [sha(names[0])] : undefined,
    ln: names.length > 1 ? [sha(names[names.length - 1])] : undefined,
    ph: cd.phone ? [sha(String(cd.phone).replace(/[^0-9]/g, ''))] : undefined,
    ct: addr.city ? [sha(String(addr.city).replace(/\s+/g, ''))] : undefined,
    zp: addr.postal_code ? [sha(String(addr.postal_code).replace(/\s+/g, ''))] : undefined,
    country: addr.country ? [sha(addr.country)] : undefined,
    external_id: email ? [sha(email)] : undefined,
    fbp: m.fbp || undefined,
    fbc: m.fbc || undefined,
    client_ip_address: m.ip || undefined,
    client_user_agent: m.ua || undefined,
  };
  Object.keys(user).forEach((k) => user[k] === undefined && delete user[k]);
  return {
    event_name: 'Purchase',
    event_time: session.created || Math.floor(Date.now() / 1000),
    event_id: session.id,
    action_source: 'website',
    event_source_url: site,
    user_data: user,
    custom_data: {
      value: (session.amount_total || 0) / 100,
      currency: String(session.currency || 'usd').toUpperCase(),
      content_ids: items,
      content_type: 'product',
      num_items: items.length,
      order_id: session.id,
    },
  };
}

async function sendPurchase(session, { testCode } = {}) {
  const token = (process.env.META_CAPI_TOKEN || '').trim();
  if (!token) return { skipped: 'META_CAPI_TOKEN not set' };
  const body = { data: [purchaseEvent(session)] };
  const code = testCode || (process.env.META_TEST_EVENT_CODE || '').trim();
  if (code) body.test_event_code = code;
  const res = await fetch('https://graph.facebook.com/v21.0/' + PIXEL_ID + '/events?access_token=' + encodeURIComponent(token), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error((data.error && data.error.message) || 'Meta CAPI request failed');
  console.log('meta purchase sent', JSON.stringify({ session: session.id, received: data.events_received, test: !!code }));
  return data;
}

module.exports = { sendPurchase, purchaseEvent, PIXEL_ID };
