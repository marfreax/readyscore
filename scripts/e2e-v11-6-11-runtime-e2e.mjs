const base = process.env.BASE_URL || "http://localhost:3000";
const email = process.env.ADMIN_EMAIL || "radmin@yopmail.com";
const password = process.env.ADMIN_PASSWORD || "12345678";

async function request(pathname, options = {}) {
  return fetch(`${base}${pathname}`, { redirect: "manual", ...options });
}
function json(text) { try { return JSON.parse(text); } catch { return null; } }
function fail(message) { console.error(`FAIL — ${message}`); process.exit(1); }
function pass(message) { console.log(`PASS — ${message}`); }

function assertPagination(body, collection, page, pageSize) {
  if (!body?.ok || !Array.isArray(body[collection]) && !Array.isArray(body.items) || !body.pagination) {
    fail(`${collection} pagination payload invalid`);
  }
  if (body.pagination.page !== page || body.pagination.pageSize !== pageSize) {
    fail(`${collection} pagination metadata invalid`);
  }
  const items = body[collection] ?? body.items;
  if (items.length > pageSize) fail(`${collection} exceeded pageSize`);
  if (body.pagination.totalItems < items.length) fail(`${collection} totalItems smaller than returned items`);
  return items;
}

async function checkPagedResource(path, collection, label, cookie, pageMarkers = []) {
  let response = await request(`${path}?page=1&pageSize=10`, {
    headers: { cookie, accept: "application/json" },
  });
  if (!response.ok) fail(`${label} page 1 failed: ${response.status}`);
  const first = json(await response.text());
  const firstItems = assertPagination(first, collection, 1, 10);
  pass(`${label} page 1`);

  if (first.pagination.totalItems >= 11) {
    response = await request(`${path}?page=2&pageSize=10`, {
      headers: { cookie, accept: "application/json" },
    });
    if (!response.ok) fail(`${label} page 2 failed: ${response.status}`);
    const second = json(await response.text());
    const secondItems = assertPagination(second, collection, 2, 10);
    if (secondItems.length === 0) fail(`${label} page 2 unexpectedly empty`);
    const firstIds = new Set(firstItems.map(item => item.id ?? item.questionVersionId));
    if (secondItems.some(item => firstIds.has(item.id ?? item.questionVersionId))) {
      fail(`${label} page 1/page 2 contain duplicate IDs`);
    }
    pass(`${label} page 2`);
  } else {
    console.log(`SKIP — ${label} page 2 (fewer than 11 records)`);
  }

  response = await request(`${path}?page=999999&pageSize=10`, {
    headers: { cookie, accept: "application/json" },
  });
  if (!response.ok) fail(`${label} boundary request failed: ${response.status}`);
  const boundary = json(await response.text());
  const boundaryItems = boundary?.[collection] ?? boundary?.items;
  if (!boundary?.ok || !Array.isArray(boundaryItems) || !boundary.pagination) {
    fail(`${label} boundary payload invalid`);
  }
  if (boundaryItems.length !== 0 || boundary.pagination.hasNextPage) {
    fail(`${label} out-of-range boundary invalid`);
  }
  pass(`${label} out-of-range boundary`);

  if (pageMarkers.length) {
    response = await request(path.replace(/^\/api/, ""), {
      headers: { cookie, accept: "text/html" },
    });
    if (!response.ok) fail(`${label} workspace failed: ${response.status}`);
    const html = await response.text();
    // Next.js escapes HTML text content in the raw response (for example `&` -> `&amp;`).
    // Normalize the small set of entities before checking human-visible workspace markers.
    const normalizedHtml = html
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    for (const marker of pageMarkers) {
      if (!normalizedHtml.includes(marker)) fail(`${label} workspace marker missing: ${marker}`);
    }
    pass(`${label} workspace`);
  }
}

let response = await request("/admin/audit");
if (![307, 308].includes(response.status)) fail(`unauthenticated audit page expected redirect, got ${response.status}`);
if (!(response.headers.get("location") || "").includes("/login")) fail("unauthenticated audit page redirect target invalid");
pass("unauthenticated admin audit guard");

for (const path of ["/api/admin/audit", "/api/admin/audit/__v11_6_11_missing__"]) {
  response = await request(path);
  if (![401, 403].includes(response.status)) fail(`unauthenticated ${path} expected 401/403, got ${response.status}`);
}
pass("unauthenticated audit API guards");

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
const auditHtml = await response.text();
for (const marker of ["Audit Trail", "Read-only", "Admin Activity Log"]) {
  if (!auditHtml.includes(marker)) fail(`audit workspace marker missing: ${marker}`);
}
pass("audit workspace loads");

await checkPagedResource(
  "/api/admin/audit",
  "items",
  "Audit",
  cookie,
);

response = await request("/api/admin/audit?page=1&pageSize=10", { headers: { cookie, accept: "application/json" } });
const auditList = json(await response.text());
if (!auditList?.ok || !Array.isArray(auditList.items)) fail("audit list payload unavailable for detail verification");
if (auditList.items.length > 0) {
  const id = auditList.items[0].id;
  response = await request(`/api/admin/audit/${encodeURIComponent(id)}`, { headers: { cookie, accept: "application/json" } });
  if (!response.ok) fail(`audit detail GET failed: ${response.status}`);
  const detail = json(await response.text());
  if (!detail?.ok || detail.event?.id !== id) fail("audit detail payload invalid");
  for (const field of ["action", "actorUserId", "entityType", "entityId", "createdAt"]) {
    if (!(field in detail.event)) fail(`audit detail missing field: ${field}`);
  }
  if (!("metadata" in detail.event)) fail("audit detail missing metadata");
  pass("audit detail retrieval");
} else {
  console.log("SKIP — audit detail retrieval (no audit events)");
}

response = await request("/api/admin/audit/__v11_6_11_missing__", { headers: { cookie, accept: "application/json" } });
if (response.status !== 404) fail(`audit detail not-found expected 404, got ${response.status}`);
pass("audit detail not-found boundary");

await checkPagedResource(
  "/api/admin/question-bank",
  "questions",
  "Question Bank",
  cookie,
  ["Question Bank", "Version-safe content management.", "DISC"],
);

await checkPagedResource(
  "/api/admin/review",
  "items",
  "Review",
  cookie,
  ["Review & Publishing", "Controlled publishing.", "Lifecycle control"],
);

await checkPagedResource(
  "/api/admin/users",
  "users",
  "Users",
  cookie,
  ["Users & Access", "Users", "Safe administration untuk status akun dan role."],
);

response = await request("/api/admin/audit", {
  method: "POST",
  headers: { cookie, "content-type": "application/json", accept: "application/json" },
  body: "{}",
});
if (response.status !== 405) fail(`audit list POST expected 405, got ${response.status}`);
response = await request("/api/admin/audit/__v11_6_11_missing__", {
  method: "DELETE",
  headers: { cookie, "content-type": "application/json", accept: "application/json" },
  body: "{}",
});
if (response.status !== 405) fail(`audit detail DELETE expected 405, got ${response.status}`);
pass("audit read-only mutation boundary");

console.log("V11.6.11 RUNTIME E2E: PASS");
