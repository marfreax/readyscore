# ReadyScore V13.1 — Question Package & Configuration

## Status
V13.1 implementation reference. Built directly from the locked V13 Question Architecture specification.

## Scope
V13.1 establishes the generic Question Package configuration foundation only.

### Included
- Generic Question Package logical identity.
- Versioned package configuration.
- Dynamic package count per Test Type.
- Total question count.
- Taxonomy version linkage.
- Generic composition rules linked to taxonomy nodes.
- Server-side configuration validation.
- Package lifecycle: DRAFT, REVIEW, APPROVED, PUBLISHED, ARCHIVED.
- Admin inspection/create/new-version/publish/archive operations.
- Content audit events for package-version governance.

### Explicitly deferred
- Runtime package selection.
- Question selection from package composition.
- Question order randomization.
- Timer enforcement on AssessmentAttempt.
- Autosave/resume/timeout runtime behavior.
- Payment/access delivery.

Those belong to V13.2/V13.3 according to the locked V13 specification.

## Data Boundary
`QuestionPackage` is the logical package identity.
`QuestionPackageVersion` is the immutable delivery configuration version.
`QuestionPackageCompositionRule` stores the required count for a taxonomy node.

Question Package does not contain scoring logic.

## Configuration invariants
A publishable package version must satisfy:
1. Positive total question count.
2. Positive time limit in seconds.
3. Valid Test Type.
4. Valid taxonomy belonging to the same Test Type.
5. At least one composition rule.
6. Positive composition counts.
7. No duplicate taxonomy node rules.
8. Composition sum exactly equals total question count.
9. Every composition node belongs to the selected taxonomy.

V13.1 does not yet validate whether enough published questions exist to satisfy the composition. That is runtime/question-pool validation work for V13.2.

## Compatibility principle
The existing Question, QuestionVersion, AssessmentAttempt, AttemptQuestion, and scoring foundations remain intact. V13.1 adds a package layer rather than replacing those foundations.
