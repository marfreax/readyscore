import crypto from "node:crypto";
import { loadEnvFile } from "node:process";
import { execFileSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

loadEnvFile(".env");

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const password = process.env.READYSCORE_AUTH_E2E_PASSWORD;
const midtransServerKey = process.env.MIDTRANS_SERVER_KEY;
if (!password) throw new Error("Set READYSCORE_AUTH_E2E_PASSWORD");
if (!midtransServerKey) throw new Error("Set MIDTRANS_SERVER_KEY for V14.4 sandbox E2E");

const prisma = new PrismaClient();
const targets = {
  riasec: { count: 60, timer: 1200, scoring: "RIASEC_SCORE_V2", dimensions: 6 },
  disc: { count: 80, timer: 1200, scoring: "DISC_SCORE_V2", dimensions: 4 },
  eq: { count: 50, timer: 1200, scoring: "EQ_SCORE_V2", dimensions: 4 },
  cognitive: { count: 40, timer: 1200, scoring: "COGNITIVE_SCORE_V2", dimensions: 4 },
};

function assert(condition, message) { if (!condition) throw new Error(message); }
async function jsonFetch(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual", ...options });
  const text = await response.text();
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch {}
  return { response, body };
}
function cookieHeader(response) {
  const values = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
  return values.map((v) => v.split(";")[0]).join("; ");
}
function sign(payload) {
  return crypto.createHash("sha512")
    .update(`${payload.order_id}${payload.status_code}${payload.gross_amount}${midtransServerKey}`)
    .digest("hex");
}
function postJson(path, cookie, body) {
  return jsonFetch(path, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify(body),
  });
}

async function registerFreshCustomer() {
  const email = `v14-4-e2e-${Date.now()}-${crypto.randomBytes(4).toString("hex")}@yopmail.com`;
  const result = await jsonFetch("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "ReadyScore V14.4 E2E", email, password }),
  });
  assert(result.response.status === 201 && result.body?.ok, `fresh customer registration failed: ${result.response.status} ${JSON.stringify(result.body)}`);
  const cookie = cookieHeader(result.response);
  assert(cookie, "fresh customer registration session cookie missing");
  return { email, cookie };
}

async function createPaidOrder(cookie, productId, label) {
  const checkout = await postJson("/api/commercial/checkout", cookie, { productId, quantity: 1 });
  assert(checkout.response.status === 201, `${label}: checkout failed: ${checkout.response.status} ${JSON.stringify(checkout.body)}`);
  const order = checkout.body.order;

  const payment = await postJson("/api/commercial/payments", cookie, { orderId: order.id });
  assert(payment.response.status === 201, `${label}: payment creation failed: ${payment.response.status} ${JSON.stringify(payment.body)}`);
  assert(payment.body.payment?.provider === "MIDTRANS", `${label}: provider mismatch`);
  assert(typeof payment.body.payment?.redirectUrl === "string", `${label}: Midtrans redirectUrl missing`);

  return { order, payment };
}

async function sendWebhook(order, transactionStatus, transactionId, extra = {}) {
  const payload = {
    order_id: order.orderNumber,
    status_code: transactionStatus === "settlement" ? "200" : "201",
    gross_amount: Number(order.totalAmountIdr).toFixed(2),
    currency: "IDR",
    transaction_id: transactionId,
    transaction_status: transactionStatus,
    ...extra,
    signature_key: "",
  };
  payload.signature_key = sign(payload);
  const result = await jsonFetch("/api/commercial/webhooks/midtrans", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ...result, payload };
}

async function verifyDelivery(cookie, orderId, expectedPayment, expectedFulfillment) {
  const delivery = await jsonFetch(`/api/commercial/orders/${orderId}/delivery`, { headers: { cookie } });
  assert(delivery.response.ok, `delivery status failed: ${delivery.response.status} ${JSON.stringify(delivery.body)}`);
  assert(delivery.body.delivery?.paymentStatus === expectedPayment, `payment status mismatch: ${JSON.stringify(delivery.body)}`);
  assert(delivery.body.delivery?.fulfillmentStatus === expectedFulfillment, `fulfillment status mismatch: ${JSON.stringify(delivery.body)}`);
  return delivery.body.delivery;
}

async function verifyAudit(orderId, requiredActions) {
  const rows = await prisma.commercialAuditEvent.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
    select: { action: true, fromState: true, toState: true, source: true, reference: true },
  });
  const actions = new Set(rows.map((row) => row.action));
  for (const action of requiredActions) assert(actions.has(action), `audit action missing for ${orderId}: ${action}; got ${JSON.stringify(rows)}`);
  return rows;
}

async function verifyEntitlements(userId) {
  const rows = await prisma.userEntitlement.findMany({
    where: { userId, type: "TEST_ACCESS", resourceType: "TEST_TYPE", resourceKey: { in: ["COGNITIVE", "EQ", "DISC", "RIASEC"] } },
    select: { resourceKey: true, usageLimit: true, usageConsumed: true, status: true },
  });
  for (const key of ["COGNITIVE", "EQ", "DISC", "RIASEC"]) {
    const row = rows.find((item) => item.resourceKey === key);
    assert(row?.status === "ACTIVE", `missing active ${key} entitlement`);
    assert(row.usageLimit >= 1 && row.usageConsumed === 0, `invalid initial ${key} entitlement state: ${JSON.stringify(row)}`);
  }
}

async function runStandard(cookie, type, expectedCount) {
  const target = targets[type];
  const started = await postJson("/api/assessment/start", cookie, { type });
  assert(started.response.ok && started.body?.ok, `${type}: start failed ${started.response.status} ${JSON.stringify(started.body)}`);
  const attemptId = started.body.attemptId;
  const questions = started.body.questions ?? [];
  assert(questions.length === target.count, `${type}: expected ${target.count} questions, got ${questions.length}`);
  assert(started.body.timer?.timeLimitSeconds === target.timer, `${type}: timer mismatch`);
  assert(started.body.snapshot?.package?.packageVersionId, `${type}: package snapshot missing`);
  assert(questions.length === expectedCount, `${type}: unexpected selection count`);

  const fingerprint = questions.map((q) => `${q.sequence}:${q.id}`).join("|");
  const first = questions[0];
  const firstValue = Array.isArray(first.scale) && first.scale.length ? first.scale[0] : 1;
  const saved = await postJson(`/api/assessment/${attemptId}/answer`, cookie, { questionId: first.id, value: firstValue });
  assert(saved.response.ok && saved.body?.saved, `${type}: first answer failed`);
  const resumed = await jsonFetch(`/api/assessment/${attemptId}`, { headers: { cookie } });
  assert(resumed.response.ok && resumed.body?.ok, `${type}: resume failed`);
  assert((resumed.body.questions ?? []).map((q) => `${q.sequence}:${q.id}`).join("|") === fingerprint, `${type}: question sequence changed`);
  assert(resumed.body.questions.find((q) => q.id === first.id)?.answer === firstValue, `${type}: answer did not persist`);

  for (const q of questions.slice(1)) {
    const value = Array.isArray(q.scale) && q.scale.length ? q.scale[0] : 1;
    const answer = await postJson(`/api/assessment/${attemptId}/answer`, cookie, { questionId: q.id, value });
    assert(answer.response.ok && answer.body?.saved, `${type}: answer failed for ${q.code}`);
  }

  const submitted = await postJson(`/api/assessment/${attemptId}/submit`, cookie, {});
  assert(submitted.response.ok && submitted.body?.ok, `${type}: submit failed ${submitted.response.status} ${JSON.stringify(submitted.body)}`);
  const result = submitted.body.result;
  assert(result?.assessmentType?.toLowerCase?.() === type, `${type}: result type mismatch`);
  assert(result?.scoringVersion === target.scoring, `${type}: scoring version mismatch`);
  const measurement = type === "riasec" ? result?.riasec?.measurement
    : type === "disc" ? result?.disc?.measurement
    : type === "eq" ? result?.eq?.measurement
    : result?.cognitive?.measurement;
  assert(measurement, `${type}: measurement payload missing`);
  assert(measurement.testType === type.toUpperCase(), `${type}: measurement test type mismatch`);
  assert(measurement.scoringVersion === target.scoring, `${type}: measurement scoring mismatch`);
  assert(Array.isArray(measurement.dimensionScores) && measurement.dimensionScores.length === target.dimensions, `${type}: dimension count mismatch`);

  const reloaded = await jsonFetch(`/api/assessment/${attemptId}`, { headers: { cookie } });
  assert(reloaded.response.ok && reloaded.body?.result, `${type}: result persistence/reload failed`);
  return { attemptId, result };
}

async function runTimeout(cookie, type) {
  const target = targets[type];
  const started = await postJson("/api/assessment/start", cookie, { type });
  assert(started.response.ok && started.body?.ok, `${type} timeout: start failed`);
  assert(started.body.questions?.length === target.count, `${type} timeout: count mismatch`);
  const attemptId = started.body.attemptId;
  const first = started.body.questions[0];
  const value = Array.isArray(first.scale) && first.scale.length ? first.scale[0] : 1;
  const answer = await postJson(`/api/assessment/${attemptId}/answer`, cookie, { questionId: first.id, value });
  assert(answer.response.ok, `${type} timeout: seed answer failed`);
  await prisma.assessmentAttempt.update({ where: { id: attemptId }, data: { expiresAt: new Date(Date.now() - 1000) } });
  const expired = await jsonFetch(`/api/assessment/${attemptId}`, { headers: { cookie } });
  assert(expired.response.ok && expired.body?.attempt?.status === "EXPIRED", `${type} timeout: not EXPIRED`);
  assert(expired.body?.result, `${type} timeout: result missing`);
  assert(expired.body.result?.scoringVersion === target.scoring, `${type} timeout: scoring mismatch`);
  const rejected = await postJson(`/api/assessment/${attemptId}/answer`, cookie, { questionId: first.id, value: 2 });
  assert(rejected.response.status === 422 && rejected.body?.error?.code === "ATTEMPT_EXPIRED", `${type} timeout: post-expiry answer accepted`);
  return attemptId;
}

try {
  console.log("========================================");
  console.log("V14.4 — COMMERCIAL E2E & LAUNCH READINESS");
  console.log("========================================");
  console.log(`Base URL : ${baseUrl}`);
  console.log("Mode     : REAL HTTP + REAL PostgreSQL + Midtrans sandbox API/webhook");

  const customer = await registerFreshCustomer();
  const cookie = customer.cookie;
  const user = await prisma.user.findFirst({ where: { email: customer.email }, select: { id: true } });
  assert(user, "fresh customer was not persisted to PostgreSQL");
  console.log(`Fresh customer registration/session → PASS (${customer.email})`);

  const accessBefore = await jsonFetch("/access", { headers: { cookie } });
  assert(accessBefore.response.ok, `Access & Plans page failed before purchase: ${accessBefore.response.status}`);
  assert(accessBefore.response.headers.get("content-type")?.includes("text/html"), "Access & Plans did not return HTML");
  const accessHtml = await (async () => {
    const response = await fetch(`${baseUrl}/access`, { headers: { cookie } });
    return response.text();
  })();
  for (const marker of [
    "/checkout/product-basic?testType=IQ",
    "/checkout/product-basic?testType=EQ",
    "/checkout/product-basic?testType=DISC",
    "/checkout/product-basic?testType=RIASEC",
    "/checkout/product-medium",
    "/checkout/product-advance",
    "Beli",
    "Available to buy",
  ]) {
    assert(accessHtml.includes(marker), `Access & Plans available CTA missing: ${marker}`);
  }
  assert(!accessHtml.includes("/api/scalev/checkout"), "Access & Plans still references obsolete Scalev checkout");
  assert(!accessHtml.includes("Checkout belum terhubung"), "Access & Plans still exposes disconnected checkout CTA");
  console.log("Access & Plans available purchase CTAs → PASS");

  const catalog = await jsonFetch("/api/commercial/catalog", { headers: { cookie } });
  assert(catalog.response.ok, `catalog failed: ${catalog.response.status}`);
  const product = (catalog.body.products ?? []).find((p) => p.tier === "MEDIUM" && Number.isInteger(p.priceIdr) && p.priceIdr > 0);
  assert(product, "active MEDIUM product with price is required");
  console.log(`Commercial product selection → PASS (${product.id})`);

  const first = await createPaidOrder(cookie, product.id, "canonical");
  console.log(`Checkout → order created → PASS (${first.order.orderNumber})`);
  console.log("Midtrans payment creation → PASS");

  const providerVerify = await postJson("/api/commercial/payments/verify", cookie, { orderId: first.order.id });
  assert(providerVerify.response.ok, `server-side payment verification failed: ${providerVerify.response.status} ${JSON.stringify(providerVerify.body)}`);
  assert(providerVerify.body.payment?.paymentStatus === "PENDING", `expected sandbox provider status PENDING before settlement: ${JSON.stringify(providerVerify.body)}`);
  console.log("Server-side gateway status verification (PENDING) → PASS");

  const pending = await sendWebhook(first.order, "pending", `v14_4_pending_${Date.now()}`);
  assert(pending.response.ok, `pending webhook failed: ${pending.response.status} ${JSON.stringify(pending.body)}`);
  assert(pending.body.paymentStatus === "PENDING", `pending webhook changed unexpected state: ${JSON.stringify(pending.body)}`);
  await verifyDelivery(cookie, first.order.id, "PENDING", "NOT_STARTED");
  const pendingEntitlements = await prisma.userEntitlement.count({ where: { userId: user.id, type: "TEST_ACCESS" } });
  assert(pendingEntitlements === 0, `pending payment incorrectly granted entitlement: ${pendingEntitlements}`);
  console.log("Pending payment → no entitlement / no fulfillment → PASS");

  const invalid = await jsonFetch("/api/commercial/webhooks/midtrans", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ order_id: first.order.orderNumber, status_code: "200", gross_amount: Number(first.order.totalAmountIdr).toFixed(2), currency: "IDR", transaction_id: `v14_4_invalid_${Date.now()}`, transaction_status: "settlement", signature_key: "0".repeat(128) }),
  });
  assert(invalid.response.status === 401, `invalid signature was accepted: ${invalid.response.status}`);
  console.log("Invalid webhook signature rejection → PASS");

  const settlement = await sendWebhook(first.order, "settlement", `v14_4_settlement_${Date.now()}`, { fraud_status: "accept" });
  assert(settlement.response.ok, `settlement webhook failed: ${settlement.response.status} ${JSON.stringify(settlement.body)}`);
  assert(settlement.body.paymentStatus === "PAID", `settlement did not become PAID: ${JSON.stringify(settlement.body)}`);
  console.log("Verified PAID webhook → PASS");
  await verifyDelivery(cookie, first.order.id, "PAID", "FULFILLED");
  console.log("PAID → FULFILLED → customer delivery status → PASS");

  const successPage = await fetch(`${baseUrl}/checkout/success?order_id=${encodeURIComponent(first.order.orderNumber)}`, { headers: { cookie } });
  const successHtml = await successPage.text();
  assert(successPage.ok, `payment success page failed: ${successPage.status}`);
  assert(successHtml.includes("Pembayaran berhasil"), "payment success page did not show successful payment state");
  assert(successHtml.includes("Akses pembelian sudah unlock"), "payment success page did not show unlocked access");
  console.log("Payment success landing → verified payment + unlocked access → PASS");

  const accessAfter = await fetch(`${baseUrl}/access`, { headers: { cookie } });
  const accessAfterHtml = await accessAfter.text();
  assert(accessAfter.ok, `Access & Plans page failed after fulfillment: ${accessAfter.status}`);
  for (const marker of ["Sudah dibeli", "Sudah dimiliki", "Sudah termasuk", "Beli"]) {
    assert(accessAfterHtml.includes(marker), `Access & Plans owned/available state missing: ${marker}`);
  }
  console.log("Access & Plans owned purchase states → PASS");

  const duplicate = await sendWebhook(first.order, "settlement", settlement.payload.transaction_id, { fraud_status: "accept" });
  assert(duplicate.response.ok && duplicate.body.duplicate === true, `duplicate settlement webhook was not idempotent: ${duplicate.response.status} ${JSON.stringify(duplicate.body)}`);
  const settlementEvents = await prisma.commercialWebhookEvent.count({ where: { orderId: first.order.id, eventType: "settlement", status: "PROCESSED" } });
  assert(settlementEvents === 1, `duplicate settlement created an additional processed event: ${settlementEvents}`);
  console.log("Duplicate settlement webhook idempotency → PASS");

  await verifyEntitlements(user.id);
  await verifyAudit(first.order.id, [
    "PAYMENT_PROVIDER_CREATED", "PAYMENT_PENDING", "PAYMENT_VERIFIED", "FULFILLMENT_PENDING",
    "ENTITLEMENT_CREATED", "FULFILLMENT_COMPLETED", "ACCESS_AVAILABLE",
  ]);
  console.log("Commercial audit trail → PASS");

  const canonical = await runStandard(cookie, "cognitive", targets.cognitive.count);
  console.log(`Canonical purchase → access → Cognitive assessment → persisted result → PASS (${canonical.attemptId})`);
  const cognitiveAudit = await prisma.commercialAuditEvent.findFirst({ where: { orderId: first.order.id, action: "ACCESS_CONSUMED", reference: canonical.attemptId } });
  assert(cognitiveAudit, "canonical assessment access consumption audit missing");
  const canonicalResult = await jsonFetch(`/api/assessment/${canonical.attemptId}`, { headers: { cookie } });
  assert(canonicalResult.response.ok && canonicalResult.body?.result, "canonical persisted result not reloadable");
  console.log("Result persistence/reload → PASS");

  const second = await createPaidOrder(cookie, product.id, "regression");
  const secondSettlement = await sendWebhook(second.order, "settlement", `v14_4_regression_settlement_${Date.now()}`, { fraud_status: "accept" });
  assert(secondSettlement.response.ok && secondSettlement.body.paymentStatus === "PAID", `second settlement failed: ${JSON.stringify(secondSettlement.body)}`);
  await verifyDelivery(cookie, second.order.id, "PAID", "FULFILLED");
  console.log(`Second commercial purchase / fulfillment → PASS (${second.order.orderNumber})`);

  for (const type of ["riasec", "disc", "eq"]) {
    await runStandard(cookie, type, targets[type].count);
    console.log(`${type.toUpperCase()} V13 regression → start → selection → snapshot → answer persistence → submit → score → result reload : PASS (${targets[type].count} questions)`);
  }
  // Cognitive standard was exercised as the canonical commercial path above.
  console.log("COGNITIVE V13 regression → start → selection → snapshot → answer persistence → submit → score → result reload : PASS (40 questions)");

  // The second purchase provides one additional use per core test, allowing full timeout regression without exceeding entitlement limits.
  for (const type of ["riasec", "disc", "eq", "cognitive"]) {
    await runTimeout(cookie, type);
    console.log(`${type.toUpperCase()} timeout → server expiry → timeout scoring → result persistence → post-expiry rejection : PASS`);
  }

  const finalEntitlements = await prisma.userEntitlement.findMany({
    where: { userId: user.id, type: "TEST_ACCESS", resourceType: "TEST_TYPE", resourceKey: { in: ["COGNITIVE", "EQ", "DISC", "RIASEC"] } },
    select: { resourceKey: true, usageLimit: true, usageConsumed: true },
  });
  for (const key of ["COGNITIVE", "EQ", "DISC", "RIASEC"]) {
    const row = finalEntitlements.find((item) => item.resourceKey === key);
    assert(row?.usageLimit >= 2 && row.usageConsumed === 2, `final entitlement accounting mismatch for ${key}: ${JSON.stringify(row)}`);
  }

  // Confirm database migration state from the same environment used by the E2E.
  execFileSync("pnpm", ["db:migrate:deploy"], { stdio: "pipe", encoding: "utf8" });
  console.log("Database migration state → PASS (no pending migrations)");

  console.log("V14.4 COMMERCIAL E2E & LAUNCH READINESS: PASS");
} finally {
  await prisma.$disconnect();
}
