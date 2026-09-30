-- ReadyScore V19.1 — Work Attitude commercial access integration
-- Adds Work Attitude to the existing All Tests (MEDIUM) and
-- All Tests + Profiling (ADVANCE) product entitlements and backfills
-- active bundle owners without requiring repurchase.

INSERT INTO "ProductEntitlement"
  ("id", "productId", "type", "resourceType", "resourceKey", "metadata")
VALUES
  ('v19-1-medium-test-work-attitude', 'product-medium', 'TEST_ACCESS', 'TEST_TYPE', 'WORK_ATTITUDE', '{"version":"V19.1","source":"WORK_ATTITUDE_BUNDLE_EXPANSION","includedIn":"MEDIUM"}'),
  ('v19-1-medium-result-work-attitude', 'product-medium', 'RESULT_ACCESS', 'TEST_TYPE', 'WORK_ATTITUDE', '{"version":"V19.1","source":"WORK_ATTITUDE_BUNDLE_EXPANSION","includedIn":"MEDIUM"}'),
  ('v19-1-advance-test-work-attitude', 'product-advance', 'TEST_ACCESS', 'TEST_TYPE', 'WORK_ATTITUDE', '{"version":"V19.1","source":"WORK_ATTITUDE_BUNDLE_EXPANSION","includedIn":"ADVANCE"}'),
  ('v19-1-advance-result-work-attitude', 'product-advance', 'RESULT_ACCESS', 'TEST_TYPE', 'WORK_ATTITUDE', '{"version":"V19.1","source":"WORK_ATTITUDE_BUNDLE_EXPANSION","includedIn":"ADVANCE"}')
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
  concat('v19wa_', substr(md5(ab."userId" || ':' || x."resourceKey"), 1, 24)),
  ab."userId",
  ab."productId",
  x."type",
  'TEST_TYPE',
  x."resourceKey",
  'ACTIVE',
  'V19.1_WORK_ATTITUDE_BACKFILL',
  ab."sourceOrderId",
  1,
  0,
  ab."startsAt",
  ab."endsAt"
FROM active_bundle ab
CROSS JOIN (
  VALUES
    ('TEST_ACCESS'::"EntitlementType", 'WORK_ATTITUDE'),
    ('RESULT_ACCESS'::"EntitlementType", 'WORK_ATTITUDE')
) AS x("type", "resourceKey")
WHERE NOT EXISTS (
  SELECT 1
  FROM "UserEntitlement" existing
  WHERE existing."userId" = ab."userId"
    AND existing."type" = x."type"
    AND existing."resourceType" = 'TEST_TYPE'
    AND existing."resourceKey" = x."resourceKey"
);

UPDATE "Product"
SET "description" = 'IQ + EQ + DISC + RIASEC + Work Attitude with the initial assessment entitlement for each.'
WHERE "id" = 'product-medium';

UPDATE "Product"
SET "description" = 'All available assessment types including Work Attitude, plus Cross-Test Profiling and the personalized V15 report.'
WHERE "id" = 'product-advance';
