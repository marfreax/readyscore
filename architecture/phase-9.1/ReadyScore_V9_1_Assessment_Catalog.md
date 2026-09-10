# ReadyScore V9.1 — Assessment Catalog

## Status
Implementation phase artifact. `docs/` is intentionally not used.

## Scope
V9.1 implements the customer assessment catalog as the entry point for the four active assessment products:

- Cognitive
- Emotional Intelligence (EQ)
- DISC
- RIASEC

The catalog communicates what each assessment is, what it measures, response model, question count, duration, access state, and the next action.

## Safety boundary
V9.1 does not redesign measurement, scoring, question banks, or database schema. V8 measurement/scoring contracts remain authoritative.

The catalog must not introduce:

- a universal score;
- a raw average across unrelated assessments;
- customer exposure of internal scoring keys;
- claims that exceed the assessment-specific measurement semantics.

## Customer journey

`Assessments → Assessment Card → About Assessment → Pre-Test → Test → Result`

V9.1 owns the catalog entry point only. About/pre-test and runtime changes belong to later V9 phases.

## Access behavior

The catalog remains entitlement-aware:

- Locked → access/plans CTA
- In progress → continue assessment
- Completed with result access → view result / start again
- Available → start assessment

Entitlement is not granted by the catalog itself.

## Shared source

Customer catalog metadata lives in `lib/assessment/catalog.ts` so catalog presentation and later customer surfaces can reuse a single bounded source without changing measurement configuration.
