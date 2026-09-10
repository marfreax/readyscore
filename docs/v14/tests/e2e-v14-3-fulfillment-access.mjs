import crypto from "node:crypto";
import { loadEnvFile } from "node:process";
loadEnvFile(".env");

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const password = process.env.READYSCORE_AUTH_E2E_PASSWORD;
const midtransServerKey = process.env.MIDTRANS_SERVER_KEY;
if (!password) throw new Error("Set READYSCORE_AUTH_E2E_PASSWORD");
if (!midtransServerKey) throw new Error("Set MIDTRANS_SERVER_KEY for V14.3 fulfillment E2E");

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
async function registerFreshCustomer() {
  const email = `v14-3-e2e-${Date.now()}-${crypto.randomBytes(4).toString("hex")}@yopmail.com`;
  const result = await jsonFetch("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "ReadyScore V14.3 E2E", email, password }),
  });
  assert(result.response.status === 201 && result.body?.ok, `fresh customer registration failed: ${result.response.status} ${JSON.stringify(result.body)}`);
  const cookie = cookieHeader(result.response);
  assert(cookie, "fresh customer registration session cookie missing");
  return { email, cookie };
}

console.log("========================================");
console.log("V14.3 — FULFILLMENT / ENTITLEMENT / ACCESS VALIDATION");
console.log("========================================");
console.log(`Base URL : ${baseUrl}`);
console.log("Mode     : REAL HTTP + REAL PostgreSQL + Midtrans sandbox webhook");

const customer = await registerFreshCustomer();
const cookie = customer.cookie;
console.log(`Fresh customer registration/session → PASS (${customer.email})`);

const catalog = await jsonFetch("/api/commercial/catalog", { headers: { cookie } });
assert(catalog.response.ok, `catalog failed: ${catalog.response.status}`);
const product = (catalog.body.products ?? []).find((p) => p.tier === "MEDIUM" && Number.isInteger(p.priceIdr) && p.priceIdr > 0);
assert(product, "MEDIUM product with active price is required for V14.3 E2E");
console.log(`All Tests product → PASS (${product.id})`);

const checkout = await jsonFetch("/api/commercial/checkout", {
  method: "POST",
  headers: { "content-type": "application/json", cookie },
  body: JSON.stringify({ productId: product.id, quantity: 1 }),
});
assert(checkout.response.status === 201, `checkout failed: ${checkout.response.status} ${JSON.stringify(checkout.body)}`);
const order = checkout.body.order;
console.log(`Checkout order → PASS (${order.orderNumber})`);

const payment = await jsonFetch("/api/commercial/payments", {
  method: "POST",
  headers: { "content-type": "application/json", cookie },
  body: JSON.stringify({ orderId: order.id }),
});
assert(payment.response.status === 201, `payment creation failed: ${payment.response.status} ${JSON.stringify(payment.body)}`);
console.log("Payment creation → PASS");

const settlement = {
  order_id: order.orderNumber,
  status_code: "200",
  gross_amount: Number(order.totalAmountIdr).toFixed(2),
  currency: "IDR",
  transaction_id: `v14_3_settlement_${Date.now()}`,
  transaction_status: "settlement",
  fraud_status: "accept",
  signature_key: "",
};
settlement.signature_key = sign(settlement);
const webhook = await jsonFetch("/api/commercial/webhooks/midtrans", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(settlement),
});
assert(webhook.response.ok, `settlement webhook failed: ${webhook.response.status} ${JSON.stringify(webhook.body)}`);
console.log("Verified PAID webhook → PASS");

const delivery = await jsonFetch(`/api/commercial/orders/${order.id}/delivery`, { headers: { cookie } });
assert(delivery.response.ok, `delivery status failed: ${delivery.response.status} ${JSON.stringify(delivery.body)}`);
assert(delivery.body.delivery?.paymentStatus === "PAID", "order is not PAID after verified webhook");
assert(delivery.body.delivery?.fulfillmentStatus === "FULFILLED", `order is not FULFILLED: ${JSON.stringify(delivery.body)}`);
console.log("PAID → FULFILLED → PASS");

const entitlements = await jsonFetch("/api/commercial/entitlements", { headers: { cookie } });
assert(entitlements.response.ok, `entitlements failed: ${entitlements.response.status}`);
const rows = entitlements.body.entitlements ?? [];
const tests = rows.filter((e) => e.type === "TEST_ACCESS" && e.resourceType === "TEST_TYPE");
for (const key of ["COGNITIVE", "EQ", "DISC", "RIASEC"]) {
  const row = tests.find((e) => e.resourceKey === key && e.sourceOrderId === order.id);
  assert(row, `missing ${key} entitlement from order ${order.orderNumber}`);
  assert(row.usageLimit >= 1 && row.usageConsumed === 0, `${key} entitlement usage state invalid`);
}
console.log("Correct TEST_ACCESS entitlements → PASS (4 core tests)");

const deliveryAgain = await jsonFetch(`/api/commercial/orders/${order.id}/delivery`, { method: "POST", headers: { cookie } });
assert(deliveryAgain.response.ok, `idempotent fulfillment retry failed: ${deliveryAgain.response.status} ${JSON.stringify(deliveryAgain.body)}`);
assert(deliveryAgain.body.fulfillment?.fulfillmentStatus === "FULFILLED", "retry did not remain fulfilled");
const entitlementsAfterRetry = await jsonFetch("/api/commercial/entitlements", { headers: { cookie } });
const cognitiveAfterRetry = (entitlementsAfterRetry.body.entitlements ?? []).find((e) => e.type === "TEST_ACCESS" && e.resourceType === "TEST_TYPE" && e.resourceKey === "COGNITIVE" && e.sourceOrderId === order.id);
assert(cognitiveAfterRetry?.usageLimit === 1, "duplicate fulfillment increased entitlement usage limit");
console.log("Duplicate fulfillment idempotency → PASS");

const start = await jsonFetch("/api/assessment/start", {
  method: "POST",
  headers: { "content-type": "application/json", cookie },
  body: JSON.stringify({ type: "cognitive" }),
});
assert(start.response.ok, `entitled assessment start failed: ${start.response.status} ${JSON.stringify(start.body)}`);
assert(start.body.attemptId, "attemptId missing after access grant");
console.log("ENTITLED → ASSESSMENT ACCESS GRANTED → PASS");

const entitlementsConsumed = await jsonFetch("/api/commercial/entitlements", { headers: { cookie } });
const consumed = (entitlementsConsumed.body.entitlements ?? []).find((e) => e.type === "TEST_ACCESS" && e.resourceType === "TEST_TYPE" && e.resourceKey === "COGNITIVE" && e.sourceOrderId === order.id);
assert(consumed?.usageConsumed === 1, `usage was not atomically consumed: ${JSON.stringify(consumed)}`);
console.log("Atomic access consumption → PASS (1/1)");

const secondStart = await jsonFetch("/api/assessment/start", {
  method: "POST",
  headers: { "content-type": "application/json", cookie },
  body: JSON.stringify({ type: "cognitive" }),
});
assert(secondStart.response.status === 422, `second assessment start should be denied: ${secondStart.response.status} ${JSON.stringify(secondStart.body)}`);
assert(secondStart.body?.error?.code === "TEST_ACCESS_REQUIRED", `unexpected denial code: ${JSON.stringify(secondStart.body)}`);
console.log("Consumed entitlement → second access denied → PASS");

const assessmentType = "eq";
const concurrent = await Promise.all([
  jsonFetch("/api/assessment/start", { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ type: assessmentType }) }),
  jsonFetch("/api/assessment/start", { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ type: assessmentType }) }),
]);
const successful = concurrent.filter((r) => r.response.ok);
const denied = concurrent.filter((r) => r.response.status === 422 && r.body?.error?.code === "TEST_ACCESS_REQUIRED");
assert(successful.length === 1 && denied.length === 1, `concurrent access was not atomic: ${JSON.stringify(concurrent.map((r) => ({ status: r.response.status, body: r.body })))} `);
console.log("Concurrent access consumption → PASS (exactly one attempt)");

console.log("V14.3 FULFILLMENT / ENTITLEMENT / ACCESS VALIDATION: PASS");
