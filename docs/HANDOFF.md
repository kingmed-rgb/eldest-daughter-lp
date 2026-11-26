# handoff: eldest daughter core (read this first)

Context for a new Claude session. Everything below is in this repo (`kingmed-rgb/eldest-daughter-lp`).

## the business
- Product: **The Eldest Daughter Workbook** by anna celestina (English), and **Síndrome de la hija mayor** (Spanish ebook).
- Sites (static, hosted on Vercel, behind Cloudflare): **eldestdaughtercore.com** (`index.html`) and **hijamayor.com** (`es/index.html`).
- Branch `main` = live site. Work happens on a branch and goes to main only when the owner says "push to main".

## current offer (English page)
| format | price | crossed out | includes |
|---|---|---|---|
| ebook | $9.99 | $29.99 | workbook PDF |
| audiobook | $19.99 | $59.99 | + ebook (MP3 + M4B with chapters) |
| paperback | $29.99 | $89.99 | + ebook & audiobook; printed + shipped by Lulu, free shipping to US/UK/CA/AU |

Add-ons in the checkout pop-up: **Dear Angry Eldest Daughter** (poetry, $7) and **The Eldest Daughter Journal** (guided journal, $7).
Spanish page: ebook $9 + the same two add-ons in Spanish.

## where things are
- Sales page copy, offer box, FAQ, reviews: `index.html` (English), `es/index.html` (Spanish)
- Images: `images/` (offer-workbook-tablet.webp = ebook, offer-audiobook-combo.webp = audiobook,
  offer-paperback.webp = paperback, bump-poems-en.webp / bump-journal-en.webp = add-ons, author-pfp.webp)
- Fonts: `fonts/` (Fraunces for headings, Source Serif 4 for text)
- Brand colors: cream background #FEF7EC, offer card #FFFCF6, burgundy buttons #6B0F28, deep wine titles #4D0619,
  text #2B1218, muted #5E434A, soft rose #F2DED6, lines #EBDCCD. Lowercase writing style.
- Downloads delivered to buyers: `files/e2b0943418c5d310d9/` (PDFs, audiobook mp3/m4b)
- Products and prices (server side): `api/_lib/catalog.js`
- Checkout (Stripe embedded) `api/create-checkout-session.js`, order emails `api/stripe-webhook.js` (Resend),
  paperback printing `api/_lib/print.js` + `api/lulu-webhook.js` (Lulu Print API, shipped email with tracking)
- Audiobook narration scripts: `docs/audiobook/`

## new sales page (/workbook)
- `workbook/index.html` is the Shopify product page design (cart drawer, add-on upsell, sticky bar) running on this site's Stripe checkout.
  Built from `docs/lp-v2/` (`product.src.html`, `brand.py`, `checkout.html`): edit those, then `python3 docs/lp-v2/build.py`. Images in `images/v2/`.

## test page (/read): the main page plus the best parts of /workbook
- `read/index.html` = `index.html` with: real page spreads after the self-check, four number cards instead of
  "right now / after", an audiobook preview in the offer card, and a sticky edition bar. Same headline, copy and checkout.
- Built from `index.html` by `python3 docs/lp-read/build.py`: **rebuild it after every change to index.html** so the two
  pages only differ in the tested parts.
- Every Stripe order carries `metadata.landing` = `article` (main page), `read` or `workbook`; HQ shows it as "page …".
  Compare sales per page against visits per page in Vercel Analytics (Clarity also has a `landing` tag on /read).

## secrets
Never in the repo. Stripe, Resend, Lulu keys live in Vercel environment variables.

## next task: a Shopify version to compare with the website
- Owner pulled their Shopify theme to `~/Documents/my-shopify-theme` (Shopify CLI already set up on their Mac).
- Goal: a product page for the book on Shopify, matching the website (same copy, images, three formats, add-ons) so
  the two can be compared.
- Rules from the owner: look through the theme first, wait for their description, **plan before changing**, preview
  with `shopify theme dev`, push **only** with `shopify theme push --unpublished`. **Never touch the live theme.**
- Copy and images to reuse: from `index.html` and `images/` in this repo.
