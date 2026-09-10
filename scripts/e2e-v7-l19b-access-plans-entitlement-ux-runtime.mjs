const base = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const email = `e2e_l19b_${Date.now()}@example.test`;
const password = "ReadyScore-L19B-2026!";
const name = "ReadyScore L19B";

function fail(message) { throw new Error(message); }
async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, { redirect: "manual", ...options });
  return { response, text: await response.text() };
}
function assertStatus(response, expected, label) {
  if (response.status !== expected) fail(`${label} expected HTTP ${expected}, got ${response.status}`);
}
function assertMarkers(text, markers, label) {
  for (const marker of markers) if (!text.includes(marker)) fail(`${label} missing marker: ${marker}`);
}

console.log("=== READY SCORE V7 L19B ACCESS & PLANS / ENTITLEMENT UX ACTUAL RUNTIME E2E ===");
console.log(`Base URL : ${base}`);

let result = await request("/access");
if (result.response.status !== 307 && result.response.status !== 308) fail(`Unauthenticated /access expected redirect, got ${result.response.status}`);
console.log("Unauthenticated Access guard : PASS");

const registration = await request("/api/auth/register", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ name, email, password }),
});
assertStatus(registration.response, 201, "Registration");
const setCookie = registration.response.headers.get("set-cookie");
if (!setCookie) fail("Registration session cookie missing");
const cookie = setCookie.split(";")[0];
console.log("Registration + session       : PASS");

result = await request("/access", { headers: { cookie } });
assertStatus(result.response, 200, "Authenticated /access");
assertMarkers(result.text, [
  "Access &amp; plans",
  "Current access",
  "Assessment Anda",
  "Cognitive",
  "Emotional Intelligence",
  "DISC",
  "RIASEC",
  "Single Test",
  "All Tests",
  "All Tests + Profiling",
  "Lihat paket",
  "Capability extensions",
  "Assessment ini belum termasuk akses Anda.",
], "Access & Plans");
console.log("Access & Plans customer surface : PASS");

if (!result.text.includes('href="/app"') || !result.text.includes("Workspace navigation")) {
  fail("Access page does not retain customer shell");
}
console.log("Customer shell continuity    : PASS");

const entitlementResponse = await request("/api/commercial/entitlements", { headers: { cookie } });
assertStatus(entitlementResponse.response, 200, "Entitlement API");
const entitlementJson = JSON.parse(entitlementResponse.text);
if (entitlementJson.ok !== true || !Array.isArray(entitlementJson.entitlements)) fail("Entitlement API response invalid");
console.log("Actual entitlement boundary : PASS");

const catalogResponse = await request("/api/commercial/catalog");
assertStatus(catalogResponse.response, 200, "Commercial catalog API");
const catalogJson = JSON.parse(catalogResponse.text);
if (catalogJson.ok !== true || !Array.isArray(catalogJson.products)) fail("Commercial catalog response invalid");
console.log("Canonical commercial catalog : PASS");

console.log("=== READY SCORE V7 L19B ACCESS & PLANS / ENTITLEMENT UX ACTUAL RUNTIME E2E: PASS ===");
console.log(`E2E User Email : ${email}`);
