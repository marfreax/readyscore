const base = process.env.BASE_URL || "http://localhost:3000";
const email = process.env.ADMIN_EMAIL || "radmin@yopmail.com";
const password = process.env.ADMIN_PASSWORD || "12345678";

async function request(pathname, options = {}) {
  return fetch(`${base}${pathname}`, { redirect: "manual", ...options });
}
function json(text) { try { return JSON.parse(text); } catch { return null; } }
function fail(message) { console.error(`FAIL — ${message}`); process.exit(1); }
function pass(message) { console.log(`PASS — ${message}`); }

let response = await request("/admin/audit");
if (![307, 308].includes(response.status)) fail(`unauthenticated audit page expected redirect 307/308, got ${response.status}`);
const location = response.headers.get("location") || "";
if (!location.includes("/login")) fail(`unauthenticated audit page redirect target invalid: ${location}`);
pass("unauthenticated audit page guard");

response = await request("/api/admin/audit");
if (![401, 403].includes(response.status)) fail(`unauthenticated audit list expected 401/403, got ${response.status}`);
pass("unauthenticated audit API guard");

response = await request("/api/admin/audit/__v11_6_10_missing__");
if (![401, 403].includes(response.status)) fail(`unauthenticated audit detail expected 401/403, got ${response.status}`);
pass("unauthenticated audit detail guard");

const login = await request("/api/auth/login", {
  method: "POST",
  headers: { "content-type": "application/json", accept: "application/json" },
  body: JSON.stringify({ email, password }),
});
if (!login.ok) fail(`admin login failed: ${login.status}`);
const setCookie = login.headers.get("set-cookie");
if (!setCookie) fail("admin session cookie missing");
const cookie = setCookie.split(";")[0];
pass("admin authentication");

response = await request("/admin/audit", { headers: { cookie, accept: "text/html" } });
if (!response.ok) fail(`authenticated audit page failed: ${response.status}`);
const html = await response.text();
for (const marker of ["Audit Trail", "Read-only", "Admin Activity Log"]) {
  if (!html.includes(marker)) fail(`authenticated audit page marker missing: ${marker}`);
}
pass("authenticated audit workspace");

response = await request("/api/admin/audit?page=1&pageSize=10", { headers: { cookie, accept: "application/json" } });
if (!response.ok) fail(`authenticated audit list failed: ${response.status}`);
const listBody = await response.text();
const list = json(listBody);
if (!list?.ok || !Array.isArray(list.items) || !list.pagination) fail("audit list payload invalid");
pass("authenticated audit list");

const mutationMethods = ["POST", "PUT", "PATCH", "DELETE"];
for (const method of mutationMethods) {
  response = await request("/api/admin/audit", {
    method,
    headers: { cookie, "content-type": "application/json", accept: "application/json" },
    body: "{}",
  });
  if (response.status !== 405) fail(`audit list ${method} expected 405, got ${response.status}`);
}
pass("audit list mutation methods rejected");

for (const method of mutationMethods) {
  response = await request("/api/admin/audit/__v11_6_10_missing__", {
    method,
    headers: { cookie, "content-type": "application/json", accept: "application/json" },
    body: "{}",
  });
  if (response.status !== 405) fail(`audit detail ${method} expected 405, got ${response.status}`);
}
pass("audit detail mutation methods rejected");

if (list.items.length > 0) {
  const id = list.items[0].id;
  response = await request(`/api/admin/audit/${encodeURIComponent(id)}`, { headers: { cookie, accept: "application/json" } });
  if (!response.ok) fail(`audit detail GET failed: ${response.status}`);
  const detail = json(await response.text());
  if (!detail?.ok || detail.event?.id !== id) fail("audit detail GET payload invalid");
  pass("audit detail GET remains readable");
} else {
  console.log("SKIP — no audit event available for authenticated detail GET");
}

console.log("V11.6.10 RUNTIME E2E: PASS");
