# ReadyScore — Product Development Specification, Architecture, Rules & Phase Roadmap

**Status:** LOCKED AS WORKING AGREEMENT  
**Baseline:** V18.3 Production Baseline — CLOSED  
**Development Mode:** Local-first  
**GitHub:** PAUSED until the agreed V19–V21 work is validated  
**Last Updated:** 2026-09-29

---

## 1. Purpose

Dokumen ini menjadi kontrak kerja pengembangan ReadyScore setelah V18.3.

Fokus utama:

1. memperluas jenis assessment;
2. menyempurnakan reporting layer;
3. membangun Profile / Cross-Test Evidence;
4. menyelaraskan commercial model setelah ReadyScore menjadi 6 assessment;
5. membangun Career Advisor;
6. menyelesaikan integrasi WhatsApp setelah dependency Meta siap.

Prinsip utama:

> **Jangan memperluas scope tanpa kebutuhan yang jelas dan jangan mengubah baseline yang sudah PASS tanpa alasan yang terbukti.**

---

# 2. Current Product Assessment Types

ReadyScore memiliki 6 assessment types setelah V19:

1. **RIASEC** — minat karier
2. **DISC** — kecenderungan perilaku
3. **EQ** — kecenderungan emosional
4. **Cognitive** — kemampuan kognitif
5. **Work Attitude** — kecenderungan sikap kerja
6. **Learning Preference** — kecenderungan/preferensi belajar

Target V19:

> **6 assessment types**

---

# 3. Core Architecture Principle

Setiap assessment mengikuti architecture/pipeline ReadyScore yang sudah ada.

### Standard Assessment Pipeline

```text
Question
   ↓
Question Type
   ↓
Question Package
   ↓
Configuration
   ↓
Assessment Runtime
   ↓
Scoring
   ↓
Result
   ↓
Report
```

Prinsip:

- Reuse architecture yang sudah PASS.
- Jangan membuat runtime khusus tanpa alasan kuat.
- Question Type memiliki taxonomy/scoring/selection yang jelas.
- Package dan configuration dapat diverifikasi secara independen.
- Runtime konsisten dengan assessment existing.
- Database migration hanya jika benar-benar diperlukan.
- Semua perubahan regression-aware terhadap baseline.

---

# 4. Identity & Multi-Child Architecture

## 4.1 Prinsip Utama

ReadyScore harus membedakan:

> **Account Owner ≠ Assessment Subject**

Target penggunaan:

> **1 Account Parent → multiple Child Profiles → masing-masing memiliki assessment, entitlement, result, dan report sendiri.**

Satu account boleh digunakan secara paralel oleh beberapa child/device/session.

---

## 4.2 Account

**Account** adalah pemilik/login/pengelola account.

Account-level data meliputi:

- authentication;
- account profile;
- family/child management;
- order;
- payment;
- billing;
- account-level notification.

Account **bukan otomatis** subject assessment.

---

## 4.3 Subject / Child Profile

**Subject Profile** adalah orang yang benar-benar mengikuti assessment.

Contoh:

```text
ACCOUNT
Parent: Sarah
│
├── SUBJECT: Andi
├── SUBJECT: Budi
└── SUBJECT: Citra
```

Semua assessment harus memiliki subject yang jelas.

---

## 4.4 Assessment Ownership

Assessment ownership harus mengikuti:

```text
Account
   ↓
Subject Profile
   ↓
Entitlement
   ↓
Assessment Attempt
   ↓
Result
   ↓
Report
```

Bukan:

```text
Account
   ↓
Assessment
   ↓
Result
```

---

# 5. Subject Isolation Rules

Semua state assessment yang menyangkut individu harus **subject-scoped**.

| Area | Scope |
|---|---|
| Authentication | Account |
| Account profile | Account |
| Child profile | Subject |
| Assessment entitlement | Subject |
| Active assessment attempt | Subject |
| Completed assessment | Subject |
| Same-day validation | Subject |
| Reassessment credit | Subject |
| Result | Subject |
| Web report | Subject / Attempt |
| PDF report | Subject / Attempt |
| Assessment history | Subject |
| Assessment progress | Subject |
| Assessment answers | Subject / Attempt |
| Profile / evidence | Subject |

Hal yang memang account-level tetap berada di Account:

- Order
- Payment
- Billing
- Account management

Hal yang membutuhkan context harus membawa:

```text
Account + Subject + Attempt
```

jika relevan.

---

# 6. Parallel Assessment Rule

Satu account boleh digunakan oleh beberapa subject secara bersamaan.

Contoh valid:

```text
Sarah
│
├── Andi → DISC → Attempt A
│
└── Budi → DISC → Attempt B
```

Kedua attempt **harus dapat berjalan bersamaan**.

Active attempt tidak boleh dicari hanya berdasarkan:

```text
accountId + assessmentType
```

Tetapi harus menggunakan subject context:

```text
subjectProfileId + assessmentType
```

---

# 7. Same-Day / Retake Validation

Rule existing:

> Satu subject tidak boleh mengambil assessment type yang sama lebih dari sekali pada hari yang sama sesuai aturan retake yang berlaku.

Scope validasi:

```text
subjectProfileId
+
assessmentType
+
assessment date
```

**Bukan:**

```text
accountId
+
assessmentType
+
assessment date
```

Contoh:

| Account | Subject | Test | Hari sama | Status |
|---|---|---|---|---|
| Sarah | Andi | DISC | Ya | Boleh untuk attempt pertama |
| Sarah | Budi | DISC | Ya | Boleh untuk attempt pertama |
| Sarah | Andi | DISC | Sudah selesai hari itu | Block sesuai same-day rule |
| Sarah | Budi | DISC | Sudah selesai hari itu | Block sesuai same-day rule |

Andi melakukan DISC tidak boleh memblokir Budi.

---

# 8. Entitlement & Subscription Model

## 8.1 Prinsip

Parent/account dapat melakukan pembelian.

Namun assessment entitlement dialokasikan kepada **Subject**.

```text
ACCOUNT
   ↓
ORDER
   ↓
PAYMENT
   ↓
ENTITLEMENT ALLOCATION
   ↓
SUBJECT
```

Contoh:

```text
Sarah
│
├── Andi → ADVANCE
└── Budi → Single DISC
```

Andi tidak otomatis memberikan entitlement kepada Budi.

---

## 8.2 Multi-Child Checkout

Satu order boleh berisi beberapa subject:

```text
ORDER
│
├── Andi → ADVANCE
├── Budi → ADVANCE
└── Citra → DISC
```

Tetapi entitlement tetap terisolasi per subject.

---

## 8.3 Existing Customer Protection

Perubahan commercial catalog tidak boleh secara otomatis mengubah entitlement yang sudah dibeli customer.

Existing production data dianggap protected.

---

# 9. Reassessment Credit

Reassessment credit harus subject-scoped.

Contoh:

```text
Andi → DISC credit = 1
Budi → DISC credit = 0
```

Credit Andi tidak dapat digunakan oleh Budi.

Credit lookup tidak boleh hanya bergantung pada account jika model credit tersebut sebenarnya milik subject.

---

# 10. Result & Report Identity

Result dan report harus mengikuti identity dari assessment attempt.

Chain:

```text
Attempt
   ↓
Subject Profile
   ↓
Result
   ↓
Web Report / PDF Report
```

**Report tidak boleh mengambil nama peserta hanya dari account/session yang sedang login.**

---

## 10.1 Report Identity Header

Minimal report menampilkan:

```text
READYScore
ASSESSMENT REPORT

Peserta:
Andi Pratama

Assessment:
DISC

Tanggal:
29 September 2026
```

Jika diperlukan untuk parent, Account Owner dapat ditampilkan sebagai metadata tambahan, tetapi:

> **Account Owner bukan "Peserta".**

Web result dan PDF harus menggunakan subject identity yang sama.

---

# 11. Profile / Evidence Isolation

Profile juga harus subject-scoped.

Contoh:

```text
Andi
├── DISC evidence
├── EQ evidence
└── Cognitive evidence

Budi
├── DISC evidence
└── RIASEC evidence
```

Tidak boleh menggabungkan evidence seluruh anak ke dalam satu parent profile.

Prinsip:

> **Evidence, not a single score**

Tidak membuat universal score dari seluruh assessment.

---

# 12. Authorization & Data Isolation

Setiap akses result/report harus memverifikasi ownership chain:

```text
Authenticated Account
        ↓
Subject Profile
        ↓
Attempt
        ↓
Result / Report
```

Minimal harus dipastikan:

```text
subjectProfile.accountId === authenticatedAccount.id
```

Parent hanya dapat mengakses subject yang berada di account tersebut.

Parent tidak boleh mengakses result/report subject dari account lain.

---

# 13. Session / Active Child Context

Jika satu account digunakan pada beberapa device:

```text
Laptop → Andi
Phone  → Budi
```

active child tidak boleh menjadi global state account.

Active subject harus berada pada context/session/request yang sesuai.

Satu device/session dapat berada pada Andi sementara device/session lain berada pada Budi.

---

# 14. V19.1 — Work Attitude

Tujuan:

Menambahkan assessment untuk mengukur kecenderungan sikap kerja.

Konstruk awal:

- Sistematika Kerja
- Pola Berpikir
- Pengambilan Keputusan
- Kerjasama
- Interaksi Sosial
- Penyesuaian Diri
- Kedisiplinan

Work Attitude bukan pengganti DISC.

Output minimal:

- skor/dimensi;
- interpretasi;
- ringkasan;
- report data;
- Profile evidence;
- data untuk kebutuhan V20.

**Status: CLOSED / VALIDATED**

---

# 15. V19.2 — Learning Preference

Tujuan:

Menambahkan assessment untuk mengukur kecenderungan/preferensi belajar.

Konstruk:

- Visual
- Auditory
- Kinesthetic

Terminologi:

> **Learning Preference / Preferensi Belajar**

Hasil merupakan kecenderungan/preferensi, bukan label kemampuan belajar absolut.

Output minimal:

- score;
- percentage;
- dominant preference;
- interpretation;
- summary;
- report data;
- Profile evidence;
- data untuk V20.

**Status: CLOSED / VALIDATED**

---

# 16. V19.3 — Report Adjustment

## Tujuan

Menyesuaikan reporting layer untuk seluruh 6 assessment.

```text
Assessment Result
       │
       ├── Result Page / Web
       ├── Interpretation
       ├── Visualization
       ├── Recommendation
       └── PDF Report
```

V19.3 harus memastikan:

- hasil seluruh assessment tampil benar;
- interpretation konsisten;
- visualization sesuai konstruk;
- Web dan PDF konsisten;
- identity/subject report benar;
- report tidak tertukar antar-child;
- existing assessments tetap regression-safe;
- data Work Attitude dan Learning Preference tersedia untuk V20.

### Non-goal

V19.3 tidak membangun Career Advisor.

### Identity requirement

Setiap report harus jelas mengenai:

```text
Account Owner
Subject / Peserta
Assessment
Attempt
Assessment Date
```

Namun **Peserta/Subject** adalah identity utama report.

---

# 17. V19.4 — Profile Integration / Cross-Test Evidence

V19.4 adalah integration layer.

Assessment sources:

- RIASEC
- DISC
- EQ
- Cognitive
- Work Attitude
- Learning Preference

Architecture:

```text
Assessment Result
       │
       ▼
Profile Evidence Adapter
       │
       ▼
My Profile / Evidence Map
```

Profile domains:

- Ability
- Emotional
- Resilience
- Behavior
- Interest
- Strength
- Learning

Setiap evidence harus memiliki:

- source assessment;
- source dimensions;
- target domain;
- evidence label;
- meaning/strength bila diperlukan;
- provenance;
- aturan jika evidence tidak tersedia.

Domain tanpa evidence:

> **No evidence / Not available**

Bukan score 0.

V19.4 tidak mencakup:

- Career Advisor;
- career recommendation engine;
- WhatsApp;
- assessment Question Type baru.

---

# 18. V19.5 — Commercial, Pricing & Package Alignment

## Tujuan

Karena ReadyScore berubah dari **4 assessment menjadi 6 assessment**, commercial model harus direkonsiliasi secara terpisah.

**V19.5 bukan bagian dari V19.3 Report Adjustment.**

V19.5 menjadi phase khusus untuk:

- pricing;
- commercial catalog;
- package;
- assessment count;
- package composition;
- Single Test;
- Custom Access;
- All Tests;
- ADVANCE;
- entitlement allocation;
- checkout;
- order;
- payment;
- subscription;
- reassessment;
- credit;
- multi-child allocation;
- pricing/access UI;
- admin commercial configuration;
- existing customer protection;
- reconciliation/migration jika benar-benar diperlukan.

---

## 18.1 Six Core Assessments

Commercial catalog harus mengacu pada:

1. Cognitive
2. EQ
3. DISC
4. RIASEC
5. Work Attitude
6. Learning Preference

---

## 18.2 Commercial vs Entitlement

Commercial catalog dan entitlement harus dipisahkan.

```text
6 Assessment
      ↓
Commercial Catalog
      ↓
Package
      ↓
Order / Payment
      ↓
Entitlement Allocation
      ↓
Subject
```

Jumlah assessment dalam katalog tidak boleh diasumsikan sebagai bukti bahwa subject benar-benar memiliki entitlement tersebut.

Actual active entitlement tetap menjadi sumber kebenaran untuk access runtime.

---

## 18.3 Multi-Child Commercial Model

Model:

```text
Parent Account
      ↓
Order / Payment
      ↓
Allocation
      ├── Child A
      ├── Child B
      └── Child C
```

Satu account dapat membeli untuk beberapa child dalam satu order, tetapi entitlement tetap subject-scoped.

---

# 19. V20 — Career Advisor

Career Advisor melakukan synthesis terhadap:

- RIASEC
- DISC
- EQ
- Cognitive
- Work Attitude
- Learning Preference

Assessment tetap menjadi sumber data/profile.

Career Advisor melakukan synthesis dan recommendation.

V20 tidak boleh mengubah makna assessment sumber.

---

# 20. V21 — WhatsApp Integration

Status:

**HOLD — External Dependency**

Scope:

- Meta Cloud API;
- outbound delivery;
- PDF delivery;
- webhook;
- provider error handling;
- idempotency;
- delivery status;
- failure handling;
- Free Assessment regression.

Runtime tetap diarahkan ke Meta Cloud API.

V21 dimulai ketika dependency Meta/WABA dapat divalidasi kembali.

---

# 21. Phase Order

```text
V18.3
Production Baseline
CLOSED
   │
   ▼
V19.1
Work Attitude
CLOSED / VALIDATED
   │
   ▼
V19.2
Learning Preference
CLOSED / VALIDATED
   │
   ▼
V19.3
Report Adjustment
   │
   ▼
V19.4
Profile Integration
   │
   ▼
V19.5
Commercial / Pricing / Package Alignment
   │
   ▼
V20
Career Advisor
   │
   ▼
V21
WhatsApp Integration
```

---

# 22. Development Rules

## 22.1 Local First

Semua development baru dimulai dan divalidasi secara lokal.

Jangan push GitHub sebelum phase selesai divalidasi.

## 22.2 No Premature PASS

Source berubah ≠ PASS.

PASS membutuhkan validation aktual.

## 22.3 Preserve Stable Baseline

V18.3 adalah production baseline.

V19/V20 tidak boleh merusak behavior yang sudah PASS.

## 22.4 No Blind Patching

Jika error:

1. identifikasi root cause;
2. tentukan source/data/configuration/external dependency;
3. patch layer yang terbukti bermasalah;
4. regression test.

## 22.5 Database

- Jangan migration tanpa kebutuhan nyata.
- Schema change harus eksplisit.
- Production data protected.
- Tidak destructive operation tanpa alasan dan verification.

## 22.6 Question Type

Question Type harus memiliki:

- definition;
- taxonomy/dimensions;
- question package;
- selection rules;
- scoring rules;
- result mapping;
- interpretation;
- report mapping.

## 22.7 Report

Setiap perubahan report harus regression-aware terhadap:

- Result Page;
- PDF;
- existing assessment types;
- Free Assessment;
- subject identity;
- multi-child isolation.

## 22.8 Identity Scope

Jangan melakukan lookup assessment state hanya berdasarkan Account jika state tersebut sebenarnya milik Subject.

Audit terutama terhadap:

- active attempt;
- completed assessment;
- same-day validation;
- entitlement;
- reassessment credit;
- result;
- report;
- profile/evidence;
- notification.

## 22.9 Profile

Profile adalah integration layer.

Tidak boleh:

- mengubah source score;
- membuat universal score;
- menganggap missing evidence sebagai zero;
- mencampur evidence antar-subject.

## 22.10 Scope Control

- Career Advisor hanya V20.
- WhatsApp hanya V21.
- Commercial/Pricing/Package Alignment berada di V19.5.
- V19.3 fokus pada reporting.
- V19.4 fokus pada Profile Integration.

---

# 23. Definition of Done

## V19.1

PASS jika:

- Work Attitude tersedia;
- runtime berjalan;
- scoring benar;
- result benar;
- report mapping tersedia;
- existing assessments regression-safe.

## V19.2

PASS jika:

- Learning Preference tersedia;
- Visual/Auditory/Kinesthetic dihitung;
- result benar;
- report mapping tersedia;
- existing assessments regression-safe.

## V19.3

PASS jika:

- Web result benar;
- interpretation benar;
- visualization benar;
- PDF benar;
- identity subject benar;
- multi-child report tidak tertukar;
- assessment existing tidak rusak;
- output V19 siap dikonsumsi V20.

## V19.4

PASS jika:

- My Profile membaca evidence;
- mapping assessment-to-profile eksplisit;
- Work Attitude mapping tervalidasi;
- Learning Preference mapping tervalidasi;
- Evidence Coverage benar;
- missing evidence bukan score 0;
- supporting sources tersedia;
- Profile visualization/data contract berjalan;
- existing assessment/result/report regression-safe;
- evidence antar-subject terisolasi.

## V19.5

PASS jika:

- 6 assessment menjadi commercial baseline;
- package/pricing rules terdokumentasi;
- Single Test/Custom Access/All Tests/ADVANCE konsisten;
- checkout/order/payment konsisten;
- entitlement allocation subject-scoped;
- multi-child purchase berjalan;
- reassessment/credit konsisten;
- existing customer entitlement terlindungi;
- commercial catalog tidak menjadi sumber kebenaran runtime access jika actual entitlement berbeda;
- access/result/report tetap regression-safe.

## V20

PASS jika:

- Career Profile terbentuk;
- Career Advisor synthesis berjalan;
- recommendation layer berjalan;
- existing assessment/runtime/report tidak rusak.

## V21

PASS jika:

- Meta provider dapat diakses;
- outbound text/document berjalan;
- webhook berjalan;
- delivery status tersimpan;
- idempotency berjalan;
- failure handling berjalan;
- Free Assessment delivery regression-safe.

---

# 24. Contract Summary

```text
V18.3 = Stable Production Baseline

V19.1 = Work Attitude
V19.2 = Learning Preference
V19.3 = Report Adjustment
V19.4 = Profile Integration / Cross-Test Evidence
V19.5 = Commercial / Pricing / Package Alignment

V20 = Career Advisor

V21 = WhatsApp Integration
```

### Core Identity Contract

```text
Account Owner
     │
     ├── Subject A
     │      ├── Entitlement
     │      ├── Attempts
     │      ├── Results
     │      ├── Credits
     │      └── Reports
     │
     └── Subject B
            ├── Entitlement
            ├── Attempts
            ├── Results
            ├── Credits
            └── Reports
```

### Core Rule

> **Account owns the family/account. Subject owns the assessment. Attempt owns the result. Report follows the attempt's subject. Entitlement follows the subject.**

### Commercial Rule

> **Parent/account may pay for one or multiple subjects, but purchased assessment access is allocated explicitly to the intended subject.**

### Parallel Use Rule

> **One account may be accessed by multiple subjects/devices in parallel. Assessment state must remain isolated by subject.**

### Same-Day Rule

> **Same-day same-assessment restriction is subject-scoped, not account-scoped.**

---

# 25. Immediate Next Step

Current development direction:

**V19.3 — Report Adjustment**

Before declaring V19.3 complete, audit:

1. Subject identity;
2. Result isolation;
3. Web report isolation;
4. PDF report isolation;
5. Active attempt isolation;
6. Same-day validation scope;
7. Reassessment credit scope;
8. Multi-child access;
9. parallel account usage.

After V19.3:

**V19.4 — Profile Integration**

Then:

**V19.5 — Commercial / Pricing / Package Alignment for the 6-assessment model.**

No Career Advisor before V20.

No WhatsApp before V21.
