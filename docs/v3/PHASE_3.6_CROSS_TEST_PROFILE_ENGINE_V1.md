# ReadyScore v3 — Phase 3.6 Cross-Test Profile Engine V1

Status: IMPLEMENTED / READY FOR GATE

## Purpose

Phase 3.6 introduces the synthesis boundary between completed test-specific results and downstream direction engines.

The engine deliberately does **not** calculate a universal score. Test-specific semantics remain intact and are exposed as heterogeneous evidence signals.

## Contract

`CROSS_TEST_PROFILE_V1`

Engine: `CROSS_TEST_PROFILE_ENGINE_V1`

### Input

A set of completed or partial test-specific result envelopes plus their test-specific measurement payloads.

### Output

- profile status: COMPLETE / PARTIAL / INSUFFICIENT
- evidence confidence: HIGH / MODERATE / LIMITED
- seven canonical profile domains
- source/provenance records
- test-specific evidence signals
- completeness metadata
- observed patterns
- limitations
- claim governance

## Canonical domains

- ABILITY
- EMOTIONAL
- RESILIENCE
- BEHAVIOR
- INTEREST
- STRENGTH
- LEARNING

## Non-negotiable rules

1. Cross-Test Profile is a synthesis layer.
2. It must never average raw scores from unrelated instruments.
3. It must not reinterpret a test's measurement semantics.
4. Score scales are not assumed to be comparable across tests.
5. Unsupported test types produce no synthetic evidence.
6. Every signal retains source test, attempt, scoring version and relevant interpretation version.
7. Study Direction, Major Fit and Career Exploration remain downstream.
8. No universal overall score is emitted.
9. No recommendation claim is generated in Phase 3.6.
10. Future adapters must be explicitly registered and versioned.

## Current implementation

RIASEC is the first registered adapter because it is the only production test type established by the frozen runtime baseline. It contributes six INTEREST signals (R/I/A/S/E/C) and preserves their interest semantics.

Other candidate instruments remain unsupported until their test-specific result contracts are production-ready. The engine must not fabricate evidence merely to make the cross-test profile appear complete.

## Why this is intentionally incomplete

A cross-test profile with only RIASEC evidence is a valid **partial profile**, not a fake complete profile. This is a critical integrity boundary: profile completeness must reflect actual evidence availability.

## Out of scope

- Study Direction
- Major Fit
- Career Exploration
- recommendation ranking
- psychometric calibration
- universal score normalization
- commercial entitlement UX
