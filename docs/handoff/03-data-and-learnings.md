# 03 — Data and learnings

Numbers are what the user shared from Stripe / Clarity screenshots during the landing page work (Oct–Nov 2026). They are small: treat them as signals, not statistics.

## Sales

- **Stripe, last 12 months:** about **$488** total revenue (≈ 40 sales at $12). Low volume, sold in spikes after TikTok videos.
- **Payment methods by volume (12 months):** Apple Pay **34%** · Link **32%** · cards **30%** · Cash App Pay ~2% · Amazon Pay ~2%.
  - Apple Pay is the main way people pay. The last Apple Pay payment was **Oct 19**, before the switch to embedded checkout (Oct 23). Apple Pay needs the payment method domains registered in Stripe for embedded checkout; they were added Nov 11. Still to confirm a real Apple Pay payment comes in.
  - Google Pay was **disabled** in Stripe settings; turned on during this work, not yet confirmed.
  - **PayPal:** not offered to this Stripe account. A "custom payment method" for PayPal was added but can't actually take payments; it should be deleted.
- **Embedded checkout since Oct 23:** about **$142**, with Stripe showing a **~16.5% checkout conversion** (sessions opened → paid). People who open the checkout are fairly motivated; the main losses are earlier on the page.

**For the app:** an iOS app sells through Apple's In-App Purchase / StoreKit, which also fixes the TikTok browser problem below. Expect App Store fees (15% on the Small Business Program). Web checkout (Stripe) can stay for the books.

## Audience and traffic

- **Source:** TikTok, organic. Several accounts/posts. Mostly women ~18–35, English worldwide (reviews name Mumbai, Casablanca, Lagos, London, Paris, Beirut, Dubai, Sydney, Accra, Brussels, Nairobi) and a Spanish-speaking Latin American audience for hijamayor.com.
- **TikTok in-app browser:** Apple Pay doesn't work there, and external links (like buy.stripe.com) interrupt the flow or open a confirmation. That's why checkout was moved into a pop-up on the page. For the app: deep links from TikTok to the App Store are the cleanest path; expect drop-off on any extra step.
- **Microsoft Clarity:** most visitors stop scrolling around the **offer and the FAQ**. Changes made in response: shorter page, FAQ collapsed, offer card simplified, sticky "get it now" bar after "what's inside", price shown earlier.
- Tracking IDs: Meta Pixel, GA4, Clarity (in the page source). Purchase events currently fire on a public thank-you page, so **purchase counts in Meta/GA4 are inflated** (see `05`).

## Pricing learnings

- Current: EN bundle **$12**, ES ebook **$9**.
- Pricing discussion: the bundle is likely underpriced (comparable parenting/self-help ebooks sell at $27–47), but the audience is young and impulse-buys from TikTok, so low prices convert. A $9.99 + $7 add-ons test was built, then reverted before going live. No price test has actually run yet.
- For the app, the plan is a subscription with an honest intro offer; no prices decided.

## Competitor notes

- **Evergrow (myevergrow.com):** quiz-first funnel → "personal plan" → paywall with intro week / 4-week / 12-week plans, a crossed-out price and a timer. Strong funnel to learn from; the timer and inflated "was" prices are things **not** to copy (see voice rules).
- **birthorders.com:** birth-order quiz with a ~$99 personal report. Shows people pay for a personalized report; also shows the "science" framing is shaky. Our angle is the role and healing exercises, not typing.
- TikTok "eldest daughter" content is huge and mostly free; the paid value has to be **doing** (exercises, scripts, a plan), not more explanations.

## What we learned building the landing pages

1. The audience reacts badly to anything that sounds like marketing or AI. The book's own words convert better than any copy written about it.
2. Recognition first ("you're so mature for your age"), then explanation, then the tool. Don't lead with the product.
3. Fewer choices on the offer: one product, one price, one button.
4. Friction kills on TikTok: every extra tap or redirect costs buyers.
5. Delivery has to be automatic and reliable. It broke silently (see `05`) and nobody noticed for weeks. Whatever the app does, a purchase must always unlock content without email.
