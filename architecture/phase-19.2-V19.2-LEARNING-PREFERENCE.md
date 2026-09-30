# ReadyScore — V19.2 Learning Preference

## Status
PLANNED / LOCAL IMPLEMENTATION BASELINE

## Source Contract
V19.2 follows the locked V19–V21 specification:
- Learning Preference / Preferensi Belajar
- Visual
- Auditory
- Kinesthetic
- result is a preference/tendency, not an absolute learning label
- output is consumed by reporting and later Career Advisor work

## Runtime Implementation Baseline
- Question type: LEARNING_PREFERENCE
- Response model: LIKERT_5
- 30 questions total
- 10 questions per preference
- 20-minute runtime limit
- Selection: deterministic seeded shuffle within each preference quota
- Scoring: each preference normalized to 0–100 from the 1–5 Likert response scale
- Dominant preference: highest relative preference score; ties are preserved in `dominantPreferences`

## Result Contract
- `LEARNING_PREFERENCE_RESULT_V1`
- `LEARNING_PREFERENCE_SCORE_V1`
- `LEARNING_PREFERENCE_INTERPRETATION_V1`
- `LEARNING_PREFERENCE_CONFIG_V1`
- `LEARNING_PREFERENCE_QB_V1`
- `LEARNING_PREFERENCE_TAXONOMY_V1`
- `LEARNING_PREFERENCE_SELECTION_V1`

## Database
One explicit migration adds:
- AssessmentType enum value
- ReassessmentTestType enum value
- TestType
- taxonomy version + three taxonomy domains
- 30 published questions
- AssessmentConfiguration + active version
- runtime QuestionPackage + composition rules
- Medium / Advance product entitlements
- active bundle entitlement backfill

No destructive database operation is used.

## Scope Boundary
V19.2 does not implement:
- V19.3 report redesign
- V19.4 Profile integration
- V20 Career Advisor
- V21 WhatsApp

## Validation
The repository includes `pnpm v19.2:gate` for the static V19.2 contract gate.
Typecheck, build, migration deployment, runtime assessment, submit, scoring,
and result validation must still be executed on the user's local environment
before V19.2 can be declared PASS.
