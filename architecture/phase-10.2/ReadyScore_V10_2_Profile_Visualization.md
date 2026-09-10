# ReadyScore V10.2 — Profile Visualization

## Core Definition

> **My Profile = gambaran evidence lintas assessment yang sudah tersedia.**

Profile bukan assessment baru, bukan universal score, dan bukan pengganti individual result.

## Primary Visualization

Use a spider web / radar-style visualization as an **evidence coverage map**. The visualization must not imply that heterogeneous assessment scores are directly comparable.

The V10.2 presentation therefore uses the existing profile domain availability as the visual signal. It does not calculate a new radius from assessment scores, normalize scores, average scores, or create a universal score.

## Required States

### State A — No Assessment
- neutral radar/web
- no fake score
- no zero score
- message: `Your profile is starting to take shape.`
- CTA: `Start an assessment`

### State B — Partial Assessment
- distinguish domains with evidence from domains without evidence
- domains without evidence show `No evidence / Not available`
- no zero value is manufactured for missing evidence

### State C — Full Coverage
- full evidence coverage visualization
- existing coverage summary
- supporting source information

## Profile Domains

- Ability
- Emotional
- Resilience
- Behavior
- Interest
- Strength
- Learning

## Supporting Sources

Use the existing profile source information for:
- Cognitive
- DISC
- RIASEC
- EQ

Presentation must not change the semantic meaning of the source assessment.

## Accessibility

The radar has a textual equivalent that states, per domain:
- domain
- evidence available / not available
- source information where evidence exists

The visualization is supplementary; the textual evidence map is the accessible semantic representation.

## Existing Logic Reuse

Reuse the existing Cross-Test Profile service and engine. Do not duplicate profile business logic in the UI.

## Prohibited

- new scoring
- cross-test score normalization
- raw averaging
- universal score
- new interpretation semantics
- new measurement construct
- entitlement mutation
- database migration
- historical result mutation

## Route Preservation

The existing `/profile` route remains intact. Existing routes `/app`, `/access`, `/assessments`, `/activity`, `/reports`, `/result/[attemptId]`, and `/reassessment/[type]` remain preserved.

## Definition of Done

- implementation matches V10.2 specification
- no prohibited mutation occurred
- typecheck passes
- relevant build passes
- no-assessment, partial, and full-coverage states are represented
- textual accessibility equivalent is present
- existing profile service remains the source of truth
- existing routes remain intact
- actual runtime evidence is available before final PASS
