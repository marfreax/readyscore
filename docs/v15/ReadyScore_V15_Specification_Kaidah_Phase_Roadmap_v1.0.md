# ReadyScore V15
## Personalized Profile, Major Recommendation, 30-Day Action Plan & 20+ Page Report
### Production Specification, Kaidah, Phase Order & Acceptance Gates

**Version:** 1.0  
**Date:** 2026-09-09  
**Status:** DEVELOPMENT ROADMAP — V15 SERIES

---

# 1. Purpose

V15 adalah layer interpretasi dan customer deliverable di atas assessment production ReadyScore V13 dan commercial/customer-delivery system V14.

V15 wajib memenuhi **tiga product promises**:

1. **Laporan personal 20+ halaman bahasa orang tua**
2. **Rekomendasi 5–7 jurusan + alasan cocok**
3. **Action plan 30 hari siap pakai**

Landing page secara eksplisit menampilkan ketiga benefit tersebut, termasuk “Laporan personal 20+ halaman bahasa orang tua”, “Rekomendasi 5-7 jurusan + alasan cocok”, dan “Action plan 30 hari siap pakai”. fileciteturn49file2 fileciteturn49file6

V15 bukan assessment engine baru.

Tujuan V15:

> **Mengubah frozen assessment result menjadi personalized decision-support product yang dapat dipahami orang tua, memberikan arah jurusan yang dapat dijelaskan, dan menghasilkan langkah eksplorasi 30 hari yang konkret.**

---

# 2. Frozen Baseline

V15 wajib mengonsumsi:

- V13.10 frozen assessment baseline;
- V14 frozen commercial/customer-delivery baseline.

Production assessment target tetap:

| Assessment | Questions | Maximum Time |
|---|---:|---:|
| RIASEC | 60 | 20 menit |
| DISC | 80 | 20 menit |
| EQ | 50 | 20 menit |
| Cognitive / IQ | 40 | 20 menit |

V15 **tidak boleh** mengubah secara casual:

- question count;
- question package;
- package selection;
- frozen question sequence;
- answer persistence;
- resume semantics;
- timer;
- timeout behavior;
- scoring engine;
- measurement model;
- result semantics;
- payment;
- fulfillment;
- entitlement;
- assessment access contract.

Jika perubahan terhadap baseline tersebut benar-benar diperlukan, harus dibuat sebagai amendment/phase terpisah.

---

# 3. Product Promise → Product Capability

V15 wajib memetakan marketing promise ke capability nyata:

| Promise | Required Capability |
|---|---|
| Laporan personal 20+ halaman | Personalized report generator |
| Bahasa orang tua | Parent-friendly interpretation layer |
| 5–7 jurusan | Deterministic major matching + ranking |
| Alasan cocok | Explainable recommendation engine |
| Action plan 30 hari | Personalized action-plan engine |
| 4 Test & Profiling | Integrated four-dimension profile |

Tidak boleh ada promise yang hanya berupa copy tanpa implementation capability.

---

# 4. Core Product Chain

```text
V13 FROZEN RESULTS
        ↓
INTEGRATED PERSONAL PROFILE
        ↓
PARENT-FRIENDLY INTERPRETATION
        ↓
MAJOR MATCHING
        ↓
5–7 RECOMMENDATIONS
        ↓
WHY EACH MAJOR FITS
        ↓
CAUTION / VALIDATION SIGNALS
        ↓
30-DAY ACTION PLAN
        ↓
20+ PAGE PERSONALIZED REPORT
        ↓
CUSTOMER REPORT EXPERIENCE
```

Tiga output utama bukan tiga produk terpisah. Mereka adalah satu decision-support flow.

---

# 5. Scope

## 5.1 Included

V15 mencakup:

- result-to-profile interpretation;
- integrated four-dimension profile;
- parent-friendly narrative;
- strengths interpretation;
- development/growth interpretation;
- learning/work-style interpretation;
- cross-dimension synthesis;
- Major Knowledge Base;
- major matching;
- major ranking;
- 5–7 recommendations;
- recommendation reasons;
- supporting signals;
- caution/mismatch signals;
- related career directions;
- exploration guidance;
- personalized 30-day action plan;
- personalized report composition;
- 20+ page report;
- report versioning;
- report persistence/generation;
- customer report access/experience;
- V13 regression;
- V14 regression;
- real-environment E2E.

## 5.2 Explicitly Excluded

V15 bukan fase untuk:

- mengganti scoring model;
- mengubah psychometric measurement;
- adaptive testing;
- mengubah question bank;
- mengubah package composition;
- mengubah timer;
- mengubah assessment lifecycle;
- mengubah payment gateway;
- mengubah checkout;
- mengubah fulfillment;
- mengubah entitlement semantics;
- membangun CRM;
- WhatsApp campaign;
- email marketing;
- subscription billing;
- unrelated analytics;
- broad unrelated UI redesign.

---

# 6. Interpretation ≠ Scoring

V13:

```text
answers
  ↓
score
  ↓
frozen result
```

V15:

```text
frozen result
  ↓
profile signals
  ↓
interpretation
  ↓
recommendation
  ↓
action plan
  ↓
report
```

V15 tidak boleh:

- mengubah score;
- menghitung ulang score sebagai pengganti V13;
- mengubah result semantics;
- mengubah frozen result karena interpretation.

Matching score/recommendation score adalah **interpretation/business logic**, bukan psychometric assessment score.

---

# 7. Four-Dimension Integration

V15 harus mengintegrasikan empat assessment:

- **RIASEC** — interest/preference direction;
- **DISC** — work/behavior style;
- **EQ** — emotional/context profile;
- **Cognitive / IQ** — cognitive/learning profile.

Konseptual:

```text
RIASEC
   +
DISC
   +
EQ
   +
Cognitive
   ↓
Integrated Profile
```

Recommendation tidak boleh dibuat seolah-olah hanya satu dimensi yang menentukan masa depan anak.

---

# 8. Integrated Personal Profile

V15 harus menghasilkan profile synthesis yang menjawab secara mudah dipahami:

- Anak cenderung tertarik pada apa?
- Bagaimana ia cenderung bekerja/berkolaborasi?
- Bagaimana kondisi emosional/contextual dapat memengaruhi pengalaman belajar/kerja?
- Bagaimana ia cenderung belajar dan berpikir?
- Lingkungan seperti apa yang mungkin lebih mendukung?
- Apa kombinasi kekuatan yang terlihat?
- Apa area yang perlu dikembangkan?

Output harus berasal dari frozen results dan interpretation rules yang dapat ditelusuri.

---

# 9. Parent-Friendly Language

Report utama harus menggunakan bahasa Indonesia natural dan mudah dipahami.

Prinsip:

```text
Assessment Data
      ↓
Interpretation
      ↓
Practical Meaning
```

Hindari menjadikan kode seperti RIASEC/DISC/EQ sebagai bahasa utama customer.

Contoh prinsip:

```text
Jangan:
"Profil anak adalah SI."

Lebih baik:
"Anak Anda cenderung menikmati aktivitas yang melibatkan orang lain,
namun tetap membutuhkan ruang untuk memahami dan menganalisis masalah."
```

Contoh tersebut hanya style principle. Isi final harus berasal dari result dan rule yang benar.

---

# 10. Major Knowledge Base

Major recommendation wajib berasal dari curated knowledge base.

Minimal conceptual structure:

```text
Major
├── id
├── name
├── category
├── description
├── RIASEC affinity
├── DISC / work-style affinity
├── Cognitive affinity
├── EQ/context considerations
├── related careers
├── explanation templates
└── caution signals
```

Major KB harus memiliki explicit version.

Contoh:

```text
MAJOR_KB_V1
```

Perubahan mapping harus menghasilkan version baru bila berdampak pada historical interpretation.

---

# 11. Major Matching Engine

Matching engine adalah interpretation/business logic.

Pipeline:

```text
Frozen Result
      ↓
Profile Signals
      ↓
Major Compatibility Evaluation
      ↓
Candidate Ranking
      ↓
Top 5–7
      ↓
Explanation
      ↓
Caution / Validation
```

Matching dapat mempertimbangkan:

```text
RIASEC fit
+ DISC/work-style fit
+ Cognitive fit
+ EQ/context fit
+ cross-dimension coherence
+ caution signals
```

Bobot dan formula final harus dibekukan dalam V15.1.

Wajib:

- deterministic;
- explainable;
- testable;
- versioned;
- auditable.

Tidak boleh random.

---

# 12. Recommendation Contract

Setiap recommendation minimal memiliki:

```text
{
  major,
  rank,
  matchSignal,
  whyItFits,
  supportingSignals,
  cautionSignals,
  relatedCareers,
  explorationActions
}
```

`matchSignal` bukan pengganti assessment score.

System harus dapat menjawab:

> Mengapa jurusan ini direkomendasikan untuk profil ini?

---

# 13. Recommendation Count

Customer-facing target:

**5–7 recommendations.**

Engine boleh mengevaluasi kandidat lebih banyak secara internal.

Final output harus memilih 5–7 recommendation yang paling defensible.

Jika hasil tidak cukup untuk menghasilkan 5–7 recommendation yang valid:

- jangan mengarang;
- jangan mengulang major;
- jangan membuat recommendation tanpa supporting signal;
- tampilkan failure/qualification state yang eksplisit.

---

# 14. Action Plan 30 Hari

## 14.1 Status

**Action Plan 30 hari adalah first-class V15 output.**

Bukan filler dan bukan generic appendix.

## 14.2 Purpose

Action plan menjawab:

> **“Setelah mengetahui profil dan rekomendasi ini, apa yang sebaiknya dilakukan anak dan orang tua selama 30 hari ke depan?”**

## 14.3 Input

Action plan harus dapat menggunakan:

```text
Integrated Profile
      +
Top Major Recommendations
      +
Caution / Validation Signals
      +
Exploration Needs
```

## 14.4 Required Characteristics

Action plan harus:

- personalized;
- practical;
- actionable;
- connected to recommendations;
- suitable for child/parent collaboration;
- structured across 30 days;
- designed for exploration/validation, bukan memaksa keputusan final.

Contoh struktur:

```text
WEEK 1 — Kenali Diri & Pilihan
WEEK 2 — Validasi Jurusan
WEEK 3 — Bandingkan & Eksplor
WEEK 4 — Shortlist & Next Step
```

Isi tiap minggu harus diturunkan dari profile dan recommendation, bukan satu template identik untuk semua customer.

---

# 15. 20+ Page Personalized Report

Report wajib menghasilkan:

**lebih dari 20 halaman meaningful content.**

Page count tidak boleh dicapai dengan:

- repeated paragraphs;
- blank pages;
- artificial page breaks tanpa substantive content;
- generic filler.

## Required Content Areas

Minimum content:

1. Cover
2. Cara membaca laporan
3. Executive summary
4. Personal profile snapshot
5. Interest profile
6. Interest interpretation
7. Work/behavior style
8. Work-style interpretation
9. Emotional profile
10. Emotional interpretation
11. Cognitive/learning profile
12. Learning interpretation
13. Integrated four-dimension profile
14. Strengths
15. Development areas
16. Learning/work environment guidance
17. Major recommendation overview
18. Detailed recommendation #1
19. Detailed recommendation #2
20. Detailed recommendation #3
21. Detailed recommendation #4
22. Detailed recommendation #5
23. Recommendation #6/#7 when applicable
24. Related career directions
25. Exploration guidance
26. Parent discussion guide
27. Personalized 30-day action plan
28. Closing summary

Actual pagination/layout boleh berbeda, tetapi final output harus >20 pages dan substantively personalized.

---

# 16. Personalization Rule

Setiap report wajib menunjukkan personalization pada sekurang-kurangnya:

- executive summary;
- integrated profile;
- strengths;
- development areas;
- major ranking;
- reasons for fit;
- caution signals;
- action plan.

Dua customer dengan profile yang berbeda tidak boleh menerima report yang pada substansi sama.

---

# 17. Explainability & Evidence Trail

Setiap recommendation harus dapat ditelusuri:

```text
Recommendation
   ↓
Supporting Signals
   ↓
Matching Rules
   ↓
Explanation
```

Contoh internal evidence:

```text
Major: Psychology
Supporting:
- Social affinity
- Investigative affinity
- verbal/cognitive support
- collaborative work-style compatibility

Caution:
- requires sustained reading/academic discipline
```

Contoh tersebut hanya ilustrasi struktur, bukan fixed production rule.

---

# 18. Determinism

Untuk:

```text
same frozen result
+
same interpretation version
+
same major KB version
+
same report template version
```

system harus menghasilkan output equivalent/deterministic.

Tidak boleh ada random major selection.

Jika AI/LLM digunakan di masa depan, ia hanya boleh menjadi auxiliary wording layer yang dibatasi oleh deterministic source data dan validation. AI tidak boleh menjadi sumber utama ranking/fakta tanpa controlled rules.

---

# 19. Versioning

Generated report harus dapat ditelusuri terhadap:

- assessment result version;
- interpretation version;
- major KB version;
- action-plan rule version;
- report template version.

Conceptual:

```text
Report
├── resultVersion
├── interpretationVersion
├── majorKnowledgeVersion
├── actionPlanVersion
├── templateVersion
└── generatedAt
```

Historical report tidak boleh berubah diam-diam karena KB/template/rule baru.

---

# 20. Customer Experience

V15 harus memperpanjang V14:

```text
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
4 ASSESSMENTS
   ↓
V13 RESULTS
   ↓
V15 INTERPRETATION
   ↓
RECOMMENDATIONS
   ↓
ACTION PLAN
   ↓
20+ PAGE REPORT
```

Customer harus dapat mengakses hasil/report setelah assessment selesai.

Jika report generation asynchronous:

```text
GENERATING
READY
FAILED
```

Retry harus aman dan idempotent.

---

# 21. Persistence & Regeneration

Jika report disimpan:

```text
same result + same versions
→ same report
```

Regeneration tidak boleh:

- membuat duplicate report yang tidak terkontrol;
- mengubah historical output secara silent;
- merusak V13 result;
- mengubah entitlement.

Jika generation gagal:

- failure tercatat;
- retry aman;
- report parsial tidak boleh berstatus READY.

---

# 22. Professional / Marketing Claim Boundary

Engineering tidak boleh menciptakan bukti profesional.

Klaim seperti:

- “disusun oleh tim psikolog & konselor pendidikan”;
- “standar internasional yang dipakai universitas top dunia”;

hanya boleh diperlakukan sebagai product truth jika business/process memiliki dasar dan otorisasi untuk klaim tersebut.

V15 wajib membangun capability, bukan memalsukan professional validation.

---

# 23. Regression Rule

V15 tidak boleh merusak V13 maupun V14.

## V13 minimum regression

- RIASEC 60;
- DISC 80;
- EQ 50;
- Cognitive 40;
- package selection;
- frozen sequence;
- answer persistence;
- submit;
- timeout;
- result persistence;
- post-expiry rejection.

## V14 minimum regression

- product/access;
- checkout;
- payment creation;
- server-side payment verification;
- webhook handling;
- fulfillment;
- entitlement;
- access validation;
- owned/consumed behavior.

V15 changes must not alter assessment scoring/result semantics or commercial access semantics.

---

# 24. Evidence Rule

Tidak ada phase yang dianggap PASS hanya karena:

- build berhasil;
- typecheck berhasil;
- unit test berhasil.

PASS harus memiliki evidence sesuai phase.

Untuk customer-facing V15, evidence minimum mencakup:

- real HTTP;
- real database;
- completed four assessments;
- real frozen result;
- integrated profile;
- 5–7 recommendation output;
- reason-for-fit;
- personalized 30-day action plan;
- 20+ meaningful pages;
- customer report access;
- V13 regression;
- V14 regression.

---

# 25. Phase Strategy — ONLY 2 PHASES

V15 sengaja dibatasi menjadi **dua phase**.

Jangan memecahnya menjadi banyak phase kecil.

---

## V15.1 — Interpretation, Major Matching, Action Plan & Report Engine

### Objective

Membangun seluruh core engine untuk tiga promises V15.

### Scope

- inspect/reuse existing result adapters;
- inspect any existing major-fit/career-exploration code;
- define integrated profile contract;
- parent-friendly interpretation rules;
- Major KB V1;
- deterministic major matching;
- recommendation ranking;
- 5–7 recommendations;
- explanation/caution engine;
- personalized 30-day action-plan engine;
- report content model;
- 20+ page report generation;
- versioning;
- persistence/regeneration logic where needed;
- automated/static validation.

### Exit Criteria

V15.1 harus dapat:

1. consume real frozen V13 result;
2. produce integrated profile;
3. produce 5–7 defensible recommendations;
4. explain each recommendation;
5. produce personalized 30-day action plan;
6. produce >20 meaningful report pages;
7. preserve original V13 result unchanged;
8. pass typecheck/build/tests;
9. record evidence.

V15.1 belum menjadi full customer launch gate. Customer E2E berada di V15.2.

---

## V15.2 — Customer Report Experience & Full E2E

### Objective

Membuat seluruh output V15 benar-benar tersedia sebagai customer product.

### Scope

- customer-facing report/result experience;
- report readiness state;
- report access;
- rendering/download if selected;
- integration with V14 journey;
- assessment completion → result → report flow;
- recommendation display;
- action plan display;
- V13 regression;
- V14 regression;
- real HTTP/database validation;
- real personalized report validation;
- launch-readiness evidence.

### Exit Criteria

Real customer dapat:

```text
BUY
 ↓
GET ACCESS
 ↓
COMPLETE 4 ASSESSMENTS
 ↓
GET V13 RESULTS
 ↓
GET PERSONALIZED REPORT
 ↓
SEE 5–7 MAJORS
 ↓
UNDERSTAND WHY
 ↓
GET 30-DAY ACTION PLAN
```

tanpa engineering intervention pada normal path.

---

# 26. No Third Phase by Default

V15 hanya memiliki:

- **V15.1**
- **V15.2**

Jangan membuat V15.3 untuk:

- minor UI fixes;
- copy changes;
- report layout tweaks;
- mapping corrections;
- test fixes;
- ordinary bug fixes.

Semua tetap di phase yang sedang dikerjakan.

V15.3 hanya boleh dibuat jika ditemukan domain boundary independen yang benar-benar tidak dapat ditangani aman di V15.1/V15.2.

---

# 27. Change-Control Rule

Setelah phase PASS/FROZEN:

- jangan casual change contract;
- phase berikutnya mengonsumsi frozen output;
- regression failure harus diselidiki;
- perubahan domain besar memerlukan amendment/phase baru;
- V13/V14 contracts tetap protected.

---

# 28. Final Acceptance Matrix

| Capability | Required |
|---|---|
| V13 integrity | PASS |
| Integrated four-dimension profile | PASS |
| Parent-friendly interpretation | PASS |
| Major Knowledge Base | PASS |
| Deterministic matching | PASS |
| 5–7 recommendations | PASS |
| Recommendation reasons | PASS |
| Caution signals | PASS |
| Personalized 30-day action plan | PASS |
| 20+ meaningful report pages | PASS |
| Report versioning | PASS |
| Customer report access | PASS |
| V13 regression | PASS |
| V14 regression | PASS |
| Real HTTP/DB E2E | PASS |
| No engineering intervention | PASS |

---

# 29. Final V15 Principle

V13 proved:

> **ReadyScore can assess a customer correctly.**

V14 proved:

> **ReadyScore can sell and deliver the assessment correctly.**

V15 must prove:

> **ReadyScore can turn assessment results into a personalized decision-support product that tells parents what the profile means, where the child may fit, why those directions fit, and what to do next.**

Final chain:

```text
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
4 ASSESSMENTS
   ↓
V13 RESULT
   ↓
INTEGRATED PROFILE
   ↓
5–7 MAJOR RECOMMENDATIONS
   ↓
REASONS
   ↓
30-DAY ACTION PLAN
   ↓
20+ PAGE PERSONALIZED REPORT
```

**V15 = Personalized Profile + 5–7 Major Recommendations + Reasons + 30-Day Action Plan + 20+ Page Personalized Report.**

---

# 30. First Implementation Guardrail

Langkah pertama V15.1 wajib berupa inspection terhadap codebase existing untuk menemukan dan mengevaluasi:

- existing result adapters;
- existing interpretation engine;
- existing major-fit engine;
- existing career-exploration engine;
- existing major mappings;
- current result contracts;
- existing report components;
- historical validators/scripts related to major fit.

File/engine yang sudah ada tidak boleh langsung dianggap production-ready hanya karena namanya sesuai.

**Reuse where correct. Replace/extend where necessary. Do not duplicate blindly.**

---

# 31. Definition of Done

V15 DONE hanya jika tiga promise berikut benar-benar terpenuhi secara teknis:

### Promise 1
**20+ halaman personalized report dalam bahasa yang mudah dipahami orang tua.**

### Promise 2
**5–7 rekomendasi jurusan yang dapat ditelusuri dan disertai alasan mengapa cocok.**

### Promise 3
**Action plan 30 hari yang personalized dan dapat langsung digunakan.**

Ketiganya harus muncul dari frozen assessment result dan tersedia kepada customer melalui V14 customer journey.

**No marketing-only promise. No filler. No fabricated recommendation. No hidden scoring change.**
