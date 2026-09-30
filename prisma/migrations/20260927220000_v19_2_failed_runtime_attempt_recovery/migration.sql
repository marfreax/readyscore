-- ReadyScore V19.2 — recover the local/staging Learning Preference attempts
-- created while the first V19.2 runtime mapping was still broken.
--
-- This is a one-time data repair. It only touches expired, result-less
-- Learning Preference attempts whose TEST_ACCESS entitlement was granted by
-- the V19.2 entitlement reconciliation. The failed attempt is abandoned and
-- exactly one consumed unit is returned so the paid access can be used again.
-- Future normal attempts are protected by the runtime resume rule.

WITH recoverable AS (
  SELECT
    a.id AS attempt_id,
    ue.id AS entitlement_id
  FROM "AssessmentAttempt" a
  JOIN "UserEntitlement" ue
    ON ue."userId" = a."userId"
   AND ue."type" = 'TEST_ACCESS'
   AND ue."resourceType" = 'TEST_TYPE'
   AND ue."resourceKey" = 'LEARNING_PREFERENCE'
   AND ue."status" = 'ACTIVE'
  LEFT JOIN "AssessmentResult" ar ON ar."attemptId" = a.id
  WHERE a."assessmentType" = 'LEARNING_PREFERENCE'
    AND a."status" = 'IN_PROGRESS'
    AND a."expiresAt" IS NOT NULL
    AND a."expiresAt" <= CURRENT_TIMESTAMP
    AND ar."id" IS NULL
    AND ue."usageConsumed" > 0
    AND ue."source" LIKE 'V19.2_%'
)
UPDATE "UserEntitlement" ue
SET "usageConsumed" = ue."usageConsumed" - 1,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE ue."id" IN (SELECT entitlement_id FROM recoverable);

WITH recoverable AS (
  SELECT
    a.id AS attempt_id
  FROM "AssessmentAttempt" a
  JOIN "UserEntitlement" ue
    ON ue."userId" = a."userId"
   AND ue."type" = 'TEST_ACCESS'
   AND ue."resourceType" = 'TEST_TYPE'
   AND ue."resourceKey" = 'LEARNING_PREFERENCE'
   AND ue."status" = 'ACTIVE'
  LEFT JOIN "AssessmentResult" ar ON ar."attemptId" = a.id
  WHERE a."assessmentType" = 'LEARNING_PREFERENCE'
    AND a."status" = 'IN_PROGRESS'
    AND a."expiresAt" IS NOT NULL
    AND a."expiresAt" <= CURRENT_TIMESTAMP
    AND ar."id" IS NULL
    AND ue."source" LIKE 'V19.2_%'
)
UPDATE "AssessmentAttempt" a
SET "status" = 'ABANDONED',
    "abandonedAt" = CURRENT_TIMESTAMP,
    "lastActivityAt" = CURRENT_TIMESTAMP,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE a."id" IN (SELECT attempt_id FROM recoverable);
