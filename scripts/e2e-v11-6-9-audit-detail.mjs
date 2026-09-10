const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "radmin@yopmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "12345678";

const fail = (message) => { console.error(`FAIL — ${message}`); process.exit(1); };
const pass = (message) => console.log(`PASS — ${message}`);

async function request(path, options = {}) {
  return fetch(`${BASE_URL}${path}`, { redirect: "manual", ...options });
}

const unauth = await request("/api/admin/audit/invalid-event-id");
if (![401, 403].includes(unauth.status)) fail(`unauthenticated detail guard expected 401/403, got ${unauth.status}`);
pass("unauthenticated detail guard");

const login = await request("/api/auth/login", {
  method: "POST",
  headers: { "content-type": "application/json", accept: "application/json" },
  body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
});
if (!login.ok) fail(`admin login failed: ${login.status}`);
const setCookie = login.headers.get("set-cookie");
if (!setCookie) fail("login did not return session cookie");
const cookie = setCookie.split(",").map((part) => part.split(";")[0]).join("; ");
pass("admin authentication");

const list = await request("/api/admin/audit?page=1&pageSize=10", { headers: { cookie, accept: "application/json" } });
if (!list.ok) fail(`audit list failed: ${list.status}`);
const listBody = await list.json();
if (!listBody.ok || !Array.isArray(listBody.items) || !listBody.pagination) fail("audit list contract invalid");
pass("audit list retrieval");

if (listBody.items.length === 0) {
  console.log("SKIP — no existing audit event available for detail behavior test");
} else {
  const id = listBody.items[0].id;
  const detail = await request(`/api/admin/audit/${encodeURIComponent(id)}`, { headers: { cookie, accept: "application/json" } });
  if (!detail.ok) fail(`audit detail failed: ${detail.status}`);
  const detailBody = await detail.json();
  if (!detailBody.ok || !detailBody.event || detailBody.event.id !== id) fail("audit detail payload invalid");
  for (const field of ["action", "actorUserId", "entityType", "entityId", "createdAt"]) {
    if (!(field in detailBody.event)) fail(`audit detail missing field: ${field}`);
  }
  if (!("metadata" in detailBody.event)) fail("audit detail missing metadata");
  pass("audit detail retrieval");

  const missing = await request("/api/admin/audit/__v11_6_9_missing__", { headers: { cookie, accept: "application/json" } });
  if (missing.status !== 404) fail(`missing detail expected 404, got ${missing.status}`);
  const missingBody = await missing.json();
  if (missingBody.error?.code !== "AUDIT_EVENT_NOT_FOUND") fail("missing detail error contract");
  pass("audit detail not-found boundary");
}

const page = await request("/admin/audit", { headers: { cookie, accept: "text/html" } });
if (!page.ok) fail(`audit page failed: ${page.status}`);
const html = await page.text();
for (const marker of ["Audit Trail", "Read-only"]) {
  if (!html.includes(marker)) fail(`audit page marker missing: ${marker}`);
}
pass("audit detail workspace page");

console.log("V11.6.9 RUNTIME E2E: PASS");
