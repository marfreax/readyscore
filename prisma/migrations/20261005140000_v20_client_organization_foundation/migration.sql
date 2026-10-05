BEGIN;

ALTER TABLE "BusinessLead"
  ADD COLUMN "emailMarketingConsent" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "whatsappMarketingConsent" BOOLEAN NOT NULL DEFAULT false;

CREATE TYPE "ClientOrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'RETIRED');
CREATE TYPE "ClientOrganizationMembershipStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'LEFT');
CREATE TYPE "ClientOrganizationMemberRole" AS ENUM ('ADMIN', 'VIEWER');
CREATE TYPE "ClientParticipantCategory" AS ENUM ('CANDIDATE', 'EMPLOYEE', 'ALUMNI');
CREATE TYPE "ClientInvitationStatus" AS ENUM ('DRAFT', 'SENT', 'OPENED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'REVOKED', 'DELIVERY_FAILED');
CREATE TYPE "ClientResultDeliveryStatus" AS ENUM ('NOT_SENT', 'PENDING', 'SENT', 'FAILED');

CREATE TABLE "ClientOrganization" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "logoUrl" TEXT,
  "status" "ClientOrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClientOrganization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClientOrganizationMembership" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "ClientOrganizationMemberRole" NOT NULL,
  "status" "ClientOrganizationMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
  "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClientOrganizationMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClientOrganization_code_key" ON "ClientOrganization"("code");
CREATE INDEX "ClientOrganization_status_idx" ON "ClientOrganization"("status");
CREATE INDEX "ClientOrganization_createdAt_idx" ON "ClientOrganization"("createdAt");
CREATE UNIQUE INDEX "ClientOrganizationMembership_organizationId_userId_key" ON "ClientOrganizationMembership"("organizationId", "userId");
CREATE INDEX "ClientOrganizationMembership_userId_status_idx" ON "ClientOrganizationMembership"("userId", "status");
CREATE INDEX "ClientOrganizationMembership_organizationId_status_idx" ON "ClientOrganizationMembership"("organizationId", "status");

ALTER TABLE "ClientOrganizationMembership"
  ADD CONSTRAINT "ClientOrganizationMembership_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "ClientOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientOrganizationMembership"
  ADD CONSTRAINT "ClientOrganizationMembership_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ClientParticipant" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "fullName" TEXT,
  "email" TEXT NOT NULL,
  "whatsapp" TEXT,
  "category" "ClientParticipantCategory" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClientParticipant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClientInvitation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "participantId" TEXT,
  "email" TEXT NOT NULL,
  "category" "ClientParticipantCategory" NOT NULL,
  "jobTitle" TEXT,
  "department" TEXT,
  "tokenHash" TEXT NOT NULL,
  "status" "ClientInvitationStatus" NOT NULL DEFAULT 'DRAFT',
  "assessmentConfigurationVersionId" TEXT NOT NULL,
  "questionPackageVersionId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "sentAt" TIMESTAMP(3),
  "openedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "resultEmailStatus" "ClientResultDeliveryStatus" NOT NULL DEFAULT 'NOT_SENT',
  "resultEmailSentAt" TIMESTAMP(3),
  "resultEmailError" TEXT,
  "resultEmailProviderMessageId" TEXT,
  "resultEmailAttemptCount" INTEGER NOT NULL DEFAULT 0,
  "invitationDeliveryAttempt" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClientInvitation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClientParticipantConsent" (
  "id" TEXT NOT NULL,
  "invitationId" TEXT NOT NULL,
  "noticeVersion" TEXT NOT NULL,
  "noticeAcceptedAt" TIMESTAMP(3) NOT NULL,
  "emailMarketing" BOOLEAN NOT NULL DEFAULT false,
  "whatsappMarketing" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClientParticipantConsent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AssessmentAttempt"
  ADD COLUMN "clientOrganizationId" TEXT,
  ADD COLUMN "clientParticipantId" TEXT,
  ADD COLUMN "clientInvitationId" TEXT;

CREATE UNIQUE INDEX "ClientParticipant_organizationId_email_key" ON "ClientParticipant"("organizationId", "email");
CREATE INDEX "ClientParticipant_organizationId_category_updatedAt_idx" ON "ClientParticipant"("organizationId", "category", "updatedAt");
CREATE UNIQUE INDEX "ClientInvitation_tokenHash_key" ON "ClientInvitation"("tokenHash");
CREATE INDEX "ClientInvitation_organizationId_status_createdAt_idx" ON "ClientInvitation"("organizationId", "status", "createdAt");
CREATE INDEX "ClientInvitation_organizationId_email_idx" ON "ClientInvitation"("organizationId", "email");
CREATE INDEX "ClientInvitation_participantId_createdAt_idx" ON "ClientInvitation"("participantId", "createdAt");
CREATE INDEX "ClientInvitation_expiresAt_status_idx" ON "ClientInvitation"("expiresAt", "status");
CREATE UNIQUE INDEX "ClientParticipantConsent_invitationId_key" ON "ClientParticipantConsent"("invitationId");
CREATE UNIQUE INDEX "AssessmentAttempt_clientInvitationId_key" ON "AssessmentAttempt"("clientInvitationId");
CREATE INDEX "AssessmentAttempt_clientOrganizationId_startedAt_idx" ON "AssessmentAttempt"("clientOrganizationId", "startedAt");
CREATE INDEX "AssessmentAttempt_clientParticipantId_startedAt_idx" ON "AssessmentAttempt"("clientParticipantId", "startedAt");

ALTER TABLE "ClientParticipant"
  ADD CONSTRAINT "ClientParticipant_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "ClientOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClientInvitation"
  ADD CONSTRAINT "ClientInvitation_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "ClientOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "ClientInvitation_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "ClientInvitation_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "ClientParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "ClientInvitation_assessmentConfigurationVersionId_fkey"
  FOREIGN KEY ("assessmentConfigurationVersionId") REFERENCES "AssessmentConfigurationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "ClientInvitation_questionPackageVersionId_fkey"
  FOREIGN KEY ("questionPackageVersionId") REFERENCES "QuestionPackageVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClientParticipantConsent"
  ADD CONSTRAINT "ClientParticipantConsent_invitationId_fkey"
  FOREIGN KEY ("invitationId") REFERENCES "ClientInvitation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssessmentAttempt"
  ADD CONSTRAINT "AssessmentAttempt_clientOrganizationId_fkey"
  FOREIGN KEY ("clientOrganizationId") REFERENCES "ClientOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "AssessmentAttempt_clientParticipantId_fkey"
  FOREIGN KEY ("clientParticipantId") REFERENCES "ClientParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "AssessmentAttempt_clientInvitationId_fkey"
  FOREIGN KEY ("clientInvitationId") REFERENCES "ClientInvitation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
