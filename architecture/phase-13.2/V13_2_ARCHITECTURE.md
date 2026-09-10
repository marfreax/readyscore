# ReadyScore V13.2 — Composition Validation & Question Selection

## Status
IMPLEMENTED — pending environment runtime verification.

## Scope
V13.2 connects the V13.1 Question Package configuration to the existing PostgreSQL Question/QuestionVersion and AssessmentAttempt foundations.

### Runtime flow
```text
Assessment Start
  -> runtime-eligible published package versions
  -> active taxonomy + TestType validation
  -> question eligibility (PUBLISHED + APPROVED mapping)
  -> composition availability validation
  -> seeded package selection
  -> seeded per-composition question selection
  -> duplicate/total validation
  -> seeded final order randomization
  -> attempt snapshot
```

## Eligibility boundary
Question eligibility is based on structured relationships and metadata:
- QuestionVersion.testTypeId
- QuestionVersion.taxonomyVersion
- QuestionVersion.status
- QuestionVersion.mappingStatus
- TaxonomyNode ownership/type/code

Question IDs/prefixes are not used as the business eligibility rule.

For a taxonomy node, matching uses the structured field appropriate to its `nodeType`:
- DOMAIN -> QuestionVersion.domain
- SUBDOMAIN -> QuestionVersion.subdomain
- INDICATOR -> QuestionVersion.indicator

## Composition
Every composition rule must have enough distinct eligible questions. The selected set must:
- satisfy every rule exactly
- equal package totalQuestions
- contain no duplicate logical Questions
- preserve QuestionVersion identity

## Randomization
V13.2 keeps three concerns separate:
1. package selection
2. question selection
3. question order randomization

All are deterministic from the persisted attempt seed and package version. The final ordered list is frozen in the attempt snapshot and `AttemptQuestion.sequence` through the existing persistence boundary.

## Historical safety
No QuestionVersion or historical AssessmentAttempt is rewritten by the V13.2 migration. V13.2 uses the existing immutable snapshot architecture.

## Taxonomy structure migration
The V13.2 migration adds missing active V2 taxonomy nodes required to configure composition for DISC, EQ, Cognitive, and RIASEC. It does not rewrite question content.

## Runtime compatibility
The selected package must match the active assessment configuration question count. If the taxonomy metadata declares a scoringVersion, it must match the active scoring configuration. This is a compatibility check, not a scoring-engine change.

## Package state
Only PUBLISHED package versions with an ACTIVE taxonomy and sufficient eligible question availability are runtime candidates. Invalid/unavailable packages are excluded from the candidate pool.

## Boundary
Timer/resume/timeout/answer resilience remain V13.3. V13.2 does not implement server-authoritative expiry.
