# V13.3 Delivery Notes

- Added nullable `AssessmentAttempt.expiresAt` and index.
- Frozen package timer into attempt creation and public runtime timer state.
- Added lazy expiration and expired-result finalization.
- Added durable active-attempt resume storage and server timer reconciliation.
- Added bounded answer retry behavior for transient connection failures.
- Preserved normal full-answer submit semantics.
- Added timeout completion mode to scoring context; unanswered responses are not synthesized.
- Added background expiration utility.
- No historical QuestionVersion or AssessmentAttempt rewrite.
