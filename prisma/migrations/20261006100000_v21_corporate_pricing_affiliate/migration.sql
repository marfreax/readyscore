-- CreateEnum
CREATE TYPE "AffiliateProfileStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "AffiliateLedgerEntryType" AS ENUM ('COMMISSION', 'COMMISSION_UNLOCK', 'REVERSAL', 'WITHDRAWAL_HOLD', 'WITHDRAWAL_RELEASE', 'ADMIN_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "AffiliateLedgerEntryStatus" AS ENUM ('PENDING', 'AVAILABLE', 'SETTLED');

-- CreateEnum
CREATE TYPE "AffiliatePayoutStatus" AS ENUM ('REQUESTED', 'PROCESSING', 'PAID', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ClientCreditLedgerEntryType" AS ENUM ('PURCHASE', 'ASSESSMENT_CONSUMED', 'ASSESSMENT_REFUND', 'MANUAL_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "ClientCreditReservationStatus" AS ENUM ('RESERVED', 'CONSUMED', 'RELEASED');

-- AlterTable
ALTER TABLE "CommercialOrder" ADD COLUMN     "affiliateCommissionIdrSnapshot" INTEGER,
ADD COLUMN     "affiliateId" TEXT,
ADD COLUMN     "affiliateRateBpsSnapshot" INTEGER,
ADD COLUMN     "clientDiscPackageId" TEXT,
ADD COLUMN     "clientOrganizationId" TEXT;

-- CreateTable
CREATE TABLE "AffiliateProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "commissionRateBps" INTEGER NOT NULL DEFAULT 1000,
    "status" "AffiliateProfileStatus" NOT NULL DEFAULT 'ACTIVE',
    "payoutBankName" TEXT,
    "payoutAccountName" TEXT,
    "payoutAccountNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateAttribution" (
    "id" TEXT NOT NULL,
    "buyerUserId" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "attributedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateAttribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientDiscPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "creditQuantity" INTEGER NOT NULL,
    "priceIdr" INTEGER NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientDiscPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientOrganizationCreditLot" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "sourceOrderId" TEXT NOT NULL,
    "purchasedCredits" INTEGER NOT NULL,
    "remainingCredits" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientOrganizationCreditLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientOrganizationCreditLedger" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "orderId" TEXT,
    "invitationId" TEXT,
    "entryType" "ClientCreditLedgerEntryType" NOT NULL,
    "creditsDelta" INTEGER NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientOrganizationCreditLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientInvitationCreditReservation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "creditLotId" TEXT NOT NULL,
    "status" "ClientCreditReservationStatus" NOT NULL DEFAULT 'RESERVED',
    "reservationVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientInvitationCreditReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateLedgerEntry" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "orderId" TEXT,
    "payoutRequestId" TEXT,
    "entryType" "AffiliateLedgerEntryType" NOT NULL,
    "status" "AffiliateLedgerEntryStatus" NOT NULL DEFAULT 'AVAILABLE',
    "amountIdr" INTEGER NOT NULL,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotencyKey" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliatePayoutRequest" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "amountIdr" INTEGER NOT NULL,
    "status" "AffiliatePayoutStatus" NOT NULL DEFAULT 'REQUESTED',
    "adminUserId" TEXT,
    "transferReference" TEXT,
    "adminNote" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliatePayoutRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateProfile_userId_key" ON "AffiliateProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateProfile_referralCode_key" ON "AffiliateProfile"("referralCode");

-- CreateIndex
CREATE INDEX "AffiliateProfile_status_createdAt_idx" ON "AffiliateProfile"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateAttribution_buyerUserId_key" ON "AffiliateAttribution"("buyerUserId");

-- CreateIndex
CREATE INDEX "AffiliateAttribution_affiliateId_attributedAt_idx" ON "AffiliateAttribution"("affiliateId", "attributedAt");

-- CreateIndex
CREATE INDEX "AffiliateAttribution_expiresAt_idx" ON "AffiliateAttribution"("expiresAt");

-- CreateIndex
CREATE INDEX "ClientDiscPackage_status_creditQuantity_idx" ON "ClientDiscPackage"("status", "creditQuantity");

-- CreateIndex
CREATE UNIQUE INDEX "ClientDiscPackage_creditQuantity_status_key" ON "ClientDiscPackage"("creditQuantity", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ClientOrganizationCreditLot_sourceOrderId_key" ON "ClientOrganizationCreditLot"("sourceOrderId");

-- CreateIndex
CREATE INDEX "ClientOrganizationCreditLot_organizationId_expiresAt_create_idx" ON "ClientOrganizationCreditLot"("organizationId", "expiresAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClientOrganizationCreditLedger_idempotencyKey_key" ON "ClientOrganizationCreditLedger"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ClientOrganizationCreditLedger_organizationId_createdAt_idx" ON "ClientOrganizationCreditLedger"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "ClientOrganizationCreditLedger_orderId_entryType_idx" ON "ClientOrganizationCreditLedger"("orderId", "entryType");

-- CreateIndex
CREATE UNIQUE INDEX "ClientInvitationCreditReservation_invitationId_key" ON "ClientInvitationCreditReservation"("invitationId");

-- CreateIndex
CREATE INDEX "ClientInvitationCreditReservation_organizationId_status_cre_idx" ON "ClientInvitationCreditReservation"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ClientInvitationCreditReservation_creditLotId_status_idx" ON "ClientInvitationCreditReservation"("creditLotId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateLedgerEntry_idempotencyKey_key" ON "AffiliateLedgerEntry"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AffiliateLedgerEntry_affiliateId_status_availableAt_idx" ON "AffiliateLedgerEntry"("affiliateId", "status", "availableAt");

-- CreateIndex
CREATE INDEX "AffiliateLedgerEntry_orderId_entryType_idx" ON "AffiliateLedgerEntry"("orderId", "entryType");

-- CreateIndex
CREATE INDEX "AffiliateLedgerEntry_payoutRequestId_idx" ON "AffiliateLedgerEntry"("payoutRequestId");

-- CreateIndex
CREATE INDEX "AffiliatePayoutRequest_status_requestedAt_idx" ON "AffiliatePayoutRequest"("status", "requestedAt");

-- CreateIndex
CREATE INDEX "AffiliatePayoutRequest_affiliateId_requestedAt_idx" ON "AffiliatePayoutRequest"("affiliateId", "requestedAt");

-- CreateIndex
CREATE INDEX "CommercialOrder_clientOrganizationId_createdAt_idx" ON "CommercialOrder"("clientOrganizationId", "createdAt");

-- CreateIndex
CREATE INDEX "CommercialOrder_affiliateId_createdAt_idx" ON "CommercialOrder"("affiliateId", "createdAt");

-- CreateIndex
CREATE INDEX "CommercialOrder_clientDiscPackageId_idx" ON "CommercialOrder"("clientDiscPackageId");

-- AddForeignKey
ALTER TABLE "AffiliateProfile" ADD CONSTRAINT "AffiliateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateAttribution" ADD CONSTRAINT "AffiliateAttribution_buyerUserId_fkey" FOREIGN KEY ("buyerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateAttribution" ADD CONSTRAINT "AffiliateAttribution_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "AffiliateProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialOrder" ADD CONSTRAINT "CommercialOrder_clientOrganizationId_fkey" FOREIGN KEY ("clientOrganizationId") REFERENCES "ClientOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialOrder" ADD CONSTRAINT "CommercialOrder_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "AffiliateProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialOrder" ADD CONSTRAINT "CommercialOrder_clientDiscPackageId_fkey" FOREIGN KEY ("clientDiscPackageId") REFERENCES "ClientDiscPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientOrganizationCreditLot" ADD CONSTRAINT "ClientOrganizationCreditLot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ClientOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientOrganizationCreditLot" ADD CONSTRAINT "ClientOrganizationCreditLot_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "ClientDiscPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientOrganizationCreditLot" ADD CONSTRAINT "ClientOrganizationCreditLot_sourceOrderId_fkey" FOREIGN KEY ("sourceOrderId") REFERENCES "CommercialOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientOrganizationCreditLedger" ADD CONSTRAINT "ClientOrganizationCreditLedger_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ClientOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientOrganizationCreditLedger" ADD CONSTRAINT "ClientOrganizationCreditLedger_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CommercialOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientOrganizationCreditLedger" ADD CONSTRAINT "ClientOrganizationCreditLedger_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "ClientInvitation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientInvitationCreditReservation" ADD CONSTRAINT "ClientInvitationCreditReservation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ClientOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientInvitationCreditReservation" ADD CONSTRAINT "ClientInvitationCreditReservation_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "ClientInvitation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientInvitationCreditReservation" ADD CONSTRAINT "ClientInvitationCreditReservation_creditLotId_fkey" FOREIGN KEY ("creditLotId") REFERENCES "ClientOrganizationCreditLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateLedgerEntry" ADD CONSTRAINT "AffiliateLedgerEntry_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "AffiliateProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateLedgerEntry" ADD CONSTRAINT "AffiliateLedgerEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CommercialOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateLedgerEntry" ADD CONSTRAINT "AffiliateLedgerEntry_payoutRequestId_fkey" FOREIGN KEY ("payoutRequestId") REFERENCES "AffiliatePayoutRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliatePayoutRequest" ADD CONSTRAINT "AffiliatePayoutRequest_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "AffiliateProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliatePayoutRequest" ADD CONSTRAINT "AffiliatePayoutRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Seed launch Corporate DISC packages and their backing payment product.
INSERT INTO "ClientDiscPackage" ("id", "name", "creditQuantity", "priceIdr", "status", "createdAt", "updatedAt") VALUES
  ('DISC_CREDIT_10', 'Starter', 10, 350000, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('DISC_CREDIT_50', 'Growth', 50, 1500000, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('DISC_CREDIT_100', 'Scale', 100, 2500000, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Product" ("id", "tier", "name", "description", "priceIdr", "status", "createdAt", "updatedAt") VALUES
  ('corporate-disc-credit', 'CORPORATE_DISC_CREDIT', 'Corporate DISC Credit', 'Kredit assessment DISC untuk organisasi Corporate.', NULL, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("tier") DO NOTHING;
