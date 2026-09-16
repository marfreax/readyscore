# ReadyScore V16 — Free Acquisition & Monetization Funnel

**Status:** Development Baseline  
**Baseline:** ReadyScore V15.2  
**Next:** ReadyScore V17 — AI Career Advisor

---

# 1. V16 OBJECTIVE

V16 is the commercialization layer on top of ReadyScore V15.2.

The objective is simple:

> **Bring a visitor into a free assessment → give an instant result → create curiosity through locked/blurred insight → capture WhatsApp lead → unlock a useful Free Report → convert the user toward Premium.**

V16 is **not an AI release**.

AI Career Advisor is moved to **V17**.

Core funnel:

```text
PUBLIC LANDING
      ↓
FREE RIASEC TEST — 10 QUESTIONS
      ↓
INSTANT RESULT
      ↓
FREE INSIGHT + BLURRED PREMIUM TEASER
      ↓
WA LEAD GATE
      ↓
FREE REPORT UNLOCK / DELIVERY
      ↓
PREMIUM OFFER
      ↓
CHECKOUT
      ↓
PREMIUM ACCESS
```

---

# 2. PRODUCT PRINCIPLE

## 2.1 Instant gratification

The user must see their basic result immediately after completing the test.

Do not make the user:

```text
Test → wait for email → receive result
```

Instead:

```text
Test → Instant Result
```

PDF and WhatsApp are follow-up delivery channels.

## 2.2 Curiosity before lead capture

The user should first see enough result value to understand that ReadyScore is useful.

Then expose selected locked/blurred insights.

Example:

```text
Kamu Tipe INVESTIGATIVE

[Basic interpretation]

Jurusan yang cocok:
✓ Psikologi

🔒 2 rekomendasi jurusan lainnya
🔒 Kekuatan utama
🔒 Gaya belajar
```

CTA:

> **Buka Free Report →**

The lead gate appears when the user wants to unlock/get the Free Report.

## 2.3 Free and Premium must be clearly separated

The user must never feel tricked.

### Free Report

Provides real value:
- RIASEC type;
- explanation;
- basic strengths/characteristics;
- up to 3 basic major/career recommendations;
- lightweight PDF.

### Premium

Provides deeper ReadyScore value:
- broader/multi-assessment profile;
- deeper interpretation;
- cross-test profile;
- expanded major/career recommendations;
- action plan;
- other V15.2 premium capabilities.

V17 AI is not part of V16.

---

# 3. BASELINE V15.2

V15.2 remains the technical source of truth.

Preserve existing:
- RIASEC;
- DISC;
- EQ;
- Cognitive;
- assessment runtime;
- scoring;
- result persistence;
- integrated profile;
- major matching;
- career exploration;
- report engine;
- payment;
- entitlement.

V16 should be additive.

No broad rewrite of V15.2.

Any required change to existing code must be:
1. minimal;
2. justified;
3. backward-compatible;
4. covered by regression testing.

---

# 4. PUBLIC HOMEPAGE

The current `app.readyscore.id` homepage is a development/internal assessment launcher and is not suitable as the V16 public entry point.

V16 replaces `/` with a public acquisition landing page.

## Public homepage

Purpose:

> Explain ReadyScore quickly and move the visitor into the Free Test.

Recommended structure:

```text
Hero
  ↓
Primary CTA: Mulai Tes Gratis
  ↓
How It Works
  ↓
What You Get
  ↓
Example Result
  ↓
Premium Value
  ↓
FAQ
  ↓
CTA: Mulai Tes Gratis
```

The exact copy/design can evolve without changing the funnel contract.

## Never expose publicly

- Admin Question Bank;
- internal development tools;
- PostgreSQL/database messaging;
- debug controls;
- internal assessment launchers;
- admin navigation.

---

# 5. SURFACE & ACCESS ARCHITECTURE

Separate three logical surfaces:

```text
PUBLIC
/
└── /free
    └── /free/result

USER
/login
/register
└── authenticated application

ADMIN
/admin/*
└── admin authentication + authorization
```

Important:

> Hiding an admin link is not security.

Every admin route and API must enforce server-side authorization.

A normal user must not be able to access Question Bank/admin functionality by entering a URL or manipulating client-side navigation.

Public users should be able to start `/free` without creating an account first.

---

# 6. FREE ASSESSMENT

Baseline:

> **RIASEC — 10 questions**

Requirements:
- mobile-first;
- fast;
- progress indicator;
- one clear question at a time;
- no WA/email request before completion;
- answer required before proceeding.

Important implementation rule:

```text
answers = [null, null, ...]
```

Do not initialize unanswered questions to a valid score.

The test must not produce a result until all required answers are present.

The 10-question distribution must be intentionally defined and documented; it must not be an accidental selection of dimensions.

The free test is a lightweight acquisition assessment and must not execute unnecessary full V15 premium computation.

---

# 7. INSTANT RESULT

After the 10th answer:

```text
Quiz Complete
      ↓
Calculate Free Result
      ↓
Show Result Immediately
```

Example:

> **Kamu Tipe INVESTIGATIVE**

Show:
- dominant RIASEC type;
- short interpretation;
- basic recommendation;
- selected free insight.

Then show curiosity/teaser:

```text
🔒 2 jurusan lainnya
🔒 Kekuatan utama kamu
🔒 Gaya belajar
```

The teaser may use blur/lock treatment.

Do not expose sensitive/private premium information merely as a visual trick.

---

# 8. LEAD GATE / FREE UNLOCK

When user chooses to unlock the Free Report:

### Required
- full name;
- WhatsApp number.

### Optional
- email.

### Consent
Explicit consent for relevant WhatsApp communication.

CTA:

> **Buka Free Report**

or equivalent.

After submission:

```text
Save Lead
   ↓
Unlock Free Report
   ↓
Keep Result Visible
```

Do not force the user to wait for WhatsApp/email before accessing the web result or Free Report.

---

# 9. FREE PDF

The Free PDF is both a value-delivery asset and a conversion asset.

Preferred MVP implementation:

> **Static HTML template → HTML-to-PDF**

Keep the free report lightweight.

Suggested structure:

```text
Page 1 — Cover + Name + RIASEC Type
Page 2 — Type Explanation
Page 3 — Basic Major/Career Recommendations
Page 4 — Premium Offer
Page 5 — Trust / Brand CTA
```

Exact page count may change.

The PDF must not falsely be called a “Full Report” if it contains only the free layer.

Preferred terminology:

> **Free Report**

---

# 10. WHATSAPP & EMAIL DELIVERY

WhatsApp is the primary delivery channel for the Indonesian funnel.

Email is secondary/backup.

Architecture:

```text
Lead Submitted
      ↓
Backend
      ├── Save Lead
      ├── Generate PDF
      ├── WhatsApp Delivery
      └── Email Delivery (if supplied)
```

Delivery must be server-side/provider-based.

Do not implement production delivery by opening `wa.me` from the browser.

Delivery failure must not prevent the user from seeing the result.

Track delivery status and failures.

Promotional WhatsApp messages require appropriate consent.

---

# 11. PREMIUM CONVERSION

After the Free Report/result, introduce the Premium offer.

Example:

```text
FREE
RIASEC basic result
+
Free Report

        ↓

PREMIUM
4-pillar profile
Cross-Test
Expanded Major/Career
Action Plan
```

Potential experimental price points:

- Single Test: ~Rp99.000
- All Tests: ~Rp199.000
- Full Insight: ~Rp249.000

These are experiments, not permanent pricing decisions.

Prices must not be hard-coded into frontend logic.

Use existing product/payment/entitlement architecture where practical.

---

# 12. OFFER & DISCOUNT

A real limited-time offer may be tested.

Example:

```text
READY20
20% discount
24-hour expiry
```

Rules:
- expiry must be real;
- server-side validation;
- client cannot set price/discount;
- offer conditions must be clear;
- no fake scarcity.

---

# 13. DATA ARCHITECTURE

Reuse V15.2 entities whenever possible.

Only add data structures required for V16.

Possible concepts:

```text
FreeAssessmentSession
LeadCapture
PDFDelivery
FunnelEvent
Offer / Coupon
```

Actual names must follow the existing codebase conventions.

Database changes must be additive and non-destructive.

Minimum lead data:

```text
name
whatsapp
email (nullable)
consent
consent timestamp
source/attribution when available
createdAt
```

Do not collect unnecessary personal data.

---

# 14. ANALYTICS

The funnel must be measurable.

Minimum events:

```text
landing_view
free_test_start
free_test_complete
instant_result_view
locked_insight_view
free_report_cta
lead_form_view
lead_submitted
free_report_unlocked
pdf_generated
whatsapp_sent
email_sent
premium_offer_view
checkout_started
checkout_completed
premium_unlocked
```

Core funnel:

```text
Visitor
→ Test Started
→ Test Completed
→ Result Viewed
→ Lead Captured
→ Free Report
→ Premium Offer
→ Checkout
→ Purchase
```

Measure at least:
- test completion rate;
- lead conversion rate;
- report unlock rate;
- premium conversion rate;
- revenue per lead;
- delivery success rate.

---

# 15. SECURITY & PRIVACY

Mandatory:

- server-side admin authorization;
- server-side payment/entitlement validation;
- server-side coupon validation;
- protected lead data;
- input validation;
- WhatsApp/email validation;
- rate limiting where needed;
- no secrets in frontend;
- no unnecessary personal data;
- consent recording.

The public funnel must never expose admin data or internal tooling.

---

# 16. PERFORMANCE

The web result must be independent of PDF/message delivery.

Preferred:

```text
Lead Submit
   ↓
Instant Unlock / Result
   │
   ├── PDF generation
   ├── WhatsApp
   └── Email
```

Heavy premium computation must not run for the lightweight free result unless required.

---

# 17. PHASE ROADMAP

Keep V16 deliberately small: **4 development phases + freeze/QA**.

## PHASE 1 — Public Entry + Free Test

Build:
- replace `/` homepage;
- establish `/free`;
- RIASEC 10-question flow;
- progress;
- validation;
- free scoring;
- public/user/admin surface separation.

Acceptance:

```text
Public Homepage
→ Start Free Test
→ Complete 10 Questions
→ Instant Result
```

## PHASE 2 — Instant Result + Lead Unlock

Build:
- instant result;
- blurred/locked teaser;
- Free Report CTA;
- name + WhatsApp + optional email;
- consent;
- lead persistence;
- Free Report unlock.

Acceptance:

```text
10 Questions
→ Instant Result
→ Blur/Teaser
→ Lead Gate
→ Free Report Unlocked
```

## PHASE 3 — PDF Delivery + Premium Conversion

Build:
- HTML-to-PDF;
- WhatsApp delivery;
- email backup;
- delivery status;
- premium offer;
- checkout;
- entitlement;
- coupon/offer experiment.

Acceptance:

```text
Free Report
→ PDF
→ WA/Email
→ Premium Offer
→ Checkout
→ Premium Unlock
```

## PHASE 4 — Analytics + Security + E2E + Freeze

Build/validate:
- funnel analytics;
- admin access regression;
- privacy/security;
- payment/entitlement tests;
- PDF/delivery tests;
- production build;
- full regression;
- full funnel E2E.

Minimum E2E:

```text
Landing
→ Test
→ Result
→ Blur
→ Lead
→ Free Report
→ PDF
→ Premium Offer
→ Checkout
→ Purchase
→ Premium Access
```

After all acceptance criteria pass:

> **ReadyScore V16 FREEZE**

---

# 18. OUT OF SCOPE

Explicitly deferred to V17+:

- AI Career Advisor;
- OpenAI integration;
- AI chat;
- AI consultation quota;
- AI monetization;
- RAG;
- custom model/fine-tuning;
- voice AI;
- human counselor;
- school/university/employer platform.

Do not add V17 AI requirements into V16.

---

# 19. V17 HANDOFF

V16 must preserve structured data that V17 can consume:

- user identity/profile;
- assessment results;
- integrated profile where available;
- major/career recommendations;
- premium entitlement.

Target:

```text
V15.2
   ↓
V16
   ├── Acquisition
   ├── Free Assessment
   ├── Instant Result
   ├── Lead
   ├── Free Report
   ├── Premium
   └── Entitlement
          ↓
V17
   └── AI Career Advisor
```

---

# 20. DEFINITION OF DONE

V16 is complete when:

- public homepage replaces the internal launcher;
- `/free` works without mandatory login;
- RIASEC 10-question free test works;
- unanswered questions cannot produce a result;
- instant result works;
- blur/locked teaser works;
- WA lead capture + consent works;
- Free Report unlock works;
- PDF generation works;
- WhatsApp delivery works or fails gracefully;
- email backup works when supplied;
- premium offer works;
- checkout works;
- entitlement works;
- admin routes/APIs remain protected;
- funnel analytics are recorded;
- production build passes;
- V15.2 regression passes;
- complete V16 E2E passes.

---

# 21. CORE RULE

> **V16 = Instant Result + Curiosity + Lead + Free Report + Premium Conversion.**

The user should feel:

```text
"Saya sudah mendapat hasil."
        ↓
"Menarik, ternyata ada insight lain."
        ↓
"Saya mau buka."
        ↓
"Gratis, cukup kasih WhatsApp."
        ↓
"Ini berguna."
        ↓
"Kalau mau lebih lengkap, ada Premium."
```

V16 should validate this business funnel before ReadyScore invests in the deeper AI layer.

> **V17 = AI Career Advisor.**
