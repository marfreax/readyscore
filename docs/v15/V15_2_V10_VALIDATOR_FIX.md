# ReadyScore V15.2 — V10 Validator Fix

## Scope
Test-contract correction only. No scoring, interpretation, major matching, action-plan engine, database, entitlement, or customer report content changes.

## Root cause
The V15.2 content-quality validator required every non-cover page to expose at least three flattened `body` entries. That is an overly rigid proxy for substantive content: a structured page can legitimately contain two blocks while still having enough meaningful customer-facing text.

## Fix
The validator now considers a non-cover page substantively populated when it has:
- at least 2 flattened body entries; and
- at least 120 characters of combined customer-facing body text.

The cover keeps its dedicated minimum of 2 body entries.

This makes the gate validate content substance rather than an arbitrary number of flattened lines.
