# ReadyScore V7 L19E — QA User Fixtures & Scenario Matrix

## 1. Objective

L19E establishes deterministic QA identities and reusable data states for validating customer, commercial, assessment, result, reassessment, profiling, and admin flows before L19F and L20.

This is a QA/data-fixture phase, not a product-semantic change.

## 2. Required QA Identities

```text
QA-01
Single Test User
Entitlement: EQ only

QA-02
All Tests User
Entitlement: IQ + EQ + DISC + RIASEC

QA-03
Full Access User
Entitlement: IQ + EQ + DISC + RIASEC + Cross-Test Profiling

QA-04
Admin User
Role: ADMIN
```

The identities use fixed QA IDs/emails. Passwords are generated securely by the test environment.

## 3. Scenario States

### QA-01

- EQ entitlement active
- Other core tests unavailable
- Completed EQ result fixture
- EQ reassessment credit available
- Suitable for Access & Plans, Result, ownership, and reassessment eligibility QA

### QA-02

- Four core test entitlements active
- Cross-Test Profiling unavailable
- Completed RIASEC result fixture
- Suitable for All Tests access and result journey QA

### QA-03

- Four core test entitlements active
- Cross-Test Profiling active
- Completed results for Cognitive, EQ, DISC, and RIASEC
- Suitable for cross-test profile runtime QA

### QA-04

- ADMIN role
- No customer commercial fixture required
- Suitable for Admin IA and authorization QA

## 4. Fixture Provisioning Rules

1. Provisioning is repeatable.
2. Fixture records are isolated from normal customer identities.
3. Existing fixture attempts/entitlements/credits are reset before reprovisioning.
4. Entitlements are granted through the canonical entitlement service.
5. Completed results are generated through the existing assessment runtime.
6. No result payload is fabricated by the fixture layer.
7. No schema migration is required.
8. Fixture credentials are not hardcoded into production source.

## 5. Scenario Matrix

| Area | QA-01 | QA-02 | QA-03 | QA-04 |
|---|---|---|---|---|
| Authentication | ✓ | ✓ | ✓ | ✓ |
| Single-test access | ✓ | — | — | — |
| All-tests access | — | ✓ | ✓ | — |
| Profiling unavailable | — | ✓ | — | — |
| Profiling available | — | — | ✓ | — |
| Completed result | ✓ | ✓ | ✓ | — |
| Reassessment credit | ✓ | — | — | — |
| Admin authorization | — | — | — | ✓ |

## 6. Validation

The runtime E2E also verifies cross-account result isolation and QA-01 reassessment surface reachability. The fixture/auth state is strongly typed so the L19E scripts must pass the project strict TypeScript configuration.

Static/contract:

```bash
pnpm v7:l19e:gate
```

Runtime:

```bash
pnpm e2e:l19e
```

Full phase chain:

```bash
rm -rf .next
pnpm typecheck
pnpm build
pnpm v7:l19e:gate
pnpm e2e:l19e
```

## 7. Boundaries

```text
DATABASE MIGRATION: NO

Measurement semantics: NO MUTATION
Scoring semantics: NO MUTATION
Result semantics: NO MUTATION
Commercial semantics: NO MUTATION
Entitlement semantics: NO MUTATION
Reassessment semantics: NO MUTATION
Profiling semantics: NO MUTATION
```

## 8. L19E → L19F

L19E provides the deterministic identities and states required for L19F cross-surface acceptance. L19F remains the next phase and is not implemented by L19E.
