# ReadyScore V12.1 — Delivery Notes

Baseline: V11.7.17 Delivery Notes / Closure artifact.

Implemented:
- PasswordResetToken Prisma model and User relation.
- Secure reset-token generation and SHA-256 persistence representation.
- Configurable expiry (15–120 minutes, default 60).
- Generic forgot-password response.
- Email delivery abstraction with explicit Resend production configuration.
- POST /api/auth/forgot-password.
- /forgot-password UI and Login → Forgot Password navigation.
- V12.1 static gate.

Intentionally deferred to later V12 phases:
- reset-token consumption and password mutation;
- Change Password;
- rate limiting and abuse protection;
- audit events;
- full runtime E2E and production Go-Live gate.

No assessment, scoring, Question Bank, entitlement, role, or UserStatus behavior is changed by this phase.
