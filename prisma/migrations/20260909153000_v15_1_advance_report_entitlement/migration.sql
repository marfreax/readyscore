-- READY SCORE V15.1
-- Controlled entitlement integration for the V15 personalized report.
--
-- V14's commercial tier remains unchanged:
--   ADVANCE = All Tests + Profiling
-- V15 adds the report capability to that existing product as a controlled
-- feature entitlement. The existing Advanced Report add-on remains available
-- for tiers that do not already include this capability.
--
-- Existing active ADVANCE customers are backfilled without changing their
-- assessment entitlements, result semantics, payment state, or entitlement
-- expiry. New ADVANCE fulfillment automatically grants this entitlement via
-- the canonical ProductEntitlement -> UserEntitlement fulfillment path.

INSERT INTO "ProductEntitlement"
  ("id", "productId", "type", "resourceType", "resourceKey", "metadata")
VALUES
  (
    'v15-1-advance-report',
    'product-advance',
    'REPORT_ACCESS',
    'FEATURE',
    'ADVANCED_REPORT_V1',
    '{"version":"V15.1","source":"V15_CONTROLLED_ENTITLEMENT_INTEGRATION","includedIn":"ADVANCE"}'
  )
ON CONFLICT ("productId", "type", "resourceType", "resourceKey") DO UPDATE
SET
  "metadata" = EXCLUDED."metadata";

-- Backfill only currently active ADVANCE customers. We preserve the original
-- entitlement window and order provenance. ON CONFLICT makes the operation
-- safe to rerun/reconcile without creating duplicate user entitlements.
INSERT INTO "UserEntitlement"
  (
    "id",
    "userId",
    "productId",
    "type",
    "resourceType",
    "resourceKey",
    "status",
    "source",
    "sourceOrderId",
    "usageLimit",
    "usageConsumed",
    "startsAt",
    "endsAt"
  )
SELECT DISTINCT ON (ue."userId")
  concat('v15rpt_', substr(md5(ue."userId"), 1, 24)),
  ue."userId",
  'product-advance',
  'REPORT_ACCESS',
  'FEATURE',
  'ADVANCED_REPORT_V1',
  'ACTIVE',
  'V15.1_ADVANCE_BACKFILL',
  ue."sourceOrderId",
  1,
  0,
  ue."startsAt",
  ue."endsAt"
FROM "UserEntitlement" ue
WHERE ue."productId" = 'product-advance'
  AND ue."status" = 'ACTIVE'
  AND ue."startsAt" <= CURRENT_TIMESTAMP
  AND (ue."endsAt" IS NULL OR ue."endsAt" > CURRENT_TIMESTAMP)
  AND NOT EXISTS (
    SELECT 1
    FROM "UserEntitlement" existing
    WHERE existing."userId" = ue."userId"
      AND existing."type" = 'REPORT_ACCESS'
      AND existing."resourceType" = 'FEATURE'
      AND existing."resourceKey" = 'ADVANCED_REPORT_V1'
  )
ORDER BY ue."userId", ue."updatedAt" DESC;

UPDATE "Product"
SET "description" = 'All core tests plus Cross-Test Profiling and the personalized V15 report.'
WHERE "id" = 'product-advance';
