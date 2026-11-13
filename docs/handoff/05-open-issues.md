# 05 — Open issues and pending decisions

As of 2026-11-13. Ordered by urgency.

## Broken / urgent

1. **Buyers aren't getting the download email.**
   - The old Zapier automation probably watched the old Stripe payment link. Since Oct 23, sales come from embedded Checkout Sessions created by the API, so the Zap likely never fires.
   - Options:
     - (a) Fix the Zap: trigger on Stripe "checkout session completed" / "new payment" for the whole account.
     - (b) Move it into the site: a Vercel function `api/stripe-webhook.js` listens for `checkout.session.completed`, checks the signature, reads `metadata.page` (en/es) and sends the right download email with Resend.
   - What (b) needs from the user:
     - `RESEND_API_KEY` and `STRIPE_WEBHOOK_SECRET` in Vercel (Production)
     - a verified sending domain
     - the sender name and address
     - the Spanish download link
   - Either way, **manually email everyone who bought since Oct 23** (Stripe → Payments → customer emails).
   - The user hasn't chosen yet.
2. **The thank-you page is public.**
   - `/get-xk7f2` holds the Google Drive download links and is reachable by anyone with the URL. Opening it also fires a Purchase event (value 12), so Meta/GA4 purchase numbers are inflated.
   - Fix:
     - fire Purchase only when a valid `session_id` is present (verify it server-side), and
     - deliver files via email/expiring links instead of a public page.

## To confirm

3. **Apple Pay / Google Pay** show in the embedded checkout on real devices (domains registered Nov 11; Google Pay just enabled). Check that a real Apple Pay payment comes through.
4. **Delete the PayPal "custom payment method"** in Stripe. It shows up but can't take money.
5. **Fallback payment links** (used if the API fails) must still be active and at the same price: EN bundle link and ES link `buy.stripe.com/7sY3cu2F19bC3tfctr9sk01`.

## Risks

6. **Crossed-out "was" prices ($49 / $29).** If the product was never sold at those prices, this can count as a misleading reference price (FTC, EU/UK consumer law). Safer: drop the anchor or describe it honestly (for example "value of the three items separately"). The p.s. on the EN page still says "the founding price is $12 (normally $49)".
7. **Reviews block** shows "4.8 · 600 reviews" and named reviewers. Make sure these are real and can be backed up, especially before reusing them in an app or App Store listing.
8. **Author photo** on the EN page is likely a film still, not Anna. Replace it before any wider use. Don't use it in the app.
9. **VAT / sales tax** on digital goods sold worldwide. Stripe Tax isn't set up. The App Store handles this automatically for in-app purchases.
10. **Mental-health content.** The app needs a clear "not therapy" disclaimer and crisis resources, and must handle journal data privately (local or encrypted, no ad tracking on journal content).

## Decisions pending (app)

From `04-product-spec.md` section 15, narrowed to **eldest daughters only**:

- Platform order: the iOS app exists already. Is the quiz/funnel web-based (TikTok link → web quiz → App Store), or in-app onboarding only?
- Final list of eldest daughter roles (draft: the third parent · the achiever · the peacemaker · the provider) and the quiz questions that map to them.
- What's free vs paid: free result + first exercise? first week?
- Subscription prices and intro offer (honest renewal display, easy cancel).
- English first, or English + Spanish at launch (the Spanish ebook exists, so content is there).
- Does buying the book unlock anything in the app (or the reverse)?
- Validation threshold before building more: e.g. ~300–500 waitlist signups in 2 weeks from TikTok posts showing mockups.
- Audio: does Anna record the lessons, or no audio at v1?

## Done recently (for context)

- Long-form Substack-style landing pages, EN + ES; Spanish served at hijamayor.com.
- Stripe Embedded Checkout pop-up (no redirect out of TikTok), with payment link fallback.
- Payment method domains registered for Apple Pay / Google Pay.
- Spec v0.1 written (`04`).
