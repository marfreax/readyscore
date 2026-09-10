# V13.10 FIX11 — Taxonomy / Composition Observability

## Scope
Admin-only observability improvement. No measurement, scoring, database schema, migration, package selection, question selection, randomization, timing, or customer runtime behavior is changed.

## Changes
- Question Bank list exposes the resolved **Taxonomy Node** (code + name).
- Review & Publishing list exposes the resolved **Taxonomy Node** (code + name).
- Review inspector exposes the resolved Taxonomy Node.
- Resolution uses the question version taxonomy + test type and matches the node against the existing domain/subdomain/indicator mapping used by production eligibility.
- Existing package composition remains authoritative in Question Packages.

## Purpose
Reviewers can see which composition node a question contributes to before publishing content, reducing the need to switch between Review and Question Packages.
