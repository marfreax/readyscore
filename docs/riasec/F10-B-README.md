# PHASE 3.0-D.1-F.10-B — RIASEC Question Bank Reconciliation

## Finding

The current runtime configuration requires:

```text
RIASEC = 60 questions
10 × R
10 × I
10 × A
10 × S
10 × E
10 × C
```

The current API response says:

```text
INSUFFICIENT_ELIGIBLE_QUESTIONS
Membutuhkan 60 question eligible, tersedia 20.
```

The actual `question-engine.ts` confirms that the generic global eligibility check executes **before** the RIASEC-specific quota selection.

That is not ideal because RIASEC has a different measurement rule.

## Important distinction

This phase does NOT create or fabricate RIASEC questions.

There are two possible causes:

1. The database actually contains only 20 eligible RIASEC questions.
2. The database contains 60+ RIASEC-labelled questions, but the generic eligibility rule excludes some of them.

We must distinguish these using the audit script.

## Step 1 — Run the audit

From the project root:

```bash
pnpm tsx scripts/audit-riasec-question-bank.ts
```

If `tsx` is not available, use the project's existing TypeScript execution mechanism.

The output will report, for each dimension:

```text
total
published
publishedApprovedMapping
fullyEligibleUnderCurrentGenericRule
missingSubdomain
missingIndicator
```

This gives us the exact reason the runtime currently sees only 20 eligible questions.

## Step 2 — Apply the selection-boundary patch

`F10-B-question-engine.patch` removes the generic global eligibility check before the RIASEC branch.

For RIASEC, the authoritative check remains:

```text
R >= 10
I >= 10
A >= 10
S >= 10
E >= 10
C >= 10
```

This is important because a generic "60 available" check is not sufficient to prove RIASEC coverage.

FREE and PREMIUM retain the existing global eligibility check.

## Step 3 — Do NOT loosen eligibility yet

Do not change:

```text
published
mappingStatus
subdomain
indicator
weight
scale
scoringKey
```

until the audit proves which rule is excluding the RIASEC questions.

## Interpretation

### Case A

```text
R/I/A/S/E/C totals are approximately 10 each
but fully eligible is lower
```

Then the issue is a **question-bank approval/eligibility problem**, not question selection.

### Case B

```text
RIASEC domain-labelled total < 60
```

Then the issue is **question-bank capacity**.

We need the missing RIASEC item bank before runtime can legitimately produce 60 questions.

### Case C

```text
all six dimensions have >=10 fully eligible
```

Then the current selection error is caused by an unrelated repository/filtering issue and the next investigation is `getPublishedEligibleQuestions()`.

## Exit criteria

- [ ] Audit executed against actual PostgreSQL.
- [ ] Exact R/I/A/S/E/C counts known.
- [ ] Generic eligibility vs RIASEC-specific eligibility understood.
- [ ] No fabricated questions.
- [ ] No relaxation of mapping rules without measurement specification approval.
- [ ] RIASEC selection fails with a dimension-specific error when a dimension is short.
- [ ] FREE/PREMIUM selection behavior remains unchanged.

Only after this is resolved should F.10 continue to answer persistence and scoring.
