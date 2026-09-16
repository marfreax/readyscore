# ReadyScore V16.7 — Lead Business Record

**Status:** Development baseline
**Baseline:** V16.6 Duplicate Delivery Hardening
**Scope:** Convert `FreeLeadCapture` acquisition data into a minimal, traceable business lead without introducing a CRM.

## 1. Objective

After a valid Free Lead Gate submission:

```text
FreeLeadCapture
    ↓
BusinessLead create / reuse
    ↓
FREE_ASSESSMENT attribution
    ↓
Free Report unlock
    ↓
Delivery
```

`FreeLeadCapture` remains the acquisition/consent record and assessment context. `BusinessLead` is the minimal business record used for follow-up.

## 2. Data Model

`BusinessLead` contains only:

- `id`
- `name`
- `whatsapp`
- `email`
- `source` (canonical `FREE_ASSESSMENT`)
- `status` (initial `NEW`)
- `consent`
- `consentAt`
- `assessmentAttemptId` (latest assessment context)
- `createdAt` / `updatedAt`

`FreeLeadCapture.businessLeadId` links the acquisition record to the business record.

No sales pipeline, CRM objects, campaign engine, lead scoring, or broadcast engine is introduced.

## 3. Deduplication

Identity rule:

```text
same normalized WhatsApp
        OR
same normalized email
        ↓
reuse existing BusinessLead
```

WhatsApp and email are stored in the normalized forms already produced by the V16.6 unlock endpoint. Unique database constraints provide the final duplicate barrier. A `P2002` race is re-read and safely reused.

If one submission simultaneously matches two different existing business leads, the service stops with `BUSINESS_LEAD_IDENTITY_CONFLICT` rather than silently merging records.

## 4. Consent

The public unlock endpoint requires consent. Business lead consent is never downgraded. For an already-consented lead, the original `consentAt` is preserved.

Provider secrets are not copied into the lead record.

## 5. Failure Boundary

Business lead creation is attempted after `FreeLeadCapture` persistence. If business lead persistence fails:

- `FreeLeadCapture` remains saved;
- the Free Report remains unlockable;
- a safe server-side error code is logged;
- a `business_lead_failed` funnel event is attempted;
- a later submission can retry business lead creation.

## 6. Admin Visibility

Admin-only surface:

```text
/admin/leads
    ↓
Business Leads list
    ├── Name
    ├── WhatsApp
    ├── Email
    ├── Source
    ├── Status
    ├── Assessment result
    ├── Delivery status
    ├── Consent
    └── Created / Updated
```

Both the page and API require server-side admin authorization. The list is paginated using the existing admin pagination utility.

## 7. Analytics

Server-side funnel events distinguish:

- `business_lead_created`
- `business_lead_reused`
- `business_lead_failed`

The event payload contains only the canonical source and does not contain contact secrets.

## 8. Regression Boundary

V16.7 must preserve:

- Free Assessment
- Instant Result
- FreeLeadCapture
- Free Report
- PDF generation/download
- WhatsApp/email delivery and V16.6 duplicate protection
- Premium Offer
- Checkout
- Entitlement
- Admin authorization
- Analytics

## 9. Gate

```text
pnpm db:migrate:deploy
pnpm v16:5:gate
pnpm v16:6:gate
pnpm v16:7:gate
pnpm typecheck
pnpm build

Runtime:
- new lead
- duplicate by WhatsApp
- duplicate by email
- optional email
- consent persistence
- admin authorization
- V16 regression
```

V16.7 is not PASS until runtime verification is performed locally. Production remains untouched until V16.8 certification.
