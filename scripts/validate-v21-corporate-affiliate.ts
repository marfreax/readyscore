import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { calculateAffiliateCommission } from "../lib/affiliate/service";

const prisma = new PrismaClient();
function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  const migration = readFileSync("prisma/migrations/20261006100000_v21_corporate_pricing_affiliate/migration.sql", "utf8");
  const orderCreation = readFileSync("lib/commercial/v14-1.ts", "utf8");
  const payment = readFileSync("lib/commercial/v14-2.ts", "utf8");
  const fulfillment = readFileSync("lib/commercial/v14-3.ts", "utf8");
  const invitation = readFileSync("lib/client-organization/service.ts", "utf8");
  const routes = [
    "app/api/affiliate/route.ts",
    "app/api/affiliate/payouts/route.ts",
    "app/api/admin/affiliates/route.ts",
    "app/api/client/[organizationId]/checkout/route.ts",
    "app/api/client/[organizationId]/credits/route.ts",
  ].map((path) => readFileSync(path, "utf8")).join("\n");

  check(schema.includes("model AffiliateProfile") && schema.includes("model AffiliateAttribution"), "affiliate schema missing");
  check(schema.includes("model AffiliateLedgerEntry") && schema.includes("model AffiliatePayoutRequest"), "affiliate wallet and payout schema missing");
  check(schema.includes("model ClientOrganizationCreditLot") && schema.includes("model ClientInvitationCreditReservation"), "Corporate credit lot/reservation schema missing");
  check(migration.includes("DISC_CREDIT_10") && migration.includes("350000"), "10-credit package migration missing");
  check(migration.includes("DISC_CREDIT_50") && migration.includes("1500000"), "50-credit package migration missing");
  check(migration.includes("DISC_CREDIT_100") && migration.includes("2500000"), "100-credit package migration missing");
  check(orderCreation.includes("affiliateRateBpsSnapshot") && orderCreation.includes("affiliateCommissionIdrSnapshot"), "B2C order referral snapshot missing");
  check(payment.includes("ORDER:${order.id}:COMMISSION") && payment.includes("REFUND_REVERSAL"), "paid/refunded order affiliate ledger missing");
  check(fulfillment.includes("fulfillCorporateCreditOrder") && fulfillment.includes("CORPORATE_CREDIT_GRANTED"), "Corporate paid-order fulfillment missing");
  check(invitation.includes("reserveInvitationCredit"), "invitation credit reservation missing");
  check(routes.includes("requireAdminApi") && routes.includes("requestAffiliatePayout"), "affiliate/admin API protections missing");

  check(calculateAffiliateCommission(350000, 1000) === 35000, "10% commission rounding mismatch");
  check(calculateAffiliateCommission(1500000, 1000) === 150000, "50 package commission mismatch");
  check(calculateAffiliateCommission(2500000, 1000) === 250000, "100 package commission mismatch");
  let invalidRejected = false;
  try { calculateAffiliateCommission(10000, 10001); } catch { invalidRejected = true; }
  check(invalidRejected, "commission rate above 100% must fail closed");

  const packages = await prisma.clientDiscPackage.findMany({ where: { status: "ACTIVE" }, orderBy: { creditQuantity: "asc" }, select: { creditQuantity: true, priceIdr: true } });
  check(JSON.stringify(packages) === JSON.stringify([
    { creditQuantity: 10, priceIdr: 350000 },
    { creditQuantity: 50, priceIdr: 1500000 },
    { creditQuantity: 100, priceIdr: 2500000 },
  ]), "local database Corporate pricing seed does not match approved prices");
  const paymentProduct = await prisma.product.findUnique({ where: { tier: "CORPORATE_DISC_CREDIT" }, select: { status: true } });
  check(paymentProduct?.status === "ACTIVE", "Corporate payment product is not active in local DB");

  console.log("V21 Corporate pricing + affiliate contract: PASS");
  console.log("Package price seed and payment product (local DB): PASS");
  console.log("Commission calculation, snapshots, refund reversal, and credit reservations: PASS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
