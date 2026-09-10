import crypto from "node:crypto";
import { loadEnvFile } from "node:process";

// Explicitly load the project root .env so this standalone Node E2E receives
// the same runtime configuration used by the application.
loadEnvFile(".env");

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const email = process.env.READYSCORE_AUTH_E2E_EMAIL;
const password = process.env.READYSCORE_AUTH_E2E_PASSWORD;
if (!email || !password) throw new Error("Set READYSCORE_AUTH_E2E_EMAIL and READYSCORE_AUTH_E2E_PASSWORD");

function assert(condition, message) { if (!condition) throw new Error(message); }
async function jsonFetch(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual", ...options });
  const text = await response.text();
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch {}
  return { response, body };
}
function cookieHeader(response) {
  const values = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : [];
  return values.map((v) => v.split(";")[0]).join("; ");
}
async function login() {
  const result = await jsonFetch("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert(result.response.ok, `login failed: ${result.response.status}`);
  return cookieHeader(result.response);
}
function sign(payload, serverKey) {
  const input = `${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`;
  return crypto.createHash("sha512").update(input).digest("hex");
}

console.log("========================================");
console.log("V14.2 — PAYMENT GATEWAY VALIDATION");
console.log("========================================");
console.log(`Base URL : ${baseUrl}`);
console.log("Mode     : REAL HTTP + REAL PostgreSQL + Midtrans sandbox when configured");

const cookie = await login();
console.log("Real HTTP login/session → PASS");

const catalog = await jsonFetch("/api/commercial/catalog", { headers: { cookie } });
assert(catalog.response.ok, `catalog failed: ${catalog.response.status}`);
const product = (catalog.body.products ?? []).find((p) => Number.isInteger(p.priceIdr) && p.priceIdr > 0);
assert(product, "No active priced commercial product available");
console.log(`Active priced product → PASS (${product.id})`);

const checkout = await jsonFetch("/api/commercial/checkout", {
  method: "POST",
  headers: { "content-type": "application/json", cookie },
  body: JSON.stringify({ productId: product.id, quantity: 1 }),
});
assert(checkout.response.status === 201, `checkout failed: ${checkout.response.status} ${JSON.stringify(checkout.body)}`);
console.log(`Checkout order creation → PASS (${checkout.body.order.orderNumber})`);

const orderId = checkout.body.order.id;
const payment = await jsonFetch("/api/commercial/payments", {
  method: "POST",
  headers: { "content-type": "application/json", cookie },
  body: JSON.stringify({ orderId }),
});

if (payment.response.status === 502 && payment.body?.error?.code === "PAYMENT_PROVIDER_NOT_CONFIGURED") {
  console.log("Provider credentials → DEFERRED (configure MIDTRANS_SERVER_KEY for sandbox E2E)");
  console.log("V14.2 STATIC/DOMAIN VALIDATION: READY");
  process.exit(0);
}
assert(payment.response.status === 201, `payment creation failed: ${payment.response.status} ${JSON.stringify(payment.body)}`);
assert(payment.body.payment?.provider === "MIDTRANS", "payment provider mismatch");
assert(typeof payment.body.payment?.redirectUrl === "string", "Midtrans redirectUrl missing");
console.log("Midtrans payment creation → PASS");

const webhookSecret = process.env.MIDTRANS_SERVER_KEY;
if (webhookSecret) {
  const fakePending = {
    order_id: checkout.body.order.orderNumber,
    status_code: "201",
    gross_amount: String(checkout.body.order.totalAmountIdr.toFixed(2)),
    currency: "IDR",
    transaction_id: `v14_2_test_${Date.now()}`,
    transaction_status: "pending",
    signature_key: "",
  };
  fakePending.signature_key = sign(fakePending, webhookSecret);
  const webhook = await jsonFetch("/api/commercial/webhooks/midtrans", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(fakePending),
  });
  assert(webhook.response.ok, `valid webhook failed: ${webhook.response.status} ${JSON.stringify(webhook.body)}`);
  console.log("Valid signed webhook → PASS");

  const duplicate = await jsonFetch("/api/commercial/webhooks/midtrans", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(fakePending),
  });
  assert(duplicate.response.ok && duplicate.body.duplicate === true, "duplicate webhook was not idempotent");
  console.log("Duplicate webhook idempotency → PASS");

  const invalid = { ...fakePending, signature_key: "0".repeat(128) };
  const invalidResult = await jsonFetch("/api/commercial/webhooks/midtrans", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(invalid),
  });
  assert(invalidResult.response.status === 401, "invalid webhook signature was accepted");
  console.log("Invalid webhook signature rejection → PASS");
}

console.log("V14.2 PAYMENT GATEWAY VALIDATION: PASS");
