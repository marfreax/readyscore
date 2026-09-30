-- ReadyScore V19.5 — Commercial / Pricing / Package Alignment
-- Reconciles the active commercial product catalog to the six-assessment model.
-- Existing ProductEntitlement rows are preserved for customer-data safety; canonical
-- V19.5 rows are added/updated idempotently. Historical order snapshots are untouched.

UPDATE "Product"
SET "priceIdr" = CASE "tier"
  WHEN 'FREE' THEN 0
  WHEN 'BASIC' THEN 99000
  WHEN 'MEDIUM' THEN 199000
  WHEN 'ADVANCE' THEN 249000
END,
"status" = 'ACTIVE'
WHERE "tier" IN ('FREE','BASIC','MEDIUM','ADVANCE');

INSERT INTO "ProductEntitlement"
  ("id","productId","type","resourceType","resourceKey","metadata")
VALUES
  ('v195-basic-test-cognitive','product-basic','TEST_ACCESS','TEST_TYPE','COGNITIVE','{"version":"V19.5","source":"COMMERCIAL_ALIGNMENT"}'),
  ('v195-basic-result-cognitive','product-basic','RESULT_ACCESS','TEST_TYPE','COGNITIVE','{"version":"V19.5","source":"COMMERCIAL_ALIGNMENT"}'),
  ('v195-medium-test-cognitive','product-medium','TEST_ACCESS','TEST_TYPE','COGNITIVE','{"version":"V19.5","source":"COMMERCIAL_ALIGNMENT"}'),
  ('v195-medium-result-cognitive','product-medium','RESULT_ACCESS','TEST_TYPE','COGNITIVE','{"version":"V19.5","source":"COMMERCIAL_ALIGNMENT"}'),
  ('v195-medium-test-eq','product-medium','TEST_ACCESS','TEST_TYPE','EQ','{"version":"V19.5","source":"COMMERCIAL_ALIGNMENT"}'),
  ('v195-medium-result-eq','product-medium','RESULT_ACCESS','TEST_TYPE','EQ','{"version":"V19.5","source":"COMMERCIAL_ALIGNMENT"}'),
  ('v195-medium-test-disc','product-medium','TEST_ACCESS','TEST_TYPE','DISC','{"version":"V19.5","source":"COMMERCIAL_ALIGNMENT"}'),
  ('v195-medium-result-disc','product-medium','RESULT_ACCESS','TEST_TYPE','DISC','{"version":"V19.5","source":"COMMERCIAL_ALIGNMENT"}'),
  ('v195-medium-test-riasec','product-medium','TEST_ACCESS','TEST_TYPE','RIASEC','{"version":"V19.5","source":"COMMERCIAL_ALIGNMENT"}'),
  ('v195-medium-result-riasec','product-medium','RESULT_ACCESS','TEST_TYPE','RIASEC','{"version":"V19.5","source":"COMMERCIAL_ALIGNMENT"}'),
  ('v195-medium-test-work-attitude','product-medium','TEST_ACCESS','TEST_TYPE','WORK_ATTITUDE','{"version":"V19.5","source":"COMMERCIAL_ALIGNMENT"}'),
  ('v195-medium-result-work-attitude','product-medium','RESULT_ACCESS','TEST_TYPE','WORK_ATTITUDE','{"version":"V19.5","source":"COMMERCIAL_ALIGNMENT"}'),
  ('v195-medium-test-learning-preference','product-medium','TEST_ACCESS','TEST_TYPE','LEARNING_PREFERENCE','{"version":"V19.5","source":"COMMERCIAL_ALIGNMENT"}'),
  ('v195-medium-result-learning-preference','product-medium','RESULT_ACCESS','TEST_TYPE','LEARNING_PREFERENCE','{"version":"V19.5","source":"COMMERCIAL_ALIGNMENT"}'),
  ('v195-advance-test-cognitive','product-advance','TEST_ACCESS','TEST_TYPE','COGNITIVE','{"version":"V19.5","source":"COMMERCIAL_ALIGNMENT"}'),
  ('v195-advance-result-cognitive','product-advance','RESULT_ACCESS','TEST_TYPE','COGNITIVE','{"version":"V19.5","source":"COMMERCIAL_ALIGNMENT"}'),
  ('v195-advance-test-eq','product-advance','TEST_ACCESS','TEST_TYPE','EQ','{"version":"V19.5","source":"COMMERCIAL_ALIGNMENT"}'),
  ('v195-advance-result-eq','product-advance','RESULT_ACCESS','TEST_TYPE','EQ','{"version":"V19.5","source":"COMMERCIAL_ALIGNMENT"}'),
  ('v195-advance-test-disc','product-advance','TEST_ACCESS','TEST_TYPE','DISC','{"version":"V19.5","source":"COMMERCIAL_ALIGNMENT"}'),
  ('v195-advance-result-disc','product-advance','RESULT_ACCESS','TEST_TYPE','DISC','{"version":"V19.5","source":"COMMERCIAL_ALIGNMENT"}'),
  ('v195-advance-test-riasec','product-advance','TEST_ACCESS','TEST_TYPE','RIASEC','{"version":"V19.5","source":"COMMERCIAL_ALIGNMENT"}'),
  ('v195-advance-result-riasec','product-advance','RESULT_ACCESS','TEST_TYPE','RIASEC','{"version":"V19.5","source":"COMMERCIAL_ALIGNMENT"}'),
  ('v195-advance-test-work-attitude','product-advance','TEST_ACCESS','TEST_TYPE','WORK_ATTITUDE','{"version":"V19.5","source":"COMMERCIAL_ALIGNMENT"}'),
  ('v195-advance-result-work-attitude','product-advance','RESULT_ACCESS','TEST_TYPE','WORK_ATTITUDE','{"version":"V19.5","source":"COMMERCIAL_ALIGNMENT"}'),
  ('v195-advance-test-learning-preference','product-advance','TEST_ACCESS','TEST_TYPE','LEARNING_PREFERENCE','{"version":"V19.5","source":"COMMERCIAL_ALIGNMENT"}'),
  ('v195-advance-result-learning-preference','product-advance','RESULT_ACCESS','TEST_TYPE','LEARNING_PREFERENCE','{"version":"V19.5","source":"COMMERCIAL_ALIGNMENT"}'),
  ('v195-advance-profile-cross-test','product-advance','PROFILE_ACCESS','FEATURE','CROSS_TEST_PROFILE_V1','{"version":"V19.5","source":"COMMERCIAL_ALIGNMENT"}')
ON CONFLICT ("productId","type","resourceType","resourceKey")
DO UPDATE SET "metadata" = EXCLUDED."metadata";
