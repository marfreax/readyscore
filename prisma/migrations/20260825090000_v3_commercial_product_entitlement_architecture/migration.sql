-- READY SCORE V3 PHASE 3.1
-- Commercial Product & Entitlement Architecture
-- Scope: commercial catalog + explicit entitlement boundary only.
-- No assessment/question/result lifecycle mutation.

CREATE TYPE "CommercialTier" AS ENUM (
  'FREE',
  'BASIC',
  'MEDIUM',
  'ADVANCE'
);

CREATE TYPE "ProductStatus" AS ENUM (
  'DRAFT',
  'ACTIVE',
  'RETIRED'
);

CREATE TYPE "EntitlementType" AS ENUM (
  'TEST_ACCESS',
  'RESULT_ACCESS',
  'PROFILE_ACCESS',
  'REPORT_ACCESS',
  'DIRECTION_ACCESS',
  'MAJOR_FIT_ACCESS',
  'CAREER_ACCESS'
);

CREATE TYPE "EntitlementStatus" AS ENUM (
  'ACTIVE',
  'REVOKED',
  'EXPIRED'
);

CREATE TYPE "EntitlementResourceType" AS ENUM (
  'TEST_TYPE',
  'ASSESSMENT_CONFIGURATION',
  'FEATURE'
);

CREATE TABLE "Product" (
  "id" TEXT NOT NULL,
  "tier" "CommercialTier" NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "priceIdr" INTEGER,
  "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductEntitlement" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "type" "EntitlementType" NOT NULL,
  "resourceType" "EntitlementResourceType" NOT NULL,
  "resourceKey" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProductEntitlement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserEntitlement" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "productId" TEXT,
  "type" "EntitlementType" NOT NULL,
  "resourceType" "EntitlementResourceType" NOT NULL,
  "resourceKey" TEXT NOT NULL,
  "status" "EntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
  "source" TEXT NOT NULL DEFAULT 'MANUAL',
  "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserEntitlement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Product_tier_key" ON "Product"("tier");
CREATE INDEX "Product_status_idx" ON "Product"("status");

CREATE UNIQUE INDEX "ProductEntitlement_productId_type_resourceType_resourceKey_key"
  ON "ProductEntitlement"("productId", "type", "resourceType", "resourceKey");
CREATE INDEX "ProductEntitlement_type_resourceType_resourceKey_idx"
  ON "ProductEntitlement"("type", "resourceType", "resourceKey");

CREATE UNIQUE INDEX "UserEntitlement_userId_type_resourceType_resourceKey_key"
  ON "UserEntitlement"("userId", "type", "resourceType", "resourceKey");
CREATE INDEX "UserEntitlement_userId_status_idx"
  ON "UserEntitlement"("userId", "status");
CREATE INDEX "UserEntitlement_resourceType_resourceKey_status_idx"
  ON "UserEntitlement"("resourceType", "resourceKey", "status");

ALTER TABLE "ProductEntitlement"
  ADD CONSTRAINT "ProductEntitlement_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserEntitlement"
  ADD CONSTRAINT "UserEntitlement_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserEntitlement"
  ADD CONSTRAINT "UserEntitlement_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed only the commercial tier catalog. No test-access matrix is locked here.
INSERT INTO "Product" ("id", "tier", "name", "description", "status")
VALUES
  ('product-free', 'FREE', 'Free Trial', 'Experience the product and establish initial value.', 'ACTIVE'),
  ('product-basic', 'BASIC', 'Basic', 'Core assessment experience.', 'ACTIVE'),
  ('product-medium', 'MEDIUM', 'Medium', 'Multi-assessment profile.', 'ACTIVE'),
  ('product-advance', 'ADVANCE', 'Advance', 'Full assessment and direction intelligence.', 'ACTIVE');
