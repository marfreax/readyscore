# V13.2 E2E Fixture Preparation

The V13.2 runtime E2E is intentionally self-contained. V13.1 does not seed production Question Packages, so a clean database can legitimately have no runtime-eligible package.

Before calling `/api/assessment/start`, the E2E script creates or refreshes deterministic PostgreSQL-only fixture packages for DISC, EQ, Cognitive, and RIASEC. Each fixture:

- uses an existing ACTIVE taxonomy;
- references existing taxonomy DOMAIN nodes;
- uses the assessment's current configured question count;
- requires the expected per-domain composition;
- is marked `PUBLISHED` only for the purpose of the E2E runtime test;
- is tagged `e2eFixture: true` in metadata.

No production Question or QuestionVersion records are created or rewritten by fixture preparation. The fixture package exists solely so the real HTTP + PostgreSQL E2E can exercise V13.2 package eligibility and composition selection without requiring a manual admin setup step.
