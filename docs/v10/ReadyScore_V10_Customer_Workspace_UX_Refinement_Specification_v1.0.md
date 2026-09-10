# ReadyScore V10 --- Customer Workspace UX Refinement

**Version:** 1.0\
**Status:** LOCKED FOR DEVELOPMENT\
**Date:** 2026-09-05\
**Parent Baseline:** ReadyScore V9.15 Final Acceptance / Freeze\
**Scope:** Presentation, UX, Information Architecture, Visualization,
Accessibility, and Report Export

------------------------------------------------------------------------

## 1. Purpose

Dokumen ini adalah **master specification dan development guardrail
ReadyScore V10**.

Tujuan V10:

> **Memperbaiki cara ReadyScore dipahami dan digunakan user tanpa
> membongkar fondasi V9.15 yang sudah frozen.**

V9.15 adalah protected baseline. Actual acceptance menetapkan:

`FROZEN BASELINE: V9.14 + V9.15 ACCEPTANCE/FREEZE BOUNDARY`

V9.15 juga dinyatakan validation-only/freeze-safe dan tidak melakukan
mutation terhadap database, measurement, scoring, question bank, result
semantics, universal score, atau raw-average synthesis.

Referensi V8/V9 mempertahankan prinsip bahwa ReadyScore harus membawa
user dari response → measurement → scoring → result → interpretation →
understanding. V10 hanya memperbaiki lapisan
**understanding/presentation**.

------------------------------------------------------------------------

## 2. Product Objective

V10 adalah:

> **ReadyScore Customer Workspace UX Refinement**

V10 menyelesaikan kebingungan user awam mengenai fungsi:

-   Overview
-   Assessments
-   Results
-   My Profile
-   Reports
-   Activity
-   Access & Plans

Mental model yang harus terbentuk:

  -----------------------------------------------------------------------
  Area                                Pertanyaan user
  ----------------------------------- -----------------------------------
  Overview                            Apa yang sedang terjadi dengan saya
                                      di ReadyScore?

  Assessments                         Tes apa yang bisa saya kerjakan?

  Results                             Apa hasil tes saya?

  My Profile                          Seperti apa gambaran diri saya dari
                                      beberapa tes?

  Reports                             Apa ringkasan hasil saya dan
                                      bagaimana saya menyimpannya sebagai
                                      dokumen?

  Activity                            Apa yang sudah saya lakukan dan apa
                                      yang perlu saya lanjutkan?

  Access & Plans                      Apa yang saya punya dan bagaimana
                                      mendapatkan lebih banyak?
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 3. Non-Negotiable V10 Principles

## 3.1 V9.15 Is Frozen

V10 harus dibuat dari V9.15 sebagai parent baseline.

Jangan mengembangkan V10 dengan mengubah baseline historis V9.15 secara
langsung.

## 3.2 Presentation First

V10 boleh mengubah:

-   layout
-   typography
-   spacing
-   card structure
-   navigation presentation
-   copy
-   CTA presentation
-   status presentation
-   visualization
-   responsive presentation
-   accessibility presentation
-   summary presentation
-   PDF/export presentation

V10 tidak boleh mengubah makna data.

## 3.3 Same Data, Better Presentation

``` text
V9.15 DATA / LOGIC
        ↓
      V10 UI
        ↓
BETTER USER UNDERSTANDING
```

Bukan:

``` text
V9.15 DATA
        ↓
V10 ALTER DATA
        ↓
NEW MEANING
```

------------------------------------------------------------------------

# 4. Explicitly Out of Scope

Kecuali ada scope exception yang disetujui eksplisit, V10 **DILARANG**
mengubah:

-   database migration
-   Prisma schema
-   assessment attempt model
-   answer persistence model
-   question bank
-   QuestionVersion
-   scoring algorithm
-   scoring engine
-   measurement model
-   assessment instrument
-   result semantics
-   interpretation semantics
-   historical result meaning
-   entitlement engine
-   commercial package definition
-   pricing/business rules
-   Scalev checkout contract
-   authentication/authorization model
-   assessment runtime behavior
-   answer boundary
-   result payload contract
-   cross-test evidence meaning
-   universal score
-   raw-average synthesis
-   historical assessment content

V10 juga tidak boleh membuat UI yang memberikan access/entitlement
secara palsu.

------------------------------------------------------------------------

# 5. Measurement Safety

ReadyScore mempertahankan chain:

``` text
USER RESPONSE
    ↓
MEASUREMENT
    ↓
SCORING
    ↓
RESULT
    ↓
INTERPRETATION
    ↓
UNDERSTANDING
```

V10 bekerja terutama pada:

``` text
UNDERSTANDING / PRESENTATION
```

### Critical rule

**Spider web/radar Profile bukan universal score.**

Profile visualization hanya boleh menunjukkan:

-   evidence
-   coverage
-   domain state
-   source assessment

Domain tanpa evidence harus ditampilkan sebagai:

> **No evidence / Not available**

dan **bukan score 0**.

Tidak boleh membuat angka nol hanya karena data belum tersedia.

------------------------------------------------------------------------

# 6. V10 Information Architecture

Recommended primary navigation:

``` text
WORKSPACE

Overview
Assessments
Results
My Profile
Activity

----------------

ACCOUNT

Access & Plans
```

### Reports

Reports tidak wajib menjadi primary sidebar destination.

Recommended discovery:

``` text
Results
   └── Summary / Report
          └── Export PDF

My Profile
   └── Summary / Report
          └── Export PDF
```

Route `/reports` boleh tetap ada bila sudah digunakan existing
application. Yang berubah adalah discovery dan presentation, bukan
penghapusan route secara paksa.

------------------------------------------------------------------------

# 7. V10 Phase Plan

``` text
V9.15 FROZEN BASELINE
        ↓
V10.0 UX Foundation & IA
        ↓
V10.1 Overview / Customer Dashboard
        ↓
V10.2 Profile Visualization
        ↓
V10.3 Results Workspace
        ↓
V10.4 Reports & PDF Export
        ↓
V10.5 Assessment Workspace
        ↓
V10.6 Activity Workspace
        ↓
V10.7 Access & Plans Redesign
        ↓
V10.8 Navigation & Workspace Consistency
        ↓
V10.9 Responsive & Accessibility Hardening
        ↓
V10.10 Full Customer UX Regression
        ↓
V10.11 Final Acceptance / Freeze
```

------------------------------------------------------------------------

# 8. V10.0 --- UX Foundation & IA

## Objective

Mengunci aturan V10 sebelum implementation.

## Deliverables

-   information architecture
-   navigation rules
-   page responsibility matrix
-   CTA rules
-   assessment status rules
-   profile visualization states
-   report boundaries
-   PDF export boundary
-   access & plans hierarchy
-   responsive requirements
-   accessibility requirements
-   V9.15 preservation contract

## Acceptance

-   setiap primary page mempunyai satu fungsi utama
-   Results, Profile, dan Reports memiliki definisi berbeda
-   tidak ada overlap yang membingungkan
-   semua phase V10 mengacu pada specification ini
-   tidak ada V9.15 functional/measurement mutation

------------------------------------------------------------------------

# 9. V10.1 --- Overview / Customer Dashboard

## Core Definition

> **Overview = kondisi dan perjalanan user saat ini.**

Overview adalah command center, bukan tempat seluruh detail ditaruh.

## Required Content

1.  greeting
2.  progress summary
3.  completed assessment count
4.  in-progress assessment count
5.  available assessment summary
6.  continue action
7.  recent result summary
8.  profile availability summary
9.  current access summary

Recommended hierarchy:

``` text
Greeting
    ↓
Progress
    ↓
Continue
    ↓
Latest Results
    ↓
Profile
    ↓
Access
```

## Prohibited

-   full duplicate assessment catalog
-   full duplicate activity history
-   full duplicate profile
-   full pricing page
-   new scoring logic
-   new result calculation

------------------------------------------------------------------------

# 10. V10.2 --- Profile Visualization

## Core Definition

> **My Profile = gambaran evidence lintas assessment yang sudah
> tersedia.**

Profile bukan assessment baru, bukan universal score, dan bukan
pengganti individual result.

## Primary Visualization

Gunakan **spider web / radar visualization**.

## State A --- No Assessment

-   radar neutral/kosong
-   tidak ada fake score
-   tidak ada angka 0 yang menyiratkan hasil

Message:

> Your profile is starting to take shape.

CTA:

> Start an assessment

## State B --- Partial Assessment

Visual harus membedakan:

-   domain dengan evidence
-   domain tanpa evidence

Domain tanpa evidence:

> No evidence

Bukan:

> 0

## State C --- Full Coverage

-   full visualization
-   evidence coverage
-   supporting source information

## Profile Domains

Tetap:

-   Ability
-   Emotional
-   Resilience
-   Behavior
-   Interest
-   Strength
-   Learning

## Supporting Sources

Tetap menggunakan source yang sudah ada, misalnya:

-   Cognitive
-   DISC
-   RIASEC
-   EQ

Presentation tidak boleh mengubah semantic meaning source.

## Accessibility

Radar harus mempunyai textual equivalent yang menjelaskan:

-   domain
-   evidence available/not available
-   source
-   relevant interpretation

------------------------------------------------------------------------

# 11. V10.3 --- Results Workspace

## Core Definition

> **Results = daftar hasil assessment individual yang dimiliki user.**

Menjawab:

> "Saya sudah tes. Hasil saya mana?"

## Status

Minimal:

-   Completed
-   In Progress
-   Not Started / No Result
-   Locked, bila discovery membutuhkan status tersebut

## CTA

  Status        CTA
  ------------- ------------------
  Completed     View result
  In Progress   Continue
  Not Started   Start assessment
  Locked        Get access

## Boundary

Existing route:

`/result/[attemptId]`

tetap menjadi sumber result detail.

V10.3 hanya menjadi discovery/workspace layer.

------------------------------------------------------------------------

# 12. V10.4 --- Reports & PDF Export

## Core Definition

> **Reports = summary/document presentation dari hasil yang sudah
> tersedia.**

Perbedaan:

**Result** → hasil satu assessment.

**Profile** → gambaran lintas assessment.

**Report** → ringkasan hasil yang dikemas sebagai laporan.

## Report Content

Summary dapat menggunakan:

-   assessment yang tersedia
-   key findings dari existing result semantics
-   strengths/areas yang memang sudah tersedia
-   profile coverage
-   link/reference ke full result
-   profile summary bila tersedia

## Prohibited

Report tidak boleh:

-   menghitung score baru
-   membuat universal score
-   melakukan raw-average synthesis
-   mengubah interpretation
-   membuat diagnosis baru
-   menciptakan cross-test mathematical synthesis baru

## PDF

V10 boleh menyediakan:

> **Export PDF**

PDF adalah presentation/export dari informasi yang sudah tersedia.

Recommended first implementation:

-   browser/client-side print-to-PDF atau equivalent presentation-safe
    mechanism
-   no migration
-   no measurement change
-   no scoring change
-   no result persistence redesign

## PDF Quality

-   ReadyScore branding
-   clear title
-   clear hierarchy
-   readable typography
-   print-friendly layout
-   no clipped content
-   no broken cards
-   summary konsisten dengan UI

------------------------------------------------------------------------

# 13. V10.5 --- Assessment Workspace

## Core Definition

> **Assessments = tempat user mengetahui assessment apa yang bisa dan
> tidak bisa dikerjakan.**

Konsep "Pilih assessment Anda" tidak lagi menjadi pusat UX.

## Required Status Groups

### Available

User dapat mulai.

CTA:

> Start

### In Progress

User sudah memulai.

CTA:

> Continue

### Completed

User sudah selesai.

CTA:

> View result

Optional:

> Retake

jika existing rules mengizinkan.

### Locked / Unavailable

User belum memiliki entitlement.

CTA:

> Get access

atau copy setara yang natural.

## Locked Assessment

Locked assessment boleh ditampilkan untuk:

-   discovery
-   transparency
-   conversion

Tetapi UI tidak boleh memberikan entitlement baru.

## Purchase

Gunakan existing commercial/Scalev flow.

Jangan membuat checkout baru.

------------------------------------------------------------------------

# 14. V10.6 --- Activity Workspace

## Core Definition

> **Activity = timeline perjalanan user + next action.**

Bukan sekadar database history.

## Recommended Presentation

``` text
TODAY

RIASEC
Assessment in progress
0 / 60 answered

[ Continue ]

31 AUG 2026

Cognitive
Assessment completed

[ View result ]
```

## Lightweight Filters

-   All
-   Assessments
-   Results

Tidak perlu advanced analytics.

## Actionability

  Condition          Action
  ------------------ -------------
  In Progress        Continue
  Completed          View result
  Retake available   Retake
  Locked             Get access

Jika tidak ada action relevan, record boleh informational-only.

## Out of Scope

-   new event tracking architecture
-   new activity database model
-   analytics platform
-   event ingestion redesign

------------------------------------------------------------------------

# 15. V10.7 --- Access & Plans Redesign

## Core Definition

> **Access & Plans = tempat user memahami apa yang dimiliki dan
> bagaimana mendapatkan akses tambahan.**

## Required Hierarchy

``` text
1. Current Access
        ↓
2. Included Capabilities
        ↓
3. Assessment Access
        ↓
4. Upgrade / Get More
        ↓
5. Purchase Boundary
```

## Current Plan

Contoh:

``` text
YOUR CURRENT PLAN

All Tests + Profiling

ACTIVE
```

## Included Capabilities

Contoh:

``` text
Cognitive              Available
Emotional Intelligence Available
DISC                    Available
RIASEC                  Available
Cross-Test Profile      Available
```

## Get More

Setelah current access jelas:

-   Single Test
-   All Tests
-   All Tests + Profiling

Existing pricing/business rules tetap digunakan.

## Purchase Boundary

Scalev tetap menjadi existing checkout boundary.

Primary CTA sebaiknya customer-centric:

-   Get access
-   Upgrade
-   Continue to checkout

## Prohibited

-   entitlement mutation dari UI
-   fake unlock
-   client-side bypass
-   perubahan package entitlement rules
-   perubahan pricing tanpa scope approval

------------------------------------------------------------------------

# 16. V10.8 --- Navigation & Workspace Consistency

## Objective

Menggabungkan seluruh phase menjadi satu mental model.

Recommended sidebar:

``` text
WORKSPACE

Overview
Assessments
Results
My Profile
Activity

----------------

ACCOUNT

Access & Plans
```

### Navigation Definitions

**Overview**\
Summary and next actions.

**Assessments**\
Start/continue assessment.

**Results**\
Read individual assessment results.

**My Profile**\
Understand cross-test evidence.

**Activity**\
Review and continue journey.

**Access & Plans**\
Understand entitlement and purchase options.

**Reports**\
Output/document, discoverable dari Results/Profile.

------------------------------------------------------------------------

# 17. V10.9 --- Responsive & Accessibility Hardening

V9.13 telah menetapkan responsive/accessibility hardening. V10 wajib
mempertahankan baseline tersebut.

## Required

-   desktop
-   tablet
-   mobile
-   keyboard navigation
-   visible focus
-   adequate touch targets
-   readable contrast
-   reduced motion compatibility
-   forced-colors compatibility bila relevan
-   semantic headings
-   accessible buttons/links
-   accessible status indicators

## Spider Web

Harus mempunyai non-visual alternative.

Example:

``` text
Profile Coverage

Ability      Evidence available
Emotional    No evidence
Resilience   No evidence
Behavior     Evidence available
Interest     Evidence available
Strength     No evidence
Learning     No evidence
```

------------------------------------------------------------------------

# 18. V10.10 --- Full Customer UX Regression

## Required Journey

``` text
Landing
  ↓
Login / Register
  ↓
Overview
  ↓
Assessments
  ↓
About
  ↓
Pre-Test
  ↓
Assessment Runtime
  ↓
Result
  ↓
Results
  ↓
My Profile
  ↓
Reports
  ↓
Export PDF
  ↓
Activity
  ↓
Access & Plans
```

## Required States

1.  No assessment
2.  Partial assessment
3.  Full assessment coverage
4.  In-progress assessment
5.  Completed assessment
6.  Locked assessment
7.  User with current commercial entitlement

## Regression

Harus tetap PASS:

-   authentication
-   authorization
-   customer navigation
-   assessment start
-   assessment runtime
-   answer persistence
-   assessment submission
-   scoring
-   result
-   reassessment
-   profile
-   entitlement
-   Scalev checkout boundary
-   responsive behavior
-   accessibility

------------------------------------------------------------------------

# 19. V10.11 --- Final Acceptance / Freeze

PASS hanya berdasarkan actual runtime evidence.

Required:

``` text
pnpm typecheck                   PASS
pnpm build                      PASS

V9.15 baseline regression       PASS

V10.0 UX Foundation             PASS
V10.1 Overview                  PASS
V10.2 Profile                   PASS
V10.3 Results                   PASS
V10.4 Reports / PDF             PASS
V10.5 Assessments               PASS
V10.6 Activity                  PASS
V10.7 Access & Plans            PASS
V10.8 Navigation                PASS
V10.9 Responsive / A11y         PASS
V10.10 Full Customer Regression PASS
```

Final marker:

``` text
=== READY SCORE V10 FINAL ACCEPTANCE / FREEZE ACTUAL RUNTIME: PASS ===

FROZEN BASELINE:
V10.11 FINAL ACCEPTANCE / FREEZE
```

------------------------------------------------------------------------

# 20. Development Rules

## Rule 1 --- Branch From V9.15

V10 source must originate from V9.15.

## Rule 2 --- One Phase at a Time

Recommended:

``` text
V10.0 → gate
V10.1 → gate
V10.2 → gate
...
```

Do not silently combine unrelated phase scope.

## Rule 3 --- Preserve Existing Routes

Existing routes may remain even when navigation changes:

``` text
/app
/access
/assessments
/assessments/[type]
/assessments/[type]/pre-test
/activity
/profile
/reports
/result/[attemptId]
/reassessment/[type]
```

Do not delete existing route contracts merely because navigation
presentation changes.

## Rule 4 --- Reuse Existing Services

If existing API/service/data already provides required information:

> **reuse it.**

Do not duplicate business logic to build a new page.

## Rule 5 --- No UI-Driven Business Logic

UI status must reflect existing state.

Entitlement remains controlled by existing entitlement logic.

## Rule 6 --- No Silent Semantic Changes

If a presentation request requires changing scoring, result semantics,
measurement, entitlement, database schema, or persistence:

> **STOP → classify as SCOPE EXCEPTION.**

## Rule 7 --- Historical Results Remain Historical

V10 presentation may improve readability but cannot rewrite historical
meaning.

## Rule 8 --- Do Not Manufacture Data

If data is unavailable:

-   No evidence
-   Not completed
-   Locked
-   Not available

Do not invent:

-   zero score
-   fake completion
-   fake profile
-   fake entitlement
-   fake evidence

------------------------------------------------------------------------

# 21. Scope Exception Protocol

``` text
DISCOVERED ISSUE
      ↓
CLASSIFY
      ↓
Presentation-only?
      │
   YES ↓       NO
       ↓        ↓
Implement   Scope Exception
            ↓
       Do NOT silently
       change V10
```

Scope exception must document:

1.  issue
2.  why presentation-only is insufficient
3.  affected baseline
4.  affected files/services
5.  database impact
6.  measurement impact
7.  scoring impact
8.  entitlement impact
9.  recommended future phase

------------------------------------------------------------------------

# 22. Definition of Done Per Phase

A phase is complete only when:

-   implementation matches specification
-   no prohibited mutation occurred
-   typecheck passes
-   relevant build passes
-   relevant existing regression passes
-   new UI states are tested
-   responsive behavior is checked
-   accessibility is checked
-   existing routes still work
-   actual evidence is available

Do not mark PASS based on intention.

------------------------------------------------------------------------

# 23. Required Delivery Evidence

Each phase should produce:

``` text
PHASE DELIVERY
├── source changes
├── phase specification/reference
├── delivery notes
├── validation/gate
├── relevant runtime evidence
└── regression result
```

For presentation-only phases, delivery notes should explicitly state:

``` text
NO DATABASE MIGRATION
NO MEASUREMENT MUTATION
NO SCORING MUTATION
NO QUESTION-BANK MUTATION
NO RESULT-SEMANTICS MUTATION
NO UNIVERSAL SCORE
NO RAW-AVERAGE SYNTHESIS
HISTORICAL CONTENT REMAINS IMMUTABLE
```

------------------------------------------------------------------------

# 24. Highest-Risk V10 Areas

## Profile Spider Web

Risk: visual treatment accidentally implies a universal score.

Control: evidence/coverage visualization only.

## Reports

Risk: summary becomes a new scoring/synthesis layer.

Control: only render existing result/profile evidence.

## Access & Plans

Risk: UI changes accidentally alter entitlement.

Control: existing entitlement engine remains source of truth.

## Assessment Status

Risk: UI invents access state.

Control: status comes from existing activity + entitlement state.

## PDF

Risk: PDF becomes a second interpretation layer.

Control: PDF is a presentation representation of existing information.

------------------------------------------------------------------------

# 25. Final UX Mental Model

``` text
OVERVIEW
"What is happening with me?"

        ↓

ASSESSMENTS
"What can I do?"

        ↓

RESULTS
"What did I get?"

        ↓

MY PROFILE
"What does the bigger picture look like?"

        ↓

REPORTS
"How can I see/save the summary?"

        ↓

ACTIVITY
"What have I done and what should I continue?"

        ↓

ACCESS & PLANS
"What do I have and what can I get?"
```

------------------------------------------------------------------------

# 26. Final V10 Guardrail

Aturan paling sederhana untuk seluruh development team:

> **V10 must make ReadyScore easier to understand, not make ReadyScore
> measure something new.**

Jika perubahan membuat produk:

-   lebih jelas
-   lebih mudah dinavigasi
-   lebih mudah dibaca
-   lebih mudah divisualisasikan
-   lebih mudah diekspor
-   lebih accessible

maka kemungkinan besar berada di V10.

Jika perubahan membuat produk:

-   mengukur sesuatu secara berbeda
-   menghitung score baru
-   mengubah scoring
-   mengubah result semantics
-   mengubah entitlement
-   mengubah historical data
-   mengubah assessment content
-   mengubah persistence model

maka **bukan V10 presentation scope** dan harus menjadi scope
exception/future phase.

------------------------------------------------------------------------

# 27. V10 Master Boundary

``` text
                    READY SCORE V9.15
                    FROZEN BASELINE
                           │
                           ▼
                 ┌───────────────────┐
                 │       V10          │
                 │ Customer Workspace │
                 │ UX Refinement      │
                 └───────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ↓                ↓                ↓
     INFORMATION        VISUAL            PRESENTATION
     ARCHITECTURE       EXPERIENCE        EXPERIENCE
          │                │                │
          ↓                ↓                ↓
      Navigation       Spider Web        Summary
      Page Roles       Status UI         PDF
      CTA              Responsive        Copy
      States           Accessibility     Layout
                           │
                           ▼
                  EXISTING V9.15 DATA
                  EXISTING V9.15 LOGIC
                  EXISTING V9.15 RESULT
                  EXISTING V9.15 ENTITLEMENT
```

**V9.15 remains the source of truth. V10 is the experience layer above
it.**

------------------------------------------------------------------------

# 28. Status

**Document Status:** LOCKED FOR DEVELOPMENT

**Version:** V10.0 Specification v1.0

**Parent Baseline:** ReadyScore V9.15 Final Acceptance / Freeze

**Development Mode:** Presentation / UX / IA Refinement

**Database Migration:** NO

**Measurement Mutation:** NO

**Scoring Mutation:** NO

**Question Bank Mutation:** NO

**Result Semantics Mutation:** NO

**Universal Score:** NO

**Raw-Average Synthesis:** NO

**Historical Content Mutation:** NO

**Existing Entitlement Logic Mutation:** NO

**Existing Assessment Runtime Mutation:** NO

**Final Acceptance:** Must be established from actual runtime evidence.
