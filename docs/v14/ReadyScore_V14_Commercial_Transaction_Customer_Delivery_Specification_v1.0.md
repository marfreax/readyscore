# ReadyScore V14 --- Commercial Transaction & Customer Delivery System

## Production Specification, Kaidah, Phase Order & Acceptance Gates

**Version:** 1.0\
**Date:** 2026-09-08\
**Status:** DEVELOPMENT ROADMAP --- V14 SERIES

------------------------------------------------------------------------

# 1. Purpose

V14 adalah fase komersialisasi ReadyScore setelah V13.10 berhasil
membuktikan bahwa assessment production dapat dikonfigurasi,
dipublikasikan, dijalankan, di-score, dan menghasilkan result secara
nyata.

Fokus V14 bukan mengubah assessment engine V13, melainkan membangun
**purchase-to-access flow** yang menghubungkan:

``` text
CUSTOMER
   ↓
PRODUCT / ASSESSMENT OFFER
   ↓
CHECKOUT
   ↓
PAYMENT GATEWAY
   ↓
PAYMENT VERIFICATION
   ↓
FULFILLMENT
   ↓
ENTITLEMENT / ACCESS
   ↓
ASSESSMENT
   ↓
RESULT
```

Tujuan akhirnya:

> **Customer dapat membeli produk ReadyScore melalui checkout yang
> nyata, pembayaran diverifikasi secara server-side, fulfillment
> diberikan secara idempotent, akses assessment diberikan sesuai
> entitlement, dan customer dapat menjalankan assessment sampai result
> tanpa intervensi engineering.**

V14 harus mengonsumsi fondasi assessment V13 yang sudah PASS/FROZEN dan
tidak boleh menjadikan payment/commerce sebagai alasan untuk mengubah
kontrak assessment runtime.

------------------------------------------------------------------------

# 2. V14 Baseline

V14 menggunakan V13.10 sebagai frozen assessment baseline.

Fondasi berikut dianggap sudah tersedia dan harus dipertahankan:

-   Production Question Package
-   Production eligibility
-   Composition-valid question selection
-   Frozen attempt snapshot
-   Randomized question sequence
-   Durable answer persistence
-   Resume semantics
-   Server-authoritative timer
-   Timeout finalization
-   Production scoring
-   Result persistence
-   Customer assessment flow

Production target V13 tetap:

  Assessment         Questions   Maximum Time
  ---------------- ----------- --------------
  RIASEC                    60     20 minutes
  DISC                      80     20 minutes
  EQ                        50     20 minutes
  Cognitive / IQ            40     20 minutes

V14 tidak mengubah jumlah soal, scoring engine, timer, package
selection, atau result contract tanpa phase amendment yang eksplisit.

------------------------------------------------------------------------

# 3. Commercial Scope

V14 mencakup komponen yang diperlukan agar ReadyScore dapat beroperasi
sebagai produk berbayar.

## Included

-   Product / assessment offer definition
-   Checkout initiation
-   Payment gateway integration
-   Payment status lifecycle
-   Server-side payment verification
-   Webhook handling
-   Webhook signature/authenticity verification
-   Idempotent payment processing
-   Order / transaction record
-   Payment-to-fulfillment mapping
-   Entitlement creation
-   Customer assessment access handoff
-   Access validation before assessment start
-   Payment and fulfillment audit trail
-   Customer-facing payment/access status
-   Commercial E2E
-   Regression against V13 assessment runtime

## Explicitly Excluded

-   Redesign assessment scoring
-   Redesign Question Package
-   Psychometric redesign
-   Adaptive testing
-   Exposure control
-   Advanced assessment analytics
-   Broad UI redesign unrelated to checkout/access
-   WhatsApp marketing automation
-   Email marketing automation
-   CRM functionality
-   Subscription/billing recurrence unless explicitly introduced by a
    later amendment

Email/WhatsApp delivery may be added as a delivery extension, but must
not become a hidden dependency for the core purchase-to-access flow.

------------------------------------------------------------------------

# 4. Payment Gateway Principle

Payment gateway adalah **payment infrastructure**, bukan source of truth
untuk customer entitlement.

Canonical ownership:

``` text
Payment Gateway
      ↓
Payment Verification
      ↓
ReadyScore Transaction
      ↓
Fulfillment
      ↓
Entitlement
      ↓
Assessment Access
```

ReadyScore must never grant assessment access merely because a browser
reports that payment succeeded.

A successful payment must be established from a trusted server-side
gateway signal or verified gateway API response according to the
selected provider's contract.

------------------------------------------------------------------------

# 5. Payment State Model

V14 harus memiliki state yang eksplisit dan auditable.

Minimum conceptual states:

``` text
CREATED
   ↓
PENDING
   ├──→ PAID
   ├──→ FAILED
   ├──→ EXPIRED
   └──→ CANCELLED
```

Post-payment fulfillment:

``` text
PAID
  ↓
FULFILLMENT_PENDING
  ↓
FULFILLED
```

Jika fulfillment mengalami error teknis, status transaksi tidak boleh
dikembalikan secara sembarangan menjadi unpaid.

Recommended recovery semantics:

``` text
PAID
  ↓
FULFILLMENT_PENDING
  ↓
FULFILLED

or

PAID
  ↓
FULFILLMENT_FAILED
  ↓
RETRY
  ↓
FULFILLED
```

Payment confirmation dan fulfillment harus dipisahkan.

------------------------------------------------------------------------

# 6. Order / Transaction Principle

Setiap checkout harus menghasilkan identitas transaksi internal yang
stabil.

Minimum conceptual identity:

``` text
Order
Transaction
Payment Provider
Provider Transaction Reference
Customer
Product
Amount
Currency
Payment Status
Fulfillment Status
Created At
Updated At
```

Provider reference tidak boleh menjadi satu-satunya identity di
ReadyScore.

ReadyScore harus dapat melakukan reconciliation antara:

``` text
ReadyScore Order
      ↕
Gateway Payment
      ↕
Fulfillment
      ↕
Entitlement
```

------------------------------------------------------------------------

# 7. Idempotency Principle

Webhook dan payment callback harus diperlakukan sebagai **at-least-once
delivery**.

Artinya:

> Event payment yang sama dapat diterima lebih dari satu kali dan tidak
> boleh menghasilkan entitlement ganda.

V14 wajib memastikan:

-   duplicate webhook tidak membuat duplicate fulfillment
-   duplicate callback tidak menggandakan entitlement
-   retry gateway aman
-   concurrent processing aman
-   provider reference dapat direconcile
-   state transition tidak dapat mundur secara ilegal

Contoh:

``` text
Webhook PAID
Webhook PAID
Webhook PAID
      ↓
ONE PAYMENT
      ↓
ONE FULFILLMENT
      ↓
ONE INTENDED ENTITLEMENT
```

------------------------------------------------------------------------

# 8. Webhook Security Principle

Webhook tidak boleh dipercaya hanya berdasarkan payload.

Minimum:

-   verify provider signature/authentication
-   validate provider transaction reference
-   validate expected amount
-   validate currency
-   validate transaction identity
-   validate allowed state transition
-   reject malformed or inconsistent events
-   record audit information
-   process idempotently

Jika provider mendukung server-side status inquiry, reconciliation harus
dapat menggunakannya sebagai secondary verification path.

------------------------------------------------------------------------

# 9. Fulfillment Principle

Fulfillment adalah boundary antara:

``` text
PAYMENT CONFIRMED
```

dan:

``` text
CUSTOMER MAY ACCESS PRODUCT
```

Payment sukses **tidak otomatis berarti** database langsung memberikan
access tanpa proses fulfillment yang tercatat.

Canonical flow:

``` text
Payment Verified
      ↓
Order = PAID
      ↓
Fulfillment
      ↓
Entitlement Created
      ↓
Access Available
```

Fulfillment harus:

-   deterministic
-   idempotent
-   auditable
-   retryable
-   independent from browser state

------------------------------------------------------------------------

# 10. Entitlement Principle

Entitlement adalah source of truth untuk hak customer menggunakan produk
ReadyScore.

Entitlement minimal harus dapat menjawab:

-   customer siapa?
-   produk apa?
-   assessment/test type apa?
-   berapa kali penggunaan?
-   sudah digunakan berapa kali?
-   kapan mulai berlaku?
-   kapan berakhir jika ada expiry?
-   berasal dari transaksi mana?
-   statusnya apa?

Conceptually:

``` text
Customer
   │
   ▼
Entitlement
   │
   ├── Product
   ├── Assessment Type
   ├── Usage Limit
   ├── Usage Consumed
   ├── Validity
   └── Source Transaction
```

Access assessment harus diperiksa terhadap entitlement yang valid.

------------------------------------------------------------------------

# 11. Assessment Access Boundary

V14 harus membuat boundary yang jelas:

``` text
BEFORE PAYMENT
      ↓
NO PAID ENTITLEMENT
      ↓
NO PAID ASSESSMENT ACCESS

AFTER VERIFIED PAYMENT
      ↓
FULFILLMENT
      ↓
ENTITLEMENT
      ↓
ASSESSMENT ACCESS
```

Assessment runtime V13 tetap bertanggung jawab atas:

-   start attempt
-   package selection
-   question selection
-   timer
-   answers
-   submit
-   timeout
-   scoring
-   result

V14 bertanggung jawab atas:

-   apakah customer berhak memulai assessment.

Dengan demikian:

``` text
V14 Access
     ↓
V13 Assessment Runtime
```

------------------------------------------------------------------------

# 12. Access Consumption Principle

Penggunaan entitlement harus atomic.

Sistem tidak boleh:

1.  membuat dua attempt dari satu entitlement karena race condition;
    atau
2.  mengurangi usage tanpa assessment attempt yang valid.

Aturan konsumsi harus ditentukan secara eksplisit berdasarkan produk.

Minimum invariant:

> Satu entitlement tidak boleh dikonsumsi lebih dari batas yang
> diberikan produk.

Jika produk memberikan satu assessment, akses tersebut tidak boleh
menghasilkan dua assessment yang sah hanya karena refresh, retry, atau
dua browser berjalan bersamaan.

------------------------------------------------------------------------

# 13. Checkout Principle

Checkout harus memiliki separation:

``` text
PRODUCT CATALOG
      ↓
CHECKOUT
      ↓
ORDER
      ↓
PAYMENT
```

Harga dan produk yang digunakan untuk membuat order harus disnapshot
pada transaksi.

Jangan bergantung pada harga katalog yang berubah setelah customer
melakukan checkout.

Minimum snapshot:

-   product identifier
-   product name
-   assessment type
-   quantity
-   unit price
-   total amount
-   currency
-   applicable commercial configuration

------------------------------------------------------------------------

# 14. Failure & Recovery

V14 harus mendefinisikan recovery untuk kondisi:

### Payment Pending

Customer belum mendapatkan entitlement.

### Payment Failed

Customer tidak mendapatkan entitlement.

### Payment Expired

Customer tidak mendapatkan entitlement.

### Payment Paid, Fulfillment Delayed

Payment tetap PAID. Fulfillment dapat di-retry.

### Duplicate Webhook

Tidak menghasilkan duplicate fulfillment.

### Browser Closed After Payment

Customer dapat kembali dan melihat status transaksi/access tanpa
kehilangan entitlement.

### Gateway Timeout

ReadyScore tidak boleh menganggap payment berhasil hanya karena request
timeout.

### Callback Arrives Before Browser Redirect

Webhook tetap dapat menyelesaikan payment dan fulfillment.

Browser redirect hanya UX.

------------------------------------------------------------------------

# 15. Auditability

Commercial lifecycle harus dapat diaudit.

Minimum audit trail harus dapat menjawab:

``` text
WHO
WHAT
WHEN
FROM STATE
TO STATE
SOURCE
REFERENCE
```

Contoh:

``` text
Order CREATED
Payment PENDING
Webhook RECEIVED
Payment VERIFIED
Order PAID
Fulfillment CREATED
Entitlement CREATED
Assessment ACCESS_GRANTED
Assessment STARTED
```

Audit harus membedakan event gateway dengan mutation internal
ReadyScore.

------------------------------------------------------------------------

# 16. Security Principles

V14 wajib mengikuti prinsip:

1.  Server authoritative.
2.  Client tidak menentukan payment success.
3.  Client tidak menentukan entitlement.
4.  Amount tidak boleh dipercaya dari browser.
5.  Product price harus berasal dari server.
6.  Webhook harus diverifikasi.
7.  State transition harus divalidasi.
8.  Sensitive payment data tidak disimpan jika tidak diperlukan.
9.  Payment provider secret hanya berada di server.
10. Duplicate event harus aman.

------------------------------------------------------------------------

# 17. Provider Strategy

Arsitektur payment harus provider-agnostic pada domain layer.

Conceptual:

``` text
ReadyScore Payment Domain
          │
          ├── Midtrans Adapter
          │
          └── Xendit Adapter
```

Domain logic tidak boleh tersebar ke seluruh application berdasarkan
provider.

Minimal abstraction:

``` text
createPayment()
verifyPayment()
parseWebhook()
verifyWebhook()
getPaymentStatus()
```

Provider-specific implementation berada di adapter/integration boundary.

Untuk V14 production launch, **satu provider dapat menjadi provider
pertama**. Dukungan provider kedua tidak wajib diselesaikan dalam phase
yang sama apabila abstraction boundary sudah benar.

------------------------------------------------------------------------

# 18. Phase Order

V14 dibuat sesingkat mungkin menjadi **4 phase**.

------------------------------------------------------------------------

## Phase V14.1 --- Commercial Domain & Checkout Foundation

### Objective

Membangun foundation transaksi komersial tanpa bergantung pada provider
tertentu.

### Scope

-   Product/offer commercial model
-   Order/transaction model
-   Payment state model
-   Fulfillment state model
-   Entitlement model
-   Checkout initiation
-   Price snapshot
-   Internal transaction identity
-   Domain service boundaries
-   Audit foundation
-   Access boundary foundation

### Exit Criteria

ReadyScore dapat:

``` text
Product
  ↓
Checkout
  ↓
Order
  ↓
Pending Payment
```

dan seluruh state dapat dipersist secara konsisten.

Tidak ada assessment runtime change.

------------------------------------------------------------------------

## Phase V14.2 --- Payment Gateway Integration

### Objective

Menghubungkan V14 dengan payment provider nyata.

### Scope

-   Provider adapter
-   Payment creation
-   Payment status verification
-   Webhook endpoint
-   Signature verification
-   Provider reference reconciliation
-   Idempotency
-   Valid state transitions
-   Payment audit events
-   Failure/retry handling

### Exit Criteria

Real payment sandbox/test environment membuktikan:

``` text
Checkout
  ↓
Gateway
  ↓
Payment
  ↓
Verified PAID
```

serta duplicate webhook, invalid webhook, failed payment, dan pending
payment ditangani dengan benar.

------------------------------------------------------------------------

## Phase V14.3 --- Fulfillment, Entitlement & Customer Access

### Objective

Menghubungkan verified payment ke hak akses assessment.

### Scope

-   Payment → fulfillment
-   Fulfillment → entitlement
-   Entitlement validation
-   Atomic access consumption
-   Assessment access handoff
-   Customer payment/access status
-   Retryable fulfillment
-   Browser-independent fulfillment
-   Access denial without entitlement

### Exit Criteria

Real customer flow membuktikan:

``` text
PAID
 ↓
FULFILLED
 ↓
ENTITLED
 ↓
ACCESS GRANTED
 ↓
V13 ASSESSMENT
```

dan customer tanpa entitlement tidak dapat menggunakan paid assessment.

------------------------------------------------------------------------

## Phase V14.4 --- Commercial E2E & Launch Readiness

### Objective

Membuktikan keseluruhan purchase-to-result lifecycle.

### Scope

-   Real/sandbox gateway E2E
-   Checkout E2E
-   Payment verification E2E
-   Webhook E2E
-   Duplicate webhook E2E
-   Fulfillment E2E
-   Entitlement E2E
-   Access E2E
-   Assessment regression against V13
-   Result regression
-   Failure/recovery E2E
-   Audit verification
-   Build/typecheck
-   Final launch gate

### Canonical E2E

``` text
CUSTOMER
   ↓
SELECT PRODUCT
   ↓
CHECKOUT
   ↓
CREATE ORDER
   ↓
PAYMENT
   ↓
GATEWAY VERIFICATION
   ↓
WEBHOOK
   ↓
PAID
   ↓
FULFILLMENT
   ↓
ENTITLEMENT
   ↓
ACCESS
   ↓
START ASSESSMENT
   ↓
COMPLETE / TIMEOUT
   ↓
SCORING
   ↓
RESULT
```

### Exit Criteria

> A real customer can purchase a ReadyScore product, have payment
> verified, receive the correct entitlement, access the correct
> assessment, complete it, and receive the persisted result without
> engineering intervention.

------------------------------------------------------------------------

# 19. V14 Acceptance Gates

Setiap phase wajib menghasilkan:

1.  specification / implementation record
2.  changed files
3.  migration, jika diperlukan
4.  static validation
5.  typecheck/build
6.  real DB/HTTP E2E
7.  payment/provider E2E jika relevan
8.  regression evidence
9.  security/integrity evidence
10. final PASS/FAIL
11. freeze point
12. known limitations

Tidak ada phase yang dianggap PASS hanya karena code berhasil build.

------------------------------------------------------------------------

# 20. Regression Rule

V14 tidak boleh merusak V13.

Minimum regression wajib mencakup:

-   RIASEC 60
-   DISC 80
-   EQ 50
-   Cognitive 40
-   package selection
-   frozen sequence
-   answer persistence
-   submit
-   timeout
-   result persistence
-   post-expiry rejection

Payment/access changes must not alter assessment scoring or result
semantics.

------------------------------------------------------------------------

# 21. Change-Control Rule

Setelah V14 phase dinyatakan `PASS / FROZEN`:

-   jangan mengubah contract secara casual
-   phase berikutnya harus mengonsumsi output frozen
-   regression harus diselidiki
-   perubahan domain yang signifikan memerlukan amendment atau phase
    baru
-   payment provider-specific behavior harus tetap berada di integration
    boundary

------------------------------------------------------------------------

# 22. V14 Non-Goals

V14 bukan fase untuk:

-   mengganti scoring model
-   melakukan psychometric validation penuh
-   membuat adaptive test
-   membuat CRM
-   membangun marketing automation
-   membuat WhatsApp campaign engine
-   membuat email marketing platform
-   membuat subscription billing
-   membuat advanced analytics
-   redesign besar customer/admin UI

Fokus V14 adalah satu hal:

> **Mengubah ReadyScore dari assessment system menjadi transactional
> commercial assessment product yang dapat dibeli dan diakses secara
> reliable.**

------------------------------------------------------------------------

# 23. Final V14 Principle

V13 membuktikan:

> **ReadyScore dapat menjalankan assessment production dengan benar.**

V14 harus membuktikan:

> **ReadyScore dapat menjual assessment production dengan benar.**

Definisi sukses V14:

``` text
PRODUCT
   ↓
PURCHASE
   ↓
VERIFIED PAYMENT
   ↓
FULFILLMENT
   ↓
ENTITLEMENT
   ↓
ACCESS
   ↓
ASSESSMENT
   ↓
RESULT
```

Tanpa engineering intervention pada jalur normal maupun recovery yang
telah ditentukan.

**V14 = Commercial Transaction & Customer Delivery System.**
