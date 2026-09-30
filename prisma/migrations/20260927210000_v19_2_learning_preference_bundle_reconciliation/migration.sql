-- ReadyScore V19.2 — Learning Preference bundle reconciliation
--
-- V19.2 data seeding already backfills Learning Preference for active
-- MEDIUM/ADVANCE bundle owners that exist at migration time. This follow-up
-- migration handles users whose bundle entitlement was created/updated
-- before/after the V19.2 migration sequence but whose Learning Preference
-- TEST_ACCESS was still absent.
--
-- Important:
-- - Only MEDIUM/ADVANCE bundle entitlements are used as the source.
-- - SINGLE_TEST (product-basic) users are NOT granted Learning Preference
--   access unless their selected test is Learning Preference itself.
-- - Existing TEST_ACCESS usage is never changed.
-- - No duplicate entitlement is created.

INSERT INTO "UserEntitlement"
  ("id", "userId", "productId", "type", "resourceType", "resourceKey", "status", "source", "sourceOrderId", "usageLimit", "usageConsumed", "startsAt", "endsAt")
SELECT
  concat('v19lp_bundle_', substr(md5(ue."userId" || ':' || ue."productId" || ':LEARNING_PREFERENCE:TEST_ACCESS'), 1, 24)),
  ue."userId",
  ue."productId",
  'TEST_ACCESS',
  'TEST_TYPE',
  'LEARNING_PREFERENCE',
  'ACTIVE',
  'V19.2_LEARNING_PREFERENCE_BUNDLE_RECONCILIATION',
  ue."sourceOrderId",
  1,
  0,
  ue."startsAt",
  ue."endsAt"
FROM "UserEntitlement" ue
WHERE ue."productId" IN ('product-medium', 'product-advance')
  AND ue."type" = 'TEST_ACCESS'
  AND ue."resourceType" = 'TEST_TYPE'
  AND ue."resourceKey" IN ('COGNITIVE', 'EQ', 'DISC', 'RIASEC', 'WORK_ATTITUDE')
  AND ue."status" = 'ACTIVE'
  AND ue."startsAt" <= CURRENT_TIMESTAMP
  AND (ue."endsAt" IS NULL OR ue."endsAt" > CURRENT_TIMESTAMP)
  AND NOT EXISTS (
    SELECT 1
    FROM "UserEntitlement" existing
    WHERE existing."userId" = ue."userId"
      AND existing."type" = 'TEST_ACCESS'
      AND existing."resourceType" = 'TEST_TYPE'
      AND existing."resourceKey" = 'LEARNING_PREFERENCE'
      AND existing."status" = 'ACTIVE'
  )
ON CONFLICT ("userId", "type", "resourceType", "resourceKey") DO NOTHING;

INSERT INTO "UserEntitlement"
  ("id", "userId", "productId", "type", "resourceType", "resourceKey", "status", "source", "sourceOrderId", "usageLimit", "usageConsumed", "startsAt", "endsAt")
SELECT
  concat('v19lp_bundle_result_', substr(md5(ue."userId" || ':' || ue."productId" || ':LEARNING_PREFERENCE:RESULT_ACCESS'), 1, 24)),
  ue."userId",
  ue."productId",
  'RESULT_ACCESS',
  'TEST_TYPE',
  'LEARNING_PREFERENCE',
  'ACTIVE',
  'V19.2_LEARNING_PREFERENCE_BUNDLE_RECONCILIATION',
  ue."sourceOrderId",
  1,
  0,
  ue."startsAt",
  ue."endsAt"
FROM "UserEntitlement" ue
WHERE ue."productId" IN ('product-medium', 'product-advance')
  AND ue."type" = 'TEST_ACCESS'
  AND ue."resourceType" = 'TEST_TYPE'
  AND ue."resourceKey" IN ('COGNITIVE', 'EQ', 'DISC', 'RIASEC', 'WORK_ATTITUDE')
  AND ue."status" = 'ACTIVE'
  AND ue."startsAt" <= CURRENT_TIMESTAMP
  AND (ue."endsAt" IS NULL OR ue."endsAt" > CURRENT_TIMESTAMP)
  AND NOT EXISTS (
    SELECT 1
    FROM "UserEntitlement" existing
    WHERE existing."userId" = ue."userId"
      AND existing."type" = 'RESULT_ACCESS'
      AND existing."resourceType" = 'TEST_TYPE'
      AND existing."resourceKey" = 'LEARNING_PREFERENCE'
      AND existing."status" = 'ACTIVE'
  )
ON CONFLICT ("userId", "type", "resourceType", "resourceKey") DO NOTHING;
