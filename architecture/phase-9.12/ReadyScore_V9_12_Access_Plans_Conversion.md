# ReadyScore V9.12 — Access / Plans / Conversion UX

## Scope

V9.12 strengthens the customer-facing Access & Plans surface and the conversion journey over the existing commercial runtime.

The implementation is presentation/orchestration only:

- Access status reads canonical active entitlements.
- Plans are rendered from the active commercial catalog.
- Upgrade options use the existing upgrade quote service.
- Single Test conversion uses the existing Scalev checkout SKU boundary.
- All Tests and All Tests + Profiling use their existing Scalev checkout SKU boundaries.
- Checkout is never treated as entitlement.
- Entitlement remains activated only by verified commercial fulfillment.
- Add-ons remain informational unless their existing commercial fulfillment flow is configured.

## Protected boundaries

V9.12 does **not** change:

- measurement semantics;
- scoring semantics;
- question bank content;
- question selection;
- historical QuestionVersion semantics;
- result semantics;
- Cross-Test Profile semantics;
- Reports semantics;
- Activity semantics;
- universal score;
- raw-average synthesis;
- entitlement grant primitives;
- payment verification;
- Scalev webhook/fulfillment semantics;
- database schema.

No database migration is introduced.

No universal score.

No raw-average synthesis.

## Customer experience

### 1. Current access

The customer can immediately see:

- whether paid access is active;
- the current commercial tier;
- links back to Assessments and Reports;
- that access status comes from active entitlement.

### 2. Plans

The plan comparison presents the customer-facing commercial tiers:

- Single Test;
- All Tests;
- All Tests + Profiling.

Each plan communicates capability rather than an invented universal score.

The current plan is marked as active. Lower tiers are not presented as upgrade actions. Higher tiers are presented as upgrade opportunities when the canonical upgrade quote allows them.

### 3. Single Test conversion

The customer can choose one of:

- Cognitive;
- EQ;
- DISC;
- RIASEC.

The selected SKU is passed to the existing `/api/scalev/checkout` boundary.

The UI does not grant entitlement.

### 4. Checkout configuration safety

A purchase CTA is shown only when the corresponding Scalev SKU is configured.

When configuration is missing, the customer receives an explicit non-purchase state instead of a dead or misleading payment action.

### 5. Upgrade conversion

Upgrade messaging is capability-based:

- one assessment;
- all four core assessments;
- all four core assessments plus Cross-Test Profile.

Existing differential pricing from `getUpgradeQuote()` is displayed as informational conversion context.

### 6. Add-ons

Existing B2C add-ons remain visible as capability extensions.

Their active state is derived from current add-on entitlement state. V9.12 does not invent new checkout SKUs or direct grant paths for add-ons.

## Architecture

```text
Customer
   │
   ▼
/access
   │
   ├── getCommercialCatalog()
   │
   ├── getActiveProductsForUser()
   │
   ├── listUserEntitlements()
   │
   ├── getUpgradeQuote()
   │
   └── getScalevCheckoutConfiguration()
             │
             ▼
      capability-aware CTA
             │
             ▼
/api/scalev/checkout?sku=...
             │
             ▼
        Scalev checkout
             │
             ▼
 verified commercial fulfillment
             │
             ▼
   ReadyScore entitlement state
```

## Security / ownership

The customer page requires an authenticated session.

Access decisions remain entitlement-based.

The customer page cannot call:

- `grantProductEntitlements`;
- `grantSingleTestEntitlements`;
- `grantEntitlement`.

The checkout route requires authentication and validates the requested SKU before redirecting.

## Measurement safety

V9.12 does not introduce:

- IQ reinterpretation;
- new assessment scores;
- cross-test averaging;
- universal scoring;
- measurement calibration;
- question-bank changes.

The Access / Plans surface describes product capabilities, not psychometric conclusions.

## Regression requirements

Before freezing V9.12:

```text
pnpm typecheck
pnpm build
pnpm v9:0:gate
pnpm v9:1:gate
pnpm v9:2:gate
pnpm v9:3:gate
pnpm v9:4:gate
pnpm v9:5:gate
pnpm v9:6:gate
pnpm v9:7:gate
pnpm v9:8:gate
pnpm v9:9:gate
pnpm v9:10:gate
pnpm v9:11:gate
pnpm v9:12:gate
```

Database migration must remain absent.

## Acceptance target

V9.12 is accepted only when:

- typecheck passes;
- production build passes;
- V9.0–V9.11 gates remain PASS;
- V9.12 gate passes;
- checkout boundary remains redirect-only;
- no customer-side entitlement grant bypass exists;
- no measurement/scoring/question-bank mutation is introduced;
- no database migration is introduced.
