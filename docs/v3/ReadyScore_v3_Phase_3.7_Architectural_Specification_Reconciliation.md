# ReadyScore v3 — Phase 3.7
# Study Direction Engine — Architectural / Specification Reconciliation

**Status:** DESIGN RECONCILIATION / FROZEN BOUNDARY  
**Phase:** 3.7 — Study Direction Engine  
**Baseline:** F.10-C.2-F + Phase 3.1 + 3.2 + 3.3 + 3.4 + 3.5 + 3.6  
**Implementation status:** NOT YET IMPLEMENTED  
**Output folder:** `phase-3.7-output/`

---

## 0. Executive Decision

Phase 3.7 is the first phase that converts the frozen Cross-Test Profile into a **Study Direction** output.

The engine must not become:

- a second scoring engine;
- a generic recommendation generator;
- a major-fit engine;
- a career engine;
- an AI interpretation layer;
- a universal score calculator.

The canonical chain is:

```text
TEST RESULTS
    ↓
TEST-SPECIFIC INTERPRETATION
    ↓
CROSS-TEST PROFILE
    ↓
STUDY DIRECTION ENGINE
    ↓
STUDY AREA / DIRECTION
    ↓
PHASE 3.8 — MAJOR FIT
    ↓
PHASE 3.9 — CAREER EXPLORATION
```

Phase 3.7 therefore owns **study-area correspondence**, not major selection.

---

# 1. Frozen Boundary

The following are treated as upstream and frozen for this phase:

```text
F.10-C.2-F
RIASEC actual runtime E2E
        +
3.1 Commercial / Entitlement architecture
        +
3.2 Test Catalog / Taxonomy
        +
3.3 Test-Specific Question Bank
        +
3.4 Scoring Engine V2 architecture
        +
3.5 Result & Interpretation Engine
        +
3.6 Cross-Test Profile Engine
```

The RIASEC runtime remains a regression minimum.

Phase 3.7 must not reopen RIASEC implementation merely because the Direction Engine needs additional evidence. Missing upstream evidence is a **capability limitation**, not permission to mutate frozen measurement.

---

# 2. Four-Layer Reconciliation

Every Phase 3.7 implementation must reconcile:

```text
V3 MASTER ARCHITECTURE
        ↕
PHASE 3.7 SPECIFICATION
        ↕
ACTUAL SOURCE / DATABASE
        ↕
FROZEN RUNTIME
```

### Current source reality

The supplied application already contains:

- `lib/profile/engine-v1.ts`
- `lib/profile/types.ts`
- `lib/profile/adapters/riasec.ts`
- `lib/assessment/riasec/result-contract.ts`
- `lib/assessment/riasec/result-adapter.ts`
- `scripts/validate-cross-test-profile-engine-v1.mjs`

The current Cross-Test Profile implementation:

- has seven profile domains;
- has only a RIASEC adapter registered;
- preserves test-specific signal semantics;
- does not expose a universal `overallScore`;
- explicitly prohibits raw averaging;
- marks unsupported test types as insufficient rather than inventing evidence.

That behavior is the required upstream contract.

---

# 3. Phase 3.7 Objective

The objective is to answer:

> **Given the evidence actually available in a user's Cross-Test Profile, which broad study areas are worth exploring next, and why?**

The engine must produce:

1. candidate study areas;
2. correspondence/evidence strength;
3. supporting signals;
4. potential challenges / tensions;
5. missing evidence;
6. exploration prompts;
7. confidence/sufficiency metadata;
8. claim governance.

It must not produce:

```text
"You should major in X."
```

or:

```text
"You will succeed in X."
```

---

# 4. Study Direction vs Major Fit

This distinction is mandatory.

## Phase 3.7

```text
Profile
  ↓
Study Area
```

Examples:

- Technology & Computing
- Engineering
- Business & Management
- Health & Life Sciences
- Social Sciences
- Communication & Media
- Design & Creative
- Education
- Law & Policy
- Agriculture & Environmental
- Architecture & Built Environment
- Hospitality & Service

These are **exploration domains**, not final majors.

## Phase 3.8

```text
Study Area
  ↓
Major
  ↓
Major Fit
```

Phase 3.7 must not contain university or major-specific logic.

---

# 5. Evidence Hierarchy

The Phase 3.0 measurement model defines the provisional recommendation hierarchy.

## Primary signals

```text
INTEREST
COGNITIVE ABILITY
RELEVANT STRENGTH
```

## Supporting signals

```text
PERSONALITY
LEARNING
EQ
AQ
```

## Contextual signals

```text
USER GOALS
ACADEMIC BACKGROUND
CONSTRAINTS
PREFERENCES
```

This hierarchy must be represented explicitly in the Direction Engine.

A signal must never gain primary influence merely because it happens to have a 0–100 presentation score.

---

# 6. Signal Semantics

The engine must preserve the semantics of every signal.

```text
ABILITY     ≠ INTEREST
INTEREST    ≠ TRAIT
TRAIT       ≠ PREFERENCE
PROFILE     ≠ RAW SCORE
```

The engine therefore works with **evidence**, not arbitrary numbers.

For every signal:

```text
sourceTestType
construct
dimension
score
scoreScale
scoreSemantics
status
confidence
```

must remain traceable.

---

# 7. Direction Engine Contract

Recommended conceptual contract:

```text
StudyDirectionEngine
    input:
        CrossTestProfile
        StudyDirectionCatalog
        optional ContextProfile

    output:
        StudyDirectionResult
```

The result must be versioned.

Recommended versions:

```text
STUDY_DIRECTION_ENGINE_V1
STUDY_DIRECTION_RESULT_V1
STUDY_DIRECTION_CATALOG_V1
```

---

# 8. Study Direction Result

Conceptual shape:

```text
{
  contractVersion,
  engineVersion,
  profileId,
  generatedAt,

  status,
  confidence,

  directions: [
    {
      directionId,
      name,
      correspondence,
      evidenceLevel,

      supportingSignals: [],
      supportingPatterns: [],

      potentialChallenges: [],
      missingEvidence: [],

      rationale: [],
      explorationPrompts: []
    }
  ],

  synthesis: {
    dominantThemes: [],
    limitations: [],
    contextualFactors: []
  },

  claims: {
    allowed: [],
    restricted: [],
    prohibited: []
  }
}
```

No `majorId` is owned by this contract.

No university entity is owned by this contract.

---

# 9. Correspondence Semantics

The engine may use a presentation score for ranking, but the semantic meaning must be:

> **degree of correspondence between available profile evidence and the defined study-area evidence model.**

It is not:

- probability of success;
- probability of graduation;
- admission probability;
- predicted GPA;
- guaranteed suitability;
- career outcome probability.

Preferred labels:

```text
Strong alignment
Potential alignment
Worth exploring
Limited evidence
Insufficient evidence
```

Avoid presenting a naked number as if it were a probability.

---

# 10. Evidence Model

Every Study Area must declare its evidence requirements.

Conceptual model:

```text
StudyArea
    ├── InterestEvidence
    ├── AbilityEvidence
    ├── StrengthEvidence
    ├── SupportingEvidence
    ├── ContextualFactors
    ├── PotentialTensions
    └── ExplorationTopics
```

Example:

```text
Technology & Computing

Primary:
    Investigative interest
    Logical / analytical reasoning
    Relevant analytical strength

Supporting:
    Learning preference
    Persistence / AQ
    Detail orientation / behavioral tendency

Explore:
    programming
    data
    systems
    AI
    cybersecurity
```

This is a study-area evidence model, not a major-fit model.

---

# 11. Direction Scoring Governance

The engine must not use:

```text
average(all profile scores)
```

and must not use:

```text
average(IQ, EQ, AQ, DISC, RIASEC, Strength)
```

Instead, a direction's correspondence is calculated from **declared evidence relationships**.

Conceptual:

```text
Direction Correspondence
    =
    primary evidence
    +
    supporting evidence
    +
    contextual modifiers
    -
    unresolved tensions
```

The exact numeric formula is a separate scoring specification and must be versioned.

No formula may be introduced merely to produce attractive ranking.

---

# 12. Minimum Evidence Rule

A direction should not be strongly surfaced when its primary evidence is absent.

Example:

```text
RIASEC only
    ↓
Technology & Computing
```

may provide:

```text
Potential alignment
```

but must not silently imply:

```text
Strong alignment
```

if the direction's evidence model requires cognitive ability or relevant strength and those are unavailable.

This is especially important because the current application has only the RIASEC profile adapter registered.

---

# 13. Current Application Limitation

The supplied application currently has:

```text
RIASEC adapter
    ↓
INTEREST signals
```

and does not yet expose equivalent registered adapters for:

```text
COGNITIVE
EQ
AQ
DISC
STRENGTH
LEARNING
```

Therefore Phase 3.7 must support **partial-evidence operation**.

The engine must never fabricate those missing signals.

Correct:

```text
RIASEC available
Cognitive unavailable
Strength unavailable

→ direction evidence limited
→ result remains exploratory
```

Incorrect:

```text
RIASEC score
→ inferred cognitive ability
→ inferred strength
→ strong direction
```

---

# 14. Completeness and Sufficiency

Cross-Test Profile completeness is not the same as Direction sufficiency.

```text
PROFILE COMPLETENESS
        ≠
DIRECTION SUFFICIENCY
```

A profile may contain one complete RIASEC test and still be insufficient for a strong study-direction conclusion.

Therefore Phase 3.7 needs its own:

```text
directionEvidenceStatus
```

Recommended values:

```text
SUFFICIENT
PARTIAL
LIMITED
INSUFFICIENT
```

These are not psychometric confidence intervals.

---

# 15. Direction Catalog

The catalog should be configuration/data, not hard-coded inside scoring logic.

Minimum fields:

```text
directionId
code
name
description
status
version

primaryEvidence[]
supportingEvidence[]
contextualFactors[]

potentialChallenges[]
explorationTopics[]

claimPolicy
```

Recommended lifecycle:

```text
DRAFT
    ↓
REVIEW
    ↓
APPROVED
    ↓
PUBLISHED
    ↓
RETIRED
```

The same versioning discipline used for assessment configuration must apply.

---

# 16. Initial Study Area Catalog

The following is an initial architecture proposal, not a claim that the catalog is psychometrically validated.

```text
TECHNOLOGY_COMPUTING
ENGINEERING
BUSINESS_MANAGEMENT
ECONOMICS_FINANCE
HEALTH_LIFE_SCIENCES
SOCIAL_SCIENCES
COMMUNICATION_MEDIA
DESIGN_CREATIVE
EDUCATION
LAW_POLICY
AGRICULTURE_ENVIRONMENT
ARCHITECTURE_BUILT_ENVIRONMENT
HOSPITALITY_SERVICE
```

The catalog should remain extensible.

A direction must not be added merely because it is commercially attractive.

---

# 17. Direction Evidence Mapping

The catalog should map **constructs/dimensions**, not arbitrary test names.

Example:

```text
TECHNOLOGY_COMPUTING

Primary:
    RIASEC.INVESTIGATIVE
    Cognitive.LOGICAL_REASONING
    Strength.LOGICAL_ANALYTICAL

Supporting:
    Learning.PROBLEM_SOLVING
    AQ.PERSISTENCE
    DISC/detail-related tendency

Exploration:
    Programming
    Data
    AI
    Systems
    Cybersecurity
```

The engine consumes evidence through this mapping.

It does not contain:

```text
if RIASEC == "I" then Computer Science
```

That would collapse the product into a simplistic lookup table.

---

# 18. Pattern-Based Reasoning

The engine should preserve patterns.

Example:

```text
RIASEC:
I = high
A = high
R = moderate
```

should remain a pattern:

```text
Investigative + Artistic + Realistic
```

rather than being converted into one universal score.

Potential output:

```text
Technology & Computing
Potential alignment

Why:
- strong investigative interest
- analytical exploration pattern
- creative dimension may support design-oriented technology paths

Explore:
- data visualization
- UX / product design
- AI
- creative technology
```

The exact recommendation must depend on the complete evidence catalog.

---

# 19. Contradiction / Tension Handling

The engine must not hide conflicting evidence.

Example:

```text
Strong Investigative Interest
+
Low relevant Cognitive Evidence
```

should not simply return:

```text
Strong fit
```

Instead:

```text
Potential alignment

Supporting:
- strong Investigative interest

Area to validate:
- cognitive evidence for the required analytical workload is not yet available
```

Another example:

```text
Strong Social Interest
+
Low Social Preference
```

should surface the tension rather than deleting one signal.

---

# 20. Explainability Requirement

Every surfaced direction must answer:

```text
Why did this appear?
```

Minimum explanation:

```text
1. strongest supporting evidence
2. supporting evidence
3. missing evidence
4. potential tension
5. what to explore next
```

A direction without traceable evidence is invalid.

---

# 21. Exploration Layer

Study Direction must end with exploration, not a verdict.

Example:

```text
Technology & Computing
        ↓
Explore:
    Programming
    Data
    AI
    Cybersecurity
    Systems
```

The exploration topics are intentionally broader than majors.

They are useful for:

- self-experimentation;
- project exploration;
- course exploration;
- conversation with parents/counselors;
- later major comparison.

---

# 22. Context Integration

The engine may accept contextual data:

```text
goals
academicBackground
constraints
preferences
```

But contextual data must remain clearly separated from measurement evidence.

Recommended:

```text
MEASURED EVIDENCE
+
CONTEXT
=
DIRECTION OUTPUT
```

not:

```text
context overwrites measurement
```

Example:

```text
Interest → Engineering
Academic background → weak mathematics preparation
```

Output:

```text
Potential alignment

Validation area:
mathematics preparation may need strengthening.
```

---

# 23. Claim Governance

## Allowed

```text
Strong alignment
Potential alignment
Worth exploring
Supporting evidence
Potential challenge
Area to validate
Suggested exploration
```

## Restricted

```text
best major
best career
perfect fit
high chance of success
```

## Prohibited

```text
You must choose...
You will succeed...
You will graduate...
You are definitely suitable...
This test determines your major...
```

---

# 24. Out of Scope

Phase 3.7 must NOT implement:

```text
Major Fit
Career Exploration
University matching
University database
Admission prediction
Career salary prediction
AI counselor
Parent reporting
Payment
Subscription
B2B dashboard
```

These belong to later phases.

---

# 25. Data Model Direction

Conceptual target:

```text
StudyDirectionCatalog
    └── StudyDirectionVersion
            ├── EvidenceRule[]
            ├── SupportingRule[]
            ├── ContextRule[]
            ├── TensionRule[]
            └── ExplorationTopic[]

StudyDirectionResult
    ├── profileId
    ├── engineVersion
    ├── catalogVersion
    ├── directions[]
    ├── evidenceStatus
    ├── confidence
    └── claims
```

This is a target architecture.

Do not immediately migrate Prisma models unless implementation requires it and the migration is explicitly approved.

---

# 26. Persistence Boundary

Phase 3.7 should prefer a versioned result snapshot.

Minimum provenance:

```text
profileId
profileContractVersion
profileEngineVersion
studyDirectionCatalogVersion
studyDirectionEngineVersion
generatedAt
```

Historical direction results must remain reproducible.

A later catalog change must not rewrite an old user's result silently.

---

# 27. API Boundary

Recommended conceptual API:

```text
GET /api/direction/study
```

or equivalent internal service boundary.

Input:

```text
profileId
```

Output:

```text
STUDY_DIRECTION_RESULT_V1
```

The route must not perform raw assessment scoring.

The route must not own the Cross-Test Profile calculation.

---

# 28. Service Boundary

Recommended:

```text
lib/direction/
    types.ts
    engine-v1.ts
    catalog/
    rules/
    adapters/
```

The Direction Engine should consume:

```text
CrossTestProfile
```

rather than:

```text
Answer[]
```

This prevents the Direction Engine from bypassing measurement semantics.

---

# 29. Regression Protection

The minimum protection remains:

```text
pnpm e2e:riasec
pnpm profile:gate
```

The Phase 3.7 gate should additionally cover:

```text
direction:gate
```

Recommended test cases:

```text
DIRECTION_RIASEC_ONLY
DIRECTION_FULL_PROFILE
DIRECTION_PARTIAL_PROFILE
DIRECTION_NO_PRIMARY_EVIDENCE
DIRECTION_CONFLICTING_EVIDENCE
DIRECTION_UNKNOWN_TEST
DIRECTION_NO_RAW_AVERAGE
DIRECTION_EXPLAINABILITY
DIRECTION_VERSIONING
DIRECTION_CLAIM_GOVERNANCE
```

---

# 30. Acceptance Criteria

Phase 3.7 design is PASS only when:

- [ ] Direction Engine consumes Cross-Test Profile.
- [ ] Direction Engine does not consume raw answers.
- [ ] Study Area is separated from Major.
- [ ] Primary/supporting/contextual evidence hierarchy is encoded.
- [ ] Missing evidence is explicit.
- [ ] Conflicting evidence is preserved.
- [ ] No universal score is generated.
- [ ] No raw average of unrelated test scores is used.
- [ ] Direction output is explainable.
- [ ] Direction result is versioned.
- [ ] Direction catalog is versioned.
- [ ] Claim governance is explicit.
- [ ] Partial evidence is supported.
- [ ] Unknown test types do not generate synthetic evidence.
- [ ] F.10-C.2-F remains protected.
- [ ] `profile:gate` remains PASS.
- [ ] No Phase 3.8 major logic is introduced.
- [ ] No Phase 3.9 career logic is introduced.
- [ ] No database migration is performed merely for speculative future structure.

---

# 31. Reconciliation Result

## Architecture

**PASS**

The master architecture explicitly places Study Direction downstream of Cross-Test Profile and upstream of Major Fit / Career Exploration.

## Specification

**PASS / READY FOR IMPLEMENTATION**

The Phase 3.0 measurement model provides the required evidence hierarchy and claim boundaries.

## Actual Source

**PARTIAL**

Cross-Test Profile exists, but only RIASEC currently provides a registered adapter.

Therefore Direction Engine must be partial-evidence aware.

## Database Contract

**NO MIGRATION REQUIRED FOR DESIGN PHASE**

The current schema already contains the versioning and generic result persistence required to proceed with a service-level implementation. Any new persistence model requires a separate implementation decision.

## Frozen RIASEC Runtime

**PROTECTED**

No changes to the RIASEC production set, scoring contract, or frozen runtime are required by this reconciliation.

---

# 32. Final Architectural Decision

The Phase 3.7 engine is defined as:

```text
CROSS-TEST PROFILE
        ↓
EVIDENCE NORMALIZATION
        ↓
STUDY AREA EVIDENCE MATCHING
        ↓
CORRESPONDENCE
        ↓
EXPLANATION
        ↓
LIMITATIONS / TENSIONS
        ↓
EXPLORATION PROMPTS
```

Not:

```text
ALL TEST SCORES
        ↓
AVERAGE
        ↓
TOP MAJOR
```

This distinction is the central architectural protection for Phase 3.7.

---

# 33. Next Implementation Gate

Before writing production Direction Engine code:

1. freeze `STUDY_DIRECTION_CATALOG_V1`;
2. freeze `STUDY_DIRECTION_RESULT_V1`;
3. freeze `STUDY_DIRECTION_ENGINE_V1`;
4. implement service boundary;
5. add `direction:gate`;
6. run:
   - `pnpm typecheck`
   - `pnpm build`
   - `pnpm profile:gate`
   - `pnpm e2e:riasec`
   - `pnpm direction:gate`
7. only then move to Phase 3.8.

---

# END — PHASE 3.7 RECONCILIATION
