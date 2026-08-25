# PHASE 3.0-D.1-F.8 — RIASEC Persistence Boundary Audit
## Source Reconciliation Against ReadyScore v2

**Audit basis:** `RS-v2(1).zip` supplied by the project owner  
**Status:** PASS — source inspected  
**Decision:** No Prisma migration required for RIASEC result payload at this stage.

---

## 1. SOURCE OF TRUTH INSPECTED

The following actual v2 files were inspected:

```text
prisma/schema.prisma
lib/assessment/types.ts
lib/assessment/assessment-repository.ts
lib/assessment/runtime-service.ts
lib/assessment/question-engine.ts
lib/assessment-config.ts

app/api/assessment/[attemptId]/route.ts
app/api/assessment/[attemptId]/result/route.ts
app/api/assessment/[attemptId]/submit/route.ts
app/result/[attemptId]/page.tsx
```

The repository already contains the F.4–F.7 RIASEC modules as supplied in the archive.

---

# 2. ACTUAL DATABASE MODEL

The current schema contains:

```text
AssessmentAttempt
AssessmentResult
```

`AssessmentResult` is:

```text
id
attemptId UNIQUE
result JSON
createdAt
updatedAt
```

Therefore the existing database already has a suitable JSON persistence boundary for a versioned test-specific result.

**Conclusion:**

```text
RIASEC_RESULT_V1
        ↓
AssessmentResult.result (JSON)
```

does NOT require a new Prisma model or migration.

---

# 3. IMPORTANT EXISTING RESULT CONTRACT

The actual `AssessmentResult` TypeScript interface is generic:

```text
attemptId
assessmentType
assessmentConfigurationVersion
questionBankVersion
taxonomyVersion
scoringVersion
overallScore
band
status
domainScores
subdomainScores
indicatorScores
coverage
dataSufficiency
completedAt
```

It does NOT contain RIASEC-specific fields such as:

```text
topCode
rankedDimensions
dimensionScores
RIASEC coverage
RIASEC quality
```

Therefore the F.7 decision was correct:

> Do not force RIASEC measurement fields into the legacy generic `AssessmentResult` type.

---

# 4. EXISTING PERSISTENCE FLOW

Actual v2 flow:

```text
submitAssessment()
    ↓
calculateResult()
    ↓
persistCompletedResult()
    ↓
AssessmentResult.result JSON
    ↓
AssessmentAttempt = COMPLETED
```

`persistCompletedResult()` already uses a Prisma transaction and:

1. checks whether a result already exists;
2. validates the attempt;
3. creates `AssessmentResult`;
4. marks the attempt `COMPLETED`.

This behavior must remain the single lifecycle boundary.

---

# 5. EXISTING RESULT READ FLOW

Actual v2 flow:

```text
GET /api/assessment/[attemptId]/result
    ↓
getAttemptResult()
    ↓
getPersistedResult()
    ↓
AssessmentResult.result JSON
```

The API currently returns:

```json
{
  "ok": true,
  "result": {}
}
```

This can remain compatible.

RIASEC-specific result validation can happen after reading the JSON payload.

---

# 6. CRITICAL ARCHITECTURAL FINDING

The current database does NOT require:

```text
RiasecResult table
RiasecDimensionScore table
RiasecResultDetail table
```

for V1.

Adding those now would create unnecessary persistence complexity.

The existing JSON snapshot model is already appropriate because the assessment result is intended to be immutable historical output.

---

# 7. RECOMMENDED PERSISTENCE SHAPE

Store:

```text
AssessmentResult.result
```

as:

```text
{
  "contractVersion": "RIASEC_RESULT_V1",
  "provenance": {
    "attemptId": "...",
    "testType": "RIASEC",
    "assessmentConfigurationVersion": "RIASEC_CONFIG_V1",
    "questionBankVersion": "RIASEC_QB_V1",
    "scoringVersion": "RIASEC_SCORE_V1",
    "completedAt": "..."
  },
  "measurement": {
    ...
  }
}
```

This is exactly the purpose of the F.7 `RiasecPersistableResult`.

---

# 8. NO DATABASE MIGRATION

Do NOT create:

```text
prisma/migrations/...ria...
```

for F.8/F.9 persistence.

The existing:

```text
AssessmentResult.result Json
```

is sufficient.

---

# 9. IMMUTABILITY

The existing repository already prevents duplicate result creation:

```text
AssessmentResult.attemptId UNIQUE
```

and checks an existing result before creating one.

This should be preserved.

RIASEC persistence must therefore be idempotent.

---

# 10. TRANSACTION BOUNDARY

The existing:

```text
persistCompletedResult()
```

already owns:

```text
result creation
+
attempt completion
```

Therefore a new RIASEC persistence adapter must not introduce a competing lifecycle transaction.

The adapter created for this phase is a boundary/helper and must be called by the runtime at the same completion boundary.

---

# 11. NO DUPLICATE LIFECYCLE

Do NOT implement:

```text
save RIASEC result
        ↓
mark attempt completed
```

in a separate transaction if the runtime already owns completion.

The preferred final flow is:

```text
RIASEC scorer
      ↓
RIASEC result contract
      ↓
generic completion transaction
      ↓
AssessmentResult.result JSON
      ↓
AssessmentAttempt.COMPLETED
```

---

# 12. IMPORTANT CURRENT GAP

The current v2 `AssessmentType` is:

```text
free
premium
```

and Prisma enum:

```text
FREE
PREMIUM
```

RIASEC is currently NOT an assessment type in that infrastructure.

Therefore this audit does NOT silently add:

```text
RIASEC
```

to the enum.

That is a separate architectural change under:

```text
PHASE 3.0-D.1-F.9 — RIASEC Assessment Runtime Wiring
```

F.9 must reconcile:

```text
testType
assessment configuration
question selection
attempt type
runtime dispatch
```

before a user can actually start a RIASEC assessment.

---

# 13. QUESTION BANK GAP

The current question engine selects:

```text
free
premium
```

using:

```text
ASSESSMENT_CONFIG
```

and the current premium selection quotas are:

```text
Motivasi
Disiplin
Kemandirian
Critical Thinking
Problem Solving
Komunikasi
Leadership
Emotional Resilience
```

These are NOT RIASEC dimensions.

Therefore:

> Do not reuse the current premium selector for RIASEC.

RIASEC needs its own test-specific selection configuration/strategy.

---

# 14. RIASEC TARGET CONFIGURATION

The approved design is:

```text
RIASEC_CONFIG_V1
RIASEC_QB_V1
RIASEC_SCORE_V1
RIASEC_RESULT_V1
```

The target production bank:

```text
R = 10
I = 10
A = 10
S = 10
E = 10
C = 10
```

Total:

```text
60 target
```

with:

```text
24 reserve
```

---

# 15. FINAL F.8 DECISION

### Persistence

```text
KEEP:
AssessmentResult.result JSON
```

### Database

```text
NO NEW MODEL
NO MIGRATION
```

### Result contract

```text
USE:
RIASEC_RESULT_V1
```

### Generic AssessmentResult

```text
DO NOT EXPAND YET
```

### Runtime

```text
NEXT:
F.9
```

### Question selection

```text
NEXT:
F.9
```

---

# 16. F.8 EXIT CRITERIA

All required source questions have now been resolved:

- [x] Prisma assessment models inspected.
- [x] Result persistence method inspected.
- [x] Result read method inspected.
- [x] Submit flow inspected.
- [x] API result route inspected.
- [x] Result UI inspected.
- [x] Generic result contract inspected.
- [x] Historical persistence model identified.
- [x] RIASEC persistence strategy selected.
- [x] Migration impact identified.
- [x] Runtime integration gap identified.
- [x] Question selection gap identified.

---

# 17. NEXT PHASE

```text
PHASE 3.0-D.1-F.9
RIASEC Assessment Runtime Wiring
```

F.9 must address:

```text
RIASEC test type
        ↓
RIASEC configuration
        ↓
RIASEC question selection
        ↓
RIASEC attempt
        ↓
RIASEC answers
        ↓
RIASEC scorer
        ↓
RIASEC_RESULT_V1
        ↓
existing AssessmentResult JSON
```

No Prisma migration is expected unless F.9 uncovers a requirement that cannot be represented by the existing schema.

---

# END F.8
