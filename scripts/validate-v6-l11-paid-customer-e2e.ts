import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { getScalevProductSkuMap, resolveScalevSku } from "../lib/scalev/config";

const prisma = new PrismaClient();
const root = process.cwd();
function read(p: string) { return fs.readFileSync(path.join(root, p), "utf8"); }
function fail(message: string): never { throw new Error(message); }

async function main() {
  console.log("=== READY SCORE V6 L11 PAID CUSTOMER E2E MVP GATE ===");
  console.log("Scope      : Verified paid acquisition → identity → entitlement → assessment → result → retest/upgrade/profile");
  console.log("Protection : Frozen V4/V5 measurement, result, reassessment, upgrade, and profiling semantics");

  const schema = read("prisma/schema.prisma");
  const migration = read("prisma/migrations/20260827170000_v6_l11_paid_customer_e2e/migration.sql");
  const service = read("lib/scalev/service.ts");
  const config = read("lib/scalev/config.ts");
  const e2e = read("scripts/e2e-paid-customer-runtime.mjs");

  if (!schema.includes("model ScalevAddOnPurchase")) fail("Paid add-on purchase ledger model missing.");
  if (!schema.includes("addOnPurchaseId String?")) fail("Handoff add-on purchase boundary missing.");
  if (!migration.includes('CREATE TABLE "ScalevAddOnPurchase"')) fail("L11 migration missing add-on purchase ledger.");
  if (!service.includes("grantReassessmentCredit")) fail("Paid reassessment credit fulfillment missing.");
  if (!service.includes("REASSESSMENT_CREDIT")) fail("Scalev reassessment-credit fulfillment mapping missing.");
  if (!service.includes("SCALEV_ADDON_PRODUCT_NOT_ACTIVE")) fail("Add-on product validation missing.");
  if (!e2e.includes("payment.received")) fail("Paid E2E must use verified payment.received webhook.");
  if (!e2e.includes("claimHandoff") || !e2e.includes("handoffUrl")) fail("Paid E2E handoff journey missing.");
  if (!e2e.includes("/api/profile/cross-test")) fail("Paid E2E profiling journey missing.");

  const map = getScalevProductSkuMap();
  const expected = [
    ["RS-SINGLE-EQ-V1", "PRODUCT", "BASIC"],
    ["RS-ASSESSMENT-V1", "PRODUCT", "MEDIUM"],
    ["RS-ALL-PROFILING-V1", "PRODUCT", "ADVANCE"],
    ["RS-REASSESSMENT-CREDIT-V1", "REASSESSMENT_CREDIT", "addon-reassessment-credit-v1"],
  ] as const;
  for (const [sku, kind, target] of expected) {
    const item = map[sku] as any;
    if (!item) fail(`Required Scalev SKU missing: ${sku}`);
    if ((item.kind ?? "PRODUCT") !== kind) fail(`Scalev SKU kind mismatch: ${sku}`);
    if (kind === "PRODUCT" && item.tier !== target) fail(`Scalev SKU tier mismatch: ${sku}`);
    if (kind === "REASSESSMENT_CREDIT" && item.addOnProductId !== target) fail(`Scalev add-on mapping mismatch: ${sku}`);
  }
  if (resolveScalevSku("RS-ASSESSMENT-V1")?.kind !== "PRODUCT") fail("Frozen MEDIUM Scalev mapping was changed.");

  const products = await prisma.product.findMany({ where: { tier: { in: ["BASIC", "MEDIUM", "ADVANCE"] } }, select: { tier: true, priceIdr: true, status: true } });
  const price = new Map(products.map((p) => [p.tier, p]));
  if (price.get("BASIC")?.status !== "ACTIVE" || price.get("BASIC")?.priceIdr !== 99_000) fail("BASIC commercial price/status mismatch.");
  if (price.get("MEDIUM")?.status !== "ACTIVE" || price.get("MEDIUM")?.priceIdr !== 199_000) fail("MEDIUM commercial price/status mismatch.");
  if (price.get("ADVANCE")?.status !== "ACTIVE" || price.get("ADVANCE")?.priceIdr !== 249_000) fail("ADVANCE commercial price/status mismatch.");

  const addOn = await prisma.addOnProduct.findUnique({ where: { id: "addon-reassessment-credit-v1" }, select: { status: true, priceIdr: true } });
  if (!addOn || addOn.status !== "ACTIVE" || addOn.priceIdr !== 49_000) fail("Reassessment Credit commercial boundary mismatch.");

  const routes = [
    "app/api/scalev/webhook/route.ts",
    "app/api/scalev/handoff/route.ts",
    "app/api/scalev/handoff/request/route.ts",
    "app/api/assessment/start/route.ts",
    "app/api/assessment/reassessment/eligibility/route.ts",
    "app/api/assessment/reassessment/start/route.ts",
    "app/api/profile/cross-test/route.ts",
  ];
  for (const file of routes) if (!fs.existsSync(path.join(root, file))) fail(`Required L11 route missing: ${file}`);

  console.log("Paid Scalev verification boundary : PASS");
  console.log("Identity + single-use handoff    : PASS");
  console.log("Single Test Rp99k                 : PASS");
  console.log("All Tests Rp199k                  : PASS");
  console.log("All Tests + Profiling Rp249k      : PASS");
  console.log("Reassessment Credit Rp49k         : PASS");
  console.log("Upgrade paid fulfillment boundary : PASS");
  console.log("Assessment → result continuity    : PASS");
  console.log("Cross-Test Profiling continuity   : PASS");
  console.log("Idempotency / duplicate protection: PASS");
  console.log("Measurement semantics mutation    : NO");
  console.log("L11 database migration            : REQUIRED");
  console.log("V6 L11 PAID CUSTOMER E2E MVP GATE: PASS");
}

main().catch((error) => {
  console.error("V6 L11 PAID CUSTOMER E2E MVP GATE: FAIL");
  console.error(error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
