import { spawn } from "node:child_process";
import { createHmac, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const port = 3195;
const base = `http://127.0.0.1:${port}`;
const verifyToken = "readyscore-v18-3-local-verify";
const appSecret = "readyscore-v18-3-local-app-secret";
const phone = `62813${Date.now().toString().slice(-8)}`;
const prisma = new PrismaClient();
let child;
let conversationId;
let outboundId;

const assert = (ok, message) => { if (!ok) throw new Error(message); };
const signature = (body) => `sha256=${createHmac("sha256", appSecret).update(Buffer.from(body)).digest("hex")}`;
async function request(path, options = {}) { return fetch(`${base}${path}`, { redirect: "manual", ...options }); }
async function postWebhook(payload) {
  const body = JSON.stringify(payload);
  return request("/api/webhooks/whatsapp", { method: "POST", headers: { "content-type": "application/json", "x-hub-signature-256": signature(body) }, body });
}
async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const r = await request(`/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(verifyToken)}&hub.challenge=v18-3`);
      if (r.status === 200) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Next server did not become ready");
}

try {
  child = spawn("pnpm", ["exec", "next", "start", "--port", String(port)], {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: "production", PORT: String(port), WHATSAPP_VERIFY_TOKEN: verifyToken, WHATSAPP_APP_SECRET: appSecret, WHATSAPP_E2E_MODE: "1", WHATSAPP_ADMIN_SEND_RATE_LIMIT_MAX: "1", WHATSAPP_ADMIN_SEND_RATE_LIMIT_WINDOW_SECONDS: "60" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", () => {}); child.stderr.on("data", () => {});
  await waitForServer();

  const root = await request("/");
  assert(root.status === 200, `root smoke expected 200, got ${root.status}`);
  assert(root.headers.get("x-content-type-options") === "nosniff", "X-Content-Type-Options missing");
  assert(root.headers.get("x-frame-options") === "DENY", "X-Frame-Options missing");
  assert(root.headers.get("strict-transport-security")?.includes("max-age=31536000"), "HSTS header missing");
  console.log("security headers: PASS");

  const oversized = Buffer.alloc(1_000_001, "a");
  const oversizedResponse = await request("/api/webhooks/whatsapp", { method: "POST", headers: { "content-type": "application/json" }, body: oversized });
  assert(oversizedResponse.status === 413, `oversized webhook expected 413, got ${oversizedResponse.status}`);
  const oversizedBody = await oversizedResponse.json();
  assert(oversizedBody?.error?.code === "WHATSAPP_WEBHOOK_PAYLOAD_TOO_LARGE", "oversized webhook error code missing");
  console.log("webhook payload-size hardening: PASS");

  const malformed = "{";
  const malformedResponse = await request("/api/webhooks/whatsapp", { method: "POST", headers: { "content-type": "application/json", "x-hub-signature-256": signature(malformed) }, body: malformed });
  assert(malformedResponse.status === 400, `malformed JSON expected 400, got ${malformedResponse.status}`);
  console.log("webhook malformed-input handling: PASS");

  const fixture = await prisma.whatsAppConversation.create({
    data: { phoneNumber: `+${phone}`, displayName: "V18.3 Hardening Test", unreadCount: 1, lastMessageAt: new Date(), messages: { create: { direction: "INBOUND", messageType: "TEXT", status: "RECEIVED", text: "V18.3 hardening" } } },
  });
  conversationId = fixture.id;

  const login = await request("/api/auth/login", { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ email: process.env.ADMIN_EMAIL || "radmin@yopmail.com", password: process.env.ADMIN_PASSWORD || "12345678" }) });
  assert(login.ok, `admin login failed: ${login.status}`);
  const cookie = (login.headers.get("set-cookie") || "").split(";")[0];
  assert(cookie, "admin session cookie missing");

  let r = await request(`/api/admin/whatsapp/conversations/${conversationId}/messages`, { method: "POST", headers: { cookie, accept: "application/json", "content-type": "application/json", "idempotency-key": `v18.3-${randomBytes(10).toString("hex")}` }, body: JSON.stringify({ text: "V18.3 rate-limit first" }) });
  assert(r.status === 201, `first send expected 201, got ${r.status}`);
  const first = await r.json(); outboundId = first.message?.id; assert(outboundId, "outbound message id missing");

  r = await request(`/api/admin/whatsapp/conversations/${conversationId}/messages`, { method: "POST", headers: { cookie, accept: "application/json", "content-type": "application/json", "idempotency-key": `v18.3-${randomBytes(10).toString("hex")}` }, body: JSON.stringify({ text: "V18.3 rate-limit second" }) });
  assert(r.status === 429, `rate limit expected 429, got ${r.status}`);
  assert(r.headers.get("retry-after"), "Retry-After missing");
  console.log("admin send rate limiting: PASS");

  const outbound = await prisma.whatsAppMessage.findUnique({ where: { id: outboundId }, select: { externalMessageId: true, status: true } });
  assert(outbound?.externalMessageId && outbound.status === "SENT", "outbound provider state missing");

  const delivered = await postWebhook({ object: "whatsapp_business_account", entry: [{ changes: [{ value: { statuses: [{ id: outbound.externalMessageId, status: "delivered", timestamp: String(Math.floor(Date.now() / 1000) + 2), recipient_id: phone }] } }] }] });
  assert(delivered.status === 200, `delivered webhook expected 200, got ${delivered.status}`);
  const stale = await postWebhook({ object: "whatsapp_business_account", entry: [{ changes: [{ value: { statuses: [{ id: outbound.externalMessageId, status: "sent", timestamp: String(Math.floor(Date.now() / 1000) + 3), recipient_id: phone }] } }] }] });
  assert(stale.status === 200, `stale status webhook expected 200, got ${stale.status}`);
  const statusAfter = await prisma.whatsAppMessage.findUnique({ where: { id: outboundId }, select: { status: true, deliveredAt: true } });
  assert(statusAfter?.status === "DELIVERED" && statusAfter.deliveredAt, "stale provider status regressed message state");
  console.log("provider status monotonicity: PASS");

  console.log("=== READY SCORE V18.3 HARDENING E2E — PASS ===");
} finally {
  if (conversationId) await prisma.whatsAppMessage.deleteMany({ where: { conversationId } }).catch(() => {});
  if (conversationId) await prisma.whatsAppConversation.delete({ where: { id: conversationId } }).catch(() => {});
  await prisma.$disconnect();
  if (child && !child.killed) child.kill("SIGTERM");
}
