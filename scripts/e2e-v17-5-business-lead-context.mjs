import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const port = 3191;
const base = `http://127.0.0.1:${port}`;
const email = process.env.ADMIN_EMAIL || "radmin@yopmail.com";
const password = process.env.ADMIN_PASSWORD || "12345678";
const prisma = new PrismaClient();
let child;
let autoConversationId;
let explicitConversationId;
let autoLeadId;
let explicitLeadId;

async function request(path, options = {}) { return fetch(`${base}${path}`, { redirect: "manual", ...options }); }
function assert(ok, message) { if (!ok) throw new Error(message); }
async function waitForServer() {
  for (let i = 0; i < 50; i += 1) {
    try { const r = await request("/api/admin/whatsapp/conversations"); if ([401, 403].includes(r.status)) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("Next server did not become ready");
}

try {
  const suffix = Date.now().toString().slice(-8);
  const autoPhone = `+62812${suffix}`;
  const explicitPhone = `+62813${suffix}`;

  const autoLead = await prisma.businessLead.create({
    data: { name: "V17.5 Auto Match", whatsapp: autoPhone, email: `v175-auto-${suffix}@example.test`, source: "FREE_ASSESSMENT", status: "NEW", consent: true, consentAt: new Date() },
  });
  autoLeadId = autoLead.id;
  const explicitLead = await prisma.businessLead.create({
    data: { name: "V17.5 Explicit Lead", whatsapp: `+62814${suffix}`, email: `v175-explicit-${suffix}@example.test`, source: "FREE_ASSESSMENT", status: "NEW", consent: true, consentAt: new Date() },
  });
  explicitLeadId = explicitLead.id;

  const autoConversation = await prisma.whatsAppConversation.create({ data: { phoneNumber: autoPhone, displayName: "V17.5 Auto Customer", unreadCount: 1, lastMessageAt: new Date(), lastInboundAt: new Date(), messages: { create: { direction: "INBOUND", messageType: "TEXT", status: "RECEIVED", text: "Context auto match" } } } });
  autoConversationId = autoConversation.id;
  const explicitConversation = await prisma.whatsAppConversation.create({ data: { phoneNumber: explicitPhone, displayName: "V17.5 Explicit Customer", unreadCount: 0, lastMessageAt: new Date(), messages: { create: { direction: "INBOUND", messageType: "TEXT", status: "RECEIVED", text: "Context explicit link" } } } });
  explicitConversationId = explicitConversation.id;

  child = spawn("pnpm", ["exec", "next", "start", "--port", String(port)], { cwd: process.cwd(), env: { ...process.env, PORT: String(port), WHATSAPP_E2E_MODE: "1" }, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.on("data", () => {}); child.stderr.on("data", () => {});
  await waitForServer();

  let r = await request("/api/admin/whatsapp/conversations");
  assert([401,403].includes(r.status), `unauthenticated API expected 401/403, got ${r.status}`);
  console.log("admin authorization: PASS");

  r = await request("/api/auth/login", { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ email, password }) });
  assert(r.ok, `admin login failed: ${r.status}`);
  const cookie = (r.headers.get("set-cookie") || "").split(";")[0]; assert(cookie, "session cookie missing");

  r = await request(`/api/admin/whatsapp/conversations/${autoConversationId}`, { headers: { cookie, accept: "application/json" } });
  assert(r.ok, "auto-match conversation detail failed");
  let body = await r.json();
  assert(body.conversation?.context?.businessLead?.id === autoLeadId, "exact WhatsApp BusinessLead matching failed");
  assert(body.conversation?.context?.matching?.strategy === "EXACT_WHATSAPP_THEN_EXPLICIT_LINK", "matching strategy missing");
  console.log("BusinessLead exact WhatsApp matching: PASS");

  const linkedConversation = await prisma.whatsAppConversation.findUnique({ where: { id: autoConversationId }, select: { businessLeadId: true } });
  assert(linkedConversation?.businessLeadId === autoLeadId, "auto-match was not persisted");

  r = await request(`/api/admin/whatsapp/conversations/${explicitConversationId}/lead-candidates?search=${encodeURIComponent("V17.5 Explicit Lead")}`, { headers: { cookie, accept: "application/json" } });
  assert(r.ok, "lead candidate search failed");
  body = await r.json();
  assert(body.ok && body.items.some((x) => x.id === explicitLeadId), "expected BusinessLead candidate missing");
  console.log("BusinessLead candidate search: PASS");

  const beforeAudit = await prisma.adminContentAuditEvent.count({ where: { entityType: "WHATSAPP_CONVERSATION", entityId: explicitConversationId, action: "BUSINESS_LEAD_LINKED" } });
  r = await request(`/api/admin/whatsapp/conversations/${explicitConversationId}/link-lead`, { method: "POST", headers: { cookie, "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ businessLeadId: explicitLeadId }) });
  assert(r.ok, `explicit link failed: ${r.status}`);
  body = await r.json();
  assert(body.ok && body.businessLeadId === explicitLeadId, "explicit link response invalid");
  const afterLink = await prisma.whatsAppConversation.findUnique({ where: { id: explicitConversationId }, select: { businessLeadId: true } });
  assert(afterLink?.businessLeadId === explicitLeadId, "explicit BusinessLead link was not persisted");
  const afterAudit = await prisma.adminContentAuditEvent.count({ where: { entityType: "WHATSAPP_CONVERSATION", entityId: explicitConversationId, action: "BUSINESS_LEAD_LINKED" } });
  assert(afterAudit === beforeAudit + 1, "BusinessLead link audit event missing");
  console.log("explicit BusinessLead linking + audit: PASS");

  r = await request(`/api/admin/whatsapp/conversations/${explicitConversationId}`, { headers: { cookie, accept: "application/json" } });
  assert(r.ok, "linked conversation detail failed");
  body = await r.json();
  const context = body.conversation?.context;
  assert(context?.businessLead?.id === explicitLeadId, "linked lead missing from context");
  assert(context?.businessLead?.whatsapp === `+62814${suffix}`, "lead WhatsApp context inaccurate");
  assert(context?.customer?.email === `v175-explicit-${suffix}@example.test`, "customer email context inaccurate");
  assert(context?.assessment === null && context?.freeReport === null, "unexpected assessment/report context was fabricated");
  console.log("context accuracy + no fabricated assessment/report: PASS");

  const leadCount = await prisma.businessLead.count({ where: { id: { in: [autoLeadId, explicitLeadId] } } });
  assert(leadCount === 2, "BusinessLead identity was duplicated or mutated unexpectedly");
  console.log("no duplicate identity: PASS");
  console.log("ReadyScore V17.5 Business Lead & Context E2E: PASS");
} finally {
  if (explicitConversationId) await prisma.whatsAppConversation.delete({ where: { id: explicitConversationId } }).catch(() => {});
  if (autoConversationId) await prisma.whatsAppConversation.delete({ where: { id: autoConversationId } }).catch(() => {});
  if (explicitLeadId) await prisma.businessLead.delete({ where: { id: explicitLeadId } }).catch(() => {});
  if (autoLeadId) await prisma.businessLead.delete({ where: { id: autoLeadId } }).catch(() => {});
  await prisma.$disconnect();
  if (child && !child.killed) child.kill("SIGTERM");
}
