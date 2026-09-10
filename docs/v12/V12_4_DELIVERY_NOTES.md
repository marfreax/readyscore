# V12.4 Delivery Notes

- Baseline: `AppRS-v12.3-Change-Password-Credential-Operations.zip` (PASS).
- Added configurable recovery rate limiting.
- Added authentication security audit persistence and audit recording.
- Added security audit coverage for reset requested/succeeded/rejected and password changed.
- Preserved generic recovery responses and existing reset token safety.
- Preserved existing session semantics; reset does not auto-login.
- No business-state mutation introduced.
- Added targeted runtime E2E for rate limiting, token abuse, audit, and business-state protection.
- Added V12.4 static gate.
