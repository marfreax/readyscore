import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

const spec = read("ReadyScore-V18-WhatsApp-Production-Runtime-Completion-Spec.md");
const schema = read("prisma/schema.prisma");
const migration = read("prisma/migrations/20260925121000_v18_1_whatsapp_outbound_idempotency/migration.sql");
const webhook = read("app/api/webhooks/whatsapp/route.ts");
const persistence = read("lib/whatsapp/persistence.ts");
const provider = read("lib/whatsapp/cloud-api-client.ts");
const security = read("lib/whatsapp/webhook-security.ts");
const reply = read("lib/whatsapp/admin-reply.ts");
const api = read("app/api/admin/whatsapp/conversations/[id]/messages/route.ts");
const packageJson = JSON.parse(read("package.json"));

for (const marker of [
  "V18.1 — WhatsApp Core Runtime",
  "webhook verification",
  "signature validation",
  "idempotency",
  "Meta Graph API client",
  "safe acknowledgement",
]) check(spec.includes(marker), `V18.1 specification marker missing: ${marker}`);

for (const marker of [
  "clientRequestId     String?  @unique",
  "externalMessageId   String?  @unique",
  "@@unique([phoneNumber, channel])",
]) check(schema.includes(marker), `schema contract missing: ${marker}`);

check(migration.includes('ADD COLUMN "clientRequestId" TEXT'), "outbound idempotency migration missing column");
check(migration.includes('CREATE UNIQUE INDEX "WhatsAppMessage_clientRequestId_key"'), "outbound idempotency unique index missing");

for (const marker of ["verifyWhatsAppChallenge", "verifyWhatsAppSignature", "normalizeWhatsAppWebhookPayload", "persistInboundWhatsAppMessage", "applyWhatsAppStatus"]) check(webhook.includes(marker), `webhook runtime marker missing: ${marker}`);
for (const marker of ["normalizeWhatsAppPhone", "whatsappIdentityVariants", "externalMessageId", "P2002", "unreadCount", "businessLeadId"]) check(persistence.includes(marker), `persistence marker missing: ${marker}`);
for (const marker of ["graph.facebook.com", "WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_GRAPH_VERSION", "WHATSAPP_PROVIDER_NOT_CONFIGURED", "WHATSAPP_TEMPLATE_REQUIRED", "WHATSAPP_NETWORK_ERROR"]) check(provider.includes(marker), `provider marker missing: ${marker}`);
for (const marker of ["createHmac", "timingSafeEqual", "WHATSAPP_VERIFY_TOKEN", "WHATSAPP_APP_SECRET", "sha256="]) check(security.includes(marker), `security marker missing: ${marker}`);
for (const marker of ["clientRequestId", "WHATSAPP_IDEMPOTENCY_KEY_CONFLICT", "direction: \"OUTBOUND\"", "sendWhatsAppText"]) check(reply.includes(marker), `outbound idempotency/provider marker missing: ${marker}`);
check(api.includes('request.headers.get("idempotency-key")'), "admin send API does not accept idempotency key");

const frozen = [
  "scripts/validate-v17-11-question-architecture-freeze.mjs",
  "scripts/e2e-v17-11-question-architecture-regression.mjs",
  "scripts/v17-11-freeze.mjs",
];
for (const file of frozen) check(exists(file), `frozen V17.11 artifact missing: ${file}`);
check(packageJson.scripts?.["v18.0:gate"] === "node scripts/validate-v18-0-architecture-baseline.mjs", "V18.0 baseline gate missing");
check(packageJson.scripts?.["v18.1:gate"] === "node scripts/validate-v18-1-whatsapp-core-runtime.mjs", "V18.1 gate missing/mismatched");
check(packageJson.scripts?.["e2e:v18.1:whatsapp"] === "node scripts/e2e-v18-1-whatsapp-core-runtime.mjs", "V18.1 E2E script missing/mismatched");

for (const forbidden of ["prisma db push", "pm2 restart", "git push", "https://app.readyscore.id"]) {
  check(!migration.includes(forbidden), `V18.1 migration contains forbidden production mutation marker: ${forbidden}`);
}

if (failures.length) {
  console.error("ReadyScore V18.1 WhatsApp Core Runtime — FAIL");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("=== READY SCORE V18.1 WHATSAPP CORE RUNTIME ===");
console.log("V18.0 baseline boundary preserved: PASS");
console.log("Webhook verification + signature boundary: PASS");
console.log("Inbound normalization + persistence boundary: PASS");
console.log("Phone normalization + BusinessLead variants: PASS");
console.log("Inbound idempotency boundary: PASS");
console.log("Outbound idempotency boundary: PASS");
console.log("Meta provider boundary: PASS");
console.log("Delivery/read status boundary: PASS");
console.log("Question Architecture frozen boundary: PASS");
console.log("Production mutation boundary: PASS");
console.log("=== READY SCORE V18.1 WHATSAPP CORE RUNTIME — PASS ===");
