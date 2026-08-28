# ReadyScore V5 L10 — Cross-Test Profiling MVP

## Scope
Customer-facing synthesis of the latest completed RIASEC, DISC, EQ, and Cognitive result snapshots.

## Frozen boundaries
- Existing assessment measurement/scoring contracts are read-only inputs.
- Existing immutable `AssessmentResult` snapshots are not modified.
- No database migration is introduced in L10.
- Product tier remains separate from assessment identity.
- No universal overall score is calculated.
- No raw averaging is performed across incompatible score scales.

## Evidence domains
| Assessment | Profile domain | Evidence |
|---|---|---|
| Cognitive | ABILITY | Four reasoning dimensions |
| EQ | EMOTIONAL | Four emotional/social-response dimensions |
| DISC | BEHAVIOR | Four behavioral dimensions |
| RIASEC | INTEREST | Six interest dimensions |

Seven profile domains exist in the contract; four are populated by the currently active L10 instruments. RESILIENCE, STRENGTH, and LEARNING remain unavailable rather than being synthesized from unsupported evidence.

## Runtime contract
- `CROSS_TEST_PROFILE_V1`
- `CROSS_TEST_PROFILE_ENGINE_V1`
- `V5_L10_CROSS_TEST_PROFILING_V1`

The service selects the latest completed immutable snapshot per supported assessment type for the authenticated user and sends the test-specific payload through its registered adapter.

## Claim governance
Allowed: evidence synthesis and relative patterns within a test-specific measurement domain.
Restricted/prohibited: deterministic study/major/career outcomes, readiness claims without a defined construct, incompatible-scale comparisons, universal intelligence/personality/suitability scores, and raw averaging.
