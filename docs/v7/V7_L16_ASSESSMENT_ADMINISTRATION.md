# V7 — L16 Assessment Administration & Instrument Configuration

## Scope
L16 provides a version-safe administrative workspace for assessment and instrument configuration across RIASEC, DISC, EQ, Cognitive, Free, and Premium assessment contracts.

## Version-safe assessment configuration
Assessment configuration is separated into a logical configuration record and immutable configuration versions. A configuration version records the question-bank, taxonomy, scoring, selection-algorithm, and question-count contract used by an assessment.

Historical configuration versions are never edited in place. Editing a logical configuration creates a new draft version. Activation is explicit; when a new version becomes active, the previous active version is archived. Active versions cannot be archived directly.

## Runtime protection
L16 is administrative configuration only. It does not alter measurement engines, scoring semantics, result semantics, profiling semantics, commercial fulfillment, reassessment semantics, or the existing attempt snapshot boundary.

Existing attempts retain their configuration/version snapshot so later administrative changes do not rewrite historical assessment meaning.

## Administrative capabilities
- List assessment configurations
- Inspect logical configuration and versions
- Create logical configuration
- Create a new draft configuration version
- Activate a configuration version
- Archive non-active versions
- View question-bank, taxonomy, scoring, selection, question-count, and lifecycle status metadata

## Lifecycle
`DRAFT → ACTIVE → ARCHIVED`

Activation is an explicit administrative operation. A new active version archives the prior active version for the same logical configuration.

## Database
L16 introduces the `AssessmentConfiguration` and `AssessmentConfigurationVersion` models and the corresponding migration. No measurement or scoring tables are rewritten.

## Customer/runtime boundary
The customer assessment runtime continues to consume its frozen attempt-level snapshot. L16 does not introduce a universal score or combine different assessment instruments into a single measurement model.
