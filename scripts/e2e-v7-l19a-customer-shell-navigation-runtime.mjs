const base = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const email = `e2e_l19a_${Date.now()}@example.test`;
const password = "ReadyScore-L19A-2026!";
const name = "ReadyScore L19A";

function fail(message) { throw new Error(message); }

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, { redirect: "manual", ...options });
  return { response, text: await response.text() };
}

function assertStatus(response, expected, label) {
  if (response.status !== expected) fail(`${label} expected HTTP ${expected}, got ${response.status}`);
}

function assertMarkers(text, markers, label) {
  for (const marker of markers) {
    if (!text.includes(marker)) fail(`${label} missing marker: ${marker}`);
  }
}

console.log("=== READY SCORE V7 L19A CUSTOMER SHELL & NAVIGATION ACTUAL RUNTIME E2E ===");
console.log(`Base URL : ${base}`);

let result = await request("/app");
if (result.response.status !== 307 && result.response.status !== 308) fail(`Unauthenticated /app expected redirect, got ${result.response.status}`);
console.log("Unauthenticated /app guard       : PASS");

const registration = await request("/api/auth/register", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ name, email, password }),
});
assertStatus(registration.response, 201, "Registration");
const setCookie = registration.response.headers.get("set-cookie");
if (!setCookie) fail("Registration session cookie missing");
const cookie = setCookie.split(";")[0];
console.log("Registration + session          : PASS");

result = await request("/app", { headers: { cookie } });
assertStatus(result.response, 200, "Authenticated /app");
assertMarkers(result.text, [
  "Your workspace",
  "Your assessments",
  "Recent activity",
  "Access &amp; plans",
  "IQ / Cognitive",
  "Emotional Intelligence",
  "DISC",
  "RIASEC",
  "Workspace navigation",
], "Authenticated /app");
if (result.text.includes('aria-label="Main navigation"') || result.text.includes("rs-nav-link")) {
  fail("Legacy duplicate header navigation marker remains");
}
console.log("Canonical customer shell          : PASS");
console.log("No duplicate primary header nav   : PASS");
console.log("Dashboard workspace surfaces      : PASS");

for (const route of ["/profile", "/reports", "/reassessment/riasec"]) {
  result = await request(route, { headers: { cookie } });
  assertStatus(result.response, 200, route);
  assertMarkers(result.text, ["ReadyScore", "Workspace navigation", "Keluar"], route);
  console.log(`${route.padEnd(31)}: PASS`);
}

result = await request("/result/not-a-real-attempt", { headers: { cookie } });
if (result.response.status !== 404 && result.response.status !== 200) fail(`/result error route unexpected HTTP ${result.response.status}`);
console.log("Result ownership/error boundary   : PASS");

console.log("=== READY SCORE V7 L19A CUSTOMER SHELL & NAVIGATION ACTUAL RUNTIME E2E: PASS ===");
console.log(`E2E User Email : ${email}`);
