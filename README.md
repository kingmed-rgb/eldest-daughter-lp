# The Eldest Daughter Workbook — Landing Page

Static landing page for [eldestdaughtercore.com](https://www.eldestdaughtercore.com).

## Stack

- Pure HTML/CSS — no framework, no build step
- Self-hosted fonts (Inter, Fraunces) in `fonts/`
- WebP images in `images/` and `pages/`
- Tracking: GA4 · Microsoft Clarity · Meta Pixel

## Deployment

Deployed on **Vercel** via automatic Git integration.

Every push to `main` triggers a new production deployment.

### First-time setup

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import the `eldest-daughter-lp` GitHub repository
3. Framework preset: **Other** (no build command, output directory: `./`)
4. Click **Deploy**

### Custom domain

1. In Vercel dashboard → **Settings → Domains**
2. Add `www.eldestdaughtercore.com` and `eldestdaughtercore.com`
3. Update DNS records (see below)

### DNS records

| Type  | Name | Value                  |
|-------|------|------------------------|
| A     | @    | `76.76.21.21`          |
| CNAME | www  | `cname.vercel-dns.com` |

> Allow up to 48 hours for DNS propagation. Vercel provisions HTTPS automatically.

## Project structure

```
/
├── index.html              # Main landing page
├── terms-of-service/
│   └── index.html          # Served at /terms-of-service
├── privacy-policy/
│   └── index.html          # Served at /privacy-policy
├── fonts/                  # Self-hosted woff2 files
├── images/                 # Avatars, hero, bundle images (WebP)
├── pages/                  # Page preview cards (WebP)
├── favicon.png
├── vercel.json             # Clean URLs + cache headers
└── .vercelignore           # Excludes source PNGs and duplicate files
```

## Environment variables

None required — fully static site.

## Local preview

Open `index.html` directly in a browser, or use any static server:

```bash
npx serve .
```
