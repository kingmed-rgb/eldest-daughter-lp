// Private report: where paying customers came from (tiktok, instagram, facebook...). Locked with BACKFILL_TOKEN.
//   /api/sales-sources?token=...                 last 30 days
//   /api/sales-sources?token=...&since=2026-11-17
// The source is saved on each order by the sales page (metadata.source). Orders from before tracking started
// show as "not tracked".
const crypto = require('crypto');

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

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const usd = (c) => '$' + (c / 100).toFixed(2);
const LABEL = { tiktok: 'tiktok', instagram: 'instagram', facebook: 'facebook', meta: 'meta ad (instagram or facebook)', direct: 'direct / unknown', unknown: 'direct / unknown' };

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  const q = req.query || {};
  if (!tokenOk(q.token)) return res.status(404).send('not found');

  const since = /^\d{4}-\d{2}-\d{2}$/.test(q.since || '') ? new Date(q.since + 'T00:00:00Z') : new Date(Date.now() - 30 * 864e5);
  try {
    // every paid checkout since the date
    const orders = [];
    let after = null;
    for (let page = 0; page < 20; page++) {
      const list = await stripe('checkout/sessions?limit=100&status=complete&created[gte]=' + Math.floor(since / 1000) + (after ? '&starting_after=' + after : ''));
      for (const s of list.data) if (s.payment_status === 'paid') orders.push(s);
      if (!list.has_more) break;
      after = list.data[list.data.length - 1].id;
    }

    const groups = {};
    for (const s of orders) {
      const m = s.metadata || {};
      const key = m.source ? (LABEL[m.source] || m.source) : 'not tracked (before tracking started)';
      const g = groups[key] || (groups[key] = { orders: 0, revenue: 0, paperback: 0, campaigns: {} });
      g.orders++; g.revenue += s.amount_total || 0;
      if (String(m.items || '').split(',').includes('print')) g.paperback++;
      if (m.campaign) g.campaigns[m.campaign] = (g.campaigns[m.campaign] || 0) + 1;
    }
    const rows = Object.entries(groups).sort((a, b) => b[1].revenue - a[1].revenue);
    const total = orders.reduce((n, s) => n + (s.amount_total || 0), 0);

    const recent = orders.slice(0, 50).map((s) => {
      const m = s.metadata || {};
      return `<tr><td>${esc(new Date(s.created * 1000).toISOString().slice(0, 16).replace('T', ' '))}</td><td>${esc(m.source ? (LABEL[m.source] || m.source) : 'not tracked')}</td><td>${esc(m.first_source && m.first_source !== m.source ? m.first_source : '')}</td><td>${esc(m.campaign || '')}${m.ad ? ' · ' + esc(m.ad) : ''}</td><td>${esc(m.items || '')}</td><td class="n">${usd(s.amount_total || 0)}</td></tr>`;
    }).join('');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>sales by source</title>
<style>body{font:15px/1.5 -apple-system,system-ui,sans-serif;margin:0;padding:20px 16px;background:#FEF7EC;color:#2B1218}h1{font-size:22px;margin:0 0 4px}p{margin:0 0 16px;color:#5E434A}
table{width:100%;border-collapse:collapse;margin:0 0 28px;background:#fff;border-radius:10px;overflow:hidden}th,td{text-align:left;padding:9px 10px;border-bottom:1px solid #EBDCCD;vertical-align:top}th{font-size:13px;color:#5E434A;font-weight:600}.n{text-align:right;white-space:nowrap}h2{font-size:17px;margin:0 0 8px}.s{font-size:13px;color:#5E434A}</style></head><body>
<h1>sales by source</h1><p>since ${esc(since.toISOString().slice(0, 10))} · ${orders.length} paid orders · ${usd(total)}</p>
<table><tr><th>source</th><th class="n">orders</th><th class="n">share</th><th class="n">revenue</th><th class="n">paperbacks</th></tr>
${rows.map(([k, g]) => `<tr><td>${esc(k)}${Object.keys(g.campaigns).length ? '<div class="s">' + Object.entries(g.campaigns).map(([c, n]) => esc(c) + ' (' + n + ')').join(', ') + '</div>' : ''}</td><td class="n">${g.orders}</td><td class="n">${orders.length ? Math.round(g.orders / orders.length * 100) : 0}%</td><td class="n">${usd(g.revenue)}</td><td class="n">${g.paperback}</td></tr>`).join('')}
</table>
<h2>latest orders</h2><table><tr><th>date (utc)</th><th>source</th><th>first came from</th><th>campaign · ad</th><th>bought</th><th class="n">paid</th></tr>${recent}</table>
</body></html>`);
  } catch (e) {
    return res.status(500).send('error: ' + esc(e.message));
  }
};
