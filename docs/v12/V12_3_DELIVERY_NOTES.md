# V12.3 Delivery Notes

## Delivered
- Authenticated Change Password page.
- Authenticated Change Password API.
- Server-side current-password verification.
- Canonical password hashing.
- Confirmation and minimum-length validation.
- Transactional compare-and-update guard.
- DB/local auth-store credential synchronization.
- Customer navigation entry.
- Targeted runtime E2E and static contract gate.

## Deliberately Deferred to V12.4
- Account enumeration hardening.
- Rate limiting and abuse protection.
- Security audit events.
- Secret-safe security logging.
- Expanded session security semantics.

## Architecture Note
The current ReadyScore authentication layer maintains PostgreSQL User state and a local auth-state store. The DB mutation is authoritative and is committed transactionally; the local file representation is synchronized immediately afterward. This is not claimed as cross-storage atomicity.

## Migration
None. V12.3 uses the existing User model and V12.1 PasswordResetToken remains unchanged.
