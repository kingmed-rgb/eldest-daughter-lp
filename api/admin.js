// Private live data for the owner's dashboard page (/hq-7c4e). Read-only. Locked with BACKFILL_TOKEN (sent as a header).
//   GET /api/admin?days=7   -> goal, orders with source and items, failed payments, unfinished checkouts,
//                              Instagram views, Lulu print jobs. Nothing is changed or sent.
const crypto = require('crypto');
const { lulu } = require('./_lib/lulu.js');

const GOAL = 10000;
// 2026 sales from the old Stripe account and Gumroad (uploaded exports, those stores no longer sell)
const OLDER_2026 = 1493.06;
const IG_API = 'https://graph.facebook.com/v21.0/';

function tokenOk(given) {
  const want = (process.env.BACKFILL_TOKEN || '').trim();
  if (!want || !given) return false;
  return crypto.timingSafeEqual(crypto.createHash('sha256').update(String(given)).digest(), crypto.createHash('sha256').update(want).digest());
}
async function stripe(path) {
  const res = await fetch('https://api.stripe.com/v1/' + path, { headers: { Authorization: 'Bearer ' + (process.env.STRIPE_SECRET_KEY || '').trim() } });
  const data = await res.json();
  if (!res.ok) throw new Error((data.error && data.error.message) || 'Stripe request failed');
  return data;
}
async function all(path, max = 10) {
  const out = []; let after = null;
  for (let i = 0; i < max; i++) {
    const r = await stripe(path + (after ? '&starting_after=' + after : ''));
    out.push(...r.data); if (!r.has_more) break; after = r.data[r.data.length - 1].id;
  }
  return out;
}
const ITEM = { main: 'ebook', audio: 'audiobook', print: 'paperback', poems: 'poems', journal: 'journal' };
function itemsOf(s) {
  const m = (s.metadata || {}).items;
  if (m) return m.split(',').map((k) => ITEM[k] || k);
  return s.payment_link ? ['ebook (payment link)'] : ['ebook'];
}

async function instagram(days) {
  const token = (process.env.IG_ACCESS_TOKEN || '').trim(), ig = (process.env.IG_USER_ID || '').trim();
  if (!token || !ig) return { error: 'Instagram key not set' };
  const day = 86400, end = Math.floor(Date.now() / 1000 / day) * day;
  const get = async (path, q) => { const r = await fetch(IG_API + path + '?' + new URLSearchParams(Object.assign({ access_token: token }, q))); const d = await r.json(); if (d.error) throw new Error(d.error.message); return d; };
  try {
    const n = Math.min(days, 30);
    const per = await Promise.all([...Array(n + 1).keys()].map(async (i) => {
      const since = end - (n - i) * day;
      const d = await get(ig + '/insights', { metric: 'views,reach', period: 'day', metric_type: 'total_value', since, until: since + day });
      const v = {}; (d.data || []).forEach((m) => { v[m.name] = (m.total_value || {}).value || 0; });
      return { date: new Date(since * 1000).toISOString().slice(0, 10), views: v.views || 0, reach: v.reach || 0 };
    }));
    const media = await get(ig + '/media', { fields: 'timestamp,permalink,caption,like_count,comments_count', limit: 15 });
    const posts = (media.data || []).filter((m) => Date.parse(m.timestamp) / 1000 >= end - n * day).map((m) => ({
      when: m.timestamp, link: m.permalink, likes: m.like_count, comments: m.comments_count, text: String(m.caption || '').split('\n')[0].slice(0, 90),
    }));
    return { days: per, posts };
  } catch (e) { return { error: e.message }; }
}

async function printJobs() {
  try {
    const r = await lulu('/print-jobs/?page_size=10&ordering=-date_created');
    if (!r.ok) return { error: 'Lulu HTTP ' + r.status };
    return { jobs: ((r.data && r.data.results) || []).filter((j) => /^cs_/.test(j.external_id || '')).map((j) => ({
      id: j.id, created: j.date_created, status: (j.status || {}).name, ship_to: ((j.shipping_address || {}).country_code) || '',
      dispatch: j.estimated_shipping_dates ? [j.estimated_shipping_dates.dispatch_min, j.estimated_shipping_dates.dispatch_max] : null,
      arrival: j.estimated_shipping_dates ? [j.estimated_shipping_dates.arrival_min, j.estimated_shipping_dates.arrival_max] : null,
      tracking: ((j.line_items || [])[0] || {}).tracking_urls || null,
    })) };
  } catch (e) { return { error: e.message }; }
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  if (!tokenOk(req.headers['x-key'])) return res.status(404).json({ error: 'not found' });
  if ((req.query || {}).wallets) {
    // which payment methods and wallet domains are switched on in Stripe (read-only)
    try {
      const [doms, cfgs] = await Promise.all([stripe('payment_method_domains?limit=20'), stripe('payment_method_configurations?limit=10')]);
      const on = (c) => Object.keys(c).filter((k) => c[k] && typeof c[k] === 'object' && c[k].display_preference && c[k].available);
      return res.status(200).json({
        domains: (doms.data || []).map((d) => ({ domain: d.domain_name, enabled: d.enabled, apple_pay: (d.apple_pay || {}).status, google_pay: (d.google_pay || {}).status, link: (d.link || {}).status, paypal: (d.paypal || {}).status })),
        configurations: (cfgs.data || []).map((c) => ({ name: c.name, active: c.active, is_default: c.is_default, available: on(c) })),
      });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }
  const days = Math.min(90, Math.max(1, parseInt((req.query || {}).days, 10) || 7));
  const now = Math.floor(Date.now() / 1000), since = now - days * 86400, jan1 = Math.floor(Date.UTC(new Date().getUTCFullYear(), 0, 1) / 1000);
  try {
    const [year, charges, ig, print] = await Promise.all([
      all('checkout/sessions?limit=100&created[gte]=' + jan1),
      all('charges?limit=100&created[gte]=' + since, 3),
      instagram(days),
      printJobs(),
    ]);
    const paid = year.filter((s) => s.status === 'complete' && s.payment_status === 'paid');
    const siteYear = paid.reduce((a, s) => a + (s.amount_total || 0) / 100, 0);
    const inRange = paid.filter((s) => s.created >= since);
    const orders = inRange.map((s) => {
      const m = s.metadata || {}, cd = s.customer_details || {};
      return {
        when: new Date(s.created * 1000).toISOString(), amount: (s.amount_total || 0) / 100, items: itemsOf(s), site: m.page === 'es' ? 'Spanish' : 'English',
        source: m.source || (s.payment_link ? 'payment link' : 'not tracked'), first_source: m.first_source || '', campaign: m.campaign || '', ad: m.ad || '',
        days_to_buy: m.days_to_buy || '', country: (cd.address || {}).country || '', email: cd.email || s.customer_email || '', name: cd.name || '',
      };
    });
    const paidEmails = new Set(paid.map((s) => ((s.customer_details || {}).email || '').toLowerCase()).filter(Boolean));
    const failed = charges.filter((c) => c.status === 'failed').map((c) => {
      const email = (c.billing_details && c.billing_details.email) || c.receipt_email || '';
      return { when: new Date(c.created * 1000).toISOString(), amount: c.amount / 100, reason: c.failure_message || (c.outcome || {}).seller_message || '', code: (c.outcome || {}).reason || c.failure_code || '', email, paid_later: !!(email && paidEmails.has(email.toLowerCase())) };
    });
    const unfinished = year.filter((s) => s.created >= since && s.status !== 'complete').map((s) => {
      const email = (s.customer_details && s.customer_details.email) || s.customer_email || '';
      return { when: new Date(s.created * 1000).toISOString(), amount: (s.amount_total || 0) / 100, items: itemsOf(s), source: (s.metadata || {}).source || '', email, paid_later: !!(email && paidEmails.has(email.toLowerCase())) };
    }).filter((s) => s.email);
    const revenue = siteYear + OLDER_2026;
    const end = Date.UTC(new Date().getUTCFullYear(), 11, 31) / 1000, daysLeft = Math.max(1, Math.ceil((end - now) / 86400) + 1);
    return res.status(200).json({
      generated: new Date().toISOString(), days,
      goal: { goal: GOAL, revenue: Math.round(revenue * 100) / 100, site_year: Math.round(siteYear * 100) / 100, older: OLDER_2026, days_left: daysLeft, needed_per_day: Math.round(Math.max(0, GOAL - revenue) / daysLeft * 100) / 100 },
      orders, failed, unfinished, instagram: ig, print,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
