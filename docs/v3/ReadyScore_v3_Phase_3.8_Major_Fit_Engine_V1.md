# ReadyScore v3 — Phase 3.8 Major Fit Engine V1

**Status:** IMPLEMENTED — GATE PENDING
**Scope:** Study Direction + relevant evidence + major profile → Major Fit
**Boundary:** F.10-C.2-F + 3.1 + 3.2 + 3.3 + 3.4 + 3.5 + 3.6 + 3.7 remain frozen.

## 1. Canonical Boundary

```text
Study Direction
+
relevant evidence
+
major profile
    ↓
Major Fit
```

Major Fit is a correspondence layer. It does not redefine measurement, scoring, result semantics, or Cross-Test Profile semantics.

## 2. Contract

`MAJOR_FIT_V1` is the result contract and `MAJOR_FIT_ENGINE_V1` is the engine version.

The contract records:
- major identity and major-profile version;
- Study Direction identity and contract version;
- requirement-level evidence correspondence;
- matched required requirements;
- evidence completeness;
- aligned study areas;
- supporting evidence and areas to strengthen;
- limitations and claim governance.

## 3. No Invented Universal Fit Score

The Source of Truth defines Fit Score conceptually but does not define a Phase 3.8 numerical formula. Therefore this implementation deliberately does **not** invent a universal `fitScore`, probability, percentile, or raw average.

A numerical Fit Score requires an explicit major-fit measurement model and versioned formula before it may be introduced.

## 4. Evidence Rule

Evidence is accepted only when it is explicitly supplied through the Study Direction / major-profile contract. A missing or unsupported signal cannot be synthesized into positive evidence.

Required evidence is distinguished from optional requirements. Optional requirements do not inflate the required-evidence denominator.

## 5. Output Language

Allowed language is correspondence-oriented:
- Strong fit
- Potential fit
- Worth exploring
- Limited evidence
- Areas to strengthen

The engine prohibits deterministic claims such as guaranteed academic success, guaranteed graduation/employment, or one-test-only major assignment.

## 6. Non-Goals

Phase 3.8 does not implement:
- career exploration;
- commercial dashboard UX;
- payment or subscription;
- psychometric validation/calibration;
- universal cross-test averaging;
- deterministic major assignment.

## 7. Gate

```bash
pnpm major-fit:gate
```

The gate verifies contract identity, Study Direction boundary, evidence mapping, major-profile versioning, claim governance, absence of invented universal/fit score, and insufficient-evidence safety.

## 8. Frozen Regression

The minimum regression remains:

```bash
pnpm e2e:riasec
```

RIASEC production semantics must remain unchanged.
