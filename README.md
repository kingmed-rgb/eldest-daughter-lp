# The Eldest Daughter Workbook — Landing Page

Static landing page for [eldestdaughtercore.com](https://www.eldestdaughtercore.com).

## Stack

- Pure HTML/CSS — no framework, no build step
- Self-hosted fonts (Inter, Fraunces) in `fonts/`
- WebP images in `images/` and `pages/`
- Tracking: GA4 · Microsoft Clarity · Meta Pixel
- Hosting: GitHub Pages · Domain: Cloudflare

## Deployment

Hosted on **GitHub Pages**, served from the `main` branch (repo root).
Every push to `main` publishes the site within a minute or two.

The domain is managed in **Cloudflare** (DNS only, grey cloud):

| Type  | Name | Value                    |
|-------|------|--------------------------|
| A     | @    | `185.199.108.153`        |
| A     | @    | `185.199.109.153`        |
| A     | @    | `185.199.110.153`        |
| A     | @    | `185.199.111.153`        |
| CNAME | www  | `kingmed-rgb.github.io`  |

`CNAME` holds the custom domain for GitHub Pages; `.nojekyll` serves the files as-is.
Checkout is the Stripe payment link in `index.html`.

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
├── CNAME                   # Custom domain for GitHub Pages
└── .nojekyll               # Serve files as-is (no Jekyll)
```

## Environment variables

None required — fully static site.

## Local preview

Open `index.html` directly in a browser, or use any static server:

```bash
npx serve .
```
