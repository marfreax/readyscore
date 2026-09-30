CREATE TYPE "SubjectProfileType" AS ENUM ('OWNER', 'CHILD');

CREATE TABLE "SubjectProfile" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "SubjectProfileType" NOT NULL DEFAULT 'CHILD',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SubjectProfile_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AssessmentAttempt" ADD COLUMN "subjectId" TEXT;
ALTER TABLE "UserEntitlement" ADD COLUMN "subjectId" TEXT;
ALTER TABLE "UserAddOnEntitlement" ADD COLUMN "subjectId" TEXT;
ALTER TABLE "ReassessmentCredit" ADD COLUMN "subjectId" TEXT;

INSERT INTO "SubjectProfile" ("id", "accountId", "name", "type", "createdAt", "updatedAt")
SELECT 'sub_owner_' || md5(u."id"), u."id", u."name", 'OWNER'::"SubjectProfileType", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User" u
WHERE NOT EXISTS (SELECT 1 FROM "SubjectProfile" s WHERE s."accountId" = u."id");

UPDATE "AssessmentAttempt" a
SET "subjectId" = s."id"
FROM "SubjectProfile" s
WHERE a."userId" = s."accountId" AND s."type" = 'OWNER' AND a."subjectId" IS NULL;

UPDATE "UserEntitlement" e
SET "subjectId" = s."id"
FROM "SubjectProfile" s
WHERE e."userId" = s."accountId" AND s."type" = 'OWNER' AND e."subjectId" IS NULL;

UPDATE "UserAddOnEntitlement" e
SET "subjectId" = s."id"
FROM "SubjectProfile" s
WHERE e."userId" = s."accountId" AND s."type" = 'OWNER' AND e."subjectId" IS NULL;

UPDATE "ReassessmentCredit" c
SET "subjectId" = s."id"
FROM "SubjectProfile" s
WHERE c."userId" = s."accountId" AND s."type" = 'OWNER' AND c."subjectId" IS NULL;

DROP INDEX IF EXISTS "UserEntitlement_userId_type_resourceType_resourceKey_key";
DROP INDEX IF EXISTS "UserAddOnEntitlement_userId_type_resourceType_resourceKey_key";

CREATE UNIQUE INDEX "SubjectProfile_accountId_name_key" ON "SubjectProfile"("accountId", "name");
CREATE INDEX "SubjectProfile_accountId_type_idx" ON "SubjectProfile"("accountId", "type");
CREATE INDEX "AssessmentAttempt_subjectId_startedAt_idx" ON "AssessmentAttempt"("subjectId", "startedAt");
CREATE INDEX "UserEntitlement_subjectId_status_idx" ON "UserEntitlement"("subjectId", "status");
CREATE INDEX "UserAddOnEntitlement_subjectId_status_idx" ON "UserAddOnEntitlement"("subjectId", "status");
CREATE INDEX "ReassessmentCredit_subjectId_testType_status_idx" ON "ReassessmentCredit"("subjectId", "testType", "status");
CREATE UNIQUE INDEX "UserEntitlement_subjectId_type_resourceType_resourceKey_key" ON "UserEntitlement"("subjectId", "type", "resourceType", "resourceKey");
CREATE UNIQUE INDEX "UserAddOnEntitlement_subjectId_type_resourceType_resourceKey_key" ON "UserAddOnEntitlement"("subjectId", "type", "resourceType", "resourceKey");

ALTER TABLE "SubjectProfile" ADD CONSTRAINT "SubjectProfile_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "SubjectProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserEntitlement" ADD CONSTRAINT "UserEntitlement_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "SubjectProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserAddOnEntitlement" ADD CONSTRAINT "UserAddOnEntitlement_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "SubjectProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReassessmentCredit" ADD CONSTRAINT "ReassessmentCredit_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "SubjectProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommercialOrder" ADD COLUMN "subjectId" TEXT;
UPDATE "CommercialOrder" o SET "subjectId" = s."id" FROM "SubjectProfile" s WHERE o."userId" = s."accountId" AND s."type" = 'OWNER'::"SubjectProfileType" AND o."subjectId" IS NULL;
CREATE INDEX "CommercialOrder_subjectId_createdAt_idx" ON "CommercialOrder"("subjectId", "createdAt");
ALTER TABLE "CommercialOrder" ADD CONSTRAINT "CommercialOrder_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "SubjectProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
