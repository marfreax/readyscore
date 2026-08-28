-- READY SCORE V3 PHASE 3.12
-- B2C Conversion & Add-on Products
-- Additive commercial layer. Phase 3.1 Product/Tier matrix remains unchanged.
-- No checkout, payment, subscription, billing, webhook, or auto-grant implementation.

CREATE TYPE "AddOnProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RETIRED');

CREATE TABLE "AddOnProduct" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "priceIdr" INTEGER,
  "status" "AddOnProductStatus" NOT NULL DEFAULT 'DRAFT',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AddOnProduct_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AddOnProductEntitlement" (
  "id" TEXT NOT NULL,
  "addOnProductId" TEXT NOT NULL,
  "type" "EntitlementType" NOT NULL,
  "resourceType" "EntitlementResourceType" NOT NULL,
  "resourceKey" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AddOnProductEntitlement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserAddOnEntitlement" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "addOnProductId" TEXT NOT NULL,
  "type" "EntitlementType" NOT NULL,
  "resourceType" "EntitlementResourceType" NOT NULL,
  "resourceKey" TEXT NOT NULL,
  "status" "EntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
  "source" TEXT NOT NULL DEFAULT 'MANUAL',
  "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserAddOnEntitlement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AddOnProduct_code_key" ON "AddOnProduct"("code");
CREATE INDEX "AddOnProduct_status_sortOrder_idx" ON "AddOnProduct"("status","sortOrder");
CREATE UNIQUE INDEX "AddOnProductEntitlement_addOnProductId_type_resourceType_resourceKey_key"
  ON "AddOnProductEntitlement"("addOnProductId","type","resourceType","resourceKey");
CREATE INDEX "AddOnProductEntitlement_type_resourceType_resourceKey_idx"
  ON "AddOnProductEntitlement"("type","resourceType","resourceKey");
CREATE UNIQUE INDEX "UserAddOnEntitlement_userId_type_resourceType_resourceKey_key"
  ON "UserAddOnEntitlement"("userId","type","resourceType","resourceKey");
CREATE INDEX "UserAddOnEntitlement_userId_status_idx"
  ON "UserAddOnEntitlement"("userId","status");
CREATE INDEX "UserAddOnEntitlement_resourceType_resourceKey_status_idx"
  ON "UserAddOnEntitlement"("resourceType","resourceKey","status");

ALTER TABLE "AddOnProductEntitlement"
  ADD CONSTRAINT "AddOnProductEntitlement_addOnProductId_fkey"
  FOREIGN KEY ("addOnProductId") REFERENCES "AddOnProduct"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserAddOnEntitlement"
  ADD CONSTRAINT "UserAddOnEntitlement_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserAddOnEntitlement"
  ADD CONSTRAINT "UserAddOnEntitlement_addOnProductId_fkey"
  FOREIGN KEY ("addOnProductId") REFERENCES "AddOnProduct"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "AddOnProduct" ("id","code","name","description","priceIdr","status","sortOrder")
VALUES
  ('addon-riasec-v1','RIASEC_V1','RIASEC Interest Profile','Add RIASEC assessment access and its result to an eligible account.',49000,'ACTIVE',10),
  ('addon-cross-test-profile-v1','CROSS_TEST_PROFILE_V1','Cross-Test Profile','Unlock synthesis of available assessment evidence without a universal score.',79000,'ACTIVE',20),
  ('addon-study-direction-v1','STUDY_DIRECTION_V1','Study Direction','Unlock study-area exploration from available profile evidence.',99000,'ACTIVE',30),
  ('addon-major-fit-v1','MAJOR_FIT_V1','Major Fit','Unlock correspondence exploration against defined major profiles.',99000,'ACTIVE',40),
  ('addon-career-exploration-v1','CAREER_EXPLORATION_V1','Career Exploration','Unlock exploration of career families from profile and direction evidence.',99000,'ACTIVE',50),
  ('addon-advanced-report-v1','ADVANCED_REPORT_V1','Advanced Report','Unlock the read-only advanced report experience.',79000,'ACTIVE',60);

INSERT INTO "AddOnProductEntitlement"
  ("id","addOnProductId","type","resourceType","resourceKey","metadata")
VALUES
  ('aoe-riasec-test','addon-riasec-v1','TEST_ACCESS','TEST_TYPE','RIASEC','{"phase":"3.12","catalogVersion":"V3_B2C_ADD_ON_CATALOG_1"}'),
  ('aoe-riasec-result','addon-riasec-v1','RESULT_ACCESS','TEST_TYPE','RIASEC','{"phase":"3.12","catalogVersion":"V3_B2C_ADD_ON_CATALOG_1"}'),
  ('aoe-profile','addon-cross-test-profile-v1','PROFILE_ACCESS','FEATURE','CROSS_TEST_PROFILE_V1','{"phase":"3.12","catalogVersion":"V3_B2C_ADD_ON_CATALOG_1"}'),
  ('aoe-direction','addon-study-direction-v1','DIRECTION_ACCESS','FEATURE','STUDY_DIRECTION_V1','{"phase":"3.12","catalogVersion":"V3_B2C_ADD_ON_CATALOG_1"}'),
  ('aoe-major-fit','addon-major-fit-v1','MAJOR_FIT_ACCESS','FEATURE','MAJOR_FIT_V1','{"phase":"3.12","catalogVersion":"V3_B2C_ADD_ON_CATALOG_1"}'),
  ('aoe-career','addon-career-exploration-v1','CAREER_ACCESS','FEATURE','CAREER_EXPLORATION_V1','{"phase":"3.12","catalogVersion":"V3_B2C_ADD_ON_CATALOG_1"}'),
  ('aoe-report','addon-advanced-report-v1','REPORT_ACCESS','FEATURE','ADVANCED_REPORT_V1','{"phase":"3.12","catalogVersion":"V3_B2C_ADD_ON_CATALOG_1"}');
