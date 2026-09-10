# ReadyScore V9.7 — RIASEC Question Bank Quality & Runtime Hardening

**Status:** IMPLEMENTED / CONTRACT GATE TARGET  
**Scope:** RIASEC question-bank quality and customer/runtime boundary hardening only  
**Predecessor:** V9.6 DISC Question Bank  
**Protected baseline:** V8.13 Final Acceptance / Freeze  
**Measurement baseline:** V8.6 RIASEC Instrument  
**Runtime baseline:** V9.3 Assessment Runtime UX

## 1. Objective

V9.7 hardens the approved RIASEC V2 production preference bank and its customer/runtime boundary. It does not redesign the RIASEC construct, response model, scoring model, taxonomy, top-code semantics, or selection algorithm.

## 2. Protected Contract

V9.7 preserves:

- `RIASEC_CONFIG_V2`;
- `RIASEC_QB_V2`;
- `RIASEC_TAXONOMY_V2`;
- `RIASEC_SCORE_V2`;
- `RIASEC_SELECTION_V2`;
- `RIASEC_INTERPRETATION_V2`;
- `RIASEC_RESULT_V2`;
- 60 production preference items;
- six RIASEC dimensions with exactly 10 items each;
- `LIKERT_5` preference response model;
- dimension scoring as weighted mean normalized to 0–100;
- deterministic Top 3 code semantics after completion thresholds;
- historical RIASEC V1 immutability.

## 3. Question-Bank Quality Boundary

The active production bank remains exactly 60 items. Each item must have:

- a unique logical identity and code;
- a non-empty customer-facing statement;
- one valid RIASEC dimension;
- one matching RIASEC subdomain;
- a non-empty indicator;
- `PREFERENCE` item type;
- `LIKERT_5` response type;
- scale `[1,2,3,4,5]`;
- identity scoring key `[1,2,3,4,5]`;
- `reverseScore: false`;
- weight `1`;
- no customer options array;
- no objective `correctOption` key.

Dimension coverage remains exactly `R/I/A/S/E/C = 10/10/10/10/10/10`.

The existing four-indicator structure per dimension is retained; current production coverage is `3/3/2/2` after deterministic ordering of indicator frequencies within each dimension. This is a quality invariant, not a new measurement rule.

## 4. Runtime Boundary

Customer-facing runtime may expose the statement, Likert scale, selection state, progress, and normal question metadata needed to render the test.

Customer-facing runtime must not expose internal scoring metadata, including:

- `scoringKey`;
- `reverseScore`;
- internal weighting;
- database QuestionVersion identifiers;
- hidden taxonomy/scoring implementation details.

## 5. Measurement Safety

V9.7 introduces no new score synthesis. It must not introduce:

- a universal score across assessments;
- raw-average synthesis across unrelated assessments;
- ability or IQ claims;
- guaranteed career-fit or guaranteed career-suitability claims.

RIASEC remains an interest/preference profile. The Top 3 code is descriptive of the relative interest pattern and is not a universal score.

## 6. Persistence Safety

No V9.7 database migration is introduced. The V8.6 taxonomy lifecycle migration remains the protected measurement boundary. Historical RIASEC V1 records remain immutable. Material future item changes require a new immutable question version and explicit version boundary.

## 7. Acceptance

V9.7 passes only when the gate verifies the V8.6 RIASEC instrument and V2 production bank remain intact, the customer/runtime metadata boundary remains protected, the bank satisfies quality invariants, no forbidden synthesis is introduced, no migration is added, and the V9.7 gate is registered while V9.0–V9.6 remain registered.
