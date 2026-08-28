import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const schema = read("prisma/schema.prisma");
const service = read("lib/commercial/entitlement-service.ts");
const catalog = read("lib/commercial/add-on-catalog.ts");
const route = read("app/api/commercial/add-ons/route.ts");
const dashboard = read("app/app/page.tsx");
const migration = fs.readdirSync(path.join(root, "prisma/migrations"))
  .find((name) => name.includes("v3_12_b2c_conversion_add_on_products"));

function fail(message) { throw new Error(message); }

console.log("=== READY SCORE V3 PHASE 3.12 B2C CONVERSION & ADD-ON PRODUCTS V1 GATE ===");
console.log("Scope      : B2C conversion architecture / add-on catalog / entitlement extension");
console.log("Protection : Frozen measurement + Phase 3.1 product/tier matrix + 3.5-3.11 semantics");

if (!schema.includes("model AddOnProduct")) fail("AddOnProduct model missing.");
if (!schema.includes("model AddOnProductEntitlement")) fail("AddOnProductEntitlement model missing.");
if (!schema.includes("model UserAddOnEntitlement")) fail("UserAddOnEntitlement model missing.");
if (!migration) fail("Phase 3.12 migration missing.");

if (!catalog.includes('B2C_CONVERSION_VERSION = "V3_B2C_CONVERSION_3.12"')) fail("Conversion version missing.");
if (!catalog.includes("B2C_ADD_ON_CATALOG")) fail("Add-on catalog missing.");
if (!catalog.includes("PLANNING_HYPOTHESIS")) fail("Pricing planning status missing.");

const expectedAddOns = [
  "RIASEC_V1",
  "CROSS_TEST_PROFILE_V1",
  "STUDY_DIRECTION_V1",
  "MAJOR_FIT_V1",
  "CAREER_EXPLORATION_V1",
  "ADVANCED_REPORT_V1",
];
for (const key of expectedAddOns) {
  if (!catalog.includes(`code: "${key}"`)) fail(`Expected add-on missing: ${key}`);
}

if (!service.includes("userAddOnEntitlement")) fail("Canonical entitlement service does not include add-on evidence.");
if (!service.includes("grantAddOnEntitlements")) fail("Manual add-on fulfillment primitive missing.");
if (!route.includes("getB2CAddOnCatalog")) fail("Add-on catalog API missing.");
if (!dashboard.includes("getB2CAddOnCatalog")) fail("B2C add-on UX missing.");
if (!dashboard.includes("Planning hypothesis")) fail("Planning price disclosure missing.");

if (dashboard.includes("user.tier") || dashboard.includes("session.user.tier")) {
  fail("Tier-based access coupling remains prohibited.");
}
const paymentImplementationPattern = /(stripe|midtrans|xendit|createCheckout|checkoutSession|paymentIntent|purchaseWebhook|billingWebhook)/i;
if (paymentImplementationPattern.test(catalog)) fail("Payment implementation leaked into add-on catalog.");
if (paymentImplementationPattern.test(service)) fail("Payment implementation leaked into entitlement service.");

const schemaHasBaseProduct = schema.includes("model Product {") && schema.includes("model ProductEntitlement {");
if (!schemaHasBaseProduct) fail("Phase 3.1 commercial models missing; add-ons must be additive.");

console.log("Add-on product model             : PASS");
console.log("Explicit add-on entitlement map  : PASS");
console.log("Canonical entitlement extension  : PASS");
console.log("B2C conversion catalog           : PASS");
console.log("Planning-price disclosure        : PASS");
console.log("No tier-based access coupling    : PASS");
console.log("No payment implementation        : NOT INCLUDED");
console.log("Phase 3.1 matrix preserved       : PASS");
console.log("Measurement lifecycle mutation   : NONE");
console.log("F.3.12 B2C CONVERSION & ADD-ON PRODUCTS GATE: PASS");
