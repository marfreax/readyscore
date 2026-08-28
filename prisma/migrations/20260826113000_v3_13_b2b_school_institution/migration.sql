-- Phase 3.13 — B2B School / Institution Architecture
-- Institutional identity/context and explicit institution-level access.
-- No assessment/question/result lifecycle mutation.
CREATE TYPE "InstitutionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'RETIRED');
CREATE TYPE "InstitutionMembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'LEFT');
CREATE TYPE "InstitutionMemberRole" AS ENUM ('OWNER', 'ADMIN', 'COUNSELOR', 'TEACHER', 'STUDENT', 'PARENT');
CREATE TYPE "InstitutionEntitlementStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "InstitutionStatus" NOT NULL DEFAULT 'DRAFT',
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InstitutionMembership" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "InstitutionMemberRole" NOT NULL,
    "status" "InstitutionMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InstitutionMembership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InstitutionEntitlement" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "type" "EntitlementType" NOT NULL,
    "resourceType" "EntitlementResourceType" NOT NULL,
    "resourceKey" TEXT NOT NULL,
    "status" "InstitutionEntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" TEXT NOT NULL DEFAULT 'MANUAL_INSTITUTION',
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InstitutionEntitlement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Institution_code_key" ON "Institution"("code");
CREATE INDEX "Institution_status_idx" ON "Institution"("status");
CREATE INDEX "Institution_createdAt_idx" ON "Institution"("createdAt");

CREATE UNIQUE INDEX "InstitutionMembership_institutionId_userId_key" ON "InstitutionMembership"("institutionId", "userId");
CREATE INDEX "InstitutionMembership_userId_status_idx" ON "InstitutionMembership"("userId", "status");
CREATE INDEX "InstitutionMembership_institutionId_status_idx" ON "InstitutionMembership"("institutionId", "status");

CREATE UNIQUE INDEX "InstitutionEntitlement_institutionId_type_resourceType_resourceKey_key"
ON "InstitutionEntitlement"("institutionId", "type", "resourceType", "resourceKey");
CREATE INDEX "InstitutionEntitlement_institutionId_status_idx" ON "InstitutionEntitlement"("institutionId", "status");
CREATE INDEX "InstitutionEntitlement_resourceType_resourceKey_status_idx"
ON "InstitutionEntitlement"("resourceType", "resourceKey", "status");

ALTER TABLE "InstitutionMembership"
ADD CONSTRAINT "InstitutionMembership_institutionId_fkey"
FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InstitutionMembership"
ADD CONSTRAINT "InstitutionMembership_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InstitutionEntitlement"
ADD CONSTRAINT "InstitutionEntitlement_institutionId_fkey"
FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
