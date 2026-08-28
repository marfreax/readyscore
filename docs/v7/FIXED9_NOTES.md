FIXED9 — V7 L16 Assessment Configuration correction

Root cause of the previous L16 E2E failure:
The CREATE operation created the first configuration version as DRAFT. The L16 runtime E2E then explicitly activated the second version and correctly expected the previously active version to become ARCHIVED. Because v1 was never ACTIVE, the assertion failed.

Correction:
- createConfiguration() now creates the initial configuration version as ACTIVE.
- createConfigurationVersion() continues to create subsequent versions as DRAFT.
- activateConfigurationVersion() archives the current ACTIVE version before activating the requested version.
- archiveConfigurationVersion() continues to reject ACTIVE versions.

Canonical documentation path:
docs/v7/V7_L16_ASSESSMENT_ADMINISTRATION.md

No new migration is introduced by this correction. The existing L16 migration remains the migration to deploy.
