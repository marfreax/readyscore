const base = process.env.BASE_URL || "http://localhost:3000";
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (!email || !password) throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");

async function request(pathname, options = {}) {
  const r = await fetch(`${base}${pathname}`, { redirect: "manual", ...options });
  return { r, text: await r.text() };
}
function json(text) { try { return JSON.parse(text); } catch { return null; } }
function fail(message) { throw new Error(message); }

console.log("=== READY SCORE V11.6.8 USERS PAGINATION RUNTIME E2E ===");
console.log(`Base URL : ${base}`);

let x = await request("/api/admin/users");
if (x.r.status !== 401 && x.r.status !== 403) fail(`unauthenticated API expected 401/403, got ${x.r.status}`);
console.log("Unauthenticated API guard     : PASS");

let login = await request("/api/auth/login", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email, password }),
});
if (login.r.status !== 200) fail(`admin login failed ${login.r.status} ${login.text}`);
const setCookie = login.r.headers.get("set-cookie");
if (!setCookie) fail("admin session cookie missing");
const cookie = setCookie.split(";")[0];
console.log("Authenticated admin session   : PASS");

x = await request("/api/admin/users?page=1&pageSize=10", { headers: { cookie } });
if (x.r.status !== 200) fail(`page 1 GET failed ${x.r.status} ${x.text}`);
const first = json(x.text);
if (!first?.ok || !Array.isArray(first.users) || !first.pagination || !first.summary) fail("page 1 payload invalid");
if (first.pagination.page !== 1 || first.pagination.pageSize !== 10) fail("page 1 pagination metadata invalid");
if (first.users.length > 10) fail("page 1 exceeded pageSize");
if (first.pagination.totalItems !== first.summary.total) fail("summary total mismatch");
console.log("Database-backed page 1        : PASS");

if (first.pagination.totalItems >= 11) {
  x = await request("/api/admin/users?page=2&pageSize=10", { headers: { cookie } });
  if (x.r.status !== 200) fail(`page 2 GET failed ${x.r.status} ${x.text}`);
  const second = json(x.text);
  if (!second?.ok || !Array.isArray(second.users) || !second.pagination) fail("page 2 payload invalid");
  if (second.pagination.page !== 2 || second.pagination.pageSize !== 10) fail("page 2 pagination metadata invalid");
  if (second.users.length === 0) fail("page 2 unexpectedly empty despite >10 total users");
  const firstIds = new Set(first.users.map(u => u.id));
  if (second.users.some(u => firstIds.has(u.id))) fail("page 1/page 2 contain duplicate user IDs");
  console.log("Database-backed page 2        : PASS");
} else {
  console.log("Page 2 boundary              : SKIP (fewer than 11 users)");
}

x = await request("/api/admin/users?page=999999&pageSize=10", { headers: { cookie } });
if (x.r.status !== 200) fail(`out-of-range GET failed ${x.r.status} ${x.text}`);
const boundary = json(x.text);
if (!boundary?.ok || !Array.isArray(boundary.users) || !boundary.pagination) fail("out-of-range payload invalid");
if (boundary.users.length !== 0) fail("out-of-range page returned records");
if (boundary.pagination.hasNextPage) fail("out-of-range page incorrectly reports next page");
console.log("Out-of-range page boundary    : PASS");

x = await request("/admin/users", { headers: { cookie } });
if (x.r.status !== 200) fail(`admin Users page HTTP ${x.r.status}`);
for (const marker of ["Users & Access", "Users", "Safe administration untuk status akun dan role."]) {
  if (!x.text.includes(marker)) fail(`page marker missing: ${marker}`);
}
console.log("Users workspace               : PASS");
console.log("=== READY SCORE V11.6.8 USERS PAGINATION RUNTIME E2E: PASS ===");
