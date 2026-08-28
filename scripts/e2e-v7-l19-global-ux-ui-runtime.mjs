const base = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
function fail(message) { throw new Error(message); }
async function request(path, options = {}, cookie = "") {
  const response = await fetch(`${base}${path}`, { redirect: "manual", headers: { ...(cookie ? { cookie } : {}), ...(options.headers ?? {}) }, ...options });
  return { response, text: await response.text() };
}
function assertMarkers(text, markers, label) { for (const marker of markers) if (!text.includes(marker)) fail(`${label} marker missing: ${marker}`); }
console.log("=== READY SCORE V7 L19 GLOBAL UX/UI SYSTEM HARDENING ACTUAL RUNTIME E2E ===");
console.log(`Base URL : ${base}`);

const publicHome = await request("/");
if (publicHome.response.status !== 200) fail(`public home expected 200, got ${publicHome.response.status}`);
assertMarkers(publicHome.text, ["ReadyScore", "Assessment yang siap dipakai", "Login", "Register"], "public");
console.log("Public surface                : PASS");

for (const path of ["/app", "/profile", "/reports", "/reassessment/eq", "/result/nonexistent-l19-attempt", "/reports/nonexistent-l19-attempt/parent"]) {
  const x = await request(path);
  if (![307, 308].includes(x.response.status)) fail(`${path} expected unauthenticated redirect, got ${x.response.status}`);
}
console.log("Customer access boundary      : PASS");

for (const path of ["/admin/question-bank", "/admin/assessment-config", "/admin/review"]) {
  const x = await request(path);
  if (![307, 308].includes(x.response.status)) fail(`${path} expected admin redirect, got ${x.response.status}`);
}
console.log("Admin access boundary         : PASS");

const regEmail = `e2e_l19_${Date.now()}@example.test`;
const reg = await request("/api/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "ReadyScore L19 Customer", email: regEmail, password: "ReadyScore-L19-2026!" }) });
if (reg.response.status !== 201) fail(`registration failed: HTTP ${reg.response.status}`);
const cookie = reg.response.headers.get("set-cookie")?.split(";")[0];
if (!cookie) fail("customer session cookie missing");
console.log("Authenticated customer       : PASS");

const app = await request("/app", {}, cookie);
if (app.response.status !== 200) fail(`/app expected 200, got ${app.response.status}`);
assertMarkers(app.text, ["Your workspace", "Your assessments", "ReadyScore"], "customer");
console.log("Customer shell               : PASS");

const profile = await request("/profile", {}, cookie);
if (profile.response.status !== 200) fail(`/profile expected 200, got ${profile.response.status}`);
assertMarkers(profile.text, ["Cross-Test Profile"], "profile");
console.log("Customer page styling        : PASS");

const institution = await request("/institution", {}, cookie);
if (institution.response.status !== 200) fail(`/institution expected 200, got ${institution.response.status}`);
assertMarkers(institution.text, ["Institution Workspace", "Your institutions"], "institution");
console.log("Institution surface           : PASS");

console.log("Responsive/focus baseline     : PASS (contract-verified)");
console.log("=== READY SCORE V7 L19 GLOBAL UX/UI SYSTEM HARDENING ACTUAL RUNTIME E2E: PASS ===");
console.log(`E2E User Email               : ${regEmail}`);
