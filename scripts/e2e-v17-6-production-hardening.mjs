import { spawn } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const port = 3192;
const base = `http://127.0.0.1:${port}`;
const email = process.env.ADMIN_EMAIL || "radmin@yopmail.com";
const password = process.env.ADMIN_PASSWORD || "12345678";
const prisma = new PrismaClient();
let child;
let conversationId;
let firstMessageId;
let actorId;

async function request(path, options = {}) { return fetch(`${base}${path}`, { redirect: "manual", ...options }); }
function assert(ok, message) { if (!ok) throw new Error(message); }
async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    try { const r = await request("/api/admin/whatsapp/conversations"); if ([401, 403].includes(r.status)) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("Next server did not become ready");
}

try {
  process.env.WHATSAPP_ADMIN_SEND_RATE_LIMIT_MAX = "1";
  process.env.WHATSAPP_ADMIN_SEND_RATE_LIMIT_WINDOW_SECONDS = "60";

  const fixture = await prisma.whatsAppConversation.create({
    data: {
      phoneNumber: `+62812${Date.now().toString().slice(-8)}`,
      displayName: "V17.6 Hardening Test",
      unreadCount: 1,
      lastMessageAt: new Date(),
      messages: { create: { direction: "INBOUND", messageType: "TEXT", status: "RECEIVED", text: "V17.6 hardening" } },
    },
  });
  conversationId = fixture.id;

  child = spawn("pnpm", ["exec", "next", "start", "--port", String(port)], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), WHATSAPP_E2E_MODE: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", () => {}); child.stderr.on("data", () => {});
  await waitForServer();

  let r = await request(`/api/admin/whatsapp/conversations/${conversationId}/messages`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: "unauthorized" }),
  });
  assert([401, 403].includes(r.status), `unauthorized send expected 401/403, got ${r.status}`);
  console.log("admin authorization regression: PASS");

  r = await request("/api/auth/login", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert(r.ok, `admin login failed: ${r.status}`);
  const cookie = (r.headers.get("set-cookie") || "").split(";")[0];
  assert(cookie, "session cookie missing");
  const session = await prisma.user.findFirst({ where: { email }, select: { id: true } });
  actorId = session?.id;
  assert(actorId, "admin actor not found");

  r = await request(`/api/admin/whatsapp/conversations/${conversationId}/messages`, {
    method: "POST", headers: { cookie, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ text: "V17.6 rate limit first" }),
  });
  const firstText = await r.text();
  assert(r.ok, `first admin send failed: ${r.status} ${firstText}`);
  const firstBody = JSON.parse(firstText);
  firstMessageId = firstBody.message?.id;
  assert(firstBody.ok && firstMessageId, "first outbound message missing");
  console.log("admin send + provider SENT: PASS");

  r = await request(`/api/admin/whatsapp/conversations/${conversationId}/messages`, {
    method: "POST", headers: { cookie, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ text: "V17.6 rate limit blocked" }),
  });
  const blockedText = await r.text();
  assert(r.status === 429, `rate limit expected 429, got ${r.status} ${blockedText}`);
  assert(r.headers.get("retry-after"), "Retry-After header missing");
  const blockedBody = JSON.parse(blockedText);
  assert(blockedBody?.error?.code === "WHATSAPP_RATE_LIMITED", "rate limit error code missing");
  console.log("admin send rate limiting + Retry-After: PASS");

  const sentAudit = await prisma.adminContentAuditEvent.findFirst({ where: { entityType: "WHATSAPP_CONVERSATION", entityId: conversationId, action: "WHATSAPP_MESSAGE_SENT", actorUserId: actorId }, orderBy: { createdAt: "desc" } });
  assert(sentAudit?.metadata && typeof sentAudit.metadata === "object", "send audit missing");
  console.log("admin send audit: PASS");

  r = await request(`/api/admin/whatsapp/conversations/${conversationId}/read`, { method: "POST", headers: { cookie, accept: "application/json" } });
  assert(r.ok, `mark read failed: ${r.status}`);
  const readAudit = await prisma.adminContentAuditEvent.findFirst({ where: { entityType: "WHATSAPP_CONVERSATION", entityId: conversationId, action: "WHATSAPP_CONVERSATION_READ", actorUserId: actorId }, orderBy: { createdAt: "desc" } });
  assert(readAudit, "read audit missing");
  console.log("conversation read audit: PASS");

  const saved = await prisma.whatsAppMessage.findUnique({ where: { id: firstMessageId }, select: { status: true, externalMessageId: true } });
  assert(saved?.status === "SENT" && saved.externalMessageId, "outbound persistence/provider ID regression");
  console.log("outbound persistence regression: PASS");
  console.log("V17.6 Production Hardening E2E: PASS");
} finally {
  if (conversationId) await prisma.whatsAppConversation.delete({ where: { id: conversationId } }).catch(() => {});
  await prisma.$disconnect();
  if (child && !child.killed) child.kill("SIGTERM");
}
