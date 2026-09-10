# V8.12 Full Customer Regression

## Scope
V8.12 is a regression-only phase after V8.3–V8.11. It verifies that the frozen product baseline and the active V8 assessment instruments remain operational together.

## Regression coverage
- public/customer authentication and access
- customer application shell and navigation
- assessment catalog and assessment journey
- assessment start, question selection, answer persistence, resume, review and submit
- result ownership and result presentation
- reassessment
- commercial/entitlement and Scalev boundary
- cross-test profile
- reports
- admin surfaces
- institution boundary
- security and accessibility baseline
- Cognitive V2 runtime
- EQ V2 runtime
- DISC V2 runtime
- RIASEC V2 runtime

## Execution model
The V8.12 runtime suite orchestrates the existing frozen V7/L20 full-product regression and the four active V8 instrument runtime suites. Existing suites remain the source of truth for their respective regression contracts.

## Safety boundary
FULL CUSTOMER REGRESSION
NO DATABASE MIGRATION
NO MEASUREMENT MUTATION
NO SCORING MUTATION
NO QUESTION-BANK MUTATION

V8.12 must not introduce a new migration, alter historical assessment semantics, or silently change question/scoring behavior.

## Repository hygiene
The V8.12 package intentionally does not add or replace `docs/`. Any pre-existing repository `docs/` directory is left untouched.
