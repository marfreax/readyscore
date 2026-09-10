# ReadyScore V9.6 — DISC Question Bank Quality & Runtime Hardening

**Status:** IMPLEMENTED / CONTRACT GATE TARGET
**Scope:** DISC question-bank quality and runtime-boundary hardening only
**Predecessor:** V9.5 DISC Question Bank
**Protected baseline:** V8.13 Final Acceptance / Freeze
**Measurement baseline:** V8.5 DISC Instrument
**Runtime baseline:** V9.3 Assessment Runtime UX

## 1. Objective

V9.6 hardens the already-approved DISC V2 production question bank and its customer/runtime boundary. It does not redesign the DISC instrument, scoring model, taxonomy, result semantics, or question-selection model.

## 2. Protected Contract

V9.6 preserves:

- `DISC_CONFIG_V2`
- `DISC_V2`
- `DISC_TAXONOMY_V2`
- `DISC_SCORE_V2`
- `DISC_SELECTION_V2`
- `DISC_INTERPRETATION_V2`
- `DISC_RESULT_V2`
- the 24-item production blueprint;
- six target scenarios for each `TARGET_D`, `TARGET_I`, `TARGET_S`, and `TARGET_C`;
- ipsative forced-choice scoring;
- primary and secondary pattern semantics;
- no substantive overall DISC score.

## 3. Quality Boundary

The production bank remains exactly 24 items. Each item must have:

- four unique customer-facing options;
- `SCENARIO` + `SINGLE_CHOICE_4`;
- weight `1`;
- an item-specific four-position DISC permutation;
- no `correctOption` answer key.

Position mappings remain balanced across D/I/S/C and are not globally fixed.

## 4. Runtime Boundary

Customer-facing runtime may expose scenario text, four option texts, selected answer position, and normal progress state.

Customer-facing runtime must not expose:

- `scoringKey`;
- `optionDimensions`;
- internal DISC dimension mapping;
- hidden scoring semantics.

## 5. Measurement Safety

V9.6 introduces no new score synthesis. In particular, it must not introduce:

- a substantive overall DISC score;
- universal score synthesis across assessments;
- raw-average synthesis across unrelated assessments;
- IQ/aptitude claims;
- clinical or deterministic personality claims.

## 6. Persistence Safety

No V9.6 database migration is introduced. Historical `QuestionVersion` records remain immutable. Material future item changes require a new immutable question version and appropriate version boundary.

## 7. Acceptance

V9.6 passes only when the gate verifies the V9.5 DISC production contract remains intact, the runtime/admin metadata boundary remains protected, no forbidden synthesis is introduced, no migration is added, and the V9.6 gate is registered while V9.0–V9.5 remain registered.
