# ReadyScore V13.4 — Production Assessment Blueprint

**Version:** 1.0  
**Date:** 2026-09-07  
**Phase:** V13.4 / P1  
**Status:** BLUEPRINT FROZEN FOR V13.4 IMPLEMENTATION  
**Design status:** Production design target; not a claim of psychometric validation.

## 1. Purpose

V13.4 converts the V13 production target into an explicit assessment blueprint that V13.5–V13.10 can consume without inventing assessment structure during implementation.

The blueprint is the contract for:

- construct;
- intended use;
- taxonomy;
- item count;
- composition;
- scoring dependency;
- timer;
- production pool and reserve policy;
- content/safety boundaries.

The Question Package remains a delivery configuration. It does not redefine the scoring algorithm.

## 2. Production Targets

| Assessment | Target Items | Maximum Time | Minimum Candidate Pool | Minimum Reserve |
|---|---:|---:|---:|---:|
| RIASEC | 60 | 20 min | 72 | 12 |
| DISC | 80 | 20 min | 96 | 16 |
| EQ | 50 | 20 min | 60 | 10 |
| Cognitive / IQ | 40 | 20 min | 48 | 8 |

The reserve policy is operational: minimum 20% of target, rounded up. Reserve items are not runtime-eligible until they complete the normal review/publish lifecycle.

The reserve policy is not a psychometric sufficiency claim.

## 3. Timer Contract

```text
20 minutes = 1,200 seconds
```

The value is the **maximum allowed time**. It is not a requirement that every participant use all 20 minutes or complete every item.

The server remains authoritative for expiry under the frozen V13.3 timed-attempt contract.

## 4. RIASEC Blueprint

### Construct

`vocational_interest`

### Intended use

Interest exploration and relative RIASEC profile.

### Form

- 60 items
- 5-point preference response
- `RIASEC_TAXONOMY_V2`
- `RIASEC_QB_V2`
- `RIASEC_SCORE_V2`
- `RIASEC_RESULT_V2`
- `RIASEC_INTERPRETATION_V2`

### Composition

| Dimension | Items |
|---|---:|
| R — Realistic | 10 |
| I — Investigative | 10 |
| A — Artistic | 10 |
| S — Social | 10 |
| E — Enterprising | 10 |
| C — Conventional | 10 |
| **Total** | **60** |

### Scoring boundary

The existing RIASEC V2 scoring contract is compatible with 60 items and ten items per dimension. Top code is descriptive and must not be represented as a universal ability score.

### Claims

Do not present RIASEC as IQ, ability, guaranteed career fit, or guaranteed career suitability.

## 5. DISC Blueprint

### Construct

Behavioral response tendencies associated with Dominance, Influence, Steadiness and Conscientiousness.

### Intended use

Descriptive behavioral profile for self-understanding and development.

### Form

- 80 items
- situational forced-choice
- `DISC_TAXONOMY_V2`
- `DISC_V2`
- `DISC_SCORE_V2`
- `DISC_RESULT_V2`
- `DISC_INTERPRETATION_V2`

### Composition

| Taxonomy node | Items |
|---|---:|
| TARGET_D | 20 |
| TARGET_I | 20 |
| TARGET_S | 20 |
| TARGET_C | 20 |
| **Total** | **80** |

This is a **content/taxonomy coverage blueprint**. It must not be interpreted as four independent score pools unless the scoring model explicitly establishes that relationship.

### Critical scoring dependency

The current DISC V2 scoring engine requires exactly 24 questions. Therefore V13.4 does **not** claim that 80-item DISC is already scoring-compatible.

V13.7 must resolve and validate:

- 80-item scoring semantics;
- ipsative normalization;
- primary/secondary pattern behavior;
- weighting;
- missing-answer/timeout behavior;
- result contract compatibility;
- interpretation compatibility.

Every item must retain its item-specific four-option scoring permutation. Option position must never globally imply D/I/S/C.

### Claims

Do not present DISC as IQ, aptitude, clinical diagnosis, deterministic personality identity, or guaranteed career fit.

## 6. EQ Blueprint

### Construct

Emotional and social response capability as operationalized by ReadyScore EQ.

### Intended use

Self-exploration of relative response patterns across four EQ dimensions.

### Form

- 50 items
- situational judgment
- four response options per item
- `EQ_TAXONOMY_V2`
- `EQ_V2`
- `EQ_SCORE_V2`
- `EQ_RESULT_V2`
- `EQ_INTERPRETATION_V2`

### Composition

| Dimension | Items |
|---|---:|
| EMOTION_AWARENESS | 13 |
| EMOTION_REGULATION | 13 |
| EMPATHY_SOCIAL_AWARENESS | 12 |
| RELATIONSHIP_SOCIAL_RESPONSE | 12 |
| **Total** | **50** |

### Critical scoring dependency

The current EQ V2 scoring engine requires exactly 24 questions. V13.4 does not modify that engine.

V13.7 must validate the 50-item form against the actual scoring engine and result contract, including the keyed-ordinal scoring model and dimension normalization.

### Claims

No clinical, diagnostic, universal EQ, or IQ claim.

## 7. Cognitive Blueprint

### Construct

Cognitive reasoning performance as operationalized by ReadyScore Cognitive.

### Intended use

Descriptive reasoning performance profile; not a clinical IQ test.

### Form

- 40 items
- objective single-choice
- four options per item
- one correct option
- `COGNITIVE_TAXONOMY_V2`
- `COGNITIVE_V2`
- `COGNITIVE_SCORE_V2`
- `COGNITIVE_RESULT_V2`
- `COGNITIVE_INTERPRETATION_V2`

### Composition

| Dimension | Items |
|---|---:|
| VERBAL_REASONING | 10 |
| NUMERICAL_REASONING | 10 |
| LOGICAL_REASONING | 10 |
| ABSTRACT_REASONING | 10 |
| **Total** | **40** |

### Critical scoring dependency

The current Cognitive V2 scoring engine requires exactly 24 questions and six questions per dimension. V13.4 does not modify the engine.

V13.7 must validate the 40-item form, including dimension scoring, objective correctness, normalization, timeout behavior and result compatibility.

The content phase must also establish an explicit difficulty distribution; this must not be invented inside package configuration.

### Claims

Do not present the result as a clinical IQ test, universal intelligence score, diagnosis, or guaranteed ability measure.

## 8. Cross-Assessment Rules

1. Blueprint composition must equal target item count exactly.
2. A package cannot compensate for a missing blueprint.
3. A package cannot redefine scoring.
4. Scoring version is a required production dependency.
5. Production pool minimum is target plus 20% operational reserve.
6. Reserve content follows the same review and publication controls.
7. Runtime may use only eligible published content.
8. Legacy general-readiness content is not silently mixed into these instrument pools.
9. A 20-minute timer is a maximum allowed time and remains server-authoritative.
10. Safety/claims boundaries inherited from the existing V2 instrument contracts remain in force.

## 9. Phase Handoff

```text
V13.4
Blueprint frozen
    ↓
V13.5
Build candidate pools
    ↓
V13.6
Map + review + approve
    ↓
V13.7
Validate scoring compatibility
    ↓
V13.8
Configure packages
    ↓
V13.9
Publish + establish eligibility
    ↓
V13.10
Admin → Customer E2E
```

## 10. V13.4 Acceptance

V13.4 is PASS when:

- all four assessment blueprints are explicit;
- target item counts are reconciled;
- every composition sums exactly to the target;
- taxonomy versions are explicit;
- scoring versions are explicit;
- reserve policy is explicit;
- current scoring constraints are documented rather than silently changed;
- safety/claim boundaries are preserved;
- downstream phase dependencies are explicit.

V13.4 does **not** declare DISC 80, EQ 50 or Cognitive 40 scoring-ready. That decision belongs to V13.7.
