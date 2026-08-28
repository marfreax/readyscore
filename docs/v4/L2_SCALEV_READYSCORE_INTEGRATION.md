# ReadyScore V4 — L2 Scalev → ReadyScore Integration

**Status:** ACTIVE  
**Scope:** V4 L2 only  
**Baseline:** V4 L1 Commercial Runtime PASS  
**Date:** 2026-08-27

## 1. Canonical Boundary

```text
Scalev
Commerce / Sales / Payment / Order / Customer
        │
        │ payment.received webhook
        ▼
ReadyScore
Webhook Receipt
        ↓
Purchase Ledger
        ↓
Identity Mapping
        ↓
Product SKU Mapping
        ↓
Entitlement Fulfillment
        ↓
Single-use Customer Handoff
        ↓
ReadyScore Application
```

Scalev remains the commerce/order/customer system. ReadyScore does not replace the
Scalev database.

## 2. Primary Scalev SKU

The currently agreed bundled SKU is:

```text
RS-ASSESSMENT-V1
```

Default mapping:

```text
RS-ASSESSMENT-V1
        ↓
MEDIUM
        ↓
All Tests
        ↓
IQ + EQ + DISC + RIASEC
```

This matches the V4 L1 commercial catalog:

```text
MEDIUM = Rp199.000
```

Additional SKUs are not guessed. They must be added through:

```text
SCALEV_PRODUCT_SKU_MAP_JSON
```

Example shape:

```json
{
  "RS-ASSESSMENT-V1": {
    "tier": "MEDIUM"
  }
}
```

For Single Test mappings, the mapping may include:

```json
{
  "RS-RIASEC-V1": {
    "tier": "BASIC",
    "testType": "RIASEC"
  }
}
```

Only explicitly configured SKU mappings are fulfilled.

## 3. Webhook Contract

ReadyScore endpoint:

```text
POST /api/scalev/webhook
```

Required header:

```text
X-Scalev-Hmac-Sha256
```

The implementation verifies the HMAC-SHA256 Base64 signature against the
exact raw request body before parsing JSON.

Environment variable:

```text
SCALEV_WEBHOOK_SIGNING_SECRET
```

Scalev's current webhook documentation requires this raw-body HMAC verification
and constant-time signature comparison.

## 4. Fulfillment Event

Primary fulfillment event:

```text
payment.received
```

Accepted payment status:

```text
paid
settled
```

`payment.failed` is recorded but never grants entitlement.

`order.created` and `order.updated` are stored as durable order snapshots so
the product SKU can still be resolved when the payment event itself does not
contain `orderlines`.

## 5. Idempotency

Scalev webhook delivery is at-least-once.

The following is the primary event deduplication key:

```text
Scalev unique_id
```

Database constraint:

```text
ScalevWebhookEvent.uniqueId UNIQUE
```

Purchase deduplication:

```text
scalevOrderId UNIQUE
```

Therefore:

```text
payment.received #1
        ↓
fulfill

payment.received #2
        ↓
same order
        ↓
no duplicate purchase
        ↓
no duplicate entitlement
```

Failed webhook events remain retryable.

## 6. Order Enrichment

If `payment.received` arrives before `order.created`, ReadyScore attempts:

1. stored `order.created` / `order.updated` webhook snapshot;
2. Scalev API `GET /v3/orders/{id}` when `SCALEV_API_KEY` is configured.

Environment:

```text
SCALEV_API_KEY=
SCALEV_API_BASE_URL=https://api.scalev.com
```

The API key must remain server-side.

The Scalev API key requires permission to read orders.

## 7. Identity Mapping

Identity is mapped using:

```text
customer.email
```

with:

```text
name
email
phone
Scalev customer ID
```

ReadyScore creates or reuses the corresponding ReadyScore user identity.

The Scalev customer ID is stored as integration metadata only.

## 8. Purchase Ledger

ReadyScore stores:

```text
ScalevPurchase
```

with:

- Scalev order ID;
- Scalev customer ID;
- customer name;
- customer email;
- customer phone;
- product SKU;
- ReadyScore commercial tier;
- selected test type when applicable;
- ReadyScore product ID;
- ReadyScore user ID;
- payment status;
- paid timestamp;
- source webhook event;
- raw order payload;
- fulfillment status.

This is an integration ledger, not a replacement commerce database.

## 9. Entitlement Fulfillment

For:

```text
MEDIUM
```

ReadyScore grants the canonical product entitlement bundle already defined
by V4 L1.

For:

```text
ADVANCE
```

ReadyScore grants the existing product entitlement bundle including:

```text
CROSS_TEST_PROFILE_V1
```

For:

```text
BASIC
```

a `testType` must be explicitly present in the SKU mapping.

No SKU is allowed to silently infer a test type.

## 10. Customer Handoff

ReadyScore creates a single-use handoff token after successful fulfillment.

Only the SHA-256 token hash is stored.

Customer handoff endpoint:

```text
GET /api/scalev/handoff?token=<opaque-token>
```

Successful consumption:

```text
token
 ↓
validate
 ↓
consume once
 ↓
create ReadyScore session
 ↓
redirect /app
```

Default token lifetime:

```text
15 minutes
```

Configurable through:

```text
SCALEV_HANDOFF_TTL_MINUTES
```

## 11. Handoff Issuance API

For a Scalev success-page integration that has the paid order ID and customer
identity available:

```text
POST /api/scalev/handoff/request
```

Body:

```json
{
  "orderId": "SCALEV_ORDER_ID",
  "email": "customer@example.com",
  "phone": "628123456789"
}
```

ReadyScore validates the fulfilled purchase and identity before issuing a new
single-use handoff URL.

This keeps the customer-facing session token out of the webhook payload and
prevents the Scalev order ID alone from being treated as an authentication
credential.

## 12. Required Environment

```text
SCALEV_WEBHOOK_SIGNING_SECRET=
SCALEV_API_KEY=
SCALEV_API_BASE_URL=https://api.scalev.com
READYSCORE_PUBLIC_URL=
SCALEV_PRODUCT_SKU_MAP_JSON=
SCALEV_HANDOFF_TTL_MINUTES=15
```

The API key and signing secret must never be committed to source control or
exposed to browser code.

## 13. Scalev Configuration

Configure the Scalev business webhook to send:

```text
payment.received
order.created
order.updated
payment.failed
```

At minimum, `payment.received` is required for paid fulfillment and
`order.created` is required when the payment payload does not contain the
purchased orderlines.

Webhook URL:

```text
https://<READY_SCORE_DOMAIN>/api/scalev/webhook
```

Use the same signing secret configured for the ReadyScore environment.

## 14. Current Boundary

L2 includes:

- webhook ingestion;
- HMAC verification;
- event persistence;
- idempotency;
- order enrichment;
- SKU mapping;
- customer identity mapping;
- purchase ledger;
- entitlement activation;
- failure/retry handling;
- customer handoff token;
- ReadyScore session delivery.

L2 does **not** include:

- redesign of Scalev checkout;
- subscription billing architecture;
- payment gateway replacement;
- assessment/scoring changes;
- result changes;
- RIASEC engine changes.

## 15. Validation

Run:

```bash
pnpm db:migrate:deploy
pnpm typecheck
pnpm build
pnpm v4:l2:gate
pnpm commercial:gate
pnpm e2e:riasec
```

The L2 gate validates the integration boundary and does not claim that the
external Scalev account/webhook configuration is live.

## 16. Source-of-Truth Rules

This implementation follows the V4–V6 operating rules:

```text
Full ZIP in
    ↓
Analyze actual source
    ↓
Reconcile
    ↓
Implement
    ↓
Full ZIP out
```

No manual source patch is part of the normal workflow.

No new `docs/` folder is created by this implementation. This document is
placed under `V4/` so it can be moved manually into the project's documentation
structure later.
