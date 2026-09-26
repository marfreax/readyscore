import { spawn } from "node:child_process";
import { createHmac, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const port = 3194;
const base = `http://127.0.0.1:${port}`;
const verifyToken = "readyscore-v18-1-local-verify";
const appSecret = "readyscore-v18-1-local-app-secret";
const phone = `62812${Date.now().toString().slice(-8)}`;
const normalizedPhone = `+${phone}`;
const external1 = `wamid.v18_1_${randomBytes(8).toString("hex")}`;
const external2 = `wamid.v18_1_${randomBytes(8).toString("hex")}`;
const clientRequestId = `v18.1-${randomBytes(12).toString("hex")}`;
const prisma = new PrismaClient();
let child;
let conversationId;
let leadId;

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
      const r = await request(`/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(verifyToken)}&hub.challenge=v18-1`);
      if (r.status === 200) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Next server did not become ready");
}

try {
  child = spawn("pnpm", ["exec", "next", "start", "--port", String(port)], {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: "production", PORT: String(port), WHATSAPP_VERIFY_TOKEN: verifyToken, WHATSAPP_APP_SECRET: appSecret, WHATSAPP_E2E_MODE: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", () => {}); child.stderr.on("data", () => {});
  await waitForServer();

  const verification = await request(`/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(verifyToken)}&hub.challenge=v18-1-challenge`);
  assert(verification.status === 200 && (await verification.text()) === "v18-1-challenge", "Meta verification failed");
  const badVerification = await request("/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=x");
  assert(badVerification.status === 403, `invalid verification expected 403, got ${badVerification.status}`);
  console.log("webhook verification: PASS");

  const payload1 = {
    object: "whatsapp_business_account",
    entry: [{ id: "1394892188831173", changes: [{ field: "messages", value: { messaging_product: "whatsapp", metadata: { phone_number_id: "1341235719073518" }, contacts: [{ profile: { name: "V18.1 Runtime Customer" }, wa_id: phone }], messages: [{ from: phone, id: external1, timestamp: String(Math.floor(Date.now() / 1000)), type: "text", text: { body: "Halo V18.1" } }] } }] }],
  };
  const badSignature = await request("/api/webhooks/whatsapp", { method: "POST", headers: { "content-type": "application/json", "x-hub-signature-256": `sha256=${"0".repeat(64)}` }, body: JSON.stringify(payload1) });
  assert(badSignature.status === 401, `bad signature expected 401, got ${badSignature.status}`);
  console.log("signature validation: PASS");

  const first = await postWebhook(payload1);
  const firstBody = await first.json();
  assert(first.status === 200 && firstBody.persistedMessages === 1 && firstBody.duplicateMessages === 0, `inbound persistence failed: ${JSON.stringify(firstBody)}`);
  const duplicate = await postWebhook(payload1);
  const duplicateBody = await duplicate.json();
  assert(duplicate.status === 200 && duplicateBody.persistedMessages === 0 && duplicateBody.duplicateMessages === 1, `duplicate inbound not idempotent: ${JSON.stringify(duplicateBody)}`);
  console.log("inbound persistence + duplicate webhook: PASS");

  const payload2 = {
    object: "whatsapp_business_account",
    entry: [{ id: "1394892188831173", changes: [{ field: "messages", value: { messaging_product: "whatsapp", contacts: [{ profile: { name: "V18.1 Runtime Customer" }, wa_id: phone }], messages: [{ from: phone, id: external2, timestamp: String(Math.floor(Date.now() / 1000) + 1), type: "text", text: { body: "Pesan kedua" } }] } }] }],
  };
  const second = await postWebhook(payload2);
  assert(second.status === 200, `second inbound status=${second.status}`);

  const conversation = await prisma.whatsAppConversation.findUnique({ where: { phoneNumber_channel: { phoneNumber: normalizedPhone, channel: "WHATSAPP" } }, include: { messages: { orderBy: { createdAt: "asc" } } } });
  assert(conversation, "conversation not created");
  conversationId = conversation.id;
  assert(conversation.messages.length === 2, `expected 2 inbound messages, got ${conversation.messages.length}`);
  assert(conversation.unreadCount === 2, `expected unreadCount=2, got ${conversation.unreadCount}`);
  console.log("conversation creation/reuse + unread persistence: PASS");

  const lead = await prisma.businessLead.create({ data: { name: "V18.1 Variant Lead", whatsapp: `0${phone.slice(2)}`, email: `v18-1-${Date.now()}@example.test`, source: "FREE_ASSESSMENT", status: "NEW", consent: true, consentAt: new Date() } });
  leadId = lead.id;
  const payload3 = { object: "whatsapp_business_account", entry: [{ id: "1394892188831173", changes: [{ field: "messages", value: { messages: [{ from: phone, id: `wamid.v18_1_${randomBytes(8).toString("hex")}`, timestamp: String(Math.floor(Date.now() / 1000) + 2), type: "text", text: { body: "Lead variant" } }] } }] }] };
  const third = await postWebhook(payload3);
  assert(third.status === 200, `lead variant webhook status=${third.status}`);
  const linked = await prisma.whatsAppConversation.findUnique({ where: { id: conversationId }, select: { businessLeadId: true } });
  assert(linked?.businessLeadId === leadId, "normalized BusinessLead variant matching failed");
  console.log("normalized BusinessLead matching: PASS");

  const login = await request("/api/auth/login", { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ email: process.env.ADMIN_EMAIL || "radmin@yopmail.com", password: process.env.ADMIN_PASSWORD || "12345678" }) });
  assert(login.ok, `admin login failed: ${login.status}`);
  const cookie = (login.headers.get("set-cookie") || "").split(";")[0];
  assert(cookie, "admin session cookie missing");

  const sendOptions = { method: "POST", headers: { cookie, accept: "application/json", "content-type": "application/json", "idempotency-key": clientRequestId }, body: JSON.stringify({ text: "Reply V18.1" }) };
  const outbound1 = await request(`/api/admin/whatsapp/conversations/${conversationId}/messages`, sendOptions);
  const outbound1Body = await outbound1.json();
  assert(outbound1.status === 201 && outbound1Body.ok === true, `outbound send failed: ${JSON.stringify(outbound1Body)}`);
  const outbound2 = await request(`/api/admin/whatsapp/conversations/${conversationId}/messages`, sendOptions);
  const outbound2Body = await outbound2.json();
  assert(outbound2.status === 201 && outbound2Body.message?.id === outbound1Body.message?.id, "duplicate outbound request created a second message");
  const outboundCount = await prisma.whatsAppMessage.count({ where: { conversationId, clientRequestId } });
  assert(outboundCount === 1, `expected one idempotent outbound message, got ${outboundCount}`);
  console.log("outbound provider integration + durable idempotency: PASS");

  const outbound = outbound1Body.message;
  assert(typeof outbound.externalMessageId === "string" && outbound.status === "SENT", "provider message ID/status not persisted");
  const statusPayload = { object: "whatsapp_business_account", entry: [{ id: "1394892188831173", changes: [{ field: "messages", value: { statuses: [{ id: outbound.externalMessageId, status: "delivered", timestamp: String(Math.floor(Date.now() / 1000) + 3), recipient_id: phone }] } }] }] };
  const status = await postWebhook(statusPayload);
  assert(status.status === 200, `delivery status webhook status=${status.status}`);
  const refreshed = await prisma.whatsAppMessage.findUnique({ where: { id: outbound.id } });
  assert(refreshed?.status === "DELIVERED" && refreshed.deliveredAt, "DELIVERED status not persisted");
  console.log("provider delivery status: PASS");

  console.log("=== READY SCORE V18.1 WHATSAPP CORE RUNTIME E2E — PASS ===");
} finally {
  if (conversationId) await prisma.whatsAppMessage.deleteMany({ where: { conversationId } }).catch(() => {});
  if (conversationId) await prisma.whatsAppConversation.delete({ where: { id: conversationId } }).catch(() => {});
  if (leadId) await prisma.businessLead.delete({ where: { id: leadId } }).catch(() => {});
  await prisma.$disconnect();
  if (child && !child.killed) child.kill("SIGTERM");
}
