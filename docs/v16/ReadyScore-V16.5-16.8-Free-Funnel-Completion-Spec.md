# ReadyScore V16.5--V16.8 --- Free Funnel Completion & Delivery Hardening

**Status:** Development Specification / Phase Baseline\
**Baseline:** ReadyScore V16.4\
**Purpose:** Menyelesaikan gap teknis dan bisnis pada Free Acquisition
Funnel sebelum V17.\
**Next major version:** ReadyScore V17 --- AI Career Advisor

------------------------------------------------------------------------

# 1. BACKGROUND

ReadyScore V16 menetapkan funnel utama:

``` text
PUBLIC LANDING
      ↓
FREE RIASEC TEST — 10 QUESTIONS
      ↓
INSTANT RESULT
      ↓
FREE INSIGHT + BLURRED PREMIUM TEASER
      ↓
LEAD GATE
      ↓
FREE REPORT UNLOCK
      ↓
PDF DELIVERY
      ↓
PREMIUM OFFER
      ↓
CHECKOUT
      ↓
PREMIUM ACCESS
```

V16.4 telah membawa funnel acquisition, lead capture, free report,
premium offer, checkout, entitlement, analytics, security, dan landing
page ke baseline saat ini.

Namun terdapat dua gap yang harus diselesaikan sebelum V16 dianggap
benar-benar production-ready:

1.  **Free Report PDF delivery belum terbukti stabil**, termasuk PDF
    generation dan external delivery.
2.  **Data lead yang dikumpulkan belum menjadi business lead yang siap
    ditindaklanjuti**, meskipun sudah dipersist sebagai
    `FreeLeadCapture`.

Dokumen ini menjadi acuan resmi untuk phase **V16.5 sampai V16.8**.

------------------------------------------------------------------------

# 2. OBJECTIVE

Tujuan phase lanjutan:

> Mengubah Free Funnel dari sekadar funnel yang berfungsi menjadi funnel
> acquisition yang benar-benar menghasilkan lead, report delivery yang
> reliable, dan siap digunakan di production.

Target akhir:

``` text
Visitor
  ↓
Free Assessment
  ↓
Result
  ↓
Lead Capture
  ↓
CRM Lead
  ↓
Free Report
  ↓
PDF
  ├── WhatsApp
  └── Email
  ↓
Premium Offer
  ↓
Conversion
```

------------------------------------------------------------------------

# 3. PRODUCT PRINCIPLES

## 3.1 Journey First

User journey tetap menjadi pusat.

Jangan menambahkan dashboard, intelligence, AI, campaign engine, atau
CRM suite baru yang tidak diperlukan untuk menyelesaikan funnel.

## 3.2 Lead Means Business Lead

Ketika user memberikan:

-   nama;
-   WhatsApp;
-   email jika tersedia;
-   consent;

data tersebut harus diperlakukan sebagai acquisition lead yang dapat
ditindaklanjuti.

`FreeLeadCapture` tetap dipertahankan sebagai record acquisition/consent
dan assessment context.

Jika aplikasi memiliki entitas Lead/Contact yang sesuai, gunakan entitas
tersebut sebagai business lead. Jangan membuat CRM baru.

## 3.3 Delivery Must Be Observable

PDF generation dan delivery channel tidak boleh hanya dianggap berhasil
karena API mengembalikan response.

System harus dapat membedakan:

``` text
NOT_GENERATED
GENERATED
FAILED

NOT_ATTEMPTED
SENT
FAILED
SKIPPED
```

Error provider harus dapat ditelusuri tanpa mengekspos secret.

## 3.4 Additive, Minimal, Backward-Compatible

V15.2 tetap menjadi technical source of truth.

Perubahan harus:

1.  minimal;
2.  justified;
3.  backward-compatible;
4.  regression-aware.

Tidak melakukan broad rewrite.

## 3.5 External Provider Is Optional at Runtime

Jika WhatsApp atau email provider belum dikonfigurasi:

-   application tidak boleh crash;
-   Free Report tetap dapat dibuka/download;
-   status channel menjadi `SKIPPED`;
-   alasan dapat diketahui dari delivery status.

Jika provider dikonfigurasi tetapi gagal:

-   status menjadi `FAILED`;
-   error disimpan secara aman;
-   retry dapat dilakukan.

------------------------------------------------------------------------

# 4. CURRENT ARCHITECTURE

## 4.1 Current Free Lead Data

Saat ini lead capture disimpan pada:

``` text
FreeLeadCapture
```

dan terkait dengan:

``` text
AssessmentAttempt
```

Data ini menjadi source context untuk Free Report.

## 4.2 Current Delivery Architecture

``` text
AssessmentAttempt
      ↓
FreeLeadCapture
      ↓
buildFreeReport()
      ↓
renderFreeReportPdf()
      ↓
FreeReportDelivery
      ↓
 ┌───────────────┐
 │               │
WhatsApp       Email
 │               │
 └───────┬───────┘
         ↓
 Premium Offer
```

## 4.3 PDF Renderer

Renderer menggunakan executable Chromium/Chrome melalui child process.

Konfigurasi executable:

``` text
READYSCORE_CHROMIUM_PATH
        ↓
CHROME_BIN
        ↓
platform fallback
```

Implementasi tidak boleh bergantung secara buta pada:

``` text
/usr/bin/chromium
```

karena development dan production dapat menggunakan environment berbeda.

------------------------------------------------------------------------

# 5. TARGET ARCHITECTURE

Target architecture:

``` text
                         ┌──────────────────┐
                         │   Public Landing │
                         └────────┬─────────┘
                                  ↓
                         ┌──────────────────┐
                         │ Free Assessment  │
                         └────────┬─────────┘
                                  ↓
                         ┌──────────────────┐
                         │ Instant Result   │
                         └────────┬─────────┘
                                  ↓
                         ┌──────────────────┐
                         │ Lead Capture     │
                         └────────┬─────────┘
                                  ↓
                    ┌──────────────────────────┐
                    │ FreeLeadCapture          │
                    │ consent + source +       │
                    │ assessment context       │
                    └────────────┬─────────────┘
                                 ↓
                    ┌──────────────────────────┐
                    │ Business Lead / Contact  │
                    │ source = FREE_ASSESSMENT│
                    └────────────┬─────────────┘
                                 ↓
                    ┌──────────────────────────┐
                    │ Free Report              │
                    └────────────┬─────────────┘
                                 ↓
                    ┌──────────────────────────┐
                    │ PDF Generation            │
                    └────────────┬─────────────┘
                                 ↓
                         FreeReportDelivery
                           ↙             ↘
                      WhatsApp          Email
                           ↘             ↙
                         Delivery Status
                                 ↓
                         Premium Offer
                                 ↓
                           Conversion
```

------------------------------------------------------------------------

# 6. DATA OWNERSHIP

## 6.1 FreeLeadCapture

Purpose:

> Acquisition record + consent + assessment relationship.

Minimal responsibility:

-   captured identity;
-   contact data;
-   consent;
-   source;
-   assessment attempt;
-   report unlock timestamp.

Do not turn this table into a full CRM.

## 6.2 Business Lead

Purpose:

> Record yang dapat digunakan untuk sales/follow-up.

Minimum information:

``` text
id
name
whatsapp / phone
email
source
status
consent
createdAt
updatedAt
assessmentAttemptId/reference
```

Jika entitas `Lead` belum tersedia tetapi `Contact` tersedia dan
merupakan pola existing application, gunakan struktur existing tersebut
secara minimal. Jangan membuat duplicate CRM architecture.

## 6.3 Deduplication

Lead creation harus idempotent.

Rule:

``` text
same WhatsApp
        OR
same normalized email
```

tidak boleh menghasilkan lead business baru setiap kali user mengulang
flow.

Assessment attempt baru tetap boleh tercatat sebagai activity/context
baru.

------------------------------------------------------------------------

# 7. DELIVERY ARCHITECTURE

## 7.1 PDF Generation

Input:

``` text
AssessmentResult
+
FreeLeadCapture.name
```

Output:

``` text
Buffer PDF
```

Validation:

``` text
size > minimum threshold
AND
header = %PDF-
```

PDF harus dapat:

-   dibuat di local Mac;
-   dibuat di Linux production;
-   disimpan ke `FreeReportDelivery`;
-   di-download melalui PDF endpoint.

## 7.2 WhatsApp

Flow:

``` text
PDF Buffer
   ↓
WhatsApp Media Upload
   ↓
Media ID
   ↓
Document Message
   ↓
Delivery Status
```

Do not send raw PDF Base64 directly as a WhatsApp document message.

Required configuration:

``` text
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_GRAPH_VERSION
```

Secrets hanya berasal dari environment.

## 7.3 Email

Flow:

``` text
PDF Buffer
   ↓
Resend API
   ↓
Email Attachment
   ↓
Delivery Status
```

Required configuration:

``` text
RESEND_API_KEY
READYSCORE_EMAIL_FROM
```

Email bersifat optional karena WhatsApp merupakan primary delivery
channel.

Jika email diberikan, email dapat menjadi backup/secondary delivery
channel.

------------------------------------------------------------------------

# 8. DELIVERY STATE MACHINE

## PDF

``` text
NOT_GENERATED
      ↓
 GENERATED
      ↓
   FAILED
```

Failure PDF harus membuat delivery gagal dengan jelas, tetapi tidak
boleh merusak akses user terhadap result jika result sudah unlocked.

## WhatsApp

``` text
NOT_ATTEMPTED
      ↓
   SENT
```

atau:

``` text
NOT_ATTEMPTED
      ↓
   FAILED
```

atau jika provider tidak tersedia:

``` text
NOT_ATTEMPTED
      ↓
  SKIPPED
```

## Email

``` text
NOT_ATTEMPTED
      ↓
   SENT
```

atau:

``` text
NOT_ATTEMPTED
      ↓
   FAILED
```

atau:

``` text
NOT_ATTEMPTED
      ↓
  SKIPPED
```

------------------------------------------------------------------------

# 9. RETRY RULES

Retry harus aman.

Rules:

-   `SENT` tidak dikirim ulang secara otomatis.
-   `FAILED` dapat dicoba kembali.
-   `SKIPPED` dapat dicoba kembali setelah provider tersedia.
-   PDF yang sudah `GENERATED` tidak dibuat ulang jika masih valid.
-   Retry tidak boleh membuat duplicate business lead.
-   Retry tidak boleh membuat duplicate premium transaction.

------------------------------------------------------------------------

# 10. API REQUIREMENTS

## 10.1 Delivery

``` text
POST /api/free/delivery
```

Input:

``` json
{
  "attemptId": "..."
}
```

Response harus memberikan:

``` json
{
  "ok": true,
  "delivery": {
    "attemptId": "...",
    "pdfStatus": "GENERATED",
    "whatsappStatus": "SENT",
    "emailStatus": "SKIPPED",
    "fileName": "..."
  }
}
```

Failure:

``` json
{
  "ok": false,
  "error": {
    "code": "...",
    "message": "..."
  }
}
```

Secret provider error tidak boleh dikirim ke client.

## 10.2 PDF

``` text
GET /api/free/report/pdf?attemptId=...
```

Requirement:

-   hanya mengembalikan PDF jika status `GENERATED`;
-   content type `application/pdf`;
-   filename berasal dari server;
-   failure harus graceful;
-   jangan expose internal stack trace.

------------------------------------------------------------------------

# 11. LEAD CREATION RULE

Lead creation terjadi setelah lead gate berhasil divalidasi.

Sequence:

``` text
Submit Lead Form
       ↓
Validate
       ↓
Persist FreeLeadCapture
       ↓
Create / Update Business Lead
       ↓
Unlock Free Report
       ↓
Trigger Delivery
```

Lead creation failure harus diperlakukan serius, tetapi tidak boleh
menghapus `FreeLeadCapture`.

Jika business lead gagal dibuat:

-   acquisition record tetap tersimpan;
-   error dapat dicatat;
-   retry dapat dilakukan;
-   user tetap dapat melanjutkan Free Report jika aman.

------------------------------------------------------------------------

# 12. SOURCE & FUNNEL ATTRIBUTION

Business lead harus memiliki source yang konsisten.

Recommended canonical value:

``` text
FREE_ASSESSMENT
```

Optional contextual data:

``` text
landing
free
campaign
utm_source
utm_medium
utm_campaign
```

Jangan membuat source value berbeda-beda antar endpoint.

------------------------------------------------------------------------

# 13. PRIVACY & CONSENT

Contact data adalah data pribadi.

Rules:

-   consent harus tetap disimpan;
-   timestamp consent harus disimpan;
-   provider secrets tidak pernah disimpan di database;
-   API response tidak boleh mengembalikan secret;
-   log tidak boleh mencetak token;
-   WhatsApp/email hanya digunakan sesuai consent dan purpose yang
    dinyatakan;
-   admin-only access untuk data lead.

------------------------------------------------------------------------

# 14. ADMIN / BUSINESS VISIBILITY

Scope minimum:

``` text
Admin
  ↓
Leads
  ↓
List
  ├── Name
  ├── WhatsApp
  ├── Email
  ├── Source
  ├── Created At
  ├── Assessment Result
  └── Delivery Status
```

Tidak membangun:

-   sales CRM lengkap;
-   campaign manager;
-   broadcast engine;
-   automation engine;
-   lead scoring AI.

Jika existing admin UI sudah memiliki surface yang cocok, extend surface
tersebut secara minimal.

------------------------------------------------------------------------

# 15. PHASE PLAN

## PHASE 16.5 --- PDF & Delivery Hardening

### Objective

Membuat Free Report generation dan retrieval reliable di local dan
production.

### Build

-   audit dan harden Chromium path detection;
-   cross-platform renderer;
-   PDF generation validation;
-   PDF persistence;
-   PDF download endpoint;
-   graceful renderer errors;
-   delivery status consistency;
-   idempotent PDF generation.

### Acceptance

``` text
Free Report
   ↓
Generate PDF
   ↓
PDF stored
   ↓
GET PDF
   ↓
Valid PDF downloaded
```

### Gate

``` text
pnpm typecheck
pnpm build
runtime PDF E2E
```

------------------------------------------------------------------------

## PHASE 16.6 --- WhatsApp & Email Delivery

### Objective

Membuat external delivery benar-benar reliable dan observable.

### Build

-   validate WhatsApp Cloud API configuration;
-   media upload;
-   document message;
-   Resend attachment;
-   provider error mapping;
-   retry behavior;
-   delivery status persistence;
-   safe provider logging;
-   graceful fallback.

### Acceptance

``` text
Free Report
   ↓
PDF
   ├── WhatsApp → SENT
   └── Email → SENT / SKIPPED
```

Failure acceptance:

``` text
Provider unavailable
   ↓
Free Report remains accessible
   ↓
Status = SKIPPED / FAILED
```

### Gate

-   local provider test;
-   production provider test;
-   duplicate-send regression;
-   failure/retry test.

------------------------------------------------------------------------

## PHASE 16.7 --- Lead Business Record

### Objective

Mengubah acquisition data menjadi business lead yang dapat
ditindaklanjuti.

### Build

-   audit existing Lead/Contact schema;
-   create/update business lead;
-   idempotency;
-   source attribution;
-   consent preservation;
-   assessment reference;
-   minimal admin visibility.

### Acceptance

``` text
User submits contact
        ↓
FreeLeadCapture = saved
        ↓
Business Lead = created/updated
        ↓
Source = FREE_ASSESSMENT
        ↓
Lead visible to authorized admin
```

Duplicate acceptance:

``` text
Same WhatsApp/email
        ↓
Existing lead updated/reused
        ↓
No duplicate business lead
```

### Gate

-   new lead test;
-   duplicate lead test;
-   optional email test;
-   consent test;
-   admin authorization test;
-   V16 regression.

------------------------------------------------------------------------

## PHASE 16.8 --- Full Funnel Production Certification

### Objective

Memastikan seluruh V16 funnel benar-benar production-ready setelah
16.5--16.7.

### Full E2E

``` text
Landing
  ↓
Free Test
  ↓
Result
  ↓
Lead Gate
  ↓
FreeLeadCapture
  ↓
Business Lead
  ↓
Free Report
  ↓
PDF
  ↓
WhatsApp / Email
  ↓
Premium Offer
  ↓
Checkout
  ↓
Entitlement
```

### Validation

-   PDF;
-   WhatsApp;
-   email;
-   lead persistence;
-   deduplication;
-   consent;
-   analytics;
-   admin security;
-   premium offer;
-   checkout;
-   entitlement;
-   V15.2 regression;
-   production build;
-   production runtime;
-   error handling.

### Final Gate

``` text
V16.5 PASS
    ↓
V16.6 PASS
    ↓
V16.7 PASS
    ↓
V16.8 PASS
    ↓
READYScore V16 FINAL
    ↓
V17
```

------------------------------------------------------------------------

# 16. DEFINITION OF DONE

V16.5--V16.8 dianggap selesai jika:

-   PDF generation works on supported environments;
-   PDF download works;
-   PDF delivery status is reliable;
-   WhatsApp delivery works with valid provider configuration;
-   email delivery works when supplied/configured;
-   provider failure does not break Free Report access;
-   retry is idempotent;
-   captured contact becomes a business lead;
-   duplicate leads are prevented;
-   source attribution is preserved;
-   consent is preserved;
-   authorized admin can view the lead;
-   funnel analytics remain intact;
-   premium offer remains intact;
-   checkout remains intact;
-   entitlement remains intact;
-   V15.2 regression passes;
-   production build passes;
-   production runtime E2E passes.

------------------------------------------------------------------------

# 17. OUT OF SCOPE

Do not introduce:

-   AI Career Advisor;
-   OpenAI integration;
-   AI chat;
-   AI lead scoring;
-   AI sales automation;
-   WhatsApp broadcast;
-   email campaign engine;
-   marketing automation;
-   full CRM replacement;
-   sales pipeline redesign;
-   school/university platform;
-   human counselor platform.

These remain outside V16 and belong to future versions where
appropriate.

------------------------------------------------------------------------

# 18. DEVELOPMENT KAIDAH

## Rule 1 --- Latest PASS is the baseline

Development starts from the latest validated V16.4 source.

## Rule 2 --- One phase, one concern

Do not mix 16.5 PDF hardening with CRM redesign.

## Rule 3 --- Full file replacement

Every modified file must be delivered as a complete file replacement
with:

``` text
PATH
FULL FILE CONTENT
```

Do not provide partial snippets as the implementation artifact.

## Rule 4 --- No architecture rewrite without evidence

Existing architecture that already passes must not be replaced merely
because another approach looks cleaner.

## Rule 5 --- Runtime over build-only validation

`pnpm build` passing is necessary but not sufficient.

External delivery requires actual runtime verification.

## Rule 6 --- No fake provider success

Never mark WhatsApp or email as `SENT` unless the provider actually
accepts the request successfully.

## Rule 7 --- Regression-aware

Every phase must preserve:

-   Free Assessment;
-   Result;
-   Premium;
-   Checkout;
-   Entitlement;
-   Admin protection;
-   Analytics.

## Rule 8 --- Production only after local PASS

Sequence:

``` text
Code
 ↓
Typecheck
 ↓
Build
 ↓
Local Runtime
 ↓
Provider Runtime
 ↓
E2E
 ↓
Production
```

## Rule 9 --- Do not expose secrets

Never request or output:

-   WhatsApp access token;
-   Resend API key;
-   Midtrans server key;
-   webhook signing secret.

Only verify variable presence/configuration.

## Rule 10 --- Do not claim PASS before user validation

A phase is PASS only after the required runtime verification is executed
and validated.

------------------------------------------------------------------------

# 19. RECOMMENDED DEVELOPMENT ORDER

``` text
V16.5
PDF / Renderer / Download
        ↓
V16.6
WhatsApp / Email Delivery
        ↓
V16.7
Business Lead
        ↓
V16.8
Full E2E + Production Certification
```

This keeps the work intentionally small and prevents scope explosion.

------------------------------------------------------------------------

# 20. FINAL PRODUCT STATE

After V16.8:

``` text
                    READYScore V16
                         │
             ┌───────────┴───────────┐
             │                       │
        ACQUISITION              MONETIZATION
             │                       │
        Free Assessment          Premium Offer
             │                       │
        Instant Result             Checkout
             │                       │
         Lead Capture            Entitlement
             │
       Business Lead
             │
        Free Report
             │
            PDF
         ┌───┴───┐
         │       │
        WA     Email
```

Core business statement:

> **Every qualified Free Assessment completion should produce a
> traceable acquisition record, a usable Free Report, and a measurable
> path toward Premium.**

V16.8 is the final completion layer before the project moves to the V17
AI Career Advisor track.
