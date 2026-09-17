import { spawn } from "node:child_process";
import { createHmac, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const port = 3188;
const baseUrl = `http://127.0.0.1:${port}`;
const verifyToken = "readyscore-v17-2-local-verify";
const appSecret = "readyscore-v17-2-local-app-secret";
const phone = `62812${Date.now().toString().slice(-8)}`;
const external1 = `wamid.v17_2_${randomBytes(8).toString("hex")}`;
const external2 = `wamid.v17_2_${randomBytes(8).toString("hex")}`;
const prisma = new PrismaClient();
let child;
let conversationId;

function signature(body) { return `sha256=${createHmac("sha256", appSecret).update(body).digest("hex")}`; }
async function waitForServer() {
  for (let i = 0; i < 50; i += 1) {
    try { const response = await fetch(`${baseUrl}/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=v17-2`); if (response.status === 200) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("Next server did not become ready");
}
async function post(payload) {
  const body = JSON.stringify(payload);
  return fetch(`${baseUrl}/api/webhooks/whatsapp`, { method: "POST", headers: { "content-type": "application/json", "x-hub-signature-256": signature(body) }, body });
}
function assert(condition, message) { if (!condition) throw new Error(message); }

const payload1 = {
  object: "whatsapp_business_account",
  entry: [{ id: "waba-v17-2", changes: [{ field: "messages", value: { messaging_product: "whatsapp", contacts: [{ profile: { name: "V17.2 Test Customer" }, wa_id: phone }], messages: [{ from: phone, id: external1, timestamp: String(Math.floor(Date.now() / 1000)), type: "text", text: { body: "Halo ReadyScore V17.2" } }] } }] }],
};
const payload2 = {
  object: "whatsapp_business_account",
  entry: [{ id: "waba-v17-2", changes: [{ field: "messages", value: { messaging_product: "whatsapp", contacts: [{ profile: { name: "V17.2 Test Customer" }, wa_id: phone }], messages: [{ from: phone, id: external2, timestamp: String(Math.floor(Date.now() / 1000) + 1), type: "text", text: { body: "Pesan kedua" } }] } }] }],
};

try {
  child = spawn("pnpm", ["exec", "next", "start", "--port", String(port)], { cwd: process.cwd(), env: { ...process.env, PORT: String(port), WHATSAPP_VERIFY_TOKEN: verifyToken, WHATSAPP_APP_SECRET: appSecret }, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.on("data", () => {}); child.stderr.on("data", () => {});
  await waitForServer();

  const first = await post(payload1);
  assert(first.status === 200, `first webhook status=${first.status}`);
  const firstBody = await first.json();
  assert(firstBody.persistedMessages === 1 && firstBody.duplicateMessages === 0, "first message was not persisted exactly once");

  const duplicate = await post(payload1);
  assert(duplicate.status === 200, `duplicate webhook status=${duplicate.status}`);
  const duplicateBody = await duplicate.json();
  assert(duplicateBody.persistedMessages === 0 && duplicateBody.duplicateMessages === 1, "duplicate webhook was not recognized");

  const second = await post(payload2);
  assert(second.status === 200, `second webhook status=${second.status}`);
  const secondBody = await second.json();
  assert(secondBody.persistedMessages === 1, "second unique message was not persisted");

  const conversation = await prisma.whatsAppConversation.findUnique({ where: { phoneNumber_channel: { phoneNumber: `+${phone}`, channel: "WHATSAPP" } }, include: { messages: { orderBy: { createdAt: "asc" } } } });
  assert(conversation, "conversation was not created");
  conversationId = conversation.id;
  assert(conversation.messages.length === 2, `expected 2 messages, got ${conversation.messages.length}`);
  assert(conversation.unreadCount === 2, `expected unreadCount=2, got ${conversation.unreadCount}`);
  assert(conversation.messages.every((message) => message.direction === "INBOUND" && message.status === "RECEIVED"), "message direction/status incorrect");

  const statusPayload = { object: "whatsapp_business_account", entry: [{ id: "waba-v17-2", changes: [{ field: "messages", value: { messaging_product: "whatsapp", statuses: [{ id: external1, status: "delivered", timestamp: String(Math.floor(Date.now() / 1000) + 2), recipient_id: phone }] } }] }], };
  const status = await post(statusPayload);
  assert(status.status === 200, `status webhook status=${status.status}`);
  const refreshed = await prisma.whatsAppMessage.findUnique({ where: { externalMessageId: external1 } });
  assert(refreshed?.status === "DELIVERED" && refreshed.deliveredAt, "provider status was not persisted");

  console.log("ReadyScore V17.2 Conversation & Message Persistence E2E: PASS");
  console.log("duplicate webhook: PASS");
  console.log("conversation reuse: PASS");
  console.log("message persistence: PASS");
  console.log("unread count: PASS");
  console.log("provider status persistence: PASS");
} finally {
  if (conversationId) await prisma.whatsAppConversation.delete({ where: { id: conversationId } }).catch(() => {});
  await prisma.$disconnect();
  if (child && !child.killed) child.kill("SIGTERM");
}
