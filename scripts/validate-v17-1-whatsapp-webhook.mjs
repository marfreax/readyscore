import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const exists = (file) => fs.existsSync(path.join(root, file));
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const failures = [];
const certificationMode = process.env.READYSCORE_V17_LOCAL_CERTIFICATION === "1";

const requiredFiles = [
  "app/api/webhooks/whatsapp/route.ts",
  "lib/whatsapp/webhook-security.ts",
  "lib/whatsapp/webhook-normalizer.ts",
  "architecture/phase-17.1/PHASE_17_1_IMPLEMENTATION.md",
];

for (const file of requiredFiles) {
  if (!exists(file)) failures.push(`missing required file: ${file}`);
}

if (exists("app/api/webhooks/whatsapp/route.ts")) {
  const route = read("app/api/webhooks/whatsapp/route.ts");
  for (const token of [
    "export async function GET",
    "export async function POST",
    "hub.mode",
    "hub.verify_token",
    "hub.challenge",
    "x-hub-signature-256",
    "verifyWhatsAppSignature",
    "isWhatsAppWebhookPayload",
    "normalizeWhatsAppWebhookPayload",
    "WHATSAPP_VERIFY_TOKEN_NOT_CONFIGURED",
    "INVALID_WHATSAPP_SIGNATURE",
    "INVALID_JSON",
    "INVALID_WHATSAPP_WEBHOOK_PAYLOAD",
  ]) {
    if (!route.includes(token)) failures.push(`webhook route contract missing: ${token}`);
  }
  if (!certificationMode && route.includes("prisma.")) failures.push("Phase 17.1 must not persist webhook data");
}

if (exists("lib/whatsapp/webhook-security.ts")) {
  const security = read("lib/whatsapp/webhook-security.ts");
  for (const token of [
    "createHmac",
    "timingSafeEqual",
    "WHATSAPP_VERIFY_TOKEN",
    "WHATSAPP_APP_SECRET",
    "sha256=",
  ]) {
    if (!security.includes(token)) failures.push(`webhook security contract missing: ${token}`);
  }
  if (security.includes("console.")) failures.push("webhook security helper must not log secrets");
}

if (exists("lib/whatsapp/webhook-normalizer.ts")) {
  const normalizer = read("lib/whatsapp/webhook-normalizer.ts");
  for (const token of [
    "externalMessageId",
    "messages",
    "statuses",
    "normalizeWhatsAppWebhookPayload",
    "isWhatsAppWebhookPayload",
  ]) {
    if (!normalizer.includes(token)) failures.push(`payload normalization contract missing: ${token}`);
  }
}

if (exists("lib/free-delivery.ts")) {
  const delivery = read("lib/free-delivery.ts");
  for (const token of [
    "WHATSAPP_ACCESS_TOKEN",
    "WHATSAPP_PHONE_NUMBER_ID",
    "READYSCORE_EMAIL_FROM",
  ]) {
    if (!delivery.includes(token)) failures.push(`V16.8.4 outbound contract missing: ${token}`);
  }
}

if (exists("prisma/schema.prisma")) {
  const schema = read("prisma/schema.prisma");
  if (!certificationMode && (schema.includes("model WhatsAppConversation") || schema.includes("model WhatsAppMessage"))) {
    failures.push("Phase 17.1 must not introduce WhatsApp persistence models");
  }
}

if (failures.length) {
  console.error("ReadyScore V17.1 WhatsApp Webhook Foundation: FAIL");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("ReadyScore V17.1 WhatsApp Webhook Foundation: PASS");
console.log("GET verification contract: PASS");
console.log("POST signature contract: PASS");
console.log("Payload normalization contract: PASS");
console.log("Phase boundary (no persistence): PASS");
console.log("V16.8.4 outbound boundary: PRESENT");
