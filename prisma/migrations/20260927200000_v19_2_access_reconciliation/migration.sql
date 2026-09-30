-- ReadyScore V19.2 — access reconciliation
-- Ensure completed/new V19 assessment owners retain RESULT_ACCESS just like
-- the existing core assessments. This is additive and non-destructive.

-- Keep product definitions aligned for V19 assessment types.
INSERT INTO "ProductEntitlement"
  ("id", "productId", "type", "resourceType", "resourceKey", "metadata")
VALUES
  ('v19-2-medium-result-learning-preference', 'product-medium', 'RESULT_ACCESS', 'TEST_TYPE', 'LEARNING_PREFERENCE', '{"version":"V19.2","source":"LEARNING_PREFERENCE_BUNDLE_EXPANSION","includedIn":"MEDIUM"}'),
  ('v19-2-advance-result-learning-preference', 'product-advance', 'RESULT_ACCESS', 'TEST_TYPE', 'LEARNING_PREFERENCE', '{"version":"V19.2","source":"LEARNING_PREFERENCE_BUNDLE_EXPANSION","includedIn":"ADVANCE"}')
ON CONFLICT ("productId", "type", "resourceType", "resourceKey") DO UPDATE
SET "metadata" = EXCLUDED."metadata";

-- Reconcile active test owners. Existing usage counters are never changed.
INSERT INTO "UserEntitlement"
  ("id", "userId", "productId", "type", "resourceType", "resourceKey", "status", "source", "sourceOrderId", "usageLimit", "usageConsumed", "startsAt", "endsAt")
SELECT
  concat('v19res_', substr(md5(ue."userId" || ':' || ue."resourceKey" || ':RESULT_ACCESS'), 1, 24)),
  ue."userId",
  ue."productId",
  'RESULT_ACCESS',
  'TEST_TYPE',
  ue."resourceKey",
  'ACTIVE',
  'V19.2_ACCESS_RECONCILIATION',
  ue."sourceOrderId",
  1,
  0,
  ue."startsAt",
  ue."endsAt"
FROM "UserEntitlement" ue
WHERE ue."type" = 'TEST_ACCESS'
  AND ue."resourceType" = 'TEST_TYPE'
  AND ue."resourceKey" IN ('WORK_ATTITUDE', 'LEARNING_PREFERENCE')
  AND ue."status" = 'ACTIVE'
  AND NOT EXISTS (
    SELECT 1
    FROM "UserEntitlement" existing
    WHERE existing."userId" = ue."userId"
      AND existing."type" = 'RESULT_ACCESS'
      AND existing."resourceType" = 'TEST_TYPE'
      AND existing."resourceKey" = ue."resourceKey"
  );

-- Completed V19 assessments must also retain result access even if their
-- original test-access entitlement has subsequently been consumed.
INSERT INTO "UserEntitlement"
  ("id", "userId", "productId", "type", "resourceType", "resourceKey", "status", "source", "sourceOrderId", "usageLimit", "usageConsumed", "startsAt", "endsAt")
SELECT
  concat('v19res_', substr(md5(a."userId" || ':' || a."assessmentType" || ':COMPLETED:RESULT_ACCESS'), 1, 24)),
  a."userId",
  NULL,
  'RESULT_ACCESS',
  'TEST_TYPE',
  a."assessmentType"::text,
  'ACTIVE',
  'V19.2_COMPLETED_RESULT_RECONCILIATION',
  NULL,
  1,
  0,
  a."startedAt",
  NULL
FROM "AssessmentAttempt" a
WHERE a."status" = 'COMPLETED'
  AND a."assessmentType" IN ('WORK_ATTITUDE', 'LEARNING_PREFERENCE')
  AND NOT EXISTS (
    SELECT 1
    FROM "UserEntitlement" existing
    WHERE existing."userId" = a."userId"
      AND existing."type" = 'RESULT_ACCESS'
      AND existing."resourceType" = 'TEST_TYPE'
      AND existing."resourceKey" = a."assessmentType"::text
  );
