-- ReadyScore V19.2.1 — Work Attitude bundle entitlement reconciliation
--
-- V19.1 made Work Attitude part of MEDIUM/ADVANCE. This follow-up is
-- idempotent and repairs active bundle owners that were created/fulfilled
-- without the Work Attitude entitlements. It does not alter usage counters
-- and does not grant reassessment credit.

INSERT INTO "ProductEntitlement"
  ("id", "productId", "type", "resourceType", "resourceKey", "metadata")
VALUES
  ('v19-2-1-medium-test-work-attitude', 'product-medium', 'TEST_ACCESS', 'TEST_TYPE', 'WORK_ATTITUDE', '{"version":"V19.2.1","source":"WORK_ATTITUDE_BUNDLE_RECONCILIATION","includedIn":"MEDIUM"}'),
  ('v19-2-1-medium-result-work-attitude', 'product-medium', 'RESULT_ACCESS', 'TEST_TYPE', 'WORK_ATTITUDE', '{"version":"V19.2.1","source":"WORK_ATTITUDE_BUNDLE_RECONCILIATION","includedIn":"MEDIUM"}'),
  ('v19-2-1-advance-test-work-attitude', 'product-advance', 'TEST_ACCESS', 'TEST_TYPE', 'WORK_ATTITUDE', '{"version":"V19.2.1","source":"WORK_ATTITUDE_BUNDLE_RECONCILIATION","includedIn":"ADVANCE"}'),
  ('v19-2-1-advance-result-work-attitude', 'product-advance', 'RESULT_ACCESS', 'TEST_TYPE', 'WORK_ATTITUDE', '{"version":"V19.2.1","source":"WORK_ATTITUDE_BUNDLE_RECONCILIATION","includedIn":"ADVANCE"}')
ON CONFLICT ("productId", "type", "resourceType", "resourceKey") DO UPDATE
SET "metadata" = EXCLUDED."metadata";

WITH active_bundle AS (
  SELECT DISTINCT ON (ue."userId")
    ue."userId",
    ue."productId",
    ue."sourceOrderId",
    ue."startsAt",
    ue."endsAt"
  FROM "UserEntitlement" ue
  WHERE ue."productId" IN ('product-medium', 'product-advance')
    AND ue."status" = 'ACTIVE'
    AND ue."startsAt" <= CURRENT_TIMESTAMP
    AND (ue."endsAt" IS NULL OR ue."endsAt" > CURRENT_TIMESTAMP)
  ORDER BY ue."userId",
    CASE WHEN ue."productId" = 'product-advance' THEN 2 ELSE 1 END DESC,
    ue."updatedAt" DESC
)
INSERT INTO "UserEntitlement"
  ("id", "userId", "productId", "type", "resourceType", "resourceKey", "status", "source", "sourceOrderId", "usageLimit", "usageConsumed", "startsAt", "endsAt")
SELECT
  concat('v1921wa_', substr(md5(ab."userId" || ':' || x."type" || ':WORK_ATTITUDE'), 1, 24)),
  ab."userId",
  ab."productId",
  x."type",
  'TEST_TYPE',
  'WORK_ATTITUDE',
  'ACTIVE',
  'V19.2.1_WORK_ATTITUDE_BUNDLE_RECONCILIATION',
  ab."sourceOrderId",
  1,
  0,
  ab."startsAt",
  ab."endsAt"
FROM active_bundle ab
CROSS JOIN (
  VALUES
    ('TEST_ACCESS'::"EntitlementType"),
    ('RESULT_ACCESS'::"EntitlementType")
) AS x("type")
WHERE NOT EXISTS (
  SELECT 1
  FROM "UserEntitlement" existing
  WHERE existing."userId" = ab."userId"
    AND existing."type" = x."type"
    AND existing."resourceType" = 'TEST_TYPE'
    AND existing."resourceKey" = 'WORK_ATTITUDE'
    AND existing."status" = 'ACTIVE'
)
ON CONFLICT ("userId", "type", "resourceType", "resourceKey") DO NOTHING;
