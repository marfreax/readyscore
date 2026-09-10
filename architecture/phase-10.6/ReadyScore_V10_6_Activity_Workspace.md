# ReadyScore V10.6 — Activity Workspace

## 1. Objective

Turn `/activity` from a recent-history presentation into a lightweight customer journey workspace.

> **Activity = timeline perjalanan user + next action.**

The workspace answers:

> "Apa yang sudah saya lakukan dan apa yang perlu saya lanjutkan?"

This is a presentation refinement over existing activity data, not a new activity domain.

## 2. Baseline

Parent baseline: **V10.5 Assessment Workspace**.

V9.15 remains the protected product/measurement baseline. V10.6 does not change assessment, scoring, result, entitlement, or persistence semantics.

## 3. Existing source of truth

The page continues to use:

- authenticated `getCurrentSession()`
- existing `getUserActivity(userId)`
- existing `getUserHistory(userId)` through the activity service
- existing assessment attempt status
- existing result route `/result/[attemptId]`
- existing assessment runtime route `/assessments/[type]/test`
- existing `/assessments` workspace

No duplicate activity repository or business rule is introduced.

## 4. Timeline presentation

Records are ordered by the existing history service and grouped by the attempt start date.

Each activity record presents:

- assessment name
- status
- start/completion timestamps
- answered/total questions
- existing status description
- next action when applicable

Date groups use human-readable labels such as:

- TODAY
- YESTERDAY
- localized calendar date

The grouping is presentation-only.

## 5. Lightweight filters

The workspace provides three client-side filters:

### All
Shows every existing activity record.

### Assessments
Shows non-completed assessment activity, including in-progress, abandoned, and expired attempts.

### Results
Shows completed assessment records whose next destination is the existing individual result.

Filters do not query, mutate, or recalculate data. They only change the visible subset of the already-loaded activity list.

## 6. Actionability

| Existing state | Workspace action |
|---|---|
| IN_PROGRESS | Continue |
| COMPLETED | View result |
| ABANDONED | View assessments |
| EXPIRED | View assessments |

`Continue` routes to the existing assessment runtime. `View result` routes to `/result/[attemptId]`.

No new retake rule is introduced. If future product rules allow retake, they remain owned by existing reassessment logic.

## 7. Empty states

The workspace must not manufacture activity.

If there are no records:

- communicate that there is no activity yet
- provide a link to `/assessments`

If the Results filter is empty:

- communicate that no result is available yet
- provide a link to `/assessments`

## 8. Accessibility

The implementation provides:

- semantic sections and headings
- `aria-label` for the filter group
- `aria-pressed` on filter controls
- normal keyboard-operable buttons and links
- existing customer shell accessibility baseline

Responsive presentation uses the existing design-system classes and does not introduce a new breakpoint architecture.

## 9. Explicit exclusions

V10.6 does not introduce:

- new event tracking architecture
- activity database model
- analytics platform
- event ingestion redesign
- new scoring
- new result calculation
- universal score
- raw-average synthesis
- entitlement changes
- assessment runtime changes
- persistence changes

## 10. Definition of Done

- `/activity` remains available.
- Existing activity service remains the source of truth.
- Timeline presentation is clearer and action-oriented.
- All / Assessments / Results filters work client-side.
- Existing result/runtime destinations remain intact.
- No database migration is introduced.
- Contract gate passes.
- Typecheck and production build pass.
- Relevant runtime evidence is supplied by the user before acceptance.

## 11. Guardrail

> **V10 must make ReadyScore easier to understand, not make ReadyScore measure something new.**
