# ReadyScore V6 — L11 Paid Customer E2E

L11 proves the paid customer journey using the existing Scalev → ReadyScore integration boundary and real HTTP/PostgreSQL runtime.

Covered scenarios:
- Single Test (Rp99k)
- All Tests (Rp199k)
- All Tests + Profiling (Rp249k)
- Reassessment Credit (Rp49k)
- Upgrade payment path and entitlement delivery

Payment checkout itself remains owned by Scalev. The runtime E2E uses signed `payment.received` webhook delivery as the verified payment boundary; it does not fabricate `paid=true` query parameters or bypass webhook verification.

No measurement/scoring semantics are changed by L11.
