// Lulu Print API: sign-in, file checks, cost quotes, print jobs.
// Keys come from Vercel: LULU_CLIENT_KEY and LULU_CLIENT_SECRET (live keys use api.lulu.com).
const BASE = process.env.LULU_API_BASE || 'https://api.lulu.com';
const TOKEN_URL = BASE + '/auth/realms/glasstree/protocol/openid-connect/token';

let cached = { token: null, until: 0 };

async function token() {
  if (cached.token && Date.now() < cached.until) return cached.token;
  const key = (process.env.LULU_CLIENT_KEY || '').trim(), secret = (process.env.LULU_CLIENT_SECRET || '').trim();
  if (!key || !secret) throw new Error('lulu keys missing');
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { Authorization: 'Basic ' + Buffer.from(key + ':' + secret).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) throw new Error('lulu sign-in failed: HTTP ' + res.status + ' ' + (data.error_description || data.error || ''));
  cached = { token: data.access_token, until: Date.now() + Math.max(60, (data.expires_in || 300) - 60) * 1000 };
  return cached.token;
}

// Returns { ok, status, data } and never throws on API errors (so callers can report them).
async function lulu(path, method = 'GET', body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { Authorization: 'Bearer ' + (await token()), 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch (e) { data = { raw: text.slice(0, 2000) }; }
  return { ok: res.ok, status: res.status, data };
}

module.exports = { lulu, token, BASE };
