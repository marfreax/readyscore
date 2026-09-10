const base = process.env.BASE_URL || "http://localhost:3000";
const email = process.env.ADMIN_EMAIL || "radmin@yopmail.com";
const password = process.env.ADMIN_PASSWORD || "12345678";

async function request(pathname, options = {}) {
  return fetch(`${base}${pathname}`, { redirect: "manual", ...options });
}
function json(text) { try { return JSON.parse(text); } catch { return null; } }
function fail(message) { console.error(`FAIL — ${message}`); process.exit(1); }
function pass(message) { console.log(`PASS — ${message}`); }
function assertOkPayload(body, label) {
  if (!body?.ok || !Array.isArray(body.questions) || !body.pagination || !body.stats) fail(`${label}: invalid Question Bank payload`);
  if (body.questions.length > body.pagination.pageSize) fail(`${label}: returned more than pageSize`);
}
function normalizeText(value) { return String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase(); }
const QUESTION_STATUS_ORDER = [
  "DRAFT",
  "VALIDATED",
  "MAPPED",
  "REVIEW_REQUIRED",
  "APPROVED",
  "PUBLISHED",
  "ARCHIVED",
  "REJECTED",
];

function compareValues(a, b, direction, field) {
  // QuestionStatus is a PostgreSQL enum, so its database ordering follows
  // the enum declaration rather than JavaScript/locale lexical ordering.
  if (field === "status") {
    const aa = String(a ?? "");
    const bb = String(b ?? "");
    const ai = QUESTION_STATUS_ORDER.indexOf(aa);
    const bi = QUESTION_STATUS_ORDER.indexOf(bb);
    const cmp = ai < bi ? -1 : ai > bi ? 1 : 0;
    return direction === "desc" ? -cmp : cmp;
  }

  // Text/timestamp values exposed by the API are compared lexically here.
  // Avoid locale/numeric collation differences in Node.
  const aa = String(a ?? "");
  const bb = String(b ?? "");
  const cmp = aa < bb ? -1 : aa > bb ? 1 : 0;
  return direction === "desc" ? -cmp : cmp;
}
function assertDeterministicOrder(firstItems, secondItems, label) {
  if (firstItems.length !== secondItems.length) fail(`${label}: repeated result length changed`);
  for (let i = 0; i < firstItems.length; i += 1) {
    if (firstItems[i].questionVersionId !== secondItems[i].questionVersionId) {
      fail(`${label}: deterministic ordering changed at ${i}`);
    }
  }
}
function assertSorted(items, field, direction, label) {
  for (let i = 1; i < items.length; i += 1) {
    const primary = compareValues(items[i - 1][field], items[i][field], direction, field);
    if (primary > 0) fail(`${label}: primary ${field} ordering invalid at ${i}`);
  }
}

function assertGroup(items, expected, label) {
  for (const item of items) {
    if (item.testTypeCode !== expected) fail(`${label}: returned unexpected group ${item.testTypeCode}`);
  }
}
function assertStatus(items, expected, label) {
  for (const item of items) {
    if (item.status !== expected && item.mappingStatus !== expected) fail(`${label}: returned item outside status ${expected}`);
  }
}

console.log("=== READY SCORE V11.7.12 SEARCH / FILTER / SORT RUNTIME E2E ===");
console.log(`Base URL : ${base}`);

let response = await request("/api/admin/question-bank");
if (![401, 403].includes(response.status)) fail(`unauthenticated Question Bank API expected 401/403, got ${response.status}`);
pass("unauthenticated Question Bank API guard");

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

response = await request("/admin/question-bank?group=DISC&status=INVALID_STATUS&sort=INVALID_SORT&direction=INVALID_DIRECTION&page=0&pageSize=999999", {
  headers: { cookie, accept: "text/html" },
});
if (!response.ok) fail(`malformed workspace URL failed: ${response.status}`);
const html = await response.text();
for (const marker of ["Question Bank", "Version-safe content management."]) {
  if (!html.includes(marker)) fail(`workspace marker missing: ${marker}`);
}
pass("Question Bank workspace loads with malformed query normalization");

const groups = ["DISC", "RIASEC", "COGNITIVE", "EQ"];
const groupRows = new Map();
for (const group of groups) {
  response = await request(`/api/admin/question-bank?group=${encodeURIComponent(group)}&page=1&pageSize=10&sort=questionCode&direction=asc`, { headers: { cookie, accept: "application/json" } });
  if (!response.ok) fail(`${group} initial GET failed: ${response.status}`);
  const body = json(await response.text());
  assertOkPayload(body, `${group} initial`);
  if (body.pagination.page !== 1 || body.pagination.pageSize !== 10) fail(`${group}: pagination metadata invalid`);
  if (body.pagination.totalItems < 1 || body.questions.length < 1) fail(`${group}: no records available for runtime regression`);
  assertGroup(body.questions, group, `${group} group filter`);
  groupRows.set(group, body.questions);
  pass(`${group} server-side group filter`);
}

for (const [group, rows] of groupRows) {
  const sample = rows[0];
  const exact = normalizeText(sample.text).slice(0, 80);
  const partial = exact.split(" ").slice(0, Math.min(4, exact.split(" ").length)).join(" ");
  if (!partial) fail(`${group}: sample text unavailable for search regression`);

  response = await request(`/api/admin/question-bank?group=${encodeURIComponent(group)}&search=${encodeURIComponent(partial)}&page=1&pageSize=10`, { headers: { cookie, accept: "application/json" } });
  if (!response.ok) fail(`${group} partial search failed: ${response.status}`);
  let body = json(await response.text());
  assertOkPayload(body, `${group} partial search`);
  assertGroup(body.questions, group, `${group} partial search group integrity`);
  if (!body.questions.some((q) => normalizeText(q.text).includes(normalizeText(partial)))) fail(`${group}: partial search did not return matching question`);
  pass(`${group} partial/case-insensitive search`);

  const upper = partial.toUpperCase();
  response = await request(`/api/admin/question-bank?group=${encodeURIComponent(group)}&search=${encodeURIComponent(upper)}&page=1&pageSize=10`, { headers: { cookie, accept: "application/json" } });
  if (!response.ok) fail(`${group} case-insensitive search failed: ${response.status}`);
  body = json(await response.text());
  assertOkPayload(body, `${group} case-insensitive search`);
  if (!body.questions.some((q) => normalizeText(q.text).includes(normalizeText(partial)))) fail(`${group}: case-insensitive search did not return matching question`);

  response = await request(`/api/admin/question-bank?group=${encodeURIComponent(group)}&search=${encodeURIComponent(partial)}&status=${encodeURIComponent(sample.status)}&page=1&pageSize=10`, { headers: { cookie, accept: "application/json" } });
  if (!response.ok) fail(`${group} search+status failed: ${response.status}`);
  body = json(await response.text());
  assertOkPayload(body, `${group} search+status`);
  assertGroup(body.questions, group, `${group} search+status group integrity`);
  assertStatus(body.questions, sample.status, `${group} search+status`);
  pass(`${group} search + status composition`);

  response = await request(`/api/admin/question-bank?group=${encodeURIComponent(group)}&search=%20%20&page=1&pageSize=10`, { headers: { cookie, accept: "application/json" } });
  if (!response.ok) fail(`${group} empty-search failed: ${response.status}`);
  body = json(await response.text());
  assertOkPayload(body, `${group} empty-search`);
  if (body.pagination.totalItems < 1) fail(`${group}: whitespace search incorrectly constrained results`);
  pass(`${group} empty/whitespace search`);
}

const sortFields = ["questionCode", "updatedAt", "createdAt", "status"];
for (const group of groups) {
  for (const field of sortFields) {
    for (const direction of ["asc", "desc"]) {
      response = await request(`/api/admin/question-bank?group=${encodeURIComponent(group)}&sort=${field}&direction=${direction}&page=1&pageSize=10`, { headers: { cookie, accept: "application/json" } });
      if (!response.ok) fail(`${group} ${field} ${direction} failed: ${response.status}`);
      const body = json(await response.text());
      assertOkPayload(body, `${group} ${field} ${direction}`);
      assertGroup(body.questions, group, `${group} ${field} ${direction} group integrity`);
      assertSorted(body.questions, field, direction, `${group} ${field} ${direction}`);

      const repeatResponse = await request(`/api/admin/question-bank?group=${encodeURIComponent(group)}&sort=${field}&direction=${direction}&page=1&pageSize=10`, { headers: { cookie, accept: "application/json" } });
      if (!repeatResponse.ok) fail(`${group} ${field} ${direction} repeat failed: ${repeatResponse.status}`);
      const repeatBody = json(await repeatResponse.text());
      assertOkPayload(repeatBody, `${group} ${field} ${direction} repeat`);
      assertDeterministicOrder(body.questions, repeatBody.questions, `${group} ${field} ${direction}`);
      pass(`${group} sort ${field} ${direction}`);
    }
  }
}

for (const group of groups) {
  response = await request(`/api/admin/question-bank?group=${encodeURIComponent(group)}&sort=questionCode&direction=asc&page=1&pageSize=10`, { headers: { cookie, accept: "application/json" } });
  const first = json(await response.text());
  if (!response.ok || !first?.ok) fail(`${group} pagination sort baseline failed`);
  if (first.pagination.totalItems >= 11) {
    response = await request(`/api/admin/question-bank?group=${encodeURIComponent(group)}&sort=questionCode&direction=asc&page=2&pageSize=10`, { headers: { cookie, accept: "application/json" } });
    if (!response.ok) fail(`${group} page 2 failed: ${response.status}`);
    const second = json(await response.text());
    if (!second?.ok || second.questions.length === 0) fail(`${group} page 2 unexpectedly empty`);
    const ids = new Set(first.questions.map((q) => q.questionVersionId));
    if (second.questions.some((q) => ids.has(q.questionVersionId))) fail(`${group} page 1/page 2 duplicate version IDs`);
    pass(`${group} sort + pagination boundary`);
  } else {
    console.log(`SKIP — ${group} sort + pagination boundary (fewer than 11 records)`);
  }
}

// Exercise multiple simultaneous search requests. Each response must remain bound to its own server-side query context.
const raceTerms = [...groupRows.entries()].map(([group, rows]) => ({ group, term: normalizeText(rows[0].text).split(" ").slice(0, 3).join(" ") }));
const concurrent = await Promise.all(raceTerms.map(async ({ group, term }) => {
  const r = await request(`/api/admin/question-bank?group=${encodeURIComponent(group)}&search=${encodeURIComponent(term)}&page=1&pageSize=10`, { headers: { cookie, accept: "application/json" } });
  return { group, status: r.status, body: json(await r.text()) };
}));
for (const result of concurrent) {
  if (result.status !== 200) fail(`concurrent search ${result.group} failed: ${result.status}`);
  assertOkPayload(result.body, `concurrent search ${result.group}`);
  assertGroup(result.body.questions, result.group, `concurrent search ${result.group}`);
}
pass("concurrent search requests remain context-correct");

// URL state must reproduce the same server-rendered workspace context for a representative combined query.
const urlGroup = "DISC";
const urlStatus = groupRows.get(urlGroup)[0].status;
const urlSearch = normalizeText(groupRows.get(urlGroup)[0].text).split(" ").slice(0, 3).join(" ");
const url = `/admin/question-bank?group=${urlGroup}&status=${encodeURIComponent(urlStatus)}&search=${encodeURIComponent(urlSearch)}&sort=updatedAt&direction=desc&page=1&pageSize=10`;
response = await request(url, { headers: { cookie, accept: "text/html" } });
if (!response.ok) fail(`combined URL workspace failed: ${response.status}`);
const combinedHtml = await response.text();
if (!combinedHtml.includes("Question Bank") || !combinedHtml.includes("Version-safe content management.")) fail("combined URL workspace markers missing");
pass("combined search + filter + sort URL workspace");

console.log("V11.7.12 SEARCH / FILTER / SORT RUNTIME E2E: PASS");
