# ReadyScore V11.1 — Question Bank Operations

**Status:** IMPLEMENTATION BASELINE
**Parent:** V11.0 Admin Architecture & Safety Contract
**Scope:** Admin Question Bank only, with required customer-runtime compatibility regression.

## 1. Objective

Complete the unified Question Bank as an operational content system without flattening the four assessment instruments into one item model.

## 2. Question Group Contract

Question Group is the primary operational partition:

- DISC
- RIASEC
- IQ & Cognitive
- EQ

`IQ & Cognitive` maps to the existing runtime `TestType.code = COGNITIVE`.

Question Group is not domain, subdomain, indicator, scoring dimension, taxonomy, or lifecycle status.

## 3. Required Operations

- group navigation;
- group-scoped search/filter;
- inspect;
- create;
- edit through new Question Version;
- duplicate;
- group-specific CSV template;
- CSV upload;
- preview before persistence;
- schema/content validation;
- duplicate detection;
- mapping validation;
- import as DRAFT;
- existing lifecycle controls;
- version history;
- safe bulk operations where already supported.

## 4. Group-Specific Response Contracts

The implementation must preserve the existing instrument contracts:

| Group | Type | Answer Type | Scale | Key |
|---|---|---|---|---|
| DISC | SCENARIO | SINGLE_CHOICE_4 | 1–4 | four-option forced-choice key |
| RIASEC | PREFERENCE | LIKERT_5 | 1–5 | five-point key |
| IQ & Cognitive | SINGLE_CHOICE | SINGLE_CHOICE_4 | 1–4 | single objective key + correct option |
| EQ | SCENARIO | SINGLE_CHOICE_4 | 1–4 | single situational key + correct option |

These are transport/administration contracts for the already-established instrument semantics; V11.1 does not redesign measurement.

## 5. CSV Contract

Each group has its own template. A universal template is not required where it would flatten legitimate instrument differences.

Import sequence:

```text
Select Group
  ↓
Download Template
  ↓
Upload CSV
  ↓
Parse
  ↓
Preview
  ↓
Validate
  ↓
Duplicate / Mapping checks
  ↓
Import as DRAFT
  ↓
Existing Review / Approval / Publish / Activate lifecycle
```

Import never publishes directly.

A failed import must not corrupt active content. The persistence operation is transactional.

## 6. Version Safety

Existing Question Version records remain immutable after creation.

Editing an existing logical Question creates a new Question Version.

Historical attempts and results must remain reconstructable.

## 7. Customer Compatibility

V11.1 must not alter customer UX or measurement semantics. However, the Admin Question Bank implementation must not leave the existing runtime unable to consume the already-established four-choice DISC/EQ/Cognitive contracts.

Required compatibility check:

- RIASEC remains 5-point;
- DISC remains four-choice forced-choice;
- EQ remains four-choice situational;
- IQ & Cognitive remains four-choice objective;
- customer answer transport and result/scoring boundaries remain unchanged.

## 8. Security

All Admin Question Bank API operations require Admin authorization.

Validation is server-side. Client controls are not security boundaries.

High-impact operations must not bypass lifecycle protection.

## 9. Database Rule

V11.1 should use the existing Question / QuestionVersion / TestType architecture. No Prisma migration is introduced by this phase.

A future migration requires explicit justification if the existing schema cannot represent a safe requirement.

## 10. Gate

V11.1 PASS requires:

- static/contract gate;
- typecheck;
- production build;
- Admin runtime E2E;
- upload/import E2E;
- versioning E2E;
- customer compatibility regression;
- historical-safety regression.

The repository must not claim PASS from static checks alone.
