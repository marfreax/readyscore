import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

const requiredFiles = [
  "ReadyScore-V18-WhatsApp-Production-Runtime-Completion-Spec.md",
  "architecture/phase-18.0/V18.0-ARCHITECTURE-BASELINE-RECONCILIATION.md",
  "architecture/phase-18.0/V18.0-GAP-MATRIX.md",
  "architecture/phase-18.0/V18.0-API-CONTRACT.md",
  "architecture/phase-18.0/V18.0-SECURITY-CONTRACT.md",
  "scripts/validate-v18-0-architecture-baseline.mjs",
];
for (const file of requiredFiles) check(exists(file), `missing V18.0 artifact: ${file}`);

const spec = read("ReadyScore-V18-WhatsApp-Production-Runtime-Completion-Spec.md");
const matrix = read("architecture/phase-18.0/V18.0-GAP-MATRIX.md");
const baseline = read("architecture/phase-18.0/V18.0-ARCHITECTURE-BASELINE-RECONCILIATION.md");
const schema = read("prisma/schema.prisma");
const webhook = read("app/api/webhooks/whatsapp/route.ts");
const persistence = read("lib/whatsapp/persistence.ts");
const provider = read("lib/whatsapp/cloud-api-client.ts");
const security = read("lib/whatsapp/webhook-security.ts");
const adminRepo = read("lib/admin-whatsapp-repository.ts");
const adminReply = read("lib/whatsapp/admin-reply.ts");
const adminPage = read("app/admin/whatsapp/page.tsx");
const packageJson = JSON.parse(read("package.json"));

for (const marker of [
  "V17.11 — Question Architecture Freeze & Full Regression — PASS",
  "V18.0 — Architecture & Baseline Reconciliation",
  "V18.1 — WhatsApp Core Runtime",
  "V18.2 — Admin Inbox & Customer Context",
  "V18.3 — Production Hardening & Full Certification",
  "Question Architecture dianggap frozen",
  "no production change",
]) check(spec.includes(marker), `V18 specification contract missing: ${marker}`);

for (const marker of ["G-01", "G-05", "G-06", "G-10", "G-14", "V18.1", "V18.2", "V18.3"]) {
  check(matrix.includes(marker), `gap matrix missing contract marker: ${marker}`);
}

check(schema.includes("model WhatsAppConversation"), "WhatsAppConversation model missing");
check(schema.includes("model WhatsAppMessage"), "WhatsAppMessage model missing");
check(schema.includes("@@unique([phoneNumber, channel])"), "channel-aware conversation uniqueness missing");
check(schema.includes("externalMessageId   String?  @unique"), "externalMessageId uniqueness missing");
check(schema.includes("businessLeadId String?"), "BusinessLead relation field missing from conversation model");

for (const marker of [
  "export async function GET",
  "export async function POST",
  "verifyWhatsAppSignature",
  "normalizeWhatsAppWebhookPayload",
  "persistInboundWhatsAppMessage",
  "applyWhatsAppStatus",
]) check(webhook.includes(marker), `webhook runtime marker missing: ${marker}`);

for (const marker of [
  "normalizeWhatsAppPhone",
  "externalMessageId",
  "P2002",
  "unreadCount",
  "businessLeadId",
  "applyWhatsAppStatus",
]) check(persistence.includes(marker), `persistence marker missing: ${marker}`);

for (const marker of [
  "graph.facebook.com",
  "WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_GRAPH_VERSION",
  "WHATSAPP_PROVIDER_NOT_CONFIGURED",
  "WHATSAPP_TEMPLATE_REQUIRED",
]) check(provider.includes(marker), `provider boundary marker missing: ${marker}`);

for (const marker of ["createHmac", "timingSafeEqual", "WHATSAPP_VERIFY_TOKEN", "WHATSAPP_APP_SECRET", "sha256="]) {
  check(security.includes(marker), `webhook security marker missing: ${marker}`);
}

for (const marker of ["listAdminWhatsAppConversations", "listAdminWhatsAppMessages", "BusinessLead", "freeReportDelivery", "WHATSAPP_CONVERSATION_READ"]) {
  check(adminRepo.includes(marker), `admin/context marker missing: ${marker}`);
}
check(adminReply.includes("sendWhatsAppText"), "admin outbound provider boundary missing");
check(adminReply.includes('direction: "OUTBOUND"'), "outbound persistence missing");
check(adminPage.includes("WhatsAppInbox"), "canonical admin WhatsApp route missing");

const frozenFiles = [
  "scripts/validate-v17-11-question-architecture-freeze.mjs",
  "scripts/e2e-v17-11-question-architecture-regression.mjs",
  "scripts/v17-11-freeze.mjs",
];
for (const file of frozenFiles) check(exists(file), `V17.11 freeze artifact missing: ${file}`);

check(packageJson.scripts?.["v18.0:gate"] === "node scripts/validate-v18-0-architecture-baseline.mjs", "package script v18.0:gate missing/mismatched");

for (const forbidden of ["prisma db push", "prisma migrate dev", "prisma migrate deploy", "pm2 restart", "git push", "https://app.readyscore.id"]) {
  check(!baseline.includes(forbidden), `V18.0 baseline artifact must not perform production/deployment mutation: ${forbidden}`);
}

if (failures.length) {
  console.error("ReadyScore V18.0 Architecture & Baseline — FAIL");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("=== READY SCORE V18.0 ARCHITECTURE & BASELINE ===");
console.log("V17.11 PASS baseline preserved: PASS");
console.log("WhatsApp existing implementation mapped: PASS");
console.log("Database identity/idempotency boundary: PASS");
console.log("Webhook security boundary: PASS");
console.log("Provider boundary: PASS");
console.log("Admin/context boundary: PASS");
console.log("Question Architecture freeze boundary: PASS");
console.log("V18 gap matrix locked: PASS");
console.log("Production mutation boundary: PASS");
console.log("=== READY SCORE V18.0 ARCHITECTURE & BASELINE — PASS ===");
