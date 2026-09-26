# ReadyScore — Question Configuration Model

## Current Assessment Types

- FREE
- RIASEC
- DISC
- EQ
- COGNITIVE

Premium is not a current assessment type.

## Core Product Rule

Question Bank and Assessment Setting are independent.

```text
Published Question Pool
        ↓
Assessment Setting
        ↓
Readiness Check
        ↓
Runtime Selection
```

Questions may be added to the published pool without changing the assessment question count.

Example DISC:

```text
Pool: 80 published questions
Setting: D=10 I=10 S=10 C=10
Runtime: 40 selected questions
```

If the setting changes to `20/20/20/20`, new attempts use 80 selected questions. Existing attempts remain unchanged.

## Composition

Composition is configuration, not question ownership.

If no explicit composition exists and the configured count is not evenly divisible by the number of dimensions, the default composition is balanced deterministically: integer floor division plus one extra item assigned to the first dimensions in the canonical order.

For EQ 50 with four dimensions:

```text
EMOTION_AWARENESS       13
EMOTION_REGULATION      13
EMPATHY_SOCIAL_AWARENESS 12
RELATIONSHIP_SOCIAL_RESPONSE 12
```

This matches the existing production EQ composition contract.

## Readiness

A configuration is `READY` only when every composition bucket has enough eligible published QuestionVersions.

If not, the system reports the exact gap and does not auto-publish or mutate question status.

## Runtime Package

`QuestionPackageVersion` remains an internal runtime artifact. Admins should manage assessment settings and question content, not package versions directly.

## Historical Integrity

Each attempt freezes configuration version, package identity, selected QuestionVersion IDs, taxonomy/scoring/selection metadata. Later question additions or configuration changes affect only new attempts.

### V17.10 Alignment Implementation Guard
Runtime package creation must not assume a newly-created `QuestionPackage` has an eagerly loaded `versions` relation. Version numbering must tolerate an empty/unloaded relation and remain inside the transaction.
