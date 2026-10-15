import assert from "node:assert/strict";
import { test } from "node:test";
import { PROMO_TTL_SECONDS, assertPromoOrigin, newPromoToken, parsePromoCustomer, promoOrderId, promoTokenHash, verifyPromoCapability } from "../../lib/commercial/promo-security";

test("normalizes Indonesian WhatsApp formats and customer email", () => {
  for (const phone of ["0812 3456 7890", "+62 812-3456-7890", "81234567890"]) {
    assert.deepEqual(parsePromoCustomer({ name: "  Ibu  Maya  ", email: " MAYA@example.invalid ", phone }), { name: "Ibu Maya", email: "maya@example.invalid", phone: "6281234567890" });
  }
});
test("rejects malformed data without silently repairing arbitrary phone strings", () => {
  const valid = { name: "Maya", email: "maya@example.invalid", phone: "081234567890" };
  for (const bad of [null, [], { ...valid, name: "A" }, { ...valid, email: "x@y" }, { ...valid, phone: "call 081234567890" }, { ...valid, phone: "0812" }, { ...valid, name: "a\u0000b" }]) {
    assert.throws(() => parsePromoCustomer(bad));
  }
});
test("guest capability is order-scoped, expires, and rejects modified/source-confused tokens", () => {
  const token = newPromoToken();
  const now = Date.now();
  const config = { source: "PROMO_GUEST_CHECKOUT", guestTokenHash: promoTokenHash(token), guestExpiresAt: new Date(now + PROMO_TTL_SECONDS * 1000).toISOString() };
  assert.equal(verifyPromoCapability(token, config, now), true);
  assert.equal(verifyPromoCapability(newPromoToken(), config, now), false);
  assert.equal(verifyPromoCapability(token, { ...config, source: "CHECKOUT" }, now), false);
  assert.equal(verifyPromoCapability(token, { ...config, guestExpiresAt: "bad-date" }, now), false);
  assert.equal(verifyPromoCapability(token, { ...config, guestExpiresAt: new Date(now).toISOString() }, now), false);
  assert.equal(verifyPromoCapability("broken", config, now), false);
  assert.equal(verifyPromoCapability(token, { ...config, guestTokenHash: "broken" }, now), false);
  assert.equal(promoOrderId(token), promoOrderId(token));
  assert.notEqual(promoOrderId(token), promoOrderId(newPromoToken()));
  assert.ok(!promoOrderId(token).includes(token));
});
test("cross-origin and missing-origin mutation requests are rejected", () => {
  assert.doesNotThrow(() => assertPromoOrigin(new Request("https://app.readyscore.id/api/promo/checkout", { headers: { origin: "https://app.readyscore.id" } })));
  assert.throws(() => assertPromoOrigin(new Request("https://app.readyscore.id/api/promo/checkout", { headers: { origin: "https://attacker.invalid" } })));
  assert.throws(() => assertPromoOrigin(new Request("https://app.readyscore.id/api/promo/checkout")));
  assert.doesNotThrow(() => assertPromoOrigin(new Request("http://localhost:3000/api/promo/checkout", { headers: { host: "app.readyscore.id", "x-forwarded-proto": "https", origin: "https://app.readyscore.id" } })));
  assert.throws(() => assertPromoOrigin(new Request("http://localhost:3000/api/promo/checkout", { headers: { host: "app.readyscore.id", "x-forwarded-proto": "https", origin: "https://attacker.invalid" } })));
});
