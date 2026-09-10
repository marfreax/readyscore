# ReadyScore V14.5 --- Scalev Integration & Customer Activation

## Specification & Development Rules v1.0

**Status:** Draft / Development Baseline\
**Version:** V14.5\
**Predecessor:** V14.4 --- Commercial E2E & Launch Readiness\
**Next Phase:** V14.6 --- Operational Admin --- User & Access

------------------------------------------------------------------------

# 1. Purpose

V14.5 menambahkan **Scalev sebagai external sales / commerce channel**
untuk ReadyScore.

Target utama:

> Customer membeli ReadyScore melalui Landing Page Scalev, pembayaran
> berhasil, transaksi diterima oleh ReadyScore, user otomatis tersedia,
> entitlement otomatis diberikan, dan customer menerima email untuk
> mengaktifkan akun ReadyScore.

V14.5 tidak menggantikan atau merombak jalur Midtrans yang sudah
dibangun pada V14.4.

------------------------------------------------------------------------

# 2. Target Business Flow

Canonical flow V14.5:

``` text
Scalev Landing Page
        ↓
Scalev Checkout
        ↓
Customer Payment
        ↓
Scalev Payment Confirmed
        ↓
Scalev → ReadyScore Integration
        ↓
ReadyScore Commercial Order
        ↓
Payment / Fulfillment
        ↓
Entitlement
        ↓
User Provisioning
        ↓
Activation Email
        ↓
Customer Activates Account
        ↓
ReadyScore Login
        ↓
Assessment Access
```

Customer tidak diwajibkan membuat account ReadyScore secara manual
sebelum membeli.

------------------------------------------------------------------------

# 3. Architectural Position

V14.5 memperlakukan Scalev sebagai **external transaction source /
integration provider**.

Scalev:

-   menjadi channel landing page dan checkout;
-   menangani customer-facing purchase flow di Scalev;
-   menjadi source/reference transaksi eksternal.

ReadyScore:

-   menjadi system of record untuk user;
-   menjadi system of record untuk commercial order yang sudah
    diintegrasikan;
-   menjadi authority untuk fulfillment;
-   menjadi authority untuk entitlement;
-   menjadi authority untuk assessment access;
-   menjadi authority untuk assessment/result.

Conceptual architecture:

``` text
                 READY SCORE
                     │
          ┌──────────┴──────────┐
          │                     │
       Midtrans               Scalev
     Direct Channel       External Channel
          │                     │
          └──────────┬──────────┘
                     ↓
              ReadyScore Domain
                     ↓
          Order / Fulfillment
                     ↓
                 Entitlement
                     ↓
                   User
                     ↓
                Assessment
```

------------------------------------------------------------------------

# 4. Scope

V14.5 hanya mencakup:

1.  Scalev checkout configuration.
2.  Scalev order/payment integration.
3.  Scalev → ReadyScore webhook/integration.
4.  External order identification and mapping.
5.  Scalev product → ReadyScore product/assessment mapping.
6.  Customer/user provisioning.
7.  Entitlement creation through existing commercial domain.
8.  Activation token and activation flow.
9.  Activation email.
10. Idempotency.
11. Failure/retry handling.
12. Auditability.
13. Real Scalev → ReadyScore E2E validation.

------------------------------------------------------------------------

# 5. Explicit Non-Scope

V14.5 tidak boleh:

-   mengubah scoring;
-   mengubah psychometric measurement;
-   mengubah question selection;
-   mengubah timer;
-   mengubah assessment lifecycle V13;
-   mengubah result architecture;
-   mengubah Midtrans payment flow yang sudah PASS;
-   mengganti ReadyScore sebagai entitlement authority;
-   membuat CRM;
-   membuat marketing automation;
-   membuat subscription;
-   membuat WhatsApp blast;
-   membuat Operational Admin V14.6;
-   memasukkan fungsi manual admin ke customer flow;
-   melakukan redesign besar terhadap Access & Plans.

Jika kebutuhan tersebut ditemukan selama development, kebutuhan harus
dicatat sebagai scope terpisah dan tidak boleh diam-diam dimasukkan ke
V14.5.

------------------------------------------------------------------------

# 6. Scalev Checkout

Landing Page utama:

``` text
https://readyscore.myscalev.com/mulai-assessment
```

Tombol pembelian harus mengarah ke checkout Scalev yang benar.

Current failure:

``` text
Checkout ReadyScore belum dikonfigurasi.
Silakan masukkan URL Checkout Scalev terlebih dahulu.
```

V14.5 harus menghilangkan dependency/configuration failure tersebut.

Expected:

``` text
Landing Page
    ↓
Scalev Checkout
```

Checkout URL dan product reference harus berasal dari konfigurasi Scalev
yang valid.

Jangan hard-code URL yang belum diverifikasi.

------------------------------------------------------------------------

# 7. Scalev Product Mapping

Setiap produk Scalev yang dijual untuk ReadyScore harus memiliki mapping
deterministic ke produk/entitlement ReadyScore.

Minimum commercial mapping:

``` text
Scalev Product
      ↓
ReadyScore Product
      ↓
Entitlement Type
      ↓
Assessment Type(s)
```

Contoh logical mapping:

``` text
ReadyScore — RIASEC
        ↓
RIASEC entitlement

ReadyScore — DISC
        ↓
DISC entitlement

ReadyScore — EQ
        ↓
EQ entitlement

ReadyScore — IQ
        ↓
COGNITIVE entitlement

ReadyScore — All Tests
        ↓
RIASEC + DISC + EQ + COGNITIVE
```

Mapping tidak boleh bergantung hanya pada:

-   harga;
-   nama customer;
-   posisi item;
-   browser state.

Product identity/reference harus menjadi sumber mapping.

------------------------------------------------------------------------

# 8. Scalev Order Integration

Setiap transaksi Scalev yang berhasil harus dapat direpresentasikan
secara durable di ReadyScore.

Logical flow:

``` text
Scalev Order
     ↓
External Order Reference
     ↓
ReadyScore CommercialOrder
     ↓
Payment Confirmed
     ↓
Fulfillment
     ↓
Entitlement
```

ReadyScore harus menyimpan external reference yang cukup untuk:

-   reconciliation;
-   idempotency;
-   audit;
-   support;
-   future operational admin.

External reference tidak boleh menggantikan internal ReadyScore
transaction identity.

------------------------------------------------------------------------

# 9. Payment Authority

ReadyScore tidak boleh memberikan entitlement hanya karena:

-   customer kembali ke landing page;
-   browser redirect;
-   query parameter;
-   frontend state;
-   customer mengatakan sudah membayar.

Payment status harus berasal dari sumber server-authoritative Scalev
integration/event yang valid.

Expected principle:

``` text
Browser
   ≠
Payment Authority

Scalev confirmed payment
   ↓
ReadyScore processing
```

Jika status payment belum confirmed:

``` text
No entitlement
No assessment access
```

------------------------------------------------------------------------

# 10. Webhook / Integration Endpoint

ReadyScore harus menyediakan endpoint integration khusus Scalev.

Conceptual:

``` text
POST /api/integrations/scalev/webhook
```

Nama route final mengikuti struktur repository yang berlaku.

Endpoint harus:

1.  menerima event;
2.  memvalidasi authenticity/integrity sesuai mekanisme Scalev yang
    tersedia;
3.  memvalidasi payload;
4.  mengidentifikasi external order;
5.  mengidentifikasi customer;
6.  mengidentifikasi product;
7.  menentukan payment state;
8.  memproses order secara idempotent;
9.  menjalankan fulfillment melalui domain service;
10. mencatat audit event;
11. memberikan response yang sesuai.

Webhook tidak boleh berisi business logic fulfillment yang diduplikasi
dari commercial domain.

------------------------------------------------------------------------

# 11. Idempotency

Webhook delivery harus dianggap **at-least-once**.

Event yang sama dapat diterima lebih dari sekali.

Expected:

``` text
Webhook #1
    ↓
Order processed
    ↓
Fulfillment
    ↓
Entitlement created

Webhook #2 — same event/order
    ↓
Already processed
    ↓
No duplicate entitlement
```

Idempotency harus berlaku terhadap:

-   external order;
-   external event/reference bila tersedia;
-   fulfillment;
-   user provisioning;
-   entitlement creation.

Tidak boleh terjadi:

``` text
1 payment
→ 2 users

1 payment
→ 2 commercial orders

1 payment
→ duplicate entitlement
```

------------------------------------------------------------------------

# 12. User Provisioning

Customer identity utama untuk provisioning adalah email customer yang
tervalidasi dari transaksi.

Flow:

``` text
Customer Email
      ↓
Find ReadyScore User
      ↓
┌───────────────┴───────────────┐
│                               │
User exists                  No user
│                               │
Use existing                  Create user
│                               │
└───────────────┬───────────────┘
                ↓
          Entitlement
```

Rules:

-   jangan membuat duplicate user;
-   jangan membuat account berdasarkan nama saja;
-   email harus divalidasi;
-   existing user tidak boleh kehilangan entitlement;
-   existing user tidak boleh mendapatkan account kedua.

------------------------------------------------------------------------

# 13. Activation

Jika user belum pernah mengaktifkan account, ReadyScore membuat
activation flow.

Conceptual:

``` text
User Created
    ↓
Activation Token
    ↓
Activation Email
    ↓
Customer Clicks Link
    ↓
Set Password
    ↓
Account Activated
    ↓
Login
```

Activation token harus:

-   random;
-   tidak predictable;
-   disimpan secara aman;
-   memiliki expiration;
-   single-use;
-   invalid setelah berhasil digunakan;
-   tidak mengandung password;
-   tidak mengekspos sensitive internal data.

------------------------------------------------------------------------

# 14. Activation Email

Email aktivasi dikirim setelah user provisioning berhasil dan transaksi
sudah memenuhi syarat akses.

Minimum content:

-   customer greeting;
-   informasi bahwa pembelian berhasil;
-   instruksi aktivasi;
-   activation link/button;
-   informasi singkat produk yang diperoleh.

CTA:

``` text
Aktifkan Akun
```

Email tidak boleh mengandung:

-   password plaintext;
-   server secret;
-   payment secret;
-   internal database ID yang tidak diperlukan.

Jika user sudah aktif, sistem tidak boleh membuat activation token baru
secara tidak perlu.

------------------------------------------------------------------------

# 15. Entitlement

Entitlement tetap dikelola oleh commercial/entitlement domain ReadyScore
yang sudah ada.

Scalev integration hanya menentukan:

``` text
source = SCALEV
sourceOrderId = external Scalev order
product = mapped ReadyScore product
```

Setelah payment confirmed:

``` text
Scalev Paid
    ↓
ReadyScore Order
    ↓
Fulfillment
    ↓
Entitlement
```

Tidak boleh membuat entitlement langsung dari frontend.

------------------------------------------------------------------------

# 16. Assessment Access

Assessment access mengikuti access boundary ReadyScore yang sudah ada.

V14.5 tidak boleh membuat bypass seperti:

``` text
Scalev customer
    ↓
langsung boleh membuka assessment
```

Yang benar:

``` text
Scalev payment
    ↓
ReadyScore fulfillment
    ↓
ReadyScore entitlement
    ↓
existing access boundary
    ↓
assessment
```

Assessment runtime V13 tidak boleh dirombak untuk kebutuhan Scalev.

------------------------------------------------------------------------

# 17. Failure & Recovery

### Payment belum confirmed

``` text
No entitlement
```

### Payment confirmed, fulfillment gagal

``` text
Payment tetap confirmed
Fulfillment = retryable
Entitlement belum/baru dibuat sesuai transaction state
```

### Webhook duplicate

``` text
No duplicate fulfillment
No duplicate entitlement
No duplicate user
```

### User already exists

``` text
Reuse user
Create/update entitlement
No duplicate account
```

### Activation email gagal

Payment dan entitlement tidak boleh dibatalkan hanya karena email
delivery gagal.

Status activation/email failure harus dapat diretry.

------------------------------------------------------------------------

# 18. Auditability

Scalev integration harus dapat diaudit.

Minimum lifecycle harus dapat menjawab:

``` text
WHO
WHAT
WHEN
FROM STATE
TO STATE
SOURCE
REFERENCE
```

Contoh event:

``` text
SCALEV_WEBHOOK_RECEIVED
SCALEV_PAYMENT_CONFIRMED
COMMERCIAL_ORDER_CREATED
PAYMENT_VERIFIED
FULFILLMENT_PENDING
ENTITLEMENT_CREATED
USER_PROVISIONED
ACTIVATION_CREATED
ACTIVATION_EMAIL_SENT
ACCESS_AVAILABLE
```

Nama event final mengikuti conventions repository.

Audit harus membedakan:

``` text
External Scalev event
        vs
Internal ReadyScore mutation
```

------------------------------------------------------------------------

# 19. Security Rules

Wajib:

1.  Server authoritative.
2.  Jangan percaya payment status dari browser.
3.  Jangan percaya entitlement dari browser.
4.  Jangan percaya amount dari browser.
5.  Validate product identity.
6.  Validate external order reference.
7.  Verify webhook authenticity/integrity.
8.  Protect activation tokens.
9.  Jangan expose secrets.
10. Jangan log API keys, tokens, webhook secrets, atau password.
11. Idempotency wajib.
12. Customer tidak boleh mengubah product/entitlement melalui client.
13. Existing commercial access boundary tetap menjadi authority.

------------------------------------------------------------------------

# 20. Configuration & Secrets

Semua credential Scalev harus berada di environment/configuration yang
sesuai.

Tidak boleh:

-   hard-code API key;
-   hard-code OAuth token;
-   hard-code webhook secret;
-   commit secret ke repository;
-   mencetak secret ke log.

Contoh logical configuration:

``` text
SCALEV_*
```

Nama environment variable final mengikuti convention project.

Secret tidak boleh diminta atau dimasukkan ke source code.

------------------------------------------------------------------------

# 21. Database Rules

Migration hanya boleh dibuat jika benar-benar diperlukan.

Prioritas:

1.  reuse model V14 yang sudah ada;
2.  tambah field integration source/reference hanya jika diperlukan;
3.  gunakan unique constraint untuk idempotency jika tepat;
4.  jangan membuat model duplicate yang sebenarnya sudah dapat ditangani
    commercial domain.

Setiap migration harus:

-   deterministic;
-   deployable;
-   reversible secara operasional;
-   lolos migration state check.

------------------------------------------------------------------------

# 22. Midtrans Protection Rule

V14.5 **tidak boleh merusak V14.4 Midtrans**.

Sebelum dan sesudah implementation:

``` text
Midtrans Direct Purchase
→ Payment
→ Verification
→ Fulfillment
→ Entitlement
→ Access
```

harus tetap bekerja.

Scalev harus menjadi integration path tambahan, bukan replacement yang
mengubah behavior Midtrans.

------------------------------------------------------------------------

# 23. Testing Requirements

Minimum static checks:

-   typecheck;
-   lint jika tersedia;
-   production build;
-   migration validation;
-   V14.5 static gate.

Minimum integration tests:

1.  valid Scalev payment event;
2.  invalid webhook/integrity;
3.  duplicate event;
4.  existing user;
5.  new user;
6.  product mapping;
7.  entitlement creation;
8.  activation creation;
9.  activation token single-use;
10. retryable fulfillment;
11. email failure/retry behavior.

------------------------------------------------------------------------

# 24. Canonical Real E2E

V14.5 tidak boleh dinyatakan PASS hanya berdasarkan unit/static test.

Harus ada real environment proof:

``` text
1. Open Scalev Landing Page
2. Click Mulai Assessment
3. Open Scalev Checkout
4. Complete test/sandbox payment
5. Confirm Scalev payment
6. Scalev event reaches ReadyScore
7. ReadyScore creates/reconciles order
8. User is created or reused
9. Entitlement becomes available
10. Activation email is generated/sent
11. Customer activates account
12. Customer logs in
13. Access & Plans shows purchased access
14. Customer starts purchased assessment
15. Duplicate event is replayed
16. No duplicate user/order/entitlement occurs
```

Evidence harus mencakup real application behavior dan database state
yang relevan.

------------------------------------------------------------------------

# 25. V14.5 Acceptance Gate

V14.5 PASS hanya jika seluruh kondisi berikut terpenuhi:

### Checkout

-   [ ] Scalev Landing Page opens correctly.
-   [ ] CTA opens valid Scalev checkout.
-   [ ] No "Checkout ReadyScore belum dikonfigurasi" error.

### Payment

-   [ ] Test/sandbox purchase succeeds.
-   [ ] ReadyScore does not trust browser payment state.
-   [ ] Confirmed payment is recognized correctly.

### Integration

-   [ ] Scalev event reaches ReadyScore.
-   [ ] External order is mapped correctly.
-   [ ] Product mapping is deterministic.
-   [ ] Duplicate event is safe.

### Customer

-   [ ] New customer gets one ReadyScore user.
-   [ ] Existing customer reuses the existing user.
-   [ ] No duplicate account is created.

### Access

-   [ ] Entitlement is created correctly.
-   [ ] Access & Plans reflects purchased product.
-   [ ] Assessment access works through existing access boundary.

### Activation

-   [ ] Activation token is created for new account.
-   [ ] Activation email is sent/generated.
-   [ ] Activation link works.
-   [ ] Token cannot be reused.
-   [ ] Customer can log in after activation.

### Recovery

-   [ ] Fulfillment failure is retryable.
-   [ ] Email failure does not invalidate paid entitlement.
-   [ ] Duplicate webhook does not duplicate fulfillment.

### Regression

-   [ ] V13 assessment behavior remains unchanged.
-   [ ] V14.1--V14.4 relevant regression remains PASS.
-   [ ] Midtrans direct purchase remains functional.
-   [ ] Typecheck passes.
-   [ ] Production build passes.
-   [ ] Migration state is clean.
-   [ ] Real Scalev E2E passes.

------------------------------------------------------------------------

# 26. Definition of Done

V14.5 dianggap selesai jika customer dapat melakukan:

``` text
Beli di Scalev
      ↓
Bayar
      ↓
Order masuk ReadyScore
      ↓
Account otomatis tersedia
      ↓
Entitlement otomatis tersedia
      ↓
Email aktivasi diterima
      ↓
Aktifkan account
      ↓
Login
      ↓
Mulai Assessment
```

tanpa intervensi manual developer/admin untuk transaksi normal.

------------------------------------------------------------------------

# 27. Development Discipline

V14.5 harus dikerjakan secara minimal dan terkontrol.

Rules:

1.  Jangan refactor besar yang tidak diperlukan.
2.  Jangan menyentuh scoring.
3.  Jangan menyentuh measurement.
4.  Jangan menyentuh question bank kecuali benar-benar dibutuhkan oleh
    integration contract.
5.  Jangan mengubah timer.
6.  Jangan mengubah V13 assessment lifecycle.
7.  Jangan mengubah Midtrans flow tanpa alasan integration yang jelas.
8.  Jangan membuat duplicate commercial domain.
9.  Reuse existing fulfillment/entitlement services.
10. Semua external input harus dianggap untrusted.
11. Semua external event harus idempotent.
12. Semua state transition harus server-authoritative.
13. Setiap perubahan database harus memiliki migration.
14. Setiap perubahan harus memiliki validation evidence.
15. Jangan menyatakan PASS tanpa real E2E evidence.

------------------------------------------------------------------------

# 28. Phase Boundary

V14.5 berakhir pada:

``` text
Scalev Customer
        ↓
Activated ReadyScore Customer
        ↓
Entitled Assessment User
```

V14.6 baru menangani:

``` text
Admin
 ↓
Users
 ↓
Orders
 ↓
Payments
 ↓
Fulfillment
 ↓
Entitlements
 ↓
Audit
 ↓
Operational Actions
```

Operational Admin tidak boleh dimasukkan diam-diam ke V14.5.

------------------------------------------------------------------------

# 29. Final Principle

V14.5 harus menghasilkan:

> **Scalev sebagai channel penjualan, ReadyScore sebagai system of
> record.**

Customer boleh datang dari Scalev.

Payment boleh berasal dari Scalev.

Tetapi setelah transaksi masuk ke ReadyScore:

``` text
ReadyScore
    = User Authority
    = Order Integration Record
    = Fulfillment Authority
    = Entitlement Authority
    = Assessment Access Authority
```

Tujuan akhirnya bukan membuat Scalev dan ReadyScore menjadi satu
aplikasi.

Tujuannya adalah membuat keduanya **terintegrasi secara reliable,
idempotent, auditable, dan aman**.
