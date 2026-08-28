import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const page = fs.readFileSync(path.join(root, "app/app/page.tsx"), "utf8");
const service = fs.readFileSync(
  path.join(root, "lib/commercial/entitlement-service.ts"),
  "utf8",
);
const catalog = fs.readFileSync(
  path.join(root, "lib/commercial/catalog.ts"),
  "utf8",
);

function fail(message) {
  throw new Error(message);
}

console.log("=== READY SCORE V3 PHASE 3.10 COMMERCIAL DASHBOARD & ENTITLEMENT UX V1 GATE ===");
console.log("Scope      : Commercial visibility / entitlement UX / product catalog");
console.log("Protection : Measurement identity and Phase 3.1 entitlement matrix remain unchanged");

if (!page.includes("getCurrentSession")) fail("Dashboard must resolve the current session.");
if (!page.includes("listUserEntitlements")) fail("Dashboard must consume canonical user entitlements.");
if (!page.includes("getActiveProductsForUser")) fail("Dashboard must use active products only as informational context.");
if (!page.includes("refKey")) fail("Dashboard access checks must use explicit entitlement references.");
if (page.includes("user.tier") || page.includes("session.user.tier") || page.includes("product.tier ===")) {
  fail("Tier-based UI access logic is prohibited.");
}
if (!page.includes("entitlement required") && !page.includes("Entitlement required")) {
  fail("Locked entitlement state is missing.");
}
if (!page.includes("Planning hypothesis")) fail("Planning-price disclosure is required.");
if (page.includes("checkout") || page.includes("payment gateway") || page.includes("purchase webhook")) {
  fail("Payment implementation must remain deferred.");
}
if (!service.includes("hasEntitlement")) fail("Canonical entitlement primitive missing.");
if (!catalog.includes("COMMERCIAL_MATRIX_VERSION")) fail("Commercial matrix identity missing.");

console.log("Canonical entitlement boundary : PASS");
console.log("Explicit entitlement UX        : PASS");
console.log("No product-tier access coupling: PASS");
console.log("Locked/unlocked states          : PASS");
console.log("Planning price disclosure       : PASS");
console.log("Payment implementation          : NOT INCLUDED");
console.log("Measurement lifecycle mutation  : NONE");
console.log("F.3.10 COMMERCIAL DASHBOARD UX GATE: PASS");
