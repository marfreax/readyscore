import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const fail = (message: string): never => {
  throw new Error(`V9.12 check failed: ${message}`);
};
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file: string) => fs.existsSync(path.join(root, file));
const assertCondition = (condition: boolean, message: string) => {
  if (!condition) fail(message);
};

console.log("=== READY SCORE V9.12 ACCESS / PLANS / CONVERSION UX GATE ===");
console.log("Scope      : Customer Access, Plans and Conversion UX");
console.log("Protection : No measurement/scoring/question-bank/result/report/activity mutation");

for (const file of [
  "app/access/page.tsx",
  "lib/commercial/catalog.ts",
  "lib/commercial/types.ts",
  "lib/commercial/entitlement-service.ts",
  "lib/commercial/upgrade-service.ts",
  "lib/commercial/add-on-catalog.ts",
  "lib/scalev/checkout.ts",
  "app/api/scalev/checkout/route.ts",
  "architecture/phase-9.12/ReadyScore_V9_12_Access_Plans_Conversion_UX.md",
  "V9_12_DELIVERY_MANIFEST.json",
  "V9_12_DELIVERY_NOTES.md",
]) {
  assertCondition(exists(file), `required file missing: ${file}`);
}
console.log("PASS: V9.12 delivery artifacts are present");

const manifest = JSON.parse(read("V9_12_DELIVERY_MANIFEST.json"));
assertCondition(manifest.version === "V9.12", "manifest version mismatch");
assertCondition(manifest.status === "IMPLEMENTED", "manifest status mismatch");
for (const key of [
  "databaseMigration",
  "measurementRedesign",
  "scoringRedesign",
  "questionBankMutation",
  "resultSemanticsMutation",
  "universalScore",
  "rawAverageSynthesis",
  "reportsMutation",
  "activityMutation",
]) {
  assertCondition(manifest[key] === false, `protected flag must remain false: ${key}`);
}
assertCondition(manifest.accessPlans === true, "accessPlans flag missing");
assertCondition(manifest.conversionUx === true, "conversionUx flag missing");
console.log("PASS: V9.12 manifest and protected boundaries");

const page = read("app/access/page.tsx");
for (const marker of [
  "Your access",
  "Plans",
  "Single Test",
  "All Tests",
  "All Tests + Profiling",
  "Pilih level akses",
  "Upgrade",
  "Conversion path",
  "Checkout ≠ entitlement",
  "getCommercialCatalog",
  "listUserEntitlements",
  "getActiveProductsForUser",
  "getUpgradeQuote",
  "getScalevCheckoutConfiguration",
  "Beli Single Test",
  "Upgrade via Scalev",
  "Checkout belum terhubung",
]) {
  assertCondition(page.includes(marker), `customer UX marker missing: ${marker}`);
}
console.log("PASS: Customer Access / Plans / Conversion UX represented");

const commercial = read("lib/commercial/catalog.ts");
const entitlement = read("lib/commercial/entitlement-service.ts");
const upgrade = read("lib/commercial/upgrade-service.ts");
const checkout = read("lib/scalev/checkout.ts");
const checkoutRoute = read("app/api/scalev/checkout/route.ts");

assertCondition(commercial.includes("COMMERCIAL_PRODUCT_CATALOG"), "commercial catalog missing");
assertCondition(entitlement.includes("hasEntitlement"), "canonical entitlement policy missing");
assertCondition(upgrade.includes("getUpgradeQuote"), "canonical upgrade quote missing");
assertCondition(checkout.includes("RS-SINGLE-IQ-V1"), "single test checkout SKU missing");
assertCondition(checkout.includes("RS-ASSESSMENT-V1"), "all tests checkout SKU missing");
assertCondition(checkout.includes("RS-ALL-PROFILING-V1"), "profiling checkout SKU missing");
assertCondition(checkoutRoute.includes("isScalevCheckoutSku"), "checkout SKU validation missing");
assertCondition(checkoutRoute.includes("getScalevCheckoutUrl"), "checkout redirect boundary missing");
console.log("PASS: Canonical commercial, entitlement, upgrade and Scalev boundaries preserved");

for (const forbidden of [
  "grantProductEntitlements(",
  "grantSingleTestEntitlements(",
  "grantEntitlement(",
]) {
  assertCondition(!page.includes(forbidden), `customer Access page bypasses entitlement boundary: ${forbidden}`);
}
assertCondition(!page.includes("prisma."), "customer Access page must not access Prisma directly");
console.log("PASS: No customer-side entitlement or database bypass");

const architecture = read("architecture/phase-9.12/ReadyScore_V9_12_Access_Plans_Conversion_UX.md");
for (const marker of [
  "No database migration is introduced",
  "Checkout is never treated as entitlement",
  "No universal score",
  "No raw-average synthesis",
  "measurement semantics",
  "question bank content",
]) {
  assertCondition(architecture.includes(marker), `architecture safety missing: ${marker}`);
}
console.log("PASS: Architecture safety boundaries");

const migrationRoot = path.join(root, "prisma", "migrations");
const migrations = fs.existsSync(migrationRoot) ? fs.readdirSync(migrationRoot) : [];
const suspicious = migrations.filter((name) => /v9[._-]?12|access.?plans|conversion.?ux/i.test(name));
assertCondition(suspicious.length === 0, `unexpected V9.12 migration: ${suspicious.join(", ")}`);
console.log("PASS: No V9.12 database migration");

const pkg = JSON.parse(read("package.json"));
assertCondition(
  pkg.scripts?.["v9:12:gate"] === "tsx scripts/validate-v9-12-access-plans-conversion.ts",
  "v9:12:gate is not registered correctly",
);
console.log("PASS: V9.12 gate registered");

console.log("V9.12 ACCESS / PLANS / CONVERSION UX GATE: PASS");
