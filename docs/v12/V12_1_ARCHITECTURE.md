# ReadyScore V12.1 — Password Recovery Foundation

Status: IMPLEMENTATION ARTIFACT

V12.1 establishes the password-recovery foundation only. It adds a persistent single-use reset-token record, secure token generation and hashing, expiry, generic recovery response, email delivery abstraction, and the Forgot Password entry point/API.

Security boundary:
- reset token is generated with Node cryptographic randomness;
- only SHA-256 token representation is persisted;
- raw token exists only in memory and the outbound reset URL;
- token expires after configured 15–120 minutes, default 60;
- existing pending tokens for the same user are invalidated before a new token is created;
- recovery response does not reveal account existence;
- production requires explicit Resend configuration and APP_BASE_URL;
- development without email configuration does not log or persist the secret token.

V12.1 does not implement token validation/password mutation, Change Password, rate limiting, or audit events; those belong to later V12 phases.
