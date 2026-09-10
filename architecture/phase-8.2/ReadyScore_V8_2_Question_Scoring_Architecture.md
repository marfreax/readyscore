# ReadyScore V8.2 — Question & Scoring Architecture

**Status:** LOCKED ARCHITECTURE SPECIFICATION  
**Baseline:** V8.1 Measurement Specification Lock PASS  
**Scope:** Question model, response representation, item scoring adapters, dimension aggregation, result boundaries, version safety  
**Implementation status:** Architecture only; V8.2 does NOT replace production question banks or production scoring semantics.

## 1. Purpose
V8.2 translates the V8.1 measurement contract into an explicit technical architecture so that V8.3–V8.6 can implement each instrument without guessing measurement intent.

## 2. Global Architecture Rules
1. **No universal score.** Cognitive, EQ, DISC, and RIASEC do not collapse into one customer-facing score.
2. **Assessment-specific response models.** Each instrument has its own question/response/scoring adapter.
3. **Historical question versions are immutable.** A material question or scoring change creates a new version.
4. **Scoring semantics are versioned.** Production scoring identifiers change when scoring semantics materially change.
5. **Internal measurement metadata stays internal.** Customers see intended results, not hidden keys or implementation metadata.
6. **No silent scoring changes.** Material deviation from V8.1 requires an explicit change decision and new validation.
7. **No database migration in V8.2.** This phase defines architecture only.

## 3. Canonical Question Architecture
A logical question identity is stable. An assessment-facing version is immutable.

```text
Question
  └── stable logical identity
       ↓
QuestionVersion
  ├── assessmentType
  ├── questionType
  ├── prompt/stimulus
  ├── options (where applicable)
  ├── dimension metadata
  ├── scoring metadata (internal)
  └── version identity
```

A response references the question version used by the attempt. Historical attempts must never be reinterpreted using a later question version.

## 4. Question Types
Required architecture types:
- `SINGLE_CHOICE` — objective keyed response; Cognitive
- `SCENARIO_SINGLE_CHOICE` — situational judgment; EQ
- `SCENARIO_FORCED_CHOICE` — one most representative option; DISC
- `LIKERT_5_PREFERENCE` — 1–5 interest preference; RIASEC

Stimulus families such as pattern, numerical, verbal, or image may sit under `SINGLE_CHOICE`; they do not automatically create a new scoring semantic.

## 5. Cognitive Adapter
- 24 scored items
- 4 domains × 6 items: Verbal, Numerical, Logical, Abstract Reasoning
- one selected option
- objective key; correct = 1, incorrect = 0, no response = unscored
- dimension = correct / answered scored × 100
- overall = mean of four dimension scores only when completion thresholds are satisfied
- customer term = Cognitive Reasoning Score
- IQ claim is not authorized

Difficulty is explicit item metadata and must not be inferred from presentation order. Difficulty design/calibration belongs to V8.3.

## 6. EQ Adapter
- 24 scored scenarios
- 4 dimensions × 6 items
- `SCENARIO_SINGLE_CHOICE`
- situational judgment response
- item-specific explicit ordinal scoring key
- exact production keys/rubric are frozen in V8.4 before activation
- dimension normalized to 0–100
- overall = mean of four dimensions when completion requirements are met

The architecture must support option → ordinal value per item. It must not assume first-option-is-best or any global positional rule.

## 7. DISC Adapter
- 24 scenarios
- 4 options per item
- one most representative option selected
- each option maps internally to one D/I/S/C dimension
- option positions vary across items
- hidden D/I/S/C labels are not customer-facing
- **no universal ability score**

```text
selected option
    ↓
item-specific hidden mapping
    ↓
D / I / S / C selection count
    ↓
profile dimension values
```

A global rule such as `A=D, B=I, C=S, D=C` for every item is explicitly forbidden.

Dimension values are selection proportions normalized to 0–100. Primary and secondary styles use deterministic ranking; tie handling is implemented in V8.5.

## 8. RIASEC Adapter
- 60 scored items
- 6 dimensions × 10 items: R/I/A/S/E/C
- `LIKERT_5_PREFERENCE`
- interest/preference response
- weighted preference mean normalized to 0–100
- Top Code = top three dimensions after deterministic ranking when completion/coverage requirements are satisfied
- reverse scoring only where explicitly justified

## 9. Scoring Adapter Contract
All instruments use the same pipeline shape but different semantics:

```text
USER RESPONSE
    ↓
ITEM VALIDATION
    ↓
ASSESSMENT-SPECIFIC ITEM SCORER
    ↓
DIMENSION AGGREGATOR
    ↓
ASSESSMENT-SPECIFIC RESULT RULE
    ↓
CLASSIFICATION / PROFILE
    ↓
INTERPRETATION
```

The shared engine dispatches by assessment type/question type. It must never apply one universal numeric formula across all four assessments.

## 10. Completion and Missing Responses
Completion thresholds are assessment-specific. An unanswered item must never silently become a neutral score.

- Cognitive: no response is unscored; defined completion thresholds are required.
- EQ: incomplete dimensions are not finalized scores.
- DISC: incomplete profile is not finalized.
- RIASEC: Top Code requires required completion/coverage.

Exact thresholds are implementation decisions in V8.3–V8.6 and must be documented before production activation.

## 11. Result Boundaries
```text
Assessment Result
  ├── Main Result
  ├── Dimension/Profile values
  ├── Classification (if authorized)
  └── Interpretation
```

Cross-test Profile remains separate and must not create a universal score or average unrelated raw scores.

## 12. Version Safety
Material changes require a new assessment-facing version and, where scoring semantics change, a new scoring version.

```text
OLD QUESTION VERSION  ≠  NEW QUESTION VERSION
OLD SCORING VERSION   ≠  NEW SCORING VERSION
```

Historical results remain bound to the version used at completion.

## 13. V8.2 Non-Goals
V8.2 does not create production question content, replace production banks, modify production scoring modules, change customer result semantics, add migrations, add IQ norming, create clinical claims, implement customer UI, or introduce a universal score.

## 14. Handoff
```text
V8.2 LOCK
  ↓
V8.3 Cognitive Instrument
  ↓
V8.4 EQ Instrument
  ↓
V8.5 DISC Instrument
  ↓
V8.6 RIASEC Instrument
  ↓
V8.7 Unified Assessment Engine Adaptation
```

**V8.2 STATUS: LOCKED ARCHITECTURE**
