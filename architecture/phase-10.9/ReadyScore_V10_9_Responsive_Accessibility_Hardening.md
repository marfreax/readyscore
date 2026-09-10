# ReadyScore V10.9 — Responsive & Accessibility Hardening

## Objective
Harden the existing V10 customer workspace across desktop, tablet, and mobile without changing data meaning or business logic.

## Required
- Desktop, tablet, mobile presentation.
- Keyboard navigation and visible focus.
- Minimum 44px interactive touch targets.
- Readable/robust responsive text and containers.
- Reduced motion compatibility.
- Forced-colors compatibility where relevant.
- Semantic navigation headings.
- Accessible buttons/links/statuses.
- Existing profile radar textual equivalent remains intact.
- Existing routes remain intact.

## Known V10.4 print warning cleanup
The previous `.print\:hidden` selector is replaced with `.print-hidden` so the print stylesheet uses a valid class selector.

## Out of scope
No database, Prisma schema, measurement, scoring, question bank, result semantics, entitlement, assessment runtime, persistence, or commercial rule changes.
