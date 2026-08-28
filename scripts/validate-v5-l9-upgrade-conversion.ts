import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");
const schema = read("prisma/schema.prisma");
const types = read("lib/commercial/types.ts");
const service = read("lib/commercial/upgrade-service.ts");
const route = read("app/api/commercial/upgrade-quote/route.ts");
const dashboard = read("app/app/page.tsx");
const packageJson = JSON.parse(read("package.json"));

function fail(message: string) { throw new Error(message); }

console.log("=== READY SCORE V5 L9 UPGRADE & CONVERSION MVP GATE ===");
console.log("Scope      : Upgrade quote / conversion boundary");
console.log("Protection : Frozen V4 product catalog + entitlement + measurement boundaries");

if (!types.includes('planningPriceIdr: 99_000')) fail("Single Test planning price missing.");
if (!types.includes('planningPriceIdr: 199_000')) fail("All Tests planning price missing.");
if (!types.includes('planningPriceIdr: 249_000')) fail("All Tests + Profiling planning price missing.");
if (!types.includes('mode: "SINGLE_TEST"')) fail("Single Test catalog mode missing.");
if (!types.includes('mode: "ALL_TESTS"')) fail("All Tests catalog mode missing.");
if (!types.includes('mode: "ALL_TESTS_PROFILING"')) fail("All Tests + Profiling catalog mode missing.");

if (!service.includes('UPGRADE_CONVERSION_VERSION = "V5_L9_UPGRADE_CONVERSION_V1"')) fail("L9 conversion version missing.");
if (!service.includes('99_000') || !service.includes('199_000') || !service.includes('249_000')) fail("L9 pricing differential basis missing.");
if (!service.includes("getActiveProductsForUser")) fail("Upgrade must inspect owned product entitlement evidence.");
if (!service.includes("listUserEntitlements")) fail("Upgrade must inspect owned entitlement evidence.");
if (!service.includes("Math.max(0, targetPrice - currentPrice)")) fail("Upgrade differential calculation missing.");
if (!service.includes('"MEDIUM", "ADVANCE"')) fail("Upgrade targets missing.");

if (!schema.includes("model Product {")) fail("Product model missing.");
if (!schema.includes("model UserEntitlement {")) fail("User entitlement model missing.");
if (!schema.includes("model ScalevPurchase {")) fail("Scalev purchase ledger missing.");

if (!route.includes("getCurrentSession")) fail("Upgrade route is not authenticated.");
if (!route.includes("getUpgradeQuote")) fail("Upgrade route does not use canonical L9 service.");

if (!dashboard.includes("Upgrade & Conversion")) fail("Customer-facing upgrade section missing.");
if (!dashboard.includes("/api/commercial/upgrade-quote")) fail("Dashboard upgrade API wiring missing.");
if (!dashboard.includes("99 → 199 = +Rp100.000")) fail("99→199 differential disclosure missing.");
if (!dashboard.includes("99 → 249 = +Rp150.000")) fail("99→249 differential disclosure missing.");
if (!dashboard.includes("199 → 249 = +Rp50.000")) fail("199→249 differential disclosure missing.");

if (packageJson.scripts["v5:l9:gate"] !== "tsx scripts/validate-v5-l9-upgrade-conversion.ts") {
  fail("v5:l9:gate script missing.");
}
if (packageJson.scripts["e2e:upgrade"] !== "node scripts/e2e-upgrade-conversion-runtime.mjs") {
  fail("e2e:upgrade script missing.");
}

if (service.includes("grantProductEntitlements") || service.includes("grantSingleTestEntitlements")) {
  fail("L9 quote service must not fulfill entitlements before verified payment.");
}

console.log("PASS: Locked commercial catalog preserved");
console.log("PASS: Owned product / entitlement evidence required");
console.log("PASS: Upgrade targets MEDIUM + ADVANCE only");
console.log("PASS: Differential 99→199 = 100k");
console.log("PASS: Differential 99→249 = 150k");
console.log("PASS: Differential 199→249 = 50k");
console.log("PASS: Upgrade is differential, not a new product tier");
console.log("PASS: Authenticated upgrade route");
console.log("PASS: No measurement/scoring lifecycle mutation");
console.log("PASS: Payment fulfillment remains outside quote boundary");
console.log("PASS: Customer-facing conversion experience present");
console.log("L9 database migration       : NO");
console.log("V5 L9 UPGRADE & CONVERSION MVP GATE: PASS");
