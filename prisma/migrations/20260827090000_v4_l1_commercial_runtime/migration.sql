-- READY SCORE V4 L1
-- Commercial Runtime
--
-- Customer-facing launch catalog:
--   BASIC   = Rp99,000  Single Test
--   MEDIUM  = Rp199,000 All Tests
--   ADVANCE = Rp249,000 All Tests + Profiling
--
-- FREE remains an internal legacy/trial placeholder and is retired from
-- the primary paid launch catalog. Payment/checkout is not implemented here.

UPDATE "Product"
SET
  "name" = CASE "tier"
    WHEN 'FREE' THEN 'Free Trial'
    WHEN 'BASIC' THEN 'Single Test'
    WHEN 'MEDIUM' THEN 'All Tests'
    WHEN 'ADVANCE' THEN 'All Tests + Profiling'
  END,
  "description" = CASE "tier"
    WHEN 'FREE' THEN 'Legacy trial entry. Not part of the primary paid launch funnel.'
    WHEN 'BASIC' THEN 'Choose exactly one core assessment: IQ, EQ, DISC, or RIASEC.'
    WHEN 'MEDIUM' THEN 'IQ + EQ + DISC + RIASEC with the initial assessment entitlement for each.'
    WHEN 'ADVANCE' THEN 'All core tests plus Cross-Test Profiling.'
  END,
  "priceIdr" = CASE "tier"
    WHEN 'FREE' THEN 0
    WHEN 'BASIC' THEN 99000
    WHEN 'MEDIUM' THEN 199000
    WHEN 'ADVANCE' THEN 249000
  END,
  "status" = CASE "tier"
    WHEN 'FREE' THEN 'RETIRED'::"ProductStatus"
    ELSE 'ACTIVE'::"ProductStatus"
  END;

-- Remove the obsolete Phase 3.1 entitlement definitions for the three
-- launch products. Existing user entitlements are intentionally preserved.
DELETE FROM "ProductEntitlement"
WHERE "productId" IN ('product-basic', 'product-medium', 'product-advance');

-- BASIC / Single Test has no fixed bundle. Its concrete test entitlement is
-- resolved from the selected test at fulfillment time.
--
-- MEDIUM / All Tests grants exactly the four launch tests.
INSERT INTO "ProductEntitlement"
  ("id","productId","type","resourceType","resourceKey","metadata")
VALUES
  ('v4-l1-medium-test-cognitive','product-medium','TEST_ACCESS','TEST_TYPE','COGNITIVE','{"version":"V4_COMMERCIAL_L1","matrixVersion":"V4_COMMERCIAL_MATRIX_1"}'),
  ('v4-l1-medium-result-cognitive','product-medium','RESULT_ACCESS','TEST_TYPE','COGNITIVE','{"version":"V4_COMMERCIAL_L1","matrixVersion":"V4_COMMERCIAL_MATRIX_1"}'),
  ('v4-l1-medium-test-eq','product-medium','TEST_ACCESS','TEST_TYPE','EQ','{"version":"V4_COMMERCIAL_L1","matrixVersion":"V4_COMMERCIAL_MATRIX_1"}'),
  ('v4-l1-medium-result-eq','product-medium','RESULT_ACCESS','TEST_TYPE','EQ','{"version":"V4_COMMERCIAL_L1","matrixVersion":"V4_COMMERCIAL_MATRIX_1"}'),
  ('v4-l1-medium-test-disc','product-medium','TEST_ACCESS','TEST_TYPE','DISC','{"version":"V4_COMMERCIAL_L1","matrixVersion":"V4_COMMERCIAL_MATRIX_1"}'),
  ('v4-l1-medium-result-disc','product-medium','RESULT_ACCESS','TEST_TYPE','DISC','{"version":"V4_COMMERCIAL_L1","matrixVersion":"V4_COMMERCIAL_MATRIX_1"}'),
  ('v4-l1-medium-test-riasec','product-medium','TEST_ACCESS','TEST_TYPE','RIASEC','{"version":"V4_COMMERCIAL_L1","matrixVersion":"V4_COMMERCIAL_MATRIX_1"}'),
  ('v4-l1-medium-result-riasec','product-medium','RESULT_ACCESS','TEST_TYPE','RIASEC','{"version":"V4_COMMERCIAL_L1","matrixVersion":"V4_COMMERCIAL_MATRIX_1"}'),

  ('v4-l1-advance-test-cognitive','product-advance','TEST_ACCESS','TEST_TYPE','COGNITIVE','{"version":"V4_COMMERCIAL_L1","matrixVersion":"V4_COMMERCIAL_MATRIX_1"}'),
  ('v4-l1-advance-result-cognitive','product-advance','RESULT_ACCESS','TEST_TYPE','COGNITIVE','{"version":"V4_COMMERCIAL_L1","matrixVersion":"V4_COMMERCIAL_MATRIX_1"}'),
  ('v4-l1-advance-test-eq','product-advance','TEST_ACCESS','TEST_TYPE','EQ','{"version":"V4_COMMERCIAL_L1","matrixVersion":"V4_COMMERCIAL_MATRIX_1"}'),
  ('v4-l1-advance-result-eq','product-advance','RESULT_ACCESS','TEST_TYPE','EQ','{"version":"V4_COMMERCIAL_L1","matrixVersion":"V4_COMMERCIAL_MATRIX_1"}'),
  ('v4-l1-advance-test-disc','product-advance','TEST_ACCESS','TEST_TYPE','DISC','{"version":"V4_COMMERCIAL_L1","matrixVersion":"V4_COMMERCIAL_MATRIX_1"}'),
  ('v4-l1-advance-result-disc','product-advance','RESULT_ACCESS','TEST_TYPE','DISC','{"version":"V4_COMMERCIAL_L1","matrixVersion":"V4_COMMERCIAL_MATRIX_1"}'),
  ('v4-l1-advance-test-riasec','product-advance','TEST_ACCESS','TEST_TYPE','RIASEC','{"version":"V4_COMMERCIAL_L1","matrixVersion":"V4_COMMERCIAL_MATRIX_1"}'),
  ('v4-l1-advance-result-riasec','product-advance','RESULT_ACCESS','TEST_TYPE','RIASEC','{"version":"V4_COMMERCIAL_L1","matrixVersion":"V4_COMMERCIAL_MATRIX_1"}'),
  ('v4-l1-advance-profile-cross-test','product-advance','PROFILE_ACCESS','FEATURE','CROSS_TEST_PROFILE_V1','{"version":"V4_COMMERCIAL_L1","matrixVersion":"V4_COMMERCIAL_MATRIX_1"}');
