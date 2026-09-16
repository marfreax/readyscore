import "./lib-e2e-env.mjs";
import { PrismaClient } from "@prisma/client";

const base = (process.env.READYSCORE_BASE_URL ?? process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const testEmail = (process.env.READYSCORE_V168_TEST_EMAIL ?? process.env.READYSCORE_AUTH_E2E_EMAIL ?? "").trim().toLowerCase();
const prisma = new PrismaClient();
let attemptId = null;
let businessLeadId = null;
let orderId = null;
let sessionCookie = null;

function assert(condition, message) { if (!condition) throw new Error(message); }
async function json(response, label) {
  const body = await response.json().catch(() => null);
  assert(body, `${label}: invalid JSON`);
  return body;
}
function cookieFromLogin(response) {
  const values = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
  const line = values.find((value) => value.startsWith("readyscore_session=")) ?? response.headers.get("set-cookie") ?? "";
  const match = line.match(/readyscore_session=([^;]+)/);
  return match ? `readyscore_session=${match[1]}` : null;
}
async function get(path, options = {}) { return fetch(`${base}${path}`, { ...options, headers: { ...(options.headers ?? {}), ...(sessionCookie ? { Cookie: sessionCookie } : {}) } }); }

try {
  const landing = await get("/");
  assert(landing.ok, `landing:${landing.status}`);
  assert(landing.headers.get("x-frame-options") === "DENY", "security header missing: x-frame-options");
  assert(landing.headers.get("x-content-type-options") === "nosniff", "security header missing: x-content-type-options");

  const start = await get("/api/assessment/start", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "free" }) });
  const startBody = await json(start, "free start");
  assert(start.ok && startBody.ok && startBody.questions?.length === 10, "free assessment start failed");
  attemptId = startBody.attemptId;

  for (const question of startBody.questions) {
    const answer = await get(`/api/assessment/${attemptId}/answer`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ questionId: question.id, value: 5 }) });
    assert(answer.ok, `answer failed:${question.id}`);
  }
  const submit = await get(`/api/assessment/${attemptId}/submit`, { method: "POST" });
  assert(submit.ok, `submit:${submit.status}`);
  const result = await get(`/free/result/${attemptId}`);
  assert(result.ok, `result:${result.status}`);

  const unique = Date.now().toString();
  const leadPayload = {
    attemptId,
    name: "V16.8 Certification Test",
    whatsapp: `0812${unique.slice(-8)}`,
    email: testEmail || `v168-${unique}@example.invalid`,
    consent: true,
    source: "v16.8-certification",
  };
  const lead = await get("/api/free/unlock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(leadPayload) });
  const leadBody = await json(lead, "lead unlock");
  assert(lead.ok && leadBody.ok && leadBody.unlocked, `lead:${lead.status}`);
  assert(leadBody.businessLead?.id, "business lead was not returned");
  businessLeadId = leadBody.businessLead.id;

  const row = await prisma.businessLead.findUnique({ where: { id: businessLeadId } });
  assert(row?.source === "FREE_ASSESSMENT", "business lead source mismatch");
  assert(row?.consent === true && row?.consentAt, "business lead consent not persisted");
  assert(row?.assessmentAttemptId === attemptId, "business lead assessment reference mismatch");

  const duplicate = await get("/api/free/unlock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(leadPayload) });
  const duplicateBody = await json(duplicate, "duplicate lead");
  assert(duplicate.ok && duplicateBody.businessLead?.action === "REUSED", "duplicate lead was not reused");
  const leadCount = await prisma.businessLead.count({ where: { whatsapp: row.whatsapp } });
  assert(leadCount === 1, "duplicate business lead detected");

  const pdf = await get(`/api/free/report/pdf?attemptId=${encodeURIComponent(attemptId)}`);
  const pdfBytes = new Uint8Array(await pdf.arrayBuffer());
  assert(pdf.ok && pdf.headers.get("content-type")?.includes("application/pdf"), `pdf:${pdf.status}`);
  assert(pdfBytes.length > 1000 && new TextDecoder().decode(pdfBytes.slice(0, 5)) === "%PDF-", "invalid PDF output");

  const delivery = await get("/api/free/delivery", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ attemptId }) });
  const deliveryBody = await json(delivery, "delivery");
  assert(delivery.ok && deliveryBody.ok, `delivery:${delivery.status}`);
  const statuses = deliveryBody.delivery;
  assert(["SENT", "SKIPPED", "FAILED"].includes(statuses.whatsappStatus), "invalid WhatsApp delivery status");
  assert(["SENT", "SKIPPED", "FAILED"].includes(statuses.emailStatus), "invalid email delivery status");

  const premium = await get(`/free/result/${attemptId}`);
  const premiumHtml = await premium.text();
  assert(premium.ok && premiumHtml.includes("Premium") && premiumHtml.includes("Lanjut ke Premium"), `premium offer:${premium.status}`);
  const catalog = await get("/api/commercial/catalog");
  const catalogBody = await json(catalog, "commercial catalog");
  assert(catalog.ok && catalogBody.ok && Array.isArray(catalogBody.products), "commercial catalog failed");
  const product = catalogBody.products.find((item) => ["MEDIUM", "ADVANCE"].includes(item.tier) && Number.isInteger(item.priceIdr) && item.priceIdr > 0);
  assert(product, "no active paid product with configured price for checkout certification");

  const unauthorizedCheckout = await get("/api/commercial/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId: product.id, quantity: 1 }) });
  const unauthorizedBody = await json(unauthorizedCheckout, "unauthorized checkout");
  assert(unauthorizedCheckout.status === 401 && unauthorizedBody.error?.code === "UNAUTHENTICATED", "checkout authorization boundary failed");

  if (process.env.READYSCORE_E2E_EMAIL && process.env.READYSCORE_E2E_PASSWORD) {
    const login = await get("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: process.env.READYSCORE_E2E_EMAIL, password: process.env.READYSCORE_E2E_PASSWORD }) });
    const loginBody = await json(login, "login");
    assert(login.ok && loginBody.ok, "E2E login failed");
    sessionCookie = cookieFromLogin(login);
    assert(sessionCookie, "session cookie missing after login");

    const offer = await get("/free");
    assert(offer.ok, `free page after login:${offer.status}`);
    const checkout = await get("/api/commercial/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId: product.id, quantity: 1 }) });
    const checkoutBody = await json(checkout, "checkout");
    assert(checkout.ok && checkoutBody.ok && checkoutBody.order?.id, `checkout:${checkout.status}`);
    orderId = checkoutBody.order.id;

    const entitlements = await get("/api/commercial/entitlements");
    const entitlementBody = await json(entitlements, "entitlements");
    assert(entitlements.ok && entitlementBody.ok && Array.isArray(entitlementBody.entitlements), `entitlements:${entitlements.status}`);
  } else {
    console.log("AUTH_CHECKOUT: SKIPPED (authenticated E2E credentials not configured)");
  }

  const events = await prisma.funnelEvent.findMany({ where: { attemptId }, select: { event: true } });
  const eventNames = new Set(events.map((event) => event.event));
  assert(eventNames.has("business_lead_created") || eventNames.has("business_lead_reused"), "business lead funnel event missing");

  console.log("V16.8 FULL FUNNEL RUNTIME E2E: PASS");
  console.log(`attemptId=${attemptId}`);
  console.log(`businessLeadId=${businessLeadId}`);
  console.log(`delivery=PDF:${(await prisma.freeReportDelivery.findUnique({ where: { attemptId }, select: { pdfStatus: true, whatsappStatus: true, emailStatus: true } }))?.pdfStatus}`);
  if (orderId) console.log(`orderId=${orderId}`);
} catch (error) {
  console.error("V16.8 FULL FUNNEL RUNTIME E2E: FAIL");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  if (orderId) {
    await prisma.commercialOrder.delete({ where: { id: orderId } }).catch(() => {});
  }
  if (businessLeadId) {
    await prisma.freeLeadCapture.deleteMany({ where: { businessLeadId } }).catch(() => {});
    await prisma.businessLead.delete({ where: { id: businessLeadId } }).catch(() => {});
  }
  if (attemptId) {
    await prisma.assessmentAttempt.delete({ where: { id: attemptId } }).catch(() => {});
  }
  await prisma.$disconnect();
}
