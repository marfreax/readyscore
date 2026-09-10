# ReadyScore V9.8 — Assessment Engine Adaptation

**Status:** IMPLEMENTED / CONTRACT GATE TARGET  
**Scope:** Adapt the existing assessment engine to the approved V9 assessment-specific question banks and response contracts.  
**Predecessor:** V9.7 RIASEC Question Bank  
**Protected baseline:** V8.13 Final Acceptance / Freeze  
**Engine baseline:** V8.7 Unified Assessment Engine  

## 1. Objective

V9.8 makes the runtime orchestration explicitly aware of the approved assessment-specific response contracts introduced through V9.4–V9.7, without changing measurement or scoring semantics.

## 2. Runtime Contracts

- Cognitive: 24, `SINGLE_CHOICE_4`, four options, internal correct option retained only for scoring.
- EQ: 24, `SINGLE_CHOICE_4`, four options, explicit four-value scoring key retained only for scoring.
- DISC: 24, forced-choice presentation, item-specific four-position mapping retained only for scoring.
- RIASEC: 60, `LIKERT_5`, identity 1–5 scoring key, no objective answer key.
- Legacy Free/Premium contracts remain unchanged.

## 3. Engine Boundary

The unified engine remains orchestration-only. It validates the runtime contract and delegates scoring to the existing assessment-specific scorer. It does not introduce a universal scorer, rescore items, or synthesize unrelated assessment scores.

## 4. Runtime Safety

Customer runtime projections are explicitly sanitized. They may expose question text, response controls, selection state, progress, and non-sensitive version metadata, but never expose scoring keys, reverse-scoring metadata, internal weights, objective correct answers, or database QuestionVersion identifiers.

The persisted attempt snapshot remains authoritative for scoring and historical provenance; its public API projection is a separate sanitized representation.

## 5. Persistence Safety

No V9.8 database migration is introduced. Existing immutable QuestionVersion and attempt snapshot boundaries remain intact.

## 6. Acceptance

V9.8 passes only when typecheck/build and V9.0–V9.7 gates remain green, the V9.8 runtime-contract gate passes, assessment-specific response/scoring boundaries remain intact, and no forbidden score synthesis or database migration is introduced.
