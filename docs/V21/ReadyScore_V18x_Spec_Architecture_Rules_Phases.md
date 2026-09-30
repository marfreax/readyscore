# ReadyScore V18.x --- Specification, Architecture & Development Rules

**Document Status:** LOCKED AS WORKING AGREEMENT\
**Baseline:** V18.3 Production --- Functional PASS\
**Next Work:** V18.4\
**Development Mode:** LOCAL-FIRST\
**GitHub:** PAUSED until V18.x work is fully completed and validated
locally

------------------------------------------------------------------------

# 1. Purpose

Dokumen ini menjadi **single working agreement** untuk pengembangan
ReadyScore setelah V18.3.

Tujuan utamanya:

1.  Menjaga V18.3 sebagai baseline yang sudah berhasil.
2.  Menyelesaikan V18.4, V18.5, dan V18.6 secara terkontrol.
3.  Menghindari perubahan langsung yang tidak terencana.
4.  Memastikan setiap perubahan diuji di local terlebih dahulu.
5.  Tidak melakukan push / merge / deployment melalui GitHub sampai
    seluruh rangkaian V18.x selesai dan tervalidasi.
6.  Menghindari pengulangan investigasi yang tidak diperlukan.
7.  Menjaga data historis dan runtime assessment tetap aman.

------------------------------------------------------------------------

# 2. V18.3 Baseline --- CLOSED

V18.3 dianggap **selesai secara fungsional** berdasarkan validasi
production.

## 2.1 Assessment Configuration

Production sudah menunjukkan:

  Assessment     Questions Readiness
  ------------ ----------- -----------
  FREE                  10 READY
  RIASEC                60 READY
  DISC                  80 READY
  EQ                    50 READY
  COGNITIVE             40 READY

Dashboard:

-   Configurations: 5
-   Active: 5
-   Ready: 5
-   Needs questions: 0

## 2.2 Runtime Package Baseline

  Assessment   Package
  ------------ ----------------------------
  FREE         FREE_RUNTIME_PRODUCTION_V1
  RIASEC       RIASEC_PRODUCTION_V2
  DISC         DISC_PRODUCTION_V2
  EQ           EQ_PRODUCTION_V2
  COGNITIVE    Q_CGN_1

## 2.3 FREE Composition Baseline

FREE menggunakan RIASEC V2:

-   R = 2
-   I = 2
-   A = 2
-   S = 2
-   E = 1
-   C = 1

Total = 10.

## 2.4 Business Lead Baseline

Production telah menunjukkan:

-   FREE Assessment menghasilkan Business Lead.
-   Assessment result tersimpan.
-   PDF berhasil generated.
-   Email berhasil sent.
-   WhatsApp menunjukkan FAILED karena konfigurasi/nomor WhatsApp Meta
    sudah dihapus.

**WA FAILED pada baseline ini tidak dianggap sebagai kegagalan V18.3
assessment runtime.**

------------------------------------------------------------------------

# 3. Architecture Principles

## 3.1 Journey First

ReadyScore harus memprioritaskan alur pengguna:

``` text
Landing
  ↓
Registration
  ↓
Assessment
  ↓
Submission
  ↓
Scoring
  ↓
Result
  ↓
PDF
  ↓
Email / WhatsApp
  ↓
Business Lead
```

Fitur administratif tidak boleh merusak atau menghambat customer
journey.

## 3.2 Runtime Configuration Is Database-Driven

Assessment runtime menggunakan konfigurasi database sebagai authority.

Untuk assessment aktif:

``` text
AssessmentConfigurationVersion
        ↓
QuestionPackageVersion
        ↓
QuestionPackageCompositionRule
        ↓
QuestionVersion
```

Jangan membuat konfigurasi runtime baru secara hard-coded apabila
konfigurasi database sudah menjadi authority.

## 3.3 Package Before Question Creation

Jika kebutuhan assessment dapat dipenuhi menggunakan
Question/QuestionVersion yang sudah ada, **jangan membuat question
baru**.

Package dan composition digunakan untuk menentukan selection.

## 3.4 Historical Data Is Immutable

Jangan menghapus atau mengubah:

-   AssessmentAttempt historis
-   AttemptQuestion historis
-   hasil/scoring historis
-   QuestionVersion yang sudah digunakan attempt historis

Perubahan runtime harus menggunakan konfigurasi/package/version baru
bila memang diperlukan.

## 3.5 Backward Compatibility

Perubahan baru tidak boleh merusak:

-   FREE
-   RIASEC
-   DISC
-   EQ
-   COGNITIVE
-   Business Leads
-   PDF generation
-   Email delivery
-   WhatsApp integration

yang sudah berjalan.

------------------------------------------------------------------------

# 4. Development Rules

## Rule 1 --- Local First

Mulai V18.4 dan seterusnya:

``` text
LOCAL
  ↓
IMPLEMENT
  ↓
TYPECHECK
  ↓
BUILD
  ↓
TEST
  ↓
REGRESSION
  ↓
USER VALIDATION
  ↓
ONLY THEN release/deployment
```

Tidak melakukan perubahan production sebagai metode debugging utama.

## Rule 2 --- GitHub Paused

Untuk rangkaian V18.x ini:

-   Jangan push ke GitHub.
-   Jangan merge branch.
-   Jangan menggunakan GitHub sebagai tempat integrasi sementara.
-   Source of work berada di local repository.

GitHub baru digunakan setelah seluruh scope V18.x selesai dan user
menyatakan siap release.

## Rule 3 --- No Blind Patching

Jika test gagal:

1.  Cari root cause.
2.  Identifikasi file/source yang bertanggung jawab.
3.  Perbaiki source.
4.  Jalankan regression.
5.  Jangan melakukan patch acak terhadap database atau UI hanya untuk
    membuat test hijau.

## Rule 4 --- Production Data Is Not Local Data

Untuk pengembangan local, data local boleh berbeda.

Production tidak boleh diasumsikan identik dengan local.

Jika diperlukan rekonsiliasi production, lakukan sebagai aktivitas
deployment/release terpisah setelah local PASS.

## Rule 5 --- Database Changes

Setiap perubahan schema/data harus jelas:

-   tujuan,
-   tabel yang terdampak,
-   apakah historical data terdampak,
-   rollback strategy,
-   verification query.

Tidak melakukan destructive migration tanpa alasan yang jelas.

## Rule 6 --- No New Question Unless Required

Jangan membuat Question atau QuestionVersion baru hanya karena
konfigurasi/package bermasalah.

Pertama periksa:

1.  existing QuestionVersion,
2.  taxonomy,
3.  package,
4.  composition,
5.  runtime selector.

## Rule 7 --- Do Not Claim PASS Prematurely

Status hanya boleh:

-   NOT STARTED
-   IN PROGRESS
-   BLOCKED
-   FIXED --- awaiting validation
-   PASS --- validated

PASS berarti sudah benar-benar divalidasi sesuai gate yang ditentukan.

------------------------------------------------------------------------

# 5. V18.4 --- WhatsApp Integration Recovery & Hardening

## Objective

Memulihkan dan menstabilkan WhatsApp integration setelah nomor WhatsApp
yang digunakan sebelumnya dihapus dari Meta.

## Scope

### A. Meta Configuration

Periksa dan konfigurasi ulang:

-   WhatsApp Business Account
-   Phone Number ID
-   Access Token
-   WABA configuration
-   Webhook
-   webhook verification
-   outbound messaging configuration

### B. Application Configuration

Audit penggunaan:

-   WhatsApp credentials
-   environment variables
-   phone number ID
-   template/message configuration
-   webhook endpoint
-   outbound service

### C. Error Handling

WhatsApp failure tidak boleh menyebabkan:

-   Business Lead gagal dibuat
-   assessment result hilang
-   PDF gagal dibuat
-   email gagal dikirim

Status delivery harus tetap tercatat secara terpisah.

### D. Idempotency

Pastikan mekanisme idempotency V18.1 tetap bekerja.

Tidak boleh terjadi duplicate outbound message karena retry.

### E. Regression

Minimum flow:

``` text
FREE Assessment
  ↓
Result
  ↓
Business Lead
  ↓
PDF
  ↓
Email
  ↓
WhatsApp
```

## V18.4 Done When

-   Local WhatsApp integration dapat dikonfigurasi.
-   Outbound test berhasil.
-   Failure handling tervalidasi.
-   Idempotency tervalidasi.
-   Business Lead flow tetap PASS.
-   PDF tetap PASS.
-   Email tetap PASS.
-   Assessment runtime tidak berubah.
-   No regression pada V18.3 baseline.

------------------------------------------------------------------------

# 6. V18.5 --- Runtime & Delivery Regression Hardening

## Objective

Melakukan regression menyeluruh setelah perbaikan WhatsApp tanpa
memperluas feature scope.

## Scope

### Assessment Runtime

Validasi:

-   FREE --- 10
-   RIASEC --- 60
-   DISC --- 80
-   EQ --- 50
-   COGNITIVE --- 40

Untuk setiap assessment:

``` text
Start
→ Question Selection
→ Attempt
→ Submission
→ Scoring
→ Result
```

### Business Flow

Validasi:

``` text
Customer
→ Assessment
→ Result
→ Lead
→ PDF
→ Email
→ WhatsApp
```

### Admin

Validasi:

-   Assessment Configuration
-   Question Bank
-   Review & Publishing
-   Business Leads
-   WhatsApp Inbox
-   Audit Trail

### Data Integrity

Pastikan:

-   no duplicate attempt
-   no missing result
-   no orphan package
-   no invalid composition
-   no historical mutation

## V18.5 Done When

Semua core runtime flow PASS di local tanpa regression.

------------------------------------------------------------------------

# 7. V18.6 --- Release Readiness & Deployment Preparation

## Objective

Menutup rangkaian V18.x dan menyiapkan release yang tervalidasi.

## Scope

### Architecture Review

Review:

-   assessment runtime
-   package runtime
-   configuration
-   WhatsApp integration
-   lead flow
-   delivery flow
-   error handling
-   database changes

### Validation

Minimum:

``` text
pnpm install
pnpm typecheck
pnpm build
```

ditambah seluruh regression/test gate yang relevan.

### Deployment Preparation

Siapkan:

-   migration
-   environment requirements
-   deployment steps
-   rollback plan
-   verification queries
-   production smoke test

### GitHub

GitHub **baru dibuka kembali pada tahap ini**, setelah:

1.  V18.4 PASS
2.  V18.5 PASS
3.  V18.6 local validation PASS
4.  User menyatakan siap release

------------------------------------------------------------------------

# 8. Phase Boundary

Tidak membuat phase tambahan hanya untuk pekerjaan kecil.

Struktur V18.x dikunci menjadi:

``` text
V18.3  CLOSED
   ↓
V18.4  WhatsApp Recovery & Hardening
   ↓
V18.5  Runtime & Delivery Regression
   ↓
V18.6  Release Readiness
   ↓
RELEASE
```

Jika ditemukan bug selama sebuah phase, bug tersebut diperbaiki **di
dalam phase yang sedang berjalan** selama masih berada dalam scope.

Tidak membuat V18.4.1, V18.4.2, V18.4.3 hanya untuk perubahan internal
kecil.

------------------------------------------------------------------------

# 9. Change Control

Setiap perubahan harus menjawab:

1.  Apa masalahnya?
2.  Apa root cause-nya?
3.  File/source mana yang bertanggung jawab?
4.  Apa perubahan yang dilakukan?
5.  Apa dampaknya?
6.  Bagaimana cara memverifikasinya?
7.  Apa regression yang harus dijalankan?

Tidak melakukan perubahan hanya berdasarkan asumsi.

------------------------------------------------------------------------

# 10. Current Status

  Phase            Status
  ---------------- -------------------------------------
  V18.3            CLOSED / Production Functional PASS
  V18.4            NOT STARTED
  V18.5            NOT STARTED
  V18.6            NOT STARTED
  GitHub Release   PAUSED

------------------------------------------------------------------------

# 11. Immediate Next Step

Mulai dari **local repository**.

Tidak melakukan deployment.

Tidak melakukan push GitHub.

Tidak mengubah production.

Langkah pertama V18.4:

> **Audit source code WhatsApp integration dan identifikasi seluruh
> configuration boundary yang berkaitan dengan Meta WhatsApp sebelum
> melakukan perubahan apa pun.**

Setelah root cause dan scope V18.4 dikunci, baru implementasi dilakukan.

------------------------------------------------------------------------

# 12. Final Working Agreement

Untuk V18.x:

> **Local first. Root cause first. Minimal phase. No blind patch. No
> unnecessary data mutation. No GitHub until everything is validated.**

Production V18.3 menjadi baseline.

V18.4--V18.6 menjadi satu rangkaian pekerjaan terkontrol sampai
ReadyScore siap release berikutnya.
