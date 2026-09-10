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

console.log("=== READY SCORE V11.6.6 QUESTION BANK PAGINATION RUNTIME E2E ===");
console.log(`Base URL : ${base}`);

let x = await request("/api/admin/question-bank");
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

x = await request("/api/admin/question-bank?group=DISC&page=1&pageSize=10", { headers: { cookie } });
if (x.r.status !== 200) fail(`page 1 GET failed ${x.r.status} ${x.text}`);
const first = json(x.text);
if (!first?.ok || !Array.isArray(first.questions) || !first.pagination) fail("page 1 payload invalid");
if (first.pagination.page !== 1 || first.pagination.pageSize !== 10) fail("page 1 pagination metadata invalid");
if (first.questions.length > 10) fail("page 1 exceeded pageSize");
if (first.pagination.totalItems < first.questions.length) fail("totalItems is smaller than returned items");
console.log("Database-backed page 1        : PASS");

if (first.pagination.totalItems >= 11) {
  x = await request("/api/admin/question-bank?group=DISC&page=2&pageSize=10", { headers: { cookie } });
  if (x.r.status !== 200) fail(`page 2 GET failed ${x.r.status} ${x.text}`);
  const second = json(x.text);
  if (!second?.ok || !Array.isArray(second.questions) || !second.pagination) fail("page 2 payload invalid");
  if (second.pagination.page !== 2 || second.pagination.pageSize !== 10) fail("page 2 pagination metadata invalid");
  if (second.questions.length === 0) fail("page 2 unexpectedly empty despite >10 total items");
  const firstIds = new Set(first.questions.map(q => q.questionVersionId));
  if (second.questions.some(q => firstIds.has(q.questionVersionId))) fail("page 1/page 2 contain duplicate QuestionVersion IDs");
  console.log("Database-backed page 2        : PASS");
} else {
  console.log("Page 2 boundary              : SKIP (fewer than 11 DISC questions)");
}

x = await request("/api/admin/question-bank?group=DISC&page=999999&pageSize=10", { headers: { cookie } });
if (x.r.status !== 200) fail(`out-of-range GET failed ${x.r.status} ${x.text}`);
const boundary = json(x.text);
if (!boundary?.ok || !Array.isArray(boundary.questions) || !boundary.pagination) fail("out-of-range payload invalid");
if (boundary.questions.length !== 0) fail("out-of-range page returned records");
if (boundary.pagination.hasNextPage) fail("out-of-range page incorrectly reports next page");
console.log("Out-of-range page boundary    : PASS");

x = await request("/admin/question-bank", { headers: { cookie } });
if (x.r.status !== 200) fail(`admin Question Bank page HTTP ${x.r.status}`);
for (const marker of ["Question Bank", "Version-safe content management.", "DISC"]) {
  if (!x.text.includes(marker)) fail(`page marker missing: ${marker}`);
}
console.log("Question Bank workspace       : PASS");
console.log("=== READY SCORE V11.6.6 QUESTION BANK PAGINATION RUNTIME E2E: PASS ===");
