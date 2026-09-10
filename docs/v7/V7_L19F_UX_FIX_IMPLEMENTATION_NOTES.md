# V7 L19F UX Fix — Dedicated Customer Pages & Scalev CTA

## Scope
- Convert Assessments from `/app#assessments` to `/assessments`.
- Convert Recent Activity from `/app#recent` to `/activity`.
- Make Access & Plans expose explicit Scalev purchase CTAs.
- Preserve the existing entitlement, payment verification, webhook, and fulfillment boundaries.

## Scalev CTA boundary
ReadyScore does not grant entitlement when a customer clicks a purchase CTA.
The CTA calls `/api/scalev/checkout?sku=...`, which redirects to a configured Scalev-hosted checkout URL.
The URLs are supplied through `SCALEV_CHECKOUT_URL_MAP_JSON` so no Scalev secret is embedded in browser code and no URL is invented by the application.

Supported SKUs:
- RS-SINGLE-IQ-V1
- RS-SINGLE-EQ-V1
- RS-SINGLE-DISC-V1
- RS-SINGLE-RIASEC-V1
- RS-ASSESSMENT-V1
- RS-ALL-PROFILING-V1

Example environment value:
`SCALEV_CHECKOUT_URL_MAP_JSON={"RS-ASSESSMENT-V1":"https://<your-scalev-checkout>","RS-ALL-PROFILING-V1":"https://<your-scalev-checkout>","RS-SINGLE-IQ-V1":"https://<your-scalev-checkout>"}`

## Protected semantics
No changes to measurement, scoring, result, entitlement semantics, reassessment, profiling, or database schema.

## Validation
- `pnpm v7:l19f:uxfix:gate`
- `pnpm e2e:l19f:uxfix`
- `DATABASE MIGRATION: NO`

### Alternative per-SKU configuration
Instead of JSON, the checkout URL map can be supplied as:
- `SCALEV_CHECKOUT_SINGLE_IQ_URL`
- `SCALEV_CHECKOUT_SINGLE_EQ_URL`
- `SCALEV_CHECKOUT_SINGLE_DISC_URL`
- `SCALEV_CHECKOUT_SINGLE_RIASEC_URL`
- `SCALEV_CHECKOUT_ALL_TESTS_URL`
- `SCALEV_CHECKOUT_ALL_PROFILING_URL`
