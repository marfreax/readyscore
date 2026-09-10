# ReadyScore V11.4 — Admin Operations Dashboard

## Objective

Make the Admin surface capable of detecting operational problems before customers encounter them.

## Canonical data

Dashboard indicators are derived at request time from canonical operational state:
- latest QuestionVersion per logical Question;
- QuestionStatus and MappingStatus;
- assessment configuration versions and readiness evaluation;
- AdminContentAuditEvent.

No manually maintained dashboard counters are introduced.

## Dashboard sections

1. Assessment Health
   - DISC
   - RIASEC
   - IQ & Cognitive
   - EQ
2. Content Health
   - Draft / workflow
   - Validation issues
   - Mapping issues
   - Unpublished
   - Published
   - Active / usable
3. Configuration Health
   - Ready
   - Warning
   - Blocked
4. Recent Admin Activity
   - actor
   - timestamp
   - object
   - action
   - previous/new state
5. Actionable Warnings
   - blocked configuration
   - content validation issue
   - incomplete mapping
   - workflow backlog
   - unpublished content

## Safety boundary

The dashboard is read-only. It does not create, update, delete, publish, activate, archive, or otherwise mutate operational/customer data.

Customer eligibility continues to use the canonical published + approved mapping + content contract boundary. Historical attempts and results are not rewritten.

## Admin authorization

The page remains behind `requireAdmin()`. Data access is server-side and does not rely on client-side authorization.

## No schema migration

V11.4 uses the existing database contract and introduces no Prisma migration.
