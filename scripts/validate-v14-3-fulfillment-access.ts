import { existsSync, readFileSync } from "node:fs";

function fail(message: string): never { throw new Error(message); }
function must(path: string, token?: string) {
  if (!existsSync(path)) fail(`V14.3_FILE_MISSING:${path}`);
  if (token && !readFileSync(path, "utf8").includes(token)) fail(`V14.3_TOKEN_MISSING:${path}:${token}`);
}

must("prisma/migrations/20260909150000_v14_3_fulfillment_entitlement_customer_access/migration.sql", "CommercialFulfillment");
must("lib/commercial/v14-3.ts", "fulfillPaidOrder");
must("app/api/commercial/orders/[orderId]/delivery/route.ts", "retryPaidOrderFulfillment");
must("v14/tests/e2e-v14-3-fulfillment-access.mjs", "FULFILLED");

const schema = readFileSync("prisma/schema.prisma", "utf8");
for (const token of ["model CommercialFulfillment", "usageLimit", "usageConsumed", "sourceOrderId"]) {
  if (!schema.includes(token)) fail(`V14.3_SCHEMA_TOKEN_MISSING:${token}`);
}
const runtime = readFileSync("lib/assessment/runtime-service.ts", "utf8");
for (const token of ["findConsumableTestEntitlement", "TEST_ACCESS_REQUIRED", "commercialAccessClaim"]) {
  if (!runtime.includes(token)) fail(`V14.3_ACCESS_RUNTIME_TOKEN_MISSING:${token}`);
}
const repository = readFileSync("lib/assessment/assessment-repository.ts", "utf8");
if (!repository.includes("ASSESSMENT_ACCESS_RACE")) fail("V14.3_ATOMIC_ACCESS_GUARD_MISSING");
const payment = readFileSync("lib/commercial/v14-2.ts", "utf8");
if (!payment.includes("fulfillPaidOrder")) fail("V14.3_PAYMENT_TO_FULFILLMENT_HOOK_MISSING");

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
if (pkg.scripts?.["v14.3:gate"] !== "tsx scripts/validate-v14-3-fulfillment-access.ts") fail("V14.3_PACKAGE_GATE_MISSING");
if (pkg.scripts?.["e2e:v14.3:fulfillment"] !== "pnpm db:migrate:deploy && node v14/tests/e2e-v14-3-fulfillment-access.mjs") fail("V14.3_E2E_SCRIPT_MISSING");

console.log("V14.3 STATIC GATE: PASS");
console.log("Scope: paid-order fulfillment, entitlement issuance, atomic access consumption, access denial, and customer delivery status.");
