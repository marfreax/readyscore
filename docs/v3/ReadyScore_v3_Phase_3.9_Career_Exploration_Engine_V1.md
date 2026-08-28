# ReadyScore v3 — Phase 3.9 Career Exploration Engine V1

Status: IMPLEMENTATION CANDIDATE / GATE PENDING

## Frozen Boundary

Phase 3.9 consumes, and does not redefine:

- F.10-C.2-F
- Phase 3.1 Commercial
- Phase 3.2 Test Catalog & Taxonomy
- Phase 3.3 Question Bank
- Phase 3.4 Scoring
- Phase 3.5 Result & Interpretation
- Phase 3.6 Cross-Test Profile
- Phase 3.7 Study Direction
- Phase 3.8 Major Fit

## Canonical boundary

```text
Profile
  +
Study Direction
  +
Major Fit
  +
Career Profile
      ↓
Career Exploration
```

Career Exploration is exploration-oriented. It must not become deterministic career assignment.

## Career Profile

A career profile is versioned and defines:

- careerId
- optional careerCode
- name
- career family
- study areas
- optional major IDs
- version
- evidence requirements

Requirements may accept explicit Profile signal IDs. Required requirements define the evidence denominator.

## Evidence model

Each career requirement resolves to:

- AVAILABLE
- PARTIAL
- INSUFFICIENT

The engine preserves source Test Type provenance.

No arithmetic average is performed across heterogeneous assessment scores.

## Output

The V1 result contains:

- contractVersion
- engineVersion
- career identity/version
- upstream Study Direction and Major Fit identity
- evidence status
- requirement evidence
- completeness
- career family
- aligned study areas
- aligned majors
- supporting evidence
- areas to strengthen
- exploration notes
- limitations
- allowed/restricted/prohibited claims

No universal `overallScore`, `fitScore`, `careerScore`, probability, or success prediction is introduced.

## Claim governance

Allowed:

- career families worth exploring
- evidence-based exploration opportunities
- areas to strengthen
- evidence gaps

Prohibited:

- deterministic career assignment
- guaranteed employment
- guaranteed career success
- guaranteed income/promotion
- probability of career success presented as a measurement
- one-test-only deterministic career recommendation
- raw averaging of heterogeneous assessment scores

## Gate

```bash
pnpm typecheck
pnpm build
pnpm career-exploration:gate
pnpm e2e:riasec
```

Database migration is not required by the V1 engine implementation because career profiles are configuration contracts, not persisted assessment lifecycle state.
