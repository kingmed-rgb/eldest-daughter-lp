# Birth order healing — product spec

> **Scope for v1: eldest daughters only.** This spec was drafted for all birth orders as a mobile web product. The current plan is narrower: the existing iOS app, for **eldest daughters only**. Read every "birth order" / "profile" section as "eldest daughter roles" (draft: the third parent, the achiever, the peacemaker, the provider). Middle, youngest, only child and twin profiles are a possible later expansion. Where this spec says "web app", apply it to the iOS app plus, optionally, a web quiz as the TikTok entry point.

**Status:** draft v0.1 · **Owner:** Anna (product), Claude (spec + build) · **Last updated:** 2026-11-11

Everything marked **[assumption]** is a placeholder until decided. Section 15 lists the decisions needed before any code is written.

---

## 1. Vision

A mobile-first web product that helps daughters heal the role they were given in their family, starting from their birth order.

- **Entry point:** birth order (eldest, middle, youngest, only child, twin), because it is instantly recognisable on TikTok.
- **What we actually sell:** healing the *role* (the fixer, the invisible one, the baby, the little adult), not personality typing. Birth-order research does not support strong personality claims; family roles and experiences (parentification, loss, conflict, age gaps) are what the book is about.
- **Promise:** "find out what your place in the family did to you, and get a plan to set it down."

## 2. Goals and success metrics

| Phase | Goal | Metric | Target [assumption] |
|---|---|---|---|
| 1 | Quiz turns TikTok traffic into buyers | quiz start → finish | ≥ 60% |
| 1 | | quiz finish → email given | ≥ 40% |
| 1 | | quiz finish → purchase | ≥ 5% |
| 1 | Revenue per buyer above the $12 ebook | average order value | ≥ $20 |
| 1 | Buyers are happy | refund rate | < 5% |
| 2 | People keep using the app | day-7 / day-30 active | ≥ 40% / ≥ 20% |
| 2 | Subscriptions pay off | trial → first renewal | ≥ 35% |

## 3. Audience

- **Who:** daughters (women), mostly 18–35 from TikTok; later 35–55 (mothers, caregivers) through Meta ads. **[assumption: women only, matching the merged book]**
- **Languages:** English first, Spanish (Latin America) second.
- **Device:** phone, very often inside TikTok's in-app browser (no Apple Pay there, limited storage, links to other sites interrupted).

### Profiles and roles [assumption, to align with the merged book]

Each birth-order profile has 3–4 roles. A quiz result is one primary role, sometimes with a secondary one.

| Profile | Roles |
|---|---|
| Eldest daughter | the third parent · the achiever · the peacemaker · the provider (family ATM) |
| Middle daughter | the invisible one · the mediator · the rebel · the self-made one |
| Youngest daughter | the baby (never taken seriously) · the entertainer · the protected one · the one who stayed |
| Only daughter | the little adult · the golden child · the confidant · the lonely achiever |
| Twin / other [later] | to be defined |

**Modifiers** that change the wording of a result and plan: age gap to siblings, siblings' genders, half/step siblings, loss of a parent or sibling, strong conflict with a parent, caring for a parent now, has children, in a relationship.

## 4. User journey

```
TikTok account (one per profile)
  └─ link with ?src=<account>  →  /eldest (or /middle, /youngest, /only)
       └─ quiz (12–15 questions, ~3 min)
            └─ email capture ("where should we send your result?")
                 └─ result page: your role (free summary)
                      └─ offer: personal report (+ optional add-ons)
                           └─ embedded Stripe checkout (pop-up, as today)
                                └─ report page + PDF + email
                                     └─ phase 2: "start your daily plan" → app (subscription)
```

Rules:
- Every step works inside TikTok's in-app browser, without leaving the site.
- Quiz answers are saved as the user goes, so a reload doesn't lose them.
- The source account (`src`) is kept through the whole journey for analytics.

## 5. Scope by phase

| Phase | In | Out |
|---|---|---|
| **1 — Quiz + personal report** | 4 profile quizzes, result pages, personal report (web + PDF + email), checkout, add-ons, emails, analytics, admin view of sales | accounts with passwords, daily plan, subscription |
| **2 — The app** | login, today's plan, lessons, audio, journal, progress and streaks, library, subscription with trial, cancel/manage | native iOS/Android apps |
| **3 — Growth** | couple report, Spanish version of everything, 35+ landing pages, native apps, more profiles | — |

Current ebook pages (eldestdaughtercore.com, hijamayor.com) keep running unchanged and can link into the quiz.

## 6. Phase 1 — functional spec

### 6.1 Quiz

- **Length:** 12–15 questions, one per screen, progress bar, back button.
- **Question groups:**
  1. Position: birth order, number of siblings, their genders, age gaps, half/step siblings.
  2. Family experiences: loss of a parent or sibling (and age at the time), strong conflict with a parent, parent who relied on you emotionally, money pressure.
  3. Role signals (agree/disagree scale), e.g. "I sense tension before anyone speaks", "I was the one who kept the peace", "no one asked how I was doing".
  4. Today: life stage (age range, partner, children, caring for parents), what hurts most now (guilt, burnout, boundaries, relationships, money, self-worth).
  5. Plan preferences: minutes per day, read / listen / write.
- **Scoring:** each role-signal answer adds points to roles in the profile; the highest wins; a close second becomes a secondary role. Modifiers come from groups 1, 2 and 4.
- **Email capture:** after the last question, before the result. Required to see the full result; one tick box for marketing consent (unticked by default).
- **Done when:** the quiz works on a 360px phone inside TikTok, survives a reload, and records start/finish events.

### 6.2 Result page (free)

- Role name, a 3–4 sentence description, the "wound" in one line, 3 signs it shows up today.
- A teaser of the personal report (blurred sections, table of contents).
- The offer block (6.4).

### 6.3 Personal report (paid)

- **Sections:** your role and where it came from · how it shows up in love, work, money and with your family · what your modifiers changed (e.g. loss, age gap, being a mother now) · your first 7 days: one exercise a day from the book · what to say: 3 scripts (boundary, help, guilt) · next steps.
- **Length:** ~2,500–3,500 words, readable on a phone in 15 minutes.
- **Delivery:** a private web page (link emailed), plus a downloadable PDF in the house style.
- **How it is written** [decision needed, see 15]:
  - *A. Assembled from blocks:* every role and modifier has pre-written sections from the book, combined by rules. Same quality every time, no running cost, no risk of odd wording.
  - *B. Written by AI per person:* more personal, small cost per report, needs strict guardrails and review of samples.
  - *Recommended:* A for the body, with one short AI-written opening paragraph that references the user's own answers, within fixed rules.

### 6.4 Offer and pricing [assumption]

| Item | Price |
|---|---|
| Personal report | $19 |
| + the book (ebook, all daughters) | +$9 |
| + couple report (phase 3) | +$12 |

- One-time payments in phase 1. Honest pricing: no countdown timers, no "was" prices that were never charged.
- Adaptive Pricing on (local currencies), wallets on (Apple Pay, Google Pay, Link, Cash App, Amazon Pay).

### 6.5 Checkout and delivery

- The embedded Stripe pop-up already used on the ebook pages.
- After payment: the return page checks the payment with Stripe, then shows the report and starts the PDF + email. Nothing paid is ever shown without a verified payment.
- Purchase tracking (Meta, GA4) fires once, only for verified payments, with the real amount.

### 6.6 Emails

- Result email (free summary + link back to the offer).
- Purchase email (report link, PDF, receipt).
- Abandoned checkout: one reminder after 1 hour, only with consent.
- Phase 2: welcome, daily reminder (opt-in), renewal notice before every charge.

### 6.7 Admin

- A private page: quizzes started/finished, emails, purchases, revenue by profile and by TikTok account, refunds.
- Ability to resend a report email and look up a buyer by email.

## 7. Phase 2 — the app (summary, to detail later)

- **Today:** greeting, daily progress ring, streak, 1–3 items for the day.
- **Item types:** lesson (read 3–5 min), audio (same lesson, narrated), exercise/journal prompt (saved privately), check-in (mood 1–5).
- **Plan:** 28 days per role to start, built from the book's chapters, adapted by modifiers.
- **Library:** everything unlocked so far, saved items.
- **Profile:** progress, journal export, subscription management (Stripe customer portal), delete account.
- **Install:** "add to home screen" (PWA); no App Store in phase 2.
- **Subscription [assumption]:** intro week $6.99, 4 weeks $14.99 then $29.99, 12 weeks $24.99 then $59.99; renewal price and date shown before payment; cancel in one click.

## 8. Content model

```
Profile ─┬─ Role ─┬─ Result text
         │        ├─ Report blocks (per section)
         │        └─ Plan (days) ─ Day ─ Items (lesson · audio · exercise · check-in)
         └─ Quiz (questions → role points, modifiers)
Modifier ── report blocks + plan adjustments
```

- Source: the merged book. Each chapter is split into lessons, exercises and scripts, tagged by profile, role and modifier.
- Stored as files in the project (versioned, easy to review), not typed into an admin screen.
- Every text exists in English; Spanish added per profile later.

## 9. Data model (first draft)

| Table | Key fields |
|---|---|
| quiz_sessions | id, profile, answers, role, secondary_role, modifiers, src, utm, started_at, finished_at |
| leads | email, quiz_session_id, marketing_consent, language |
| orders | stripe_session_id, email, items, amount, currency, status, src |
| reports | order_id, role, modifiers, opening_paragraph, created_at, access_token |
| users (phase 2) | email, created_at, language |
| subscriptions (phase 2) | user_id, stripe_subscription_id, plan, status, renews_at |
| progress (phase 2) | user_id, day, item_id, completed_at |
| journal_entries (phase 2) | user_id, item_id, text (private), created_at |

## 10. Technical architecture [assumption]

- **App:** Next.js on Vercel (the account you already use), new project, separate from the ebook pages.
- **Database and login:** Supabase (Postgres + email magic-link login), connected through Vercel.
- **Payments:** Stripe (embedded checkout; Stripe Billing + customer portal in phase 2).
- **Email:** Resend (or similar).
- **PDF:** generated on the server from the report page.
- **Analytics:** Vercel Analytics + product events (PostHog or GA4), Meta Pixel and Clarity as today.
- **AI (only if option B/hybrid):** Claude API for the opening paragraph, with fixed prompts and limits.

## 11. Analytics events

`quiz_start`, `quiz_answer` (question id), `quiz_finish`, `email_submitted`, `result_view`, `offer_view`, `checkout_open`, `purchase` (verified only), `report_open`, `pdf_download`; phase 2: `signup`, `day_complete`, `streak`, `trial_start`, `renewal`, `cancel`. Every event carries `profile`, `role`, `src`, `language`.

## 12. Safety, legal and ethics

- **Not therapy:** clear statement on result, report and app; crisis resources link on every page where people write about painful experiences; the quiz never diagnoses.
- **Sensitive data:** journal entries and loss/conflict answers are private, encrypted at rest, never used for ads; users can export and delete everything.
- **Privacy:** cookie and tracking consent where required (EU/UK); privacy policy updated for quiz data and email.
- **Honest marketing:** no fake timers, no invented "was" prices, no "scientifically proven types"; reviews only from real customers.
- **Subscriptions (phase 2):** price, renewal date and cancellation explained before payment; reminder email before renewal; one-click cancel.
- **Tax:** decide on Stripe Tax or a merchant-of-record before selling to the EU/UK at volume.

## 13. Design

- Reuse the current system: cream background, burgundy accent for buttons, Fraunces + Source Serif 4, lowercase voice, 4 text sizes, 2 weights.
- App screens follow the mockup's structure (Today, Library, My list, Profile) in this palette.
- Each profile can have its own accent tint while keeping the same system.

## 14. Non-functional requirements

- Loads in under 2 seconds on 4G inside TikTok's browser; quiz screens under 100 KB each.
- Works at 360px width; tap targets ≥ 44px; readable contrast.
- No data lost on reload; payment never charged twice.
- Uptime handled by Vercel; daily database backups (Supabase).

## 15. Decisions needed before building

1. **Brand name and domain** (the product covers all birth orders).
2. **Audience:** daughters only, or everyone?
3. **Profiles at launch:** eldest only, or all four?
4. **Roles per profile:** confirm or replace the list in section 3 (should come from the merged book).
5. **Report writing:** A (blocks), B (AI per person) or the recommended hybrid.
6. **Prices:** report, add-ons, and later the subscription.
7. **Language at launch:** English only, or English + Spanish?
8. **Who writes and reviews content:** Claude drafts from the book, Anna approves?
9. **Audio:** AI narration first, or Anna's own voice?
10. **Budget:** monthly tools (~$20–60 at the start) and any paid ads for the 35+ test.

## 16. Inputs needed

- The merged book (all daughters).
- Brand name, domain, logo or wordmark (or approval to design one).
- Access: the Vercel team (done), Stripe (done), a Supabase account, an email-sending account.
