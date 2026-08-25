# F.8 Persistence Boundary

The v2 source audit established:

1. `AssessmentResult.result` is already JSON.
2. `AssessmentResult.attemptId` is unique.
3. Existing result persistence is transactional.
4. Existing runtime owns attempt completion.
5. No Prisma migration is required for the RIASEC result payload.

The next architectural boundary is F.9:

```text
RIASEC test type
→ configuration
→ selection
→ runtime dispatch
→ scorer
→ RIASEC_RESULT_V1
→ existing AssessmentResult JSON
```

Do not add a Prisma model for RIASEC results in F.8/F.9 unless the actual runtime requirements prove the JSON boundary insufficient.
