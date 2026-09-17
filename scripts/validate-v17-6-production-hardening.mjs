import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const checks = [
  ["Admin send rate limiter", fs.existsSync("lib/whatsapp/admin-rate-limit.ts") && read("lib/whatsapp/admin-rate-limit.ts").includes("checkWhatsAppAdminSendRateLimit")],
  ["429 Retry-After contract", read("app/api/admin/whatsapp/conversations/[id]/messages/route.ts").includes('"Retry-After"') && read("app/api/admin/whatsapp/conversations/[id]/messages/route.ts").includes('status:429')],
  ["Send audit event", read("lib/whatsapp/admin-reply.ts").includes('action: "WHATSAPP_MESSAGE_SENT"')],
  ["Read audit event", read("lib/admin-whatsapp-repository.ts").includes('action: "WHATSAPP_CONVERSATION_READ"')],
  ["Atomic inbound persistence", read("lib/whatsapp/persistence.ts").includes("prisma.$transaction(async (tx)")],
  ["Webhook idempotency preserved", read("lib/whatsapp/persistence.ts").includes("externalMessageId") && read("lib/whatsapp/persistence.ts").includes("P2002")],
  ["Provider status monotonicity", read("lib/whatsapp/persistence.ts").includes("STALE_STATUS")],
  ["Safe provider error mapping", read("lib/whatsapp/cloud-api-client.ts").includes("WHATSAPP_TEMPLATE_REQUIRED") && read("lib/whatsapp/cloud-api-client.ts").includes("WHATSAPP_AUTH_FAILED")],
  ["Security headers", read("next.config.mjs").includes("X-Content-Type-Options") && read("next.config.mjs").includes("X-Frame-Options")],
  ["Pagination bounded", read("lib/admin-whatsapp-repository.ts").includes("WHATSAPP_INBOX_PAGE_SIZE = 50")],
  ["No secret logging", !read("app/api/webhooks/whatsapp/route.ts").match(/console\.(log|info|error).*WHATSAPP_ACCESS_TOKEN/)],
];
let failed = false;
for (const [name, ok] of checks) { console.log(`${name}: ${ok ? "PASS" : "FAIL"}`); if (!ok) failed = true; }
if (failed) process.exit(1);
console.log("V17.6 Production Hardening static gate: PASS");
