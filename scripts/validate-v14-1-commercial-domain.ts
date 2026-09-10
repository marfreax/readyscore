import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "prisma/schema.prisma",
  "prisma/migrations/20260909090000_v14_1_commercial_domain_checkout_foundation/migration.sql",
  "lib/commercial/v14-1.ts",
  "app/api/commercial/catalog/route.ts",
  "app/api/commercial/checkout/route.ts",
  "app/api/commercial/orders/route.ts",
  "app/api/commercial/orders/[orderId]/route.ts",
  "app/checkout/[productId]/page.tsx",
  "app/checkout/success/page.tsx",
];

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`V14_1_MISSING:${file}`);
}

const tsconfig = JSON.parse(fs.readFileSync(path.join(root, "tsconfig.json"), "utf8"));
if (!Array.isArray(tsconfig?.exclude) || !tsconfig.exclude.includes("docs")) {
  throw new Error("ACTIVE_DEV_BOUNDARY_DOCS_NOT_EXCLUDED");
}
if (!fs.existsSync(path.join(root, "v14"))) {
  throw new Error("V14_ACTIVE_DEV_DIRECTORY_MISSING");
}

const tsInclude = Array.isArray(tsconfig?.include) ? tsconfig.include : [];
if (!Array.isArray(tsconfig?.exclude) || !tsconfig.exclude.includes("docs")) {
  throw new Error("ARCHIVED_DOCS_MUST_BE_EXCLUDED_FROM_ACTIVE_TSC");
}
// Next.js intentionally injects generated type globs into tsconfig during `next build`.
// Do not reject those generated entries: they are required by Next's own build/type validation.
if (tsInclude.some((entry: unknown) => typeof entry === "string" && entry.includes("docs/"))) {
  throw new Error("ARCHIVED_DOCS_MUST_NOT_BE_INCLUDED_IN_ACTIVE_TSC");
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (packageJson?.scripts?.["v14.1:gate"] !== "tsx scripts/validate-v14-1-commercial-domain.ts") {
  throw new Error("V14_1_GATE_SCRIPT_MISSING_OR_INVALID");
}

const schema = fs.readFileSync(path.join(root, "prisma/schema.prisma"), "utf8");
for (const token of [
  "CommercialOrder",
  "CommercialAuditEvent",
  "CommercialOrderStatus",
  "CommercialPaymentStatus",
  "CommercialFulfillmentStatus",
  "unitPriceIdrSnapshot",
  "totalAmountIdr",
]) {
  if (!schema.includes(token)) throw new Error(`V14_1_SCHEMA_MISSING:${token}`);
}

const service = fs.readFileSync(path.join(root, "lib/commercial/v14-1.ts"), "utf8");
for (const token of [
  "status: ACTIVE_PRODUCT_STATUS",
  "priceIdr",
  "productNameSnapshot",
  "assessmentTypeSnapshot",
  "unitPriceIdrSnapshot",
  "totalAmountIdr",
  "PAYMENT_PENDING",
  "ORDER_CREATED",
]) {
  if (!service.includes(token)) throw new Error(`V14_1_INVARIANT_MISSING:${token}`);
}

// V14.1 must not introduce or modify the V13 assessment runtime boundary.
const forbiddenNewRuntimePath = path.join(root, "lib/assessment/runtime-contract.ts");
if (!fs.existsSync(forbiddenNewRuntimePath)) {
  throw new Error("V13_RUNTIME_BOUNDARY_MISSING");
}

console.log("V14.1 STATIC GATE: PASS");
console.log("Scope: commercial domain + checkout foundation; no payment provider integration.");
