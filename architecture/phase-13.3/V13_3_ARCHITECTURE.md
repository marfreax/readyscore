# ReadyScore V13.3 — Timed Attempt & Resilience

## Status
Implementation baseline — V13.3.

## Scope
Server-authoritative timer, persisted `expiresAt`, incremental answer persistence, resume after refresh/close/reopen, lazy expiration, timeout finalization, unanswered handling, and race-safe attempt lifecycle.

## Timer contract
For package-driven assessments:
`expiresAt = startedAt + timeLimitSeconds`

The server decides expiration. The client timer is presentation only and is periodically reconciled from the server.

## Resume contract
The active attempt identity is stored client-side in durable `localStorage`; the server remains authoritative for package, questions, sequence, saved answers, and expiry. Reload/reopen never starts a second attempt for the same active test.

## Answer contract
Answers are persisted incrementally with server-side validation. The client may optimistically retain a pending response and retry transient failures; a server rejection (including expiry) remains authoritative.

## Timeout contract
Lazy expiration is triggered by attempt reads and writes. Expired attempts transition to `EXPIRED` and are finalized with the available persisted answers. Unanswered items remain absent from `Answer`; they are not fabricated as incorrect answers.

## Concurrency
Expiration uses a conditional state transition from `IN_PROGRESS` to `EXPIRED`. Completion/result persistence is idempotent through the existing unique result boundary. A concurrent submit that wins before expiration remains the authoritative completed attempt; a timeout claim that wins prevents later answer mutation.

## Scoring boundary
Normal submit behavior is unchanged. Timeout scoring is explicitly marked with `completionMode: TIMEOUT` so assessment-specific engines can report available-answer coverage without inventing responses for unanswered questions.

## Non-goals
No package selection redesign, no question selection redesign, no payment changes, no new assessment-specific package engines, and no rewrite of historical attempts.
