# ReadyScore — V11.7 Development Specification
## Search + Filter + Sort + URL State + Question Bank Operations Hardening

**Document:** `ReadyScore_V11_7_Development_Specification_v1.0.md`  
**Phase:** V11.7  
**Baseline:** V11.6.15 — Phase 11.6 CLOSED / FROZEN  
**Status:** SPECIFICATION — READY FOR IMPLEMENTATION  
**Date:** 2026-09-06

---

# 1. Purpose

V11.7 extends the Admin Data Workspace foundation delivered in V11.6 into a reliable, server-driven Question Bank workspace.

The phase is anchored to the existing V11.7 roadmap scope:

- Search
- Filter
- Sort
- URL State

and incorporates the concrete behavioral findings discovered during real Question Bank usage after V11.6:

1. Search can produce an incorrect/empty visible result because client requests are fired on every keystroke without stale-response protection.
2. Search/filter context must remain server-side and deterministic.
3. Import preview currently validates CSV structure but duplicate Question IDs are only rejected during the import operation.
4. Question Bank summary statistics are currently global while Group/Status/Search context is active, which can make the workspace misleading.
5. Re-importing an existing logical Question requires an explicit governance rule and must not silently overwrite historical content.
6. `Import as Draft` must remain a hard invariant for all four Question Groups.
7. All four Question Groups must receive equivalent regression coverage:
   - DISC
   - RIASEC
   - IQ & Cognitive
   - EQ

V11.7 must improve operational correctness without reopening frozen measurement, scoring, result, entitlement, or historical-assessment semantics.

---

# 2. Baseline and Boundary

## 2.1 Frozen Baseline

V11.6 is considered CLOSED / FROZEN.

V11.6 delivered the Admin Data Workspace foundation:

- Audit repository and audit API
- Reusable pagination utility
- Audit pagination API
- Reusable `AdminPagination`
- Audit Workspace
- Question Bank server-side pagination
- Review server-side pagination
- Users server-side pagination
- Audit detail
- Read-only audit authorization
- Full Phase 11.6 runtime E2E
- Typecheck
- Production build
- Delivery manifest and delivery notes

V11.7 must build on this baseline and must not reopen V11.6 tasks unless a direct V11.7 dependency requires a narrowly scoped correction.

## 2.2 Product Boundary

V11.7 is an Admin Operations / Data Workspace phase.

It does not redesign the customer assessment experience.

It does not change:

- RIASEC measurement semantics
- DISC measurement semantics
- EQ measurement semantics
- Cognitive measurement semantics
- scoring semantics
- result semantics
- reassessment semantics
- entitlement semantics
- commercial pricing
- cross-test profiling semantics
- historical assessment result interpretation

Any change to those areas requires an explicit architectural decision outside ordinary V11.7 implementation.

## 2.3 Historical Safety

The canonical model remains:

```text
Question
    =
stable logical identity

QuestionVersion
    =
immutable assessment-facing version
```

An existing Question must never be silently overwritten.

If an existing Question needs a changed assessment-facing definition, the system must create a new QuestionVersion according to the established version-safe governance model.

Historical assessment content remains immutable.

---

# 3. V11.7 Goals

## G1 — Reliable Server-Side Search

Search must reliably find the correct Question Bank records by supported fields without stale client responses overwriting newer results.

## G2 — Deterministic Filtering

Group and status filters must be applied server-side against the canonical latest QuestionVersion representation.

## G3 — Deterministic Sorting

Sorting must be explicit, stable, bounded, and compatible with pagination.

## G4 — URL-Persisted Workspace State

Search, filter, sort, pagination, and page size must be representable in URL query state so that:

- refresh preserves context
- browser back/forward works
- a workspace can be shared/bookmarked
- state is not hidden only in React memory

## G5 — Honest Import Preview

CSV preview must distinguish:

```text
syntactically valid
```

from:

```text
ready to import
```

Duplicate logical Question IDs must be detected before the final import action wherever practical.

## G6 — Import-as-Draft Safety

For DISC, RIASEC, IQ & Cognitive, and EQ:

```text
Import as Draft
        ↓
new Question / QuestionVersion
        ↓
status = DRAFT
        ↓
NO auto-publish
NO auto-activate
NO mutation of existing published version
```

This must be enforced server-side, not only by UI wording.

## G7 — Context-Correct Statistics

Question Bank statistics must clearly correspond to the active workspace context, or the UI must explicitly label them as global.

The user must never reasonably interpret global totals as totals for the currently selected Question Group or filtered result set.

## G8 — Governance-Correct Re-import

An existing logical Question ID must not be silently treated as a brand-new Question.

V11.7 must make the behavior explicit:

- duplicate detection
- clear preview
- clear user-facing error/decision
- version-safe handling if version creation is supported
- no historical overwrite

---

# 4. Supported Question Groups

V11.7 applies the same workspace principles to all four Question Groups:

| Question Group | Canonical Code | Required Regression |
|---|---|---|
| DISC | `DISC` | YES |
| RIASEC | `RIASEC` | YES |
| IQ & Cognitive | `COGNITIVE` | YES |
| EQ | `EQ` | YES |

The implementation must not contain a Question Group-specific workaround that causes the four groups to behave differently unless the difference is explicitly required by their question format.

---

# 5. Search Specification

## 5.1 Search Contract

Search is a server-side query.

Minimum supported search targets:

- Question code
- Question text
- taxonomy/domain information already exposed by the Question Bank workspace

Search must operate on the canonical latest QuestionVersion representation used by the workspace.

Search must not perform an unbounded client-side `.filter()` over a large fetched dataset.

## 5.2 Matching

Search should be case-insensitive.

Whitespace should be normalized sufficiently to avoid surprising failures caused by accidental leading/trailing spaces.

The search implementation must remain deterministic.

## 5.3 Search Request Lifecycle

The client must protect against stale responses.

Preferred implementation:

```text
User input
    ↓
debounce
    ↓
AbortController / request cancellation
    ↓
request sequence or equivalent stale-response guard
    ↓
latest response only
    ↓
update workspace
```

The following behavior is forbidden:

```text
request A: "K"
request B: "Ket"
request C: "Ketika target..."

response C arrives
response A arrives later
response A overwrites response C
```

A stale response must never replace a newer workspace state.

## 5.4 Empty Search

Empty/whitespace-only search must mean:

```text
no text constraint
```

not a literal search for an empty string.

## 5.5 Search Example

The following must be findable in DISC:

```text
Ketika target tim tertinggal dari rencana, Anda cenderung dalam rapat?
```

Searching:

```text
Ketika target tim tertinggal
```

must return the corresponding Question when the record exists and no other active filter excludes it.

This case must become an automated regression.

---

# 6. Filter Specification

## 6.1 Question Group Filter

Supported groups:

```text
ALL
DISC
RIASEC
COGNITIVE
EQ
```

The selected group must be reflected in the server query and URL state.

## 6.2 Status Filter

Supported status values must follow the existing QuestionStatus contract.

At minimum the workspace must continue supporting the existing operational statuses without inventing a second status vocabulary.

The status filter must operate against the latest QuestionVersion representation.

## 6.3 Combined Filters

Search + group + status must compose server-side.

Example:

```text
group=DISC
status=DRAFT
search=Ketika target tim tertinggal
```

must not be implemented as:

```text
fetch arbitrary page
↓
client filter
```

It must be represented in the database query.

## 6.4 Filter Reset

Changing:

- search
- group
- status
- sort field
- sort direction

must reset pagination to page 1.

Changing page or page size must not unexpectedly clear the other workspace state.

---

# 7. Sorting Specification

## 7.1 Supported Sort Dimensions

V11.7 should expose only useful bounded sort options, for example:

- Question Code
- Updated At
- Created At
- Status

The exact UI labels may follow the existing Admin design language.

## 7.2 Deterministic Tie-Breaker

Every sort must include a deterministic secondary key.

Example:

```text
updatedAt DESC
questionVersionId DESC
```

or equivalent according to the selected primary sort.

This is mandatory because pagination without a stable tie-breaker can duplicate or skip rows between pages.

## 7.3 Sort + Pagination

Sorting must occur before:

```text
LIMIT
OFFSET
```

and must be performed by the database.

No client-side sorting of a partial page is allowed.

---

# 8. URL State Specification

## 8.1 Canonical URL State

The Question Bank workspace must encode relevant state in query parameters.

Recommended canonical form:

```text
/admin/question-bank
  ?group=DISC
  &status=DRAFT
  &search=Ketika+target
  &sort=updatedAt
  &direction=desc
  &page=1
  &pageSize=25
```

Only active/non-default values need to be emitted if the implementation chooses a cleaner canonical URL.

## 8.2 Required Behavior

Refresh:

```text
URL state
    ↓
same workspace state
```

Browser Back:

```text
previous URL state
    ↓
previous workspace state
```

Browser Forward:

```text
next URL state
    ↓
next workspace state
```

Direct navigation to a URL with valid query state must reproduce that state.

## 8.3 Invalid URL Values

Invalid:

- group
- status
- sort
- direction
- page
- pageSize

must be normalized to safe defaults.

The system must not crash or issue an unbounded query because of malformed URL state.

---

# 9. Pagination Integration

V11.7 builds on the reusable V11.6 pagination contract.

Required properties:

- bounded page size
- deterministic ordering
- database-level pagination
- total count consistent with active query constraints
- page boundary correctness
- out-of-range behavior

Pagination must operate after:

```text
search
+
filter
+
sort
```

and not before.

---

# 10. Statistics / Summary Contract

## 10.1 Problem

Current Question Bank cards can show global statistics while the user has selected a specific group or filter.

Example:

```text
DISC
DRAFT
```

while cards still show:

```text
Total     701
Draft     409
Published 288
```

Those figures are global and can be misleading.

## 10.2 V11.7 Requirement

The implementation must choose one of two explicit contracts:

### Preferred

Statistics follow the active Question Group and relevant workspace filters.

or:

### Alternative

Statistics remain global, but the UI must explicitly label them:

```text
Global Question Bank
```

and must not visually imply that they describe the current filtered result set.

## 10.3 Consistency

The same query context must produce consistent:

```text
summary
+
result count
+
pagination.totalItems
```

where the summary is intended to describe the filtered workspace.

---

# 11. Import Preview and Duplicate Detection

## 11.1 Current Problem

Current preview can report:

```text
Preview valid: 100 rows.
```

while import subsequently fails with:

```text
DUPLICATE_QUESTION_IDS
```

This creates an incorrect mental model:

```text
valid
=
ready to import
```

## 11.2 Required Separation

Preview must distinguish at least:

```text
CSV parsing valid
```

from:

```text
Import readiness
```

Example:

```text
100 rows parsed
20 duplicate Question IDs
80 rows ready to import
```

If the selected import mode is strict append-only, the final state may be:

```text
IMPORT BLOCKED
20 duplicate Question IDs
```

## 11.3 Duplicate Detection

Duplicate detection must check logical Question identity, not only the currently visible page.

It must operate against the database.

It must not depend on:

```text
current search
current status filter
current pagination page
```

A Question is duplicate because the logical Question ID already exists, regardless of whether the existing version is currently visible in the workspace.

## 11.4 Duplicate List

The UI must provide a useful bounded duplicate list.

Example:

```text
Duplicate Question IDs:
DISC-001
DISC-002
...
```

If there are many duplicates, show a count plus a bounded preview.

## 11.5 No Silent Overwrite

Duplicate handling must never silently overwrite an existing QuestionVersion.

---

# 12. Re-import / Version Governance

V11.7 must explicitly document the selected behavior for an existing Question ID.

The safe baseline is:

```text
Existing Question ID
        ↓
NOT a new logical Question
        ↓
do not overwrite existing version
        ↓
reject as duplicate
```

If V11.7 introduces a deliberate:

```text
Import as New Version
```

mode, it must:

- create a new QuestionVersion
- preserve the previous version
- set the new version to DRAFT
- never auto-publish
- never auto-activate
- create the appropriate audit trail
- respect historical assessment immutability

Such a mode is optional and must not be inferred from the existing `Import as Draft` button.

---

# 13. Import-as-Draft Invariant

This is a mandatory safety contract.

For every Question Group:

```text
DISC
RIASEC
COGNITIVE
EQ
```

the following invariant must hold:

```text
Import as Draft
    ↓
new assessment-facing content
    ↓
QuestionVersion.status = DRAFT
```

and:

```text
must NOT:
    PUBLISH
    ACTIVATE
    alter an existing published version
    recalculate historical results
    change assessment configuration
    change customer entitlements
```

This must be enforced at the repository/service layer.

UI text alone is insufficient.

---

# 14. Four-Group Import Regression

The 100-question sample fixtures created for the four Question Groups should be used as regression fixtures:

```text
disc-question-bank-sample-100.csv
eq-question-bank-sample-100.csv
iq_cognitive-question-bank-sample-100.csv
riasec-question-bank-sample-100.csv
```

For each group:

## Scenario A — Preview

```text
Upload CSV
↓
Preview CSV
↓
100 rows parsed
```

Expected:

- correct group
- correct question type
- correct row count
- mapping state displayed correctly
- no mutation

## Scenario B — Import as Draft

```text
Import as Draft
```

Expected:

- +100 logical Questions when IDs are new
- +100 Draft latest versions
- Published count unchanged
- Approved count unchanged unless the architecture explicitly counts another entity
- no automatic activation
- no automatic publishing

## Scenario C — Duplicate Re-import

Upload the exact same CSV again.

Expected:

- duplicate IDs detected
- no silent duplicate logical Questions
- no overwrite
- clear user-facing result

## Scenario D — Search

Search for a known phrase from each fixture.

Example DISC:

```text
Ketika target tim tertinggal
```

Expected:

- matching Question appears
- no stale-response corruption

Equivalent known search terms must be tested for RIASEC, Cognitive, and EQ.

## Scenario E — Filter

For each group:

```text
Group = <group>
Status = DRAFT
```

Expected:

- newly imported records are discoverable as DRAFT
- no published records are falsely returned as DRAFT

## Scenario F — URL State

Set:

```text
group
status
search
sort
page
pageSize
```

then refresh.

Expected:

- state remains identical.

---

# 15. API Contract

## 15.1 Question Bank GET

The existing endpoint remains the canonical read endpoint.

It must accept bounded parameters for:

```text
group
status
search
sort
direction
page
pageSize
```

and return:

```json
{
  "ok": true,
  "questions": [],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "totalItems": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  },
  "summary": {}
}
```

Exact response fields must remain backward compatible where existing consumers depend on them.

## 15.2 Authorization

Admin API routes remain protected by:

```text
requireAdminApi()
```

No V11.7 search/filter endpoint may expose Question Bank content without admin authorization.

---

# 16. Repository Contract

The repository remains responsible for:

- database filtering
- database search
- database sorting
- pagination
- deterministic ordering
- bounded reads
- duplicate detection
- version-safe import behavior

The UI must not become the source of truth for these operations.

Repository methods must not fetch an unbounded Question Bank into memory merely to perform filtering/sorting.

---

# 17. Concurrency and Race Safety

## 17.1 Search

Latest request wins.

Possible mechanisms:

- `AbortController`
- monotonically increasing request ID
- equivalent stale-response guard

At least one must be implemented.

## 17.2 Import

Import must be transaction-safe.

The system must not partially create content if the operation is rejected by a duplicate or validation condition under the selected strict mode.

## 17.3 Statistics

Summary and page results should be generated from a coherent query context.

Where necessary, use a database transaction for:

```text
count
+
page
+
summary
```

to minimize inconsistent workspace state.

---

# 18. Audit Contract

V11.7 mutations must continue to use the existing audit contract.

At minimum, import/version-changing operations must make the relevant action traceable.

Search/filter/sort reads do not need mutation audit events.

No audit event should claim a publish/activate operation when none occurred.

---

# 19. UX Requirements

The workspace should communicate the operational state clearly.

Required principles:

- active filters are obvious
- search state is obvious
- result count refers to the active query context
- empty state explains why no records are shown
- duplicate import errors are actionable
- loading state does not create misleading stale results
- buttons preserve stable dimensions
- disabled/loading states are explicit
- no action should appear to have succeeded when the server rejected it

For empty search results, show useful context such as:

```text
No questions found
```

plus active constraints where appropriate.

---

# 20. Non-Goals

V11.7 does not include:

- psychometric recalibration
- new measurement dimensions
- scoring redesign
- result payload redesign
- customer assessment UX redesign
- new commercial products
- entitlement redesign
- historical result recalculation
- automatic bulk publishing
- automatic bulk activation
- replacing Question/QuestionVersion identity
- rewriting historical QuestionVersions
- universal score
- raw-average synthesis
- reopening Phase 11.6

---

# 21. Security Requirements

- All Question Bank APIs remain admin-protected.
- URL parameters are untrusted input and must be validated.
- Search queries must remain bounded.
- Pagination page size must remain bounded by the existing AdminPagination contract.
- No raw SQL may interpolate untrusted values directly.
- Import content must be validated before persistence.
- Duplicate detection must occur server-side.
- Import cannot elevate content to PUBLISHED or ACTIVE merely because a CSV contains arbitrary status-like data.
- Client-side controls must never be treated as authorization.

---

# 22. Testing Strategy

## 22.1 Static Gate

Create:

```text
scripts/validate-v11-7-*.mjs
```

covering:

- required artifacts
- package scripts
- API contract
- repository contract
- URL-state contract
- no forbidden Prisma migration
- import-as-draft invariant
- four-group coverage
- safety boundaries

## 22.2 Typecheck

Must pass:

```text
pnpm typecheck
```

## 22.3 Production Build

Must pass:

```text
pnpm build
```

Expected baseline remains:

```text
61/61 static pages
```

unless a deliberate route change is documented.

## 22.4 Runtime E2E

At minimum:

### Search
- exact phrase
- partial phrase
- case-insensitive search
- empty search
- stale-response/race scenario

### Filter
- each group
- each relevant status
- group + status
- search + group
- search + status
- search + group + status

### Sort
- each supported sort
- ascending
- descending
- deterministic tie-breaker
- sort + pagination

### URL
- initial state
- refresh
- direct URL
- browser navigation where harness supports it
- invalid query normalization

### Import
For all four groups:
- preview
- import as draft
- duplicate re-import
- published count unchanged
- draft count increase
- no auto-publish
- no auto-activate

### Boundary
- unauthenticated page guard
- unauthenticated API guard
- malformed query parameters
- page boundary
- page-size boundary
- empty result

---

# 23. Acceptance Matrix

| Area | Acceptance |
|---|---|
| Search | Correct result for known partial text |
| Search race | Stale response cannot overwrite newer result |
| Group filter | Correct server-side group filtering |
| Status filter | Correct latest-version status filtering |
| Combined filters | Correct server-side composition |
| Sort | Stable deterministic ordering |
| Pagination | Correct after search/filter/sort |
| URL state | Refresh preserves workspace |
| Empty state | Honest and contextual |
| Statistics | Context-correct or explicitly global |
| Preview | Distinguishes valid CSV from import readiness |
| Duplicate detection | Detected before destructive/committing action |
| Import as Draft | Always creates DRAFT |
| Import safety | No auto-publish / auto-activate |
| Existing Question | No silent overwrite |
| DISC | Full regression |
| RIASEC | Full regression |
| Cognitive | Full regression |
| EQ | Full regression |
| Auth | Admin-only |
| Audit | Mutation traceability preserved |
| Typecheck | PASS |
| Build | PASS |
| Runtime E2E | PASS |

---

# 24. Development Order

The implementation should proceed in this order:

```text
V11.7.1  Search Contract & Repository
        ↓
V11.7.2  Search UI Reliability / Debounce / Stale Response
        ↓
V11.7.3  Filter Contract
        ↓
V11.7.4  Sort Contract
        ↓
V11.7.5  URL State
        ↓
V11.7.6  Context-Correct Pagination Integration
        ↓
V11.7.7  Context-Correct Statistics
        ↓
V11.7.8  Import Preview Duplicate Analysis
        ↓
V11.7.9  Import-as-Draft Safety Hardening
        ↓
V11.7.10 Existing Question / Version Governance
        ↓
V11.7.11 Four-Group Regression Fixtures
        ↓
V11.7.12 Search / Filter / Sort Runtime E2E
        ↓
V11.7.13 Import Runtime E2E
        ↓
V11.7.14 Typecheck
        ↓
V11.7.15 Production Build
        ↓
V11.7.16 Delivery Manifest
        ↓
V11.7.17 Delivery Notes / Closure
```

The exact number of sub-tasks may be consolidated during implementation, but the dependency order must be preserved.

---

# 25. Definition of Done

V11.7 is complete only when all of the following are true:

1. Specification is implemented.
2. Search is server-side and race-safe.
3. Filters are server-side.
4. Sorting is server-side and deterministic.
5. URL state is canonical and restorable.
6. Pagination remains bounded and deterministic.
7. Statistics are context-correct or explicitly labeled global.
8. Import preview exposes duplicate readiness information.
9. Import-as-Draft is server-enforced for all four groups.
10. Existing Question IDs cannot be silently overwritten.
11. DISC regression passes.
12. RIASEC regression passes.
13. IQ & Cognitive regression passes.
14. EQ regression passes.
15. Admin authorization remains intact.
16. Audit behavior remains correct.
17. Static gate passes.
18. Runtime E2E passes.
19. `pnpm typecheck` passes.
20. `pnpm build` passes.
21. Delivery manifest is present.
22. Delivery notes are present.
23. No forbidden measurement/scoring/result semantics have been changed.
24. No V11.6 work is reopened without explicit justification.

---

# 26. Release Safety Statement

V11.7 is an Admin Operations hardening phase.

Its purpose is to make Question Bank operations:

```text
searchable
filterable
sortable
shareable
predictable
version-safe
import-safe
```

It must not convert Admin convenience features into uncontrolled content mutation.

The governing lifecycle remains:

```text
CREATE
  ↓
VALIDATE
  ↓
REVIEW
  ↓
APPROVE
  ↓
VERSION
  ↓
PUBLISH
  ↓
ACTIVATE
```

Importing a Question is not equivalent to publishing or activating it.

The administrator's ability to discover and manage content must remain separate from the customer's historical assessment reality.

---

# 27. V11.7 Closure Boundary

V11.7 must not be considered closed merely because the UI visually supports search/filter/sort.

Closure requires behavioral proof.

The minimum final evidence must demonstrate:

```text
Search
    PASS

Filter
    PASS

Sort
    PASS

URL State
    PASS

Pagination
    PASS

Import Preview
    PASS

Import as Draft
    PASS

Duplicate Governance
    PASS

DISC
    PASS

RIASEC
    PASS

IQ & Cognitive
    PASS

EQ
    PASS

Runtime E2E
    PASS

Typecheck
    PASS

Production Build
    PASS
```

Only after these conditions are met should V11.7 be marked CLOSED / FROZEN and the next phase be started.
