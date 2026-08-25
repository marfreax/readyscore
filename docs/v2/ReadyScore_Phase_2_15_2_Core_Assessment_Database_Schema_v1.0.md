# PHASE 2.15.2 — Core Assessment Database Schema v1.0

## Status
DESIGN + IMPLEMENTATION READY

## Objective

Establish the persistent core database model for ReadyScore without yet moving the existing runtime/auth services to PostgreSQL.

## Scope

### 1. User
- Persistent identity.
- Unique normalized email.
- Password hash.
- Role.
- Created/updated timestamps.

### 2. Session
- Persistent session identifier.
- User ownership.
- Expiration.
- Indexes for user and expiration lookup.

### 3. Question
Stable identity for a question code such as `RS-0001`.

Question identity is intentionally separated from question content/version.

### 4. QuestionVersion
Immutable assessment-facing content version.

Stores:
- text
- taxonomy labels
- answer/scoring metadata
- difficulty
- lifecycle status
- mapping status
- source file

A question can have multiple versions, uniquely identified by `(questionId, version)`.

### 5. AssessmentAttempt
Persistent assessment execution record.

Stores:
- user ownership (nullable to preserve anonymous/free assessment compatibility)
- assessment type
- lifecycle status
- assessment configuration/version
- question bank version
- taxonomy version
- scoring version
- selection algorithm version
- deterministic attempt seed
- immutable selection snapshot
- timestamps

### 6. AttemptQuestion
Frozen membership of a question in an attempt.

Stores:
- question identity
- exact question version
- sequence
- required flag
- question snapshot

This prevents future Question Bank changes from changing an existing attempt.

### 7. Answer
Persistent answer state for one attempt question.

Stores:
- attempt
- question
- attempt-question identity
- raw Likert value
- answer timestamps

Scored values/results are intentionally deferred to the result persistence phase.

## Explicit Non-Scope

This phase does NOT migrate existing runtime services to PostgreSQL.

It does NOT introduce:
- AssessmentResult
- DomainResult
- SubdomainResult
- IndicatorResult
- payment/order entities
- admin audit entities
- taxonomy master tables

Those belong to later phases.

## Integrity Principles

1. Existing question identity is stable.
2. Question content is versioned.
3. AttemptQuestion freezes the exact question version used.
4. AttemptQuestion also stores a JSON snapshot for historical reconstruction.
5. Existing attempts remain valid even after Question Bank publishing changes.
6. Anonymous attempts remain possible because `AssessmentAttempt.userId` is nullable.
7. User/session persistence is prepared but existing JSON auth remains active until its migration phase.
8. No destructive migration is permitted against existing production data.

## Migration

From the project root:

```bash
pnpm db:validate
pnpm db:format
pnpm db:migrate --name core_assessment_schema
pnpm db:generate
pnpm typecheck
pnpm build
```

## Expected New Tables

```text
User
Session
Question
QuestionVersion
AssessmentAttempt
AttemptQuestion
Answer
```

`DatabaseHeartbeat` remains from Phase 2.15.1.

## Gate 2.15.2 PASS

PASS only when:

- Prisma validation passes.
- Migration applies successfully.
- Prisma Client generates successfully.
- All seven core tables exist.
- Existing application typecheck passes.
- Existing application build passes.
- No existing JSON runtime/auth behavior is removed.

## Next Phase

PHASE 2.15.3 — Question Bank PostgreSQL Migration.
