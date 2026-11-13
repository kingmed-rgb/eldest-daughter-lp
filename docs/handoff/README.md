# Eldest daughter project — handoff (start here)

This folder hands over everything known so far about the eldest daughter business to another Claude Code session (the one with the iOS app). Read this file first, then the numbered files.

**Scope decision:** the app is **for eldest daughters only** at launch. Other birth orders (middle, youngest, only child) are a *possible later expansion*, not part of v1. Anything below that mentions other profiles is future work.

| File | What's in it |
|---|---|
| `README.md` | this summary: business, what's live, decisions, priorities |
| `01-design-system.md` | colors, fonts, sizes, components, SwiftUI tokens |
| `02-voice-and-copy.md` | tone rules, key copy (EN/ES), words to avoid |
| `03-data-and-learnings.md` | sales, payment methods, conversion, TikTok constraints, competitor notes |
| `04-product-spec.md` | draft spec v0.1 (quiz → personal report → app). Written for all birth orders — **apply it to eldest daughters only** |
| `05-open-issues.md` | known problems and pending decisions |
| `sources/` | the full books as text: English workbook, Spanish ebook |
| `assets/` | covers, bundle image, favicon, brand fonts (woff2) |

---

## 1. The business in one paragraph

Anna Celestina (pen name, author of the books) sells healing workbooks for **eldest daughters**: women who were parentified, became "the responsible one", and now carry guilt, burnout, hyper-independence and people-pleasing. Almost all traffic comes from **TikTok** (organic videos), mostly women 18–35, opening links inside TikTok's in-app browser. Sales come in spikes that follow videos that took off. The plan is to turn the book into an **app** (quiz → personalized plan → daily healing program, subscription), validated first with mockups and a waitlist.

## 2. Products live today

| | English | Spanish (Latin America) |
|---|---|---|
| Site | eldestdaughtercore.com | www.hijamayor.com |
| Product | **The Eldest Daughter Healing Bundle™**: the workbook (16 chapters) + poems & letters + inner child healing worksheet | **Síndrome de la hija mayor** (ebook only) |
| Price | **$12** (crossed-out $49, "save 75%") | **$9** (crossed-out $29, "ahorras 69%") |
| Checkout | Stripe Embedded Checkout in a pop-up, fallback to a Stripe payment link | same |
| After payment | `/get-xk7f2` thank-you page with Google Drive download links | hijamayor.carrd.co/#done |

Landing pages are long-form, Substack-style articles: a hook ("how many times were you told 'you're so mature for your age'?"), the wound explained in the book's words, why Anna wrote it, a signs checklist, table of contents, before/after, TikTok-style reviews, offer card, FAQ, closing lines and a P.S. A sticky "get it now" bar appears after the reader passes "what's inside".

## 3. Tech of the current sites (for reference)

- Static HTML/CSS, no framework, on **Vercel** (project `eldest-daughter`, team `kingmed-rgbs-projects`), repo `kingmed-rgb/eldest-daughter-lp`.
- `api/create-checkout-session.js`: Vercel function creating Stripe Checkout Sessions (`ui_mode: 'embedded_page'`, inline `price_data`, `metadata.page = en|es`); client uses `stripe.createEmbeddedCheckoutPage`. Both names were renamed by Stripe in 2026 — older docs/examples using `embedded` / `initEmbeddedCheckout` no longer work.
- `middleware.js` serves the Spanish page at the root of hijamayor.com.
- Secret: `STRIPE_SECRET_KEY` in Vercel env (sandbox key on Preview, live key on Production). Never commit keys.
- Tracking on both pages: Meta Pixel, GA4, Microsoft Clarity (IDs are in the page source).
- Domains: eldestdaughtercore.com DNS on Cloudflare (proxied); hijamayor.com DNS at GoDaddy pointing to Vercel. Payment method domains registered in Stripe (needed for Apple Pay / Google Pay in embedded checkout).

## 4. Key decisions so far

- **Audience framing:** heal the *role* (the fixer, the third parent, the provider), with "eldest daughter" as the recognisable entry. Birth-order personality science is weak; never claim "scientifically proven types".
- **Brand voice:** all lowercase, raw and warm like the book, no em dashes, no AI clichés, no guilt-tripping in sales copy (see `02`).
- **Design:** one cream background, burgundy only for buttons/accents, Fraunces + Source Serif 4, 4 text sizes, 2 weights (see `01`).
- **Checkout:** stay on Stripe (not Shopify): embedded pop-up so TikTok users never leave the page. PayPal is not available on this Stripe account.
- **Honest pricing:** no fake countdown timers, no invented "was" prices going forward. (The current $49/$29 anchors are flagged in `05`.)
- **Price experiments:** a $9.99 workbook + poems version with +$7 add-ons (audiobook, journal) was built and then reverted; it is in git history (`fd94cf0`). The add-ons wait for the audiobook and the journal to exist.

## 5. App direction (eldest daughters only)

1. **Validate first:** app mockups (style in `01`) + TikTok post "would you use this?" + a waitlist page with email capture. Signal to build: ~300–500 waitlist signups in 2 weeks.
2. **Funnel:** TikTok → quiz (12–15 questions, ~3 min) → email → free result ("your role: the third parent") → paid personal report and/or the app subscription.
3. **Eldest daughter roles [draft]:** the third parent · the achiever · the peacemaker · the provider (family ATM). Modifiers: age gaps, siblings' genders, loss of a parent/sibling, conflict with a parent, has children, caring for parents now.
4. **App core:** Today (daily progress, streak, 1–3 items), lessons (3–5 min read + audio), private journal with the book's exercises, library, profile with subscription management.
5. **Content source:** the workbook in `sources/` — 16 chapters, each with exercises (guilt dump & sort, rage timeline, help allergy test, mom call drill, family atm, permission slip, etc.) → a 28-day plan to start.
6. **Monetization idea:** intro week / 4-week / 12-week subscription, renewal shown honestly, one-click cancel. Prices undecided.

## 6. Priorities right now

1. **Fix purchase email delivery** — buyers since the pop-up checkout launched (Oct 23) may not have received their download email (old Zapier automation likely watched the old payment link). See `05`.
2. Confirm Apple Pay / Google Pay show in the checkout (domains registered Nov 11).
3. Validate the app idea with mockups + waitlist before building more.
