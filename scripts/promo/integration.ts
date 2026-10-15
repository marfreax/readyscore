import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { prisma } from "../../lib/db/prisma";
import { COMMERCIAL_ENTITLEMENT_MATRIX } from "../../lib/commercial/types";
import { createPromoCheckout, findPromoOrder, getPromoProduct, promoOrderSummary } from "../../lib/commercial/promo-checkout";
import { newPromoToken, parsePromoCustomer, promoOrderId } from "../../lib/commercial/promo-security";
import { processProviderWebhook } from "../../lib/commercial/v14-2";
import { verifyMidtransNotificationSignature } from "../../lib/commercial/midtrans-security";
import { hashPassword } from "../../lib/auth/store";

async function main() {
  const url = new URL(process.env.DATABASE_URL ?? "");
  assert.equal(url.hostname, "127.0.0.1"); assert.equal(url.port, "55439"); assert.equal(url.username, "promo_test");
  assert.equal(await prisma.commercialOrder.count(), 0, "Use a fresh disposable promo test database.");
  const authHash = () => createHash("sha256").update(readFileSync("data/auth-state.json")).digest("hex");
  const beforeAuth = authHash();
  Object.assign(process.env, { MIDTRANS_SERVER_KEY: "sandbox-test-only-server", MIDTRANS_CLIENT_KEY: "sandbox-test-only-client", MIDTRANS_ENVIRONMENT: "sandbox", MIDTRANS_SNAP_ENDPOINT: "https://gateway.example.invalid/snap/v1/transactions", APP_BASE_URL: "http://localhost:3000", READYSCORE_PUBLIC_URL: "http://localhost:3000", PASSWORD_RESET_EMAIL_PROVIDER: "RESEND", RESEND_API_KEY: "test-only", PASSWORD_RESET_EMAIL_FROM: "test@example.invalid" });
  const outbound: Array<Record<string, any>> = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), "https://gateway.example.invalid/snap/v1/transactions", "No network requests may escape this mock.");
    const body = JSON.parse(String(init?.body)); outbound.push(body);
    return new Response(JSON.stringify({ token: `test-token-${body.transaction_details.order_id}`, redirect_url: `https://gateway.example.invalid/pay/${body.transaction_details.order_id}` }), { status: 201 });
  };
  try {
    await prisma.product.create({ data: { id: "product-advance", tier: "ADVANCE", name: "All Tests + Profiling", description: "Disposable test product", priceIdr: 249000, status: "ACTIVE", entitlements: { create: COMMERCIAL_ENTITLEMENT_MATRIX.ADVANCE.map(e => ({ type: e.type, resourceType: e.resourceType as any, resourceKey: e.resourceKey })) } } });
    const customer = parsePromoCustomer({ name: "Ibu Maya Uji", email: "promo-new@example.invalid", phone: "081234567890" });
    const token = newPromoToken();
    const first = await createPromoCheckout(token, customer);
    assert.equal(first.priceIdr, 249000); assert.equal(first.paymentStatus, "PENDING");
    const order = (await findPromoOrder(token))!;
    assert.equal(await prisma.userEntitlement.count({ where: { userId: order.userId } }), 0);
    assert.equal(await prisma.session.count({ where: { userId: order.userId } }), 0);
    assert.equal(await findPromoOrder(newPromoToken()), null);
    const retry = await createPromoCheckout(token, customer);
    assert.equal(first.orderNumber, retry.orderNumber);
    assert.equal(await prisma.commercialOrder.count(), 1); assert.equal(outbound.length, 1);
    assert.equal(outbound[0].transaction_details.gross_amount, 249000);
    assert.equal(outbound[0].customer_details.phone, "6281234567890");
    assert.equal(outbound[0].callbacks.finish, "http://localhost:3000/checkout/promo");
    assert.ok(!JSON.stringify(outbound).includes(token));
    await assert.rejects(createPromoCheckout(token, { ...customer, email: "other@example.invalid" }), /ORDER_ALREADY_CREATED/);
    const payload = { order_id: order.orderNumber, transaction_id: "test-tx-paid", transaction_status: "settlement", status_code: "200", gross_amount: "249000.00", currency: "IDR" };
    const signature = createHash("sha512").update(`${payload.order_id}${payload.status_code}${payload.gross_amount}${process.env.MIDTRANS_SERVER_KEY}`).digest("hex");
    assert.ok(verifyMidtransNotificationSignature({ ...payload, signature_key: signature }));
    assert.ok(!verifyMidtransNotificationSignature({ ...payload, signature_key: "0".repeat(128) }));
    await assert.rejects(processProviderWebhook({ rawBody: Buffer.from("wrong"), payload: { ...payload, gross_amount: "1.00" } }), /PAYMENT_AMOUNT_MISMATCH/);
    assert.equal((await findPromoOrder(token))!.paymentStatus, "PENDING");
    await processProviderWebhook({ rawBody: Buffer.from(JSON.stringify(payload)), payload });
    const paid = (await findPromoOrder(token))!;
    assert.equal(paid.paymentStatus, "PAID"); assert.equal(paid.fulfillmentStatus, "FULFILLED");
    const granted = await prisma.userEntitlement.findMany({ where: { userId: paid.userId } });
    assert.equal(granted.length, COMMERCIAL_ENTITLEMENT_MATRIX.ADVANCE.length); assert.ok(granted.every(e => e.usageLimit === 1));
    const duplicate = await processProviderWebhook({ rawBody: Buffer.from(JSON.stringify(payload)), payload });
    assert.equal(duplicate.duplicate, true);
    assert.ok((await prisma.userEntitlement.findMany({ where: { userId: paid.userId } })).every(e => e.usageLimit === 1));
    assert.equal(promoOrderSummary(paid).paymentToken, null);
    console.log("PASS: anonymous order, server price, no premature access/login, retry, webhook signature/amount, paid fulfillment, duplicate notification.");

    const existingHash = hashPassword("existing-test-password");
    const existing = await prisma.user.create({ data: { id: "usr_promo_existing_test", name: "Existing Private Name", email: "promo-existing@example.invalid", passwordHash: existingHash, role: "USER", status: "ACTIVE" } });
    const existingToken = newPromoToken();
    const typed = { ...customer, email: existing.email, name: "Typed Buyer Name" };
    const existingOrder = await createPromoCheckout(existingToken, typed);
    const unchanged = (await prisma.user.findUnique({ where: { id: existing.id } }))!;
    assert.equal(unchanged.name, "Existing Private Name"); assert.equal(unchanged.passwordHash, existingHash);
    assert.equal(existingOrder.customer.name, "Typed Buyer Name"); assert.ok(!JSON.stringify(existingOrder).includes("Existing Private Name"));
    assert.equal(await prisma.session.count(), 0); assert.equal(authHash(), beforeAuth);
    console.log("PASS: existing account name/password unchanged, no account data leaked, no auth-store changes or sessions.");

    const pending = (await findPromoOrder(existingToken))!;
    await processProviderWebhook({ rawBody: Buffer.from("expired"), payload: { order_id: pending.orderNumber, transaction_id: "test-tx-expired", transaction_status: "expire", status_code: "407", gross_amount: "249000.00", currency: "IDR" } });
    assert.equal((await findPromoOrder(existingToken))!.paymentStatus, "EXPIRED");
    assert.equal(await prisma.userEntitlement.count({ where: { userId: existing.id } }), 0);
    assert.equal((await createPromoCheckout(existingToken, typed)).paymentStatus, "EXPIRED");
    await prisma.commercialOrder.update({ where: { id: promoOrderId(existingToken) }, data: { commercialConfig: { ...(pending.commercialConfig as object), guestExpiresAt: new Date(0).toISOString() } } });
    await assert.rejects(findPromoOrder(existingToken), /CHECKOUT_EXPIRED/);
    console.log("PASS: expired payment does not grant access; expired guest capability rejected.");

    const parallelToken = newPromoToken();
    const parallelBuyer = { ...customer, email: "promo-parallel@example.invalid" };
    const concurrent = await Promise.all([createPromoCheckout(parallelToken, parallelBuyer), createPromoCheckout(parallelToken, parallelBuyer)]);
    assert.equal(concurrent[0].orderNumber, concurrent[1].orderNumber);
    assert.equal(await prisma.commercialOrder.count({ where: { id: promoOrderId(parallelToken) } }), 1);
    assert.equal(await prisma.commercialPaymentAttempt.count({ where: { orderId: promoOrderId(parallelToken) } }), 1);
    console.log("PASS: concurrent submissions share one order and one payment attempt.");

    const countBefore = await prisma.commercialOrder.count();
    await prisma.product.update({ where: { id: "product-advance" }, data: { priceIdr: 259000 } });
    assert.equal(await getPromoProduct(), null);
    await assert.rejects(createPromoCheckout(newPromoToken(), { ...customer, email: "price@example.invalid" }), /PROMO_PRODUCT_UNAVAILABLE/);
    assert.equal(await prisma.commercialOrder.count(), countBefore);
    await prisma.product.update({ where: { id: "product-advance" }, data: { priceIdr: 249000 } });
    process.env.MIDTRANS_CLIENT_KEY = "";
    await assert.rejects(createPromoCheckout(newPromoToken(), { ...customer, email: "disabled@example.invalid" }), /PROMO_PAYMENT_UNAVAILABLE/);
    assert.equal(await prisma.user.count({ where: { email: "disabled@example.invalid" } }), 0);
    console.log("PASS: catalog price drift and missing gateway config fail before order/account creation.");
  } finally { globalThis.fetch = realFetch; await prisma.$disconnect(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
