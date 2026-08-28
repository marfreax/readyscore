-- READY SCORE V3 PHASE 3.1
-- Lock the commercial entitlement matrix defined by the V3.1 roadmap.
-- No payment/subscription implementation.
-- No assessment/question/result lifecycle mutation.

UPDATE "Product"
SET
  "priceIdr" = CASE "tier"
    WHEN 'FREE' THEN 0
    WHEN 'BASIC' THEN 99000
    WHEN 'MEDIUM' THEN 199000
    WHEN 'ADVANCE' THEN 299000
  END,
  "status" = 'ACTIVE';

-- Idempotent matrix seed. ProductEntitlement has a unique composite key.
INSERT INTO "ProductEntitlement"
  ("id","productId","type","resourceType","resourceKey","metadata")
VALUES
  ('pe-free-test','product-free','TEST_ACCESS','ASSESSMENT_CONFIGURATION','free-v1','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-free-result','product-free','RESULT_ACCESS','ASSESSMENT_CONFIGURATION','free-v1','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-basic-test-test-cognitive','product-basic','TEST_ACCESS','TEST_TYPE','COGNITIVE','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-basic-test-strength','product-basic','TEST_ACCESS','TEST_TYPE','STRENGTH','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-basic-result-cognitive','product-basic','RESULT_ACCESS','TEST_TYPE','COGNITIVE','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-basic-result-strength','product-basic','RESULT_ACCESS','TEST_TYPE','STRENGTH','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),

  ('pe-medium-test-cognitive','product-medium','TEST_ACCESS','TEST_TYPE','COGNITIVE','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-medium-test-strength','product-medium','TEST_ACCESS','TEST_TYPE','STRENGTH','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-medium-test-eq','product-medium','TEST_ACCESS','TEST_TYPE','EQ','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-medium-test-aq','product-medium','TEST_ACCESS','TEST_TYPE','AQ','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-medium-test-disc','product-medium','TEST_ACCESS','TEST_TYPE','DISC','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-medium-test-riasec','product-medium','TEST_ACCESS','TEST_TYPE','RIASEC','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-medium-result-cognitive','product-medium','RESULT_ACCESS','TEST_TYPE','COGNITIVE','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-medium-result-strength','product-medium','RESULT_ACCESS','TEST_TYPE','STRENGTH','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-medium-result-eq','product-medium','RESULT_ACCESS','TEST_TYPE','EQ','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-medium-result-aq','product-medium','RESULT_ACCESS','TEST_TYPE','AQ','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-medium-result-disc','product-medium','RESULT_ACCESS','TEST_TYPE','DISC','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-medium-result-riasec','product-medium','RESULT_ACCESS','TEST_TYPE','RIASEC','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-medium-profile-cross-test','product-medium','PROFILE_ACCESS','FEATURE','CROSS_TEST_PROFILE_V1','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),

  ('pe-advance-test-cognitive','product-advance','TEST_ACCESS','TEST_TYPE','COGNITIVE','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-advance-test-strength','product-advance','TEST_ACCESS','TEST_TYPE','STRENGTH','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-advance-test-eq','product-advance','TEST_ACCESS','TEST_TYPE','EQ','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-advance-test-aq','product-advance','TEST_ACCESS','TEST_TYPE','AQ','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-advance-test-disc','product-advance','TEST_ACCESS','TEST_TYPE','DISC','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-advance-test-riasec','product-advance','TEST_ACCESS','TEST_TYPE','RIASEC','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-advance-test-learning','product-advance','TEST_ACCESS','TEST_TYPE','LEARNING','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-advance-result-cognitive','product-advance','RESULT_ACCESS','TEST_TYPE','COGNITIVE','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-advance-result-strength','product-advance','RESULT_ACCESS','TEST_TYPE','STRENGTH','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-advance-result-eq','product-advance','RESULT_ACCESS','TEST_TYPE','EQ','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-advance-result-aq','product-advance','RESULT_ACCESS','TEST_TYPE','AQ','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-advance-result-disc','product-advance','RESULT_ACCESS','TEST_TYPE','DISC','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-advance-result-riasec','product-advance','RESULT_ACCESS','TEST_TYPE','RIASEC','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-advance-result-learning','product-advance','RESULT_ACCESS','TEST_TYPE','LEARNING','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-advance-profile-cross-test','product-advance','PROFILE_ACCESS','FEATURE','CROSS_TEST_PROFILE_V1','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-advance-direction-study','product-advance','DIRECTION_ACCESS','FEATURE','STUDY_DIRECTION_V1','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-advance-major-fit','product-advance','MAJOR_FIT_ACCESS','FEATURE','MAJOR_FIT_V1','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-advance-career','product-advance','CAREER_ACCESS','FEATURE','CAREER_EXPLORATION_V1','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}'),
  ('pe-advance-report','product-advance','REPORT_ACCESS','FEATURE','ADVANCED_REPORT_V1','{"phase":"3.1","matrixVersion":"V3_COMMERCIAL_MATRIX_1"}')
ON CONFLICT ("productId","type","resourceType","resourceKey")
DO UPDATE SET "metadata" = EXCLUDED."metadata";
