# V10.9 Delivery Notes — Responsive & Accessibility Hardening

## Scope
Presentation-only hardening of the customer workspace for desktop, tablet, and mobile, plus keyboard/focus, touch targets, semantic navigation headings, reduced-motion, forced-colors, and print-selector cleanup.

## Source of truth
V10.8 remains the parent baseline. Existing data/services/routes remain unchanged.

## Changes
- Hardened global responsive overflow behavior.
- Standardized interactive controls to 44px minimum touch targets.
- Strengthened visible keyboard focus treatment.
- Preserved reduced-motion compatibility.
- Preserved/strengthened forced-colors compatibility.
- Improved semantic navigation headings.
- Added safe table/pre overflow handling.
- Replaced the invalid `.print\:hidden` selector with `.print-hidden`, removing the known PostCSS warning source.

## Safety
NO DATABASE MIGRATION
NO MEASUREMENT MUTATION
NO SCORING MUTATION
NO QUESTION-BANK MUTATION
NO RESULT-SEMANTICS MUTATION
NO UNIVERSAL SCORE
NO RAW-AVERAGE SYNTHESIS
HISTORICAL CONTENT REMAINS IMMUTABLE

No business logic, entitlement logic, assessment runtime, persistence, or measurement behavior was changed.
