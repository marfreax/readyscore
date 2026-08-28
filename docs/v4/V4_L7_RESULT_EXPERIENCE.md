# V4 L7 — Result Experience

## Scope
Customer-facing result experience for the existing RIASEC, DISC, EQ, and Cognitive result contracts.

## Product flow
1. Assessment Complete
2. Result Summary
3. What This Means
4. Your Profile
5. Strengths
6. Areas to Watch
7. What to Explore
8. Next Action

## Measurement boundary
L7 is presentation-only. It does not change scoring, measurement semantics, result persistence, or assessment history.

Existing result contracts remain the source of truth:
- `RIASEC_RESULT_V1`
- `DISC_RESULT_V1`
- `EQ_RESULT_V1`
- `COGNITIVE_RESULT_V1`

The UI uses presentation scores only as defined by each existing measurement contract.

## Claim governance
The result experience must not:
- convert presentation scores into unsupported ability claims;
- call the Cognitive result an IQ score;
- make deterministic major/career decisions from one test;
- treat DISC as aptitude/intelligence measurement;
- treat EQ runtime execution as psychometric validation evidence.

## Validation
Expected local commands after replacement:

```text
pnpm typecheck
pnpm build
pnpm v4:l7:gate
pnpm e2e:result
pnpm e2e:cognitive
pnpm e2e:eq
pnpm e2e:disc
pnpm e2e:riasec
```

Run only commands that exist in `package.json`; the above are the commands added/confirmed for this L7 implementation.

## Database
No L7 migration is required. L7 reads the existing immutable result snapshot.
