# ReadyScore V9.11 — Reports & Activity

## Status
IMPLEMENTED — customer presentation and read-only reporting/activity layer.

## Scope
V9.11 consolidates two customer workspace surfaces:
- Reports: accessible report summaries and links to source results / Parent View.
- Recent Activity: chronological assessment-attempt history with next actions.

## Protected boundaries
V9.11 does not:
- change measurement constructs;
- change scoring;
- change question banks;
- create a universal score;
- average unrelated assessment scores;
- reinterpret source result semantics;
- mutate historical attempts or QuestionVersion records;
- introduce a database migration;
- grant access outside canonical entitlement and ownership checks.

V9.11 does not introduce a database migration. There is no database migration in V9.11.

## Reports contract
Existing `REPORT_V1` remains the source contract. `REPORT_ENGINE_V1` remains authoritative for report summary generation.
V9.11 adds presentation around:
- assessment count;
- completed result count;
- report availability;
- result-contract metadata;
- source result navigation;
- Parent View navigation;
- explicit report limitations.

Parent View remains read-only and must preserve the semantic owner of the underlying assessment result.

## Activity contract
`ACTIVITY_V1` is a read-only projection of the existing assessment history repository.
Activity exposes:
- total attempt count;
- completed count;
- in-progress count;
- inactive count;
- attempt status;
- started/completed timestamps;
- answered/total question counts;
- next action.

Activity does not create new measurement evidence.

## Security / ownership
All customer surfaces require an authenticated session.
Reports continue to use `REPORT_ACCESS / ADVANCED_REPORT_V1`.
Parent reports require both the canonical report entitlement and `attemptId + userId` ownership.
Activity uses `getUserHistory(userId)` and therefore remains account-scoped.

## UX
Reports:
1. summary
2. available result cards
3. source result
4. optional Parent View
5. report boundary / guidance

Activity:
1. summary counters
2. activity timeline
3. status and timestamps
4. next action
5. ownership/read-only boundary

## Regression
Required:
- typecheck
- production build
- V9.0 through V9.10 gates
- V9.11 gate
- no migration
- existing report parent gate remains compatible
- no universal-score/raw-average synthesis
