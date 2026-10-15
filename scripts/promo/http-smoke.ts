import assert from "node:assert/strict";
async function main() {
  const base = "http://127.0.0.1:4317";
  const page = await fetch(`${base}/checkout/promo`);
  assert.equal(page.status, 200); assert.ok((await page.text()).includes('id="promo-name"'));
  const initial = await fetch(`${base}/api/promo/checkout`);
  assert.equal(initial.status, 200); assert.match(initial.headers.get("cache-control") ?? "", /no-store/);
  const setCookie = initial.headers.get("set-cookie")!; assert.match(setCookie, /HttpOnly/i); assert.match(setCookie, /Path=\/api\/promo/i);
  const cookie = setCookie.split(";")[0];
  const configuration = await initial.json(); assert.equal(configuration.order, null);
  assert.equal(configuration.gateway.ready, false, "Run against local preview with payment credentials disabled.");
  const valid = { name: "Pembeli Uji", phone: "081234567890", email: "http-smoke@example.invalid", acceptedTerms: true };
  async function post(body: unknown, origin: string | null = base, includeCookie = true) {
    return fetch(`${base}/api/promo/checkout`, { method: "POST", headers: { "Content-Type": "application/json", ...(origin ? { Origin: origin } : {}), ...(includeCookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
  }
  assert.equal((await post(valid, "https://untrusted.example.invalid")).status, 403);
  assert.equal((await post(valid, null)).status, 403);
  assert.equal((await post({ ...valid, acceptedTerms: false })).status, 400);
  assert.equal((await post({ ...valid, phone: "wrong-number" })).status, 400);
  assert.equal((await post(valid, base, false)).status, 409);
  assert.equal((await post({ ...valid, priceIdr: 1 })).status, 503);
  assert.equal((await fetch(`${base}/api/promo/access`, { method: "POST", headers: { Origin: base, Cookie: cookie } })).status, 403);
  assert.equal((await fetch(`${base}/api/commercial/checkout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: "product-advance" }) })).status, 401);
  assert.equal((await fetch(`${base}/api/commercial/payments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: "unknown" }) })).status, 401);
  console.log("PASS: checkout renders; guest cookie HttpOnly/scoped; private/no-store; CSRF, invalid data/terms, missing session, unavailable gateway, unpaid access blocked; existing authenticated checkout APIs still require login.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
