import { PrismaClient } from "@prisma/client";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const email = process.env.READYSCORE_AUTH_E2E_EMAIL?.trim().toLowerCase();
const password = process.env.READYSCORE_AUTH_E2E_PASSWORD;
if (!email || !password) throw new Error("Set READYSCORE_AUTH_E2E_EMAIL and READYSCORE_AUTH_E2E_PASSWORD");

const prisma = new PrismaClient();
let sessionCookie = "";
let createdOrderId = "";
let selectedProductId = "";
let productBefore = null;

function fail(message) { throw new Error(message); }
function assert(condition, message) { if (!condition) fail(message); }

async function req(path, options = {}, cookie = sessionCookie) {
  const headers = { "content-type": "application/json", ...(options.headers ?? {}) };
  if (cookie) headers.cookie = cookie;
  const response = await fetch(baseUrl + path, { ...options, headers, redirect: "manual" });
  let body = null;
  try { body = await response.json(); } catch {}
  return { response, body };
}

function extractSessionCookie(response) {
  const raw = response.headers.get("set-cookie") ?? "";
  const match = raw.match(/readyscore_session=([^;]+)/);
  return match ? `readyscore_session=${match[1]}` : "";
}

async function assertDbSchema() {
  const tables = await prisma.$queryRawUnsafe(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('CommercialOrder', 'CommercialAuditEvent')
    ORDER BY table_name
  `);
  const names = tables.map((row) => row.table_name);
  assert(names.includes("CommercialOrder") && names.includes("CommercialAuditEvent"), "V14.1 tables missing after migration deploy");

  const enums = await prisma.$queryRawUnsafe(`
    SELECT t.typname
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname IN ('CommercialOrderStatus','CommercialPaymentStatus','CommercialFulfillmentStatus')
    GROUP BY t.typname
    ORDER BY t.typname
  `);
  const enumNames = enums.map((row) => row.typname);
  assert(enumNames.length === 3, `V14.1 enum schema incomplete: ${enumNames.join(",")}`);
  console.log("V14.1 PostgreSQL schema → PASS");
}

async function assertUnauthenticatedBoundary() {
  const r = await req("/api/commercial/orders", {}, "");
  assert(r.response.status === 401 && r.body?.error?.code === "UNAUTHENTICATED", `orders unauthenticated boundary failed: ${r.response.status}`);
  console.log("Unauthenticated commercial order boundary → PASS");
}

async function login() {
  const r = await req("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }, "");
  assert(r.response.ok && r.body?.ok, `login failed: HTTP ${r.response.status} ${JSON.stringify(r.body)}`);
  sessionCookie = extractSessionCookie(r.response);
  assert(sessionCookie, "login session cookie missing");
  console.log("Real HTTP login/session → PASS");
}

async function selectProduct() {
  const r = await req("/api/commercial/catalog", {}, sessionCookie);
  assert(r.response.ok && r.body?.ok, `catalog failed: HTTP ${r.response.status}`);
  const product = (r.body.products ?? []).find((p) => Number.isInteger(p.priceIdr) && p.priceIdr > 0);
  assert(product?.id, "No active priced commercial product available for V14.1 checkout validation");
  selectedProductId = product.id;
  productBefore = await prisma.product.findUnique({
    where: { id: selectedProductId },
    select: { id: true, name: true, priceIdr: true, status: true },
  });
  assert(productBefore?.status === "ACTIVE" && Number.isInteger(productBefore.priceIdr) && productBefore.priceIdr > 0, "Selected product DB state invalid");
  console.log(`Active priced product → PASS (${selectedProductId})`);
}

async function invalidCheckout() {
  const r = await req("/api/commercial/checkout", {
    method: "POST",
    body: JSON.stringify({ productId: selectedProductId, quantity: 2 }),
  });
  assert(r.response.status === 400 && r.body?.error?.code === "INVALID_CHECKOUT", `invalid quantity was not rejected: ${r.response.status} ${JSON.stringify(r.body)}`);
  console.log("Checkout quantity validation → PASS");
}

async function createOrder() {
  const r = await req("/api/commercial/checkout", {
    method: "POST",
    body: JSON.stringify({ productId: selectedProductId, quantity: 1 }),
  });
  assert(r.response.status === 201 && r.body?.ok, `checkout creation failed: HTTP ${r.response.status} ${JSON.stringify(r.body)}`);
  const order = r.body.order;
  assert(order?.id && order.orderNumber, "checkout response missing order identity");
  assert(order.status === "CREATED", `unexpected order status: ${order.status}`);
  assert(order.paymentStatus === "PENDING", `unexpected payment status: ${order.paymentStatus}`);
  assert(order.fulfillmentStatus === "NOT_STARTED", `unexpected fulfillment status: ${order.fulfillmentStatus}`);
  assert(order.quantity === 1, "order quantity snapshot mismatch");
  assert(order.unitPriceIdr === productBefore.priceIdr, "unit price snapshot mismatch");
  assert(order.totalAmountIdr === productBefore.priceIdr, "total amount mismatch");
  assert(order.currency === "IDR", "currency mismatch");
  createdOrderId = order.id;
  console.log(`Checkout order creation → PASS (${order.orderNumber})`);
}

async function verifyDbAndApiPersistence() {
  const dbOrder = await prisma.commercialOrder.findUnique({
    where: { id: createdOrderId },
    include: { auditEvents: { orderBy: { createdAt: "asc" } } },
  });
  assert(dbOrder, "commercial order not persisted in PostgreSQL");
  assert(dbOrder.userId, "order user ownership missing");
  assert(dbOrder.productId === selectedProductId, "order product identity mismatch");
  assert(dbOrder.productNameSnapshot === productBefore.name, "product name snapshot mismatch");
  assert(dbOrder.unitPriceIdrSnapshot === productBefore.priceIdr, "DB unit price snapshot mismatch");
  assert(dbOrder.totalAmountIdr === productBefore.priceIdr, "DB total amount mismatch");
  assert(dbOrder.paymentStatus === "PENDING" && dbOrder.fulfillmentStatus === "NOT_STARTED", "DB initial state mismatch");
  assert(dbOrder.provider === null && dbOrder.providerReference === null && dbOrder.paidAt === null, "provider/payment settlement fields should be empty in V14.1");
  assert(dbOrder.auditEvents.length === 2, `expected 2 V14.1 audit events, got ${dbOrder.auditEvents.length}`);
  assert(dbOrder.auditEvents[0]?.action === "ORDER_CREATED", "ORDER_CREATED audit missing");
  assert(dbOrder.auditEvents[1]?.action === "PAYMENT_PENDING", "PAYMENT_PENDING audit missing");

  const list = await req("/api/commercial/orders", {}, sessionCookie);
  assert(list.response.ok && list.body?.ok, "orders list failed");
  assert((list.body.orders ?? []).some((o) => o.id === createdOrderId), "created order missing from customer order list");

  const detail = await req(`/api/commercial/orders/${createdOrderId}`, {}, sessionCookie);
  assert(detail.response.ok && detail.body?.ok, "order detail failed");
  assert(detail.body.order?.id === createdOrderId, "order detail identity mismatch");
  assert(detail.body.order?.paymentStatus === "PENDING", "order detail payment state mismatch");

  console.log("PostgreSQL persistence + audit + customer order APIs → PASS");
}

async function verifySnapshotImmutability() {
  await prisma.product.update({ where: { id: selectedProductId }, data: { name: `${productBefore.name} [V14.1 TEST MUTATION]`, priceIdr: productBefore.priceIdr + 1 } });
  try {
    const order = await prisma.commercialOrder.findUnique({ where: { id: createdOrderId } });
    assert(order?.productNameSnapshot === productBefore.name, "order product name snapshot changed after product mutation");
    assert(order?.unitPriceIdrSnapshot === productBefore.priceIdr, "order price snapshot changed after product mutation");
    assert(order?.totalAmountIdr === productBefore.priceIdr, "order total snapshot changed after product mutation");
    console.log("Checkout product/price snapshot immutability → PASS");
  } finally {
    await prisma.product.update({ where: { id: selectedProductId }, data: { name: productBefore.name, priceIdr: productBefore.priceIdr } });
  }
}

async function cleanup() {
  if (createdOrderId) {
    await prisma.commercialOrder.delete({ where: { id: createdOrderId } });
    const left = await prisma.commercialOrder.findUnique({ where: { id: createdOrderId } });
    assert(!left, "V14.1 validation order cleanup failed");
  }
}

try {
  console.log("========================================");
  console.log("V14.1 — FUNCTIONAL / DATABASE VALIDATION");
  console.log("========================================");
  console.log(`Base URL : ${baseUrl}`);
  console.log("Mode     : REAL HTTP + REAL PostgreSQL");
  await assertDbSchema();
  await assertUnauthenticatedBoundary();
  await login();
  await selectProduct();
  await invalidCheckout();
  await createOrder();
  await verifyDbAndApiPersistence();
  await verifySnapshotImmutability();
  console.log("V14.1 FUNCTIONAL / DATABASE VALIDATION: PASS");
} finally {
  try { await cleanup(); } finally { await prisma.$disconnect(); }
}
