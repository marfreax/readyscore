# V13.6 Delivery Notes

## Baseline
Built on the V13.5 candidate-pool artifact set while preserving the V13.4 frozen production blueprint.

## Mapping
Mappings are copied from supplied candidate CSV fields. No taxonomy field is silently changed. The artifacts are mapping-review candidates, not database approvals.

## Content review
The review matrix explicitly tracks wording clarity, construct relevance, taxonomy correctness, scoring correctness, duplicate/near-duplicate risk, response option integrity, cultural/language suitability, ambiguity, and cueing/answer leakage.

No `APPROVED`, `PUBLISHED`, or `ACTIVE` state is fabricated in the review artifacts.

## Blocking state
- RIASEC: candidate pool quantity/composition is complete; content review remains pending and publication still follows actual controlled lifecycle.
- DISC: quantity/composition is complete, but 80-item scoring compatibility remains a V13.7 responsibility.
- EQ: 29 candidates only; composition and scoring/import contract remain blocked.
- Cognitive: 33 candidates only; Logical and Abstract composition and reserve are incomplete.

No migration is introduced by V13.6.
