// Shows the Spanish page at the root of hijamayor.com.
// Runs before static files are served (a vercel.json rewrite can't override index.html).
export const config = { matcher: '/' };

const SPANISH_HOSTS = new Set(['hijamayor.com', 'www.hijamayor.com']);

export default function middleware(request) {
  const host = (request.headers.get('host') || '').toLowerCase();
  if (!SPANISH_HOSTS.has(host)) return; // eldestdaughtercore.com keeps the English page
  return new Response(null, {
    headers: { 'x-middleware-rewrite': new URL('/es', request.url).toString() },
  });
}
