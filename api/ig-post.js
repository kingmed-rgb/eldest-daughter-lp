// Publishes the day's Instagram post for @celestwritings (queue: api/_lib/ig-queue.json, images: /images/ig/).
// Runs from the Vercel cron in vercel.json every day at 23:00 UTC (6pm New York in winter, 7pm in summer).
//   cron:    GET /api/ig-post                    (Vercel sends Authorization: Bearer $CRON_SECRET)
//   manual:  GET /api/ig-post?token=...&dry=1     shows what would be posted today, posts nothing
//            GET /api/ig-post?token=...&date=YYYY-MM-DD&dry=1
// Needs Vercel env vars IG_ACCESS_TOKEN (a Page access token with instagram_content_publish) and IG_USER_ID.
// Posts once per date: it looks at today's posts on the account first and skips if this one is already there.
const crypto = require('crypto');
const QUEUE = require('./_lib/ig-queue.json');

const SITE = 'https://www.eldestdaughtercore.com';
const API = 'https://graph.facebook.com/v21.0/';

function same(a, b) {
  if (!a || !b) return false;
  return crypto.timingSafeEqual(crypto.createHash('sha256').update(String(a)).digest(), crypto.createHash('sha256').update(String(b)).digest());
}
function allowed(req) {
  const q = req.query || {};
  const cron = (process.env.CRON_SECRET || '').trim();
  if (cron && same(req.headers.authorization, 'Bearer ' + cron)) return true;
  return same(q.token, (process.env.BACKFILL_TOKEN || '').trim());
}
const nyDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

async function graph(path, params = {}, method = 'GET') {
  const token = (process.env.IG_ACCESS_TOKEN || '').trim();
  const body = new URLSearchParams(Object.assign({}, params, { access_token: token }));
  const url = API + path + (method === 'GET' ? '?' + body : '');
  const res = await fetch(url, method === 'GET' ? {} : { method, body });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error((data.error && data.error.message) || 'Instagram request failed');
  return data;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  if (!allowed(req)) return res.status(404).json({ error: 'not found' });
  const q = req.query || {};
  const date = /^\d{4}-\d{2}-\d{2}$/.test(q.date || '') ? q.date : nyDate();
  const post = QUEUE.find((p) => p.date === date);
  if (!post) return res.status(200).json({ date, posted: false, reason: 'nothing queued for this date', last_queued: (QUEUE[QUEUE.length - 1] || {}).date });
  const imageUrl = SITE + post.image;
  if (q.dry) return res.status(200).json({ date, dry: true, image_url: imageUrl, caption: post.caption });

  const ig = (process.env.IG_USER_ID || '').trim();
  if (!ig || !process.env.IG_ACCESS_TOKEN) return res.status(500).json({ error: 'IG_USER_ID / IG_ACCESS_TOKEN not set' });
  try {
    // already posted today? (cron retries, or a manual run)
    const recent = await graph(ig + '/media', { fields: 'caption,timestamp,permalink', limit: 10 });
    const firstLine = post.caption.split('\n')[0].slice(0, 60);
    const dup = (recent.data || []).find((m) => (m.caption || '').startsWith(firstLine));
    if (dup) return res.status(200).json({ date, posted: false, reason: 'already on instagram', permalink: dup.permalink });

    const container = await graph(ig + '/media', { image_url: imageUrl, caption: post.caption }, 'POST');
    for (let i = 0; i < 10; i++) {
      const st = await graph(container.id, { fields: 'status_code' });
      if (st.status_code === 'FINISHED') break;
      if (st.status_code === 'ERROR' || st.status_code === 'EXPIRED') throw new Error('instagram could not process the image: ' + st.status_code);
      await wait(2000);
    }
    const published = await graph(ig + '/media_publish', { creation_id: container.id }, 'POST');
    const info = await graph(published.id, { fields: 'permalink' }).catch(() => ({}));
    console.log('instagram post published', JSON.stringify({ date, id: published.id }));
    return res.status(200).json({ date, posted: true, id: published.id, permalink: info.permalink });
  } catch (e) {
    console.error('instagram post failed', JSON.stringify({ date, reason: e.message }));
    return res.status(500).json({ date, error: e.message });
  }
};
