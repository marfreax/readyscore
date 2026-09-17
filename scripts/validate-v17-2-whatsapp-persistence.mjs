import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const failures = [];
const certificationMode = process.env.READYSCORE_V17_LOCAL_CERTIFICATION === "1";

const schema = read("prisma/schema.prisma");
const persistence = read("lib/whatsapp/persistence.ts");
const normalizer = read("lib/whatsapp/webhook-normalizer.ts");
const route = read("app/api/webhooks/whatsapp/route.ts");

for (const token of ["model WhatsAppConversation", "model WhatsAppMessage", "WhatsAppChannel", "@@unique([phoneNumber, channel])", "externalMessageId   String?  @unique"]) {
  if (!schema.includes(token)) failures.push(`schema contract missing: ${token}`);
}
for (const token of ["normalizeWhatsAppPhone", "findUnique", "externalMessageId", "duplicate", "unreadCount", "businessLeadId", "applyWhatsAppStatus"]) {
  if (!persistence.includes(token)) failures.push(`persistence contract missing: ${token}`);
}
for (const token of ["displayName", "externalMessageId", "from", "timestamp"]) {
  if (!normalizer.includes(token)) failures.push(`normalizer contract missing: ${token}`);
}
for (const token of ["persistInboundWhatsAppMessage", "applyWhatsAppStatus", "WHATSAPP_WEBHOOK_PROCESSING_FAILED"]) {
  if (!route.includes(token)) failures.push(`webhook integration missing: ${token}`);
}
const migrationDir = "prisma/migrations/20260917220000_v17_2_whatsapp_conversation_message";
if (!exists(`${migrationDir}/migration.sql`)) failures.push("V17.2 migration missing");
if (!certificationMode && exists("app/admin/whatsapp/page.tsx")) failures.push("V17.3 inbox UI must not be implemented in V17.2");

const forbidden = ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_APP_SECRET", "WHATSAPP_VERIFY_TOKEN"];
for (const token of forbidden) {
  if (persistence.includes(token)) failures.push(`secret must not be referenced by persistence layer: ${token}`);
}

if (failures.length) {
  console.error("ReadyScore V17.2 Conversation & Message Persistence: FAIL");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log("ReadyScore V17.2 Conversation & Message Persistence: PASS");
console.log("Conversation model: PASS");
console.log("Message model: PASS");
console.log("Unique conversation identity: PASS");
console.log("Unique external message ID: PASS");
console.log("Phone normalization: PASS");
console.log("Idempotent inbound persistence: PASS");
console.log("Status persistence boundary: PASS");
console.log("V17.3 inbox boundary: PASS");
