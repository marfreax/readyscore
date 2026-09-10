import { existsSync, readFileSync } from "node:fs";

function fail(message: string): never {
  throw new Error(message);
}
function must(path: string, token?: string) {
  if (!existsSync(path)) fail(`V14.2_FILE_MISSING:${path}`);
  if (token && !readFileSync(path, "utf8").includes(token)) fail(`V14.2_TOKEN_MISSING:${path}:${token}`);
}

must("prisma/migrations/20260909140000_v14_2_payment_gateway_integration/migration.sql");
must("lib/commercial/payment-provider.ts", "createPayment");
must("lib/commercial/midtrans.ts", "MidtransSnapProvider");
must("lib/commercial/midtrans-security.ts", "verifyMidtransNotificationSignature");
must("lib/commercial/v14-2.ts", "processProviderWebhook");
must("app/api/commercial/payments/route.ts");
must("app/api/commercial/payments/verify/route.ts");
must("app/api/commercial/webhooks/midtrans/route.ts");
must("v14/tests/e2e-v14-2-payment-gateway.mjs");

const schema = readFileSync("prisma/schema.prisma", "utf8");
for (const token of ["CommercialPaymentAttempt", "CommercialWebhookEvent", "CommercialPaymentAttemptStatus", "CommercialWebhookStatus"]) {
  if (!schema.includes(token)) fail(`V14.2_SCHEMA_TOKEN_MISSING:${token}`);
}
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
if (pkg.scripts?.["v14.2:gate"] !== "tsx scripts/validate-v14-2-payment-gateway.ts") fail("V14.2_PACKAGE_SCRIPT_MISSING");
if (pkg.scripts?.["e2e:v14.2:payment"] !== "pnpm db:migrate:deploy && node v14/tests/e2e-v14-2-payment-gateway.mjs") fail("V14.2_E2E_SCRIPT_MISSING");

const service = readFileSync("lib/commercial/v14-2.ts", "utf8");
for (const token of ["PAYMENT_AMOUNT_MISMATCH", "PAYMENT_CURRENCY_MISMATCH", "INVALID_PAYMENT_STATE_TRANSITION", "MIDTRANS_WEBHOOK"]) {
  if (!service.includes(token)) fail(`V14.2_SERVICE_INVARIANT_MISSING:${token}`);
}
console.log("V14.2 STATIC GATE: PASS");
console.log("Scope: payment gateway integration, provider verification, webhook security, idempotency, and recovery foundation.");
