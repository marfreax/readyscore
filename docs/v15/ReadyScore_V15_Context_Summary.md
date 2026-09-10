# ReadyScore — Context Summary for New Chat
**Date:** 2026-09-09  
**Project:** Kerjaan - Development

## 1. Current baseline

ReadyScore V13.10 is the frozen assessment baseline. It has been validated in real environments and must be treated as protected foundation.

Production targets:
- RIASEC: 60 questions / 20 minutes
- DISC: 80 questions / 20 minutes
- EQ: 50 questions / 20 minutes
- Cognitive / IQ: 40 questions / 20 minutes

V13 already covers production question packages, eligibility, composition-valid selection, frozen attempt snapshot, randomized sequence, durable answer persistence, resume semantics, server-authoritative timer, timeout finalization, production scoring, result persistence, and customer assessment flow.

**V13 rule:** V15 consumes V13 results. It must not casually change question count, question package, package selection, timer, scoring, measurement, lifecycle, or frozen result semantics.

V14 is the frozen commercial/customer-delivery layer:
PRODUCT → PURCHASE → VERIFIED PAYMENT → FULFILLMENT → ENTITLEMENT → ACCESS → ASSESSMENT → RESULT.

V14.1, V14.2, V14.3, and V14.4 are complete/frozen based on real-environment validation. V14 includes Midtrans payment, server-side verification, webhook handling, fulfillment, entitlement, customer access, success/return reconciliation, Access & Plans integration, and customer-facing assessment metadata corrections.

V14 regression explicitly protects V13: RIASEC 60, DISC 80, EQ 50, Cognitive 40, package selection, frozen sequence, answer persistence, submit, timeout, result persistence, and post-expiry rejection. V14 changes must not alter assessment scoring/result semantics.

## 2. Why V15 exists

The ReadyScore landing page promises **three** concrete product outputs:

1. **Laporan personal 20+ halaman bahasa orang tua**
2. **Rekomendasi 5–7 jurusan + alasan cocok**
3. **Action plan 30 hari siap pakai**

The landing page also describes report content such as executive summary for parents, interest/passions mapping, major recommendations and reasons, work style/collaboration, emotional resilience and learning strategy, and a 30-day action plan. fileciteturn49file2 fileciteturn49file6

The product package is positioned as “4 Test & Profiling Lengkap” and combines the four dimensions with the 20+ page report. The offer shown is Rp249.000. The current landing CTA is still a WhatsApp flow rather than the final V14 checkout path; V15 itself should focus on fulfilling the three promised outputs, not redesigning commerce.

## 3. V15 product definition

V15 is a new **Personalized Interpretation, Major Recommendation & 20+ Page Report System**.

The three outputs form one product chain:

```text
4 ASSESSMENT RESULTS
        ↓
INTEGRATED PERSONAL PROFILE
        ↓
"ANAK SAYA SEPERTI APA?"
        ↓
5–7 MAJOR RECOMMENDATIONS
        ↓
"ANAK SAYA COCOK KE MANA?"
        ↓
REASONS / FIT EXPLANATION
        ↓
30-DAY ACTION PLAN
        ↓
"SETELAH TAHU INI, HARUS MELAKUKAN APA?"
        ↓
20+ PAGE PERSONALIZED REPORT
```

The report is therefore not merely a long document. It is the final decision-support deliverable connecting profile → direction → action.

## 4. Core V15 architecture

```text
V13 FROZEN
Assessment Engine
Scoring
Result
       ↓
V15 Interpretation Layer
       ├─ Integrated Personal Profile
       ├─ Parent-Friendly Narrative
       ├─ Major Knowledge Base
       ├─ Major Matching / Ranking
       ├─ Recommendation Reasons
       ├─ Caution Signals
       ├─ 30-Day Action Plan
       └─ Report Generator
       ↓
20+ PAGE PERSONALIZED REPORT
       ↓
CUSTOMER RESULT EXPERIENCE
```

V15 must consume frozen V13 output rather than changing how V13 produces scores.

## 5. Major recommendation principle

Recommendations must come from a curated, versioned Major Knowledge Base rather than invented text.

Suggested conceptual structure:

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

Matching is interpretation/business logic, not V13 assessment scoring.

Conceptual pipeline:

```text
Frozen Results
    ↓
Profile Signals
    ↓
Major Compatibility
    ↓
Candidate Ranking
    ↓
Top 5–7
    ↓
Why It Fits + Caution + Exploration
```

The same frozen result + same rule version + same knowledge-base version must produce deterministic/equivalent recommendations.

If the data does not justify 5–7 valid recommendations, the system must not fabricate recommendations.

## 6. Action Plan principle

The **30-Day Action Plan is a first-class V15 output**, not filler inside the report.

It must be personalized from the profile and recommendations.

Bad implementation:
- one generic 30-day template for every child.

Required direction:
- actions should reflect the child's strongest signals;
- actions should help validate the recommended majors;
- actions should guide conversations, exploration, evidence gathering, and narrowing choices;
- actions should connect to the top recommendations;
- actions should provide practical next steps for the child/parent.

Conceptual flow:

```text
Profile
  ↓
Top Major Recommendations
  ↓
Exploration Needs / Caution Signals
  ↓
Personalized 30-Day Action Plan
```

The plan should answer:
> “Apa yang sebaiknya dilakukan anak dan orang tua selama 30 hari setelah membaca hasil ini?”

## 7. Parent-friendly language

The report should translate assessment results into natural Indonesian.

Avoid making RIASEC/DISC/EQ codes the primary customer language.

Prefer:
- what the child tends to enjoy;
- how the child tends to work;
- how the child handles emotional/context demands;
- how the child tends to learn/think;
- what environments may fit;
- what to explore next.

Technical labels may still exist where useful, but the report's main narrative must be understandable to parents.

## 8. 20+ page report principle

The report must genuinely exceed 20 meaningful pages.

Possible content structure:
- Cover
- How to read the report
- Executive summary
- Personal profile snapshot
- Interest profile + interpretation
- Work/behavior style + interpretation
- Emotional profile + interpretation
- Cognitive/learning profile + interpretation
- Integrated four-dimension profile
- Strengths
- Development areas
- Learning/work environment guidance
- Major recommendation overview
- Detailed recommendation sections for 5–7 majors
- Why each recommendation fits
- Caution/mismatch signals
- Related career directions
- Exploration guidance
- Parent discussion guide
- 30-day action plan
- Closing summary

Page count must come from substantive personalized content, not repeated text.

## 9. Scope

### V15 IN
- interpretation layer;
- integrated profile;
- parent-friendly narrative;
- strengths/development interpretation;
- major knowledge base;
- deterministic major matching;
- 5–7 recommendations;
- recommendation reasons;
- caution signals;
- related career directions;
- exploration guidance;
- personalized 30-day action plan;
- personalized 20+ page report;
- report versioning/persistence as required;
- customer report experience;
- V13/V14 regression;
- real-environment E2E.

### V15 OUT
- scoring redesign;
- psychometric redesign/validation;
- adaptive testing;
- question-bank/package redesign;
- timer/lifecycle changes;
- payment gateway redesign;
- checkout/fulfillment/entitlement redesign;
- CRM;
- WhatsApp/email marketing automation;
- subscriptions;
- unrelated analytics or broad UI redesign.

## 10. Engineering rules

1. **Frozen baseline:** consume V13/V14; do not casually modify them.
2. **Interpretation ≠ scoring:** V15 transforms frozen results; it does not rescore them.
3. **Deterministic:** same inputs and versions produce the same output.
4. **Traceable:** every recommendation has supporting signals and rules.
5. **Curated majors:** no hallucinated/uncontrolled recommendation list.
6. **Integrated:** use all four dimensions where available.
7. **Personalized action:** the 30-day plan must vary meaningfully with the profile.
8. **Meaningful report:** 20+ pages cannot be achieved with filler.
9. **Versioned content:** interpretation rules, Major KB, and report template are versioned.
10. **Historical stability:** an existing report must not silently change because content/rules are updated.
11. **Professional claim boundary:** engineering must not invent evidence for claims such as “prepared by psychologists/counselors” or “international standards.”
12. **Real evidence:** build/typecheck/test success alone is not PASS.
13. **Regression mandatory:** V13 assessment semantics and V14 commercial/access behavior must remain intact.
14. **Few phases:** keep V15 cohesive and limited to two phases.

## 11. Phase plan — deliberately minimal

### V15.1 — Interpretation, Major Matching, Action Plan & Report Engine

Build the core engine for all three promises:
- integrated profile;
- parent-friendly interpretation;
- Major KB V1;
- deterministic matching/ranking;
- 5–7 recommendations;
- reasons for fit;
- caution signals;
- personalized 30-day action plan;
- report content model;
- 20+ page report generator;
- versioning/persistence;
- automated/static validation.

### V15.2 — Customer Report Experience & Full E2E

Make the V15 output a real customer deliverable:
- customer-facing report/result experience;
- report readiness/access;
- report rendering/download if selected;
- integration with V14 customer journey;
- completed-assessment → V15 report E2E;
- V13 regression;
- V14 regression;
- real HTTP/database validation;
- real personalized report validation;
- launch-readiness evidence.

**Total: 2 phases.**

Do not create a third phase for ordinary bug fixes, copy changes, mapping corrections, layout changes, or test fixes. Those remain inside V15.1 or V15.2.

## 12. Definition of Done

V15 is DONE only when a real customer can:

```text
BUY
 ↓
GET ACCESS
 ↓
COMPLETE FOUR ASSESSMENTS
 ↓
RECEIVE V13 RESULTS
 ↓
RECEIVE PERSONALIZED REPORT
 ↓
READ 20+ MEANINGFUL PAGES
 ↓
SEE 5–7 MAJOR RECOMMENDATIONS
 ↓
UNDERSTAND WHY THEY FIT
 ↓
RECEIVE PERSONALIZED 30-DAY ACTION PLAN
 ↓
USE THE REPORT FOR REAL EXPLORATION
```

without engineering intervention in the normal path.

**V15 = Personalized Profile + 5–7 Major Recommendations + Reasons + 30-Day Action Plan + 20+ Page Personalized Report.**
