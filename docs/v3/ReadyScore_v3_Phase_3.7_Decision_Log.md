# ReadyScore v3 — Phase 3.7 Decision Log

## D-3.7-001 — Study Direction consumes Cross-Test Profile

**Decision:** ACCEPTED

Study Direction is downstream of Cross-Test Profile.

**Reason:** Prevents recommendation logic from bypassing test-specific measurement semantics.

---

## D-3.7-002 — Study Area is the output boundary

**Decision:** ACCEPTED

Phase 3.7 outputs broad study areas/directions.

**Deferred:** Major Fit belongs to Phase 3.8.

---

## D-3.7-003 — No universal score

**Decision:** ACCEPTED

The engine must not average Cognitive, EQ, AQ, DISC, RIASEC, Strength, or Learning scores.

**Reason:** These are different constructs and score semantics.

---

## D-3.7-004 — Partial evidence is valid

**Decision:** ACCEPTED

The current application exposes only a RIASEC Cross-Test Profile adapter.

The engine must therefore support limited/partial direction output without fabricating missing evidence.

---

## D-3.7-005 — Primary evidence hierarchy

**Decision:** ACCEPTED

Primary:

```text
Interest
Cognitive Ability
Relevant Strength
```

Supporting:

```text
Personality
Learning
EQ
AQ
```

Context:

```text
Goals
Academic Background
Constraints
Preferences
```

---

## D-3.7-006 — Explainability is mandatory

**Decision:** ACCEPTED

Every surfaced direction must expose why it appeared, what evidence supports it, what is missing, and what should be explored.

---

## D-3.7-007 — Catalog is versioned data

**Decision:** ACCEPTED

Study direction rules must not be buried in scoring code.

---

## D-3.7-008 — No speculative Prisma migration

**Decision:** ACCEPTED

The reconciliation phase does not require database migration.

Persistence changes are deferred until implementation demonstrates a real need.

---

## D-3.7-009 — RIASEC frozen baseline remains minimum protection

**Decision:** ACCEPTED

Phase 3.7 must preserve:

```text
60 questions
10/10/10/10/10/10
60 answers
persistence
submit
RIASEC_RESULT_V1
six dimensions
topCode
scoring version
```

---

## D-3.7-010 — Direction is exploratory

**Decision:** ACCEPTED

The product helps users explore possible directions. It does not determine destiny.

# END
