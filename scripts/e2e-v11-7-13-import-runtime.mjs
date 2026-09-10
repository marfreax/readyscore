import fs from "node:fs/promises";
import path from "node:path";

const base = process.env.BASE_URL || "http://localhost:3000";
const email = process.env.ADMIN_EMAIL || "radmin@yopmail.com";
const password = process.env.ADMIN_PASSWORD || "12345678";
const root = process.cwd();

async function request(pathname, options = {}) {
  return fetch(`${base}${pathname}`, { redirect: "manual", ...options });
}
function json(text) { try { return JSON.parse(text); } catch { return null; } }
function fail(message) { console.error(`FAIL — ${message}`); process.exit(1); }
function pass(message) { console.log(`PASS — ${message}`); }
function assert(condition, message) { if (!condition) fail(message); }

const groups = [
  { key: "DISC", code: "DISC", file: "disc-question-bank-sample-100.csv", marker: "Ketika target tim tertinggal" },
  { key: "RIASEC", code: "RIASEC", file: "riasec-question-bank-sample-100.csv", marker: "Fixture RIASEC item 1" },
  { key: "IQ_COGNITIVE", code: "COGNITIVE", file: "iq_cognitive-question-bank-sample-100.csv", marker: "Fixture COGNITIVE item 1" },
  { key: "EQ", code: "EQ", file: "eq-question-bank-sample-100.csv", marker: "Fixture EQ item 1" },
];
const fixtureDir = path.join(root, "fixtures/v11-7-11/four-group");
const runToken = `${Date.now()}_${process.pid}`;

function uniquifyCsv(text, token) {
  const lines = text.split(/\r?\n/);
  const header = lines[0];
  const rows = lines.slice(1).filter((line) => line.trim());
  return [header, ...rows.map((line) => {
    const comma = line.indexOf(",");
    if (comma < 1) return line;
    return `${line.slice(0, comma)}_E2E_${token}${line.slice(comma)}`;
  }), ""].join("\n");
}

async function getGroup(code, cookie, params = "") {
  const groupParam = code ? `&group=${encodeURIComponent(code)}` : "";
  const response = await request(`/api/admin/question-bank?page=1&pageSize=10&sort=questionCode&direction=asc${groupParam}${params}`, {
    headers: { cookie, accept: "application/json" },
  });
  const body = json(await response.text());
  assert(response.ok && body?.ok, `${code}: Question Bank GET failed`);
  return body;
}

async function upload(group, cookie, action, csvText) {
  const form = new FormData();
  form.set("action", action);
  form.set("group", group.key);
  form.set("file", new File([csvText], group.file, { type: "text/csv" }));
  const response = await request("/api/admin/question-bank", {
    method: "POST",
    headers: { cookie, accept: "application/json" },
    body: form,
  });
  const body = json(await response.text());
  return { response, body };
}

console.log("=== READY SCORE V11.7.13 IMPORT RUNTIME E2E ===");
console.log(`Base URL : ${base}`);
console.log(`Run token: ${runToken}`);

let response = await request("/api/admin/question-bank");
assert([401, 403].includes(response.status), `unauthenticated Question Bank API expected 401/403, got ${response.status}`);
pass("unauthenticated Question Bank API guard");

const login = await request("/api/auth/login", {
  method: "POST",
  headers: { "content-type": "application/json", accept: "application/json" },
  body: JSON.stringify({ email, password }),
});
assert(login.ok, `admin login failed: ${login.status}`);
const setCookie = login.headers.get("set-cookie");
assert(setCookie, "admin session cookie missing");
const cookie = setCookie.split(";")[0];
pass("admin authentication");

const beforeGlobal = await getGroup("", cookie);
const publishedBefore = Number(beforeGlobal.stats?.published ?? 0);
const totalBefore = Number(beforeGlobal.stats?.total ?? beforeGlobal.pagination.totalItems ?? 0);

for (const group of groups) {
  const fixturePath = path.join(fixtureDir, group.file);
  const original = await fs.readFile(fixturePath, "utf8");
  const csv = uniquifyCsv(original, runToken);
  const expectedIds = csv.split(/\r?\n/).slice(1).filter(Boolean).map((line) => line.slice(0, line.indexOf(",")));
  assert(expectedIds.length === 100, `${group.key}: fixture must contain exactly 100 rows`);

  const before = await getGroup(group.code, cookie);
  const beforePaginationTotal = Number(before.pagination.totalItems);
  const beforeLogicalTotal = Number(before.stats?.total ?? beforePaginationTotal);
  const beforePublished = Number(before.stats?.published ?? publishedBefore);

  const preview = await upload(group, cookie, "PREVIEW", csv);
  assert(preview.response.ok && preview.body?.ok, `${group.key}: PREVIEW failed (${preview.response.status})`);
  assert(preview.body.count === 100, `${group.key}: PREVIEW count is not 100`);
  assert(preview.body.group === group.key, `${group.key}: PREVIEW group mismatch`);
  const analysis = preview.body.duplicateAnalysis;
  assert(analysis && analysis.totalRows === 100, `${group.key}: duplicate analysis totalRows invalid`);
  assert(analysis.uniqueQuestionIds === 100, `${group.key}: duplicate analysis uniqueQuestionIds invalid`);
  assert(analysis.duplicateExistingCount === 0, `${group.key}: new fixture unexpectedly has existing duplicates`);
  assert(analysis.duplicateInFileCount === 0, `${group.key}: fixture unexpectedly has in-file duplicates`);
  assert(analysis.readyRows === 100 && analysis.importBlocked === false, `${group.key}: PREVIEW did not report import-ready state`);
  const afterPreview = await getGroup(group.code, cookie);
  assert(Number(afterPreview.pagination.totalItems) === beforePaginationTotal, `${group.key}: PREVIEW mutated Question Bank pagination count`);
  assert(Number(afterPreview.stats?.total ?? 0) === beforeLogicalTotal, `${group.key}: PREVIEW mutated logical Question count`);
  pass(`${group.key} preview — 100 rows, no mutation, import ready`);

  const imported = await upload(group, cookie, "IMPORT", csv);
  assert(imported.response.ok && imported.body?.ok, `${group.key}: IMPORT failed (${imported.response.status})`);
  assert(Number(imported.body.imported?.imported ?? imported.body.imported) === 100, `${group.key}: IMPORT did not report 100 imported rows`);
  pass(`${group.key} Import as Draft — 100 rows committed`);

  const after = await getGroup(group.code, cookie);
  assert(Number(after.stats?.total ?? 0) === beforeLogicalTotal + 100, `${group.key}: logical Question count did not increase by 100`);
  assert(Number(after.pagination.totalItems) === beforePaginationTotal + 100, `${group.key}: Question Bank pagination count did not increase by 100`);
  assert(Number(after.stats?.published ?? beforePublished) === beforePublished, `${group.key}: published count changed during Import as Draft`);
  const draft = await getGroup(group.code, cookie, `&status=DRAFT&search=${encodeURIComponent(group.marker)}`);
  assert(draft.pagination.totalItems >= 1, `${group.key}: imported Draft not discoverable by search/status`);
  assert(draft.questions.some((q) => q.id.startsWith(`V11_7_11_`) && q.id.includes(`_E2E_${runToken}`) && q.status === "DRAFT"), `${group.key}: imported row is not DRAFT`);
  for (const q of draft.questions) {
    assert(q.status !== "PUBLISHED", `${group.key}: imported row unexpectedly PUBLISHED`);
  }
  pass(`${group.key} DRAFT discoverability + no auto-publish`);

  const duplicatePreview = await upload(group, cookie, "PREVIEW", csv);
  assert(duplicatePreview.response.ok && duplicatePreview.body?.ok, `${group.key}: duplicate PREVIEW failed`);
  const duplicate = duplicatePreview.body.duplicateAnalysis;
  assert(duplicate.duplicateExistingCount === 100, `${group.key}: duplicate existing count expected 100, got ${duplicate.duplicateExistingCount}`);
  assert(duplicate.duplicateInFileCount === 0, `${group.key}: duplicate re-import incorrectly flagged in-file duplicates`);
  assert(duplicate.importBlocked === true, `${group.key}: duplicate re-import was not blocked`);
  assert(duplicate.readyRows === 0, `${group.key}: duplicate re-import reported ready rows`);
  pass(`${group.key} duplicate re-import PREVIEW — blocked before commit`);

  const duplicateImport = await upload(group, cookie, "IMPORT", csv);
  assert(!duplicateImport.response.ok, `${group.key}: duplicate IMPORT unexpectedly succeeded`);
  assert(String(duplicateImport.body?.error?.code ?? "").startsWith("DUPLICATE_QUESTION_IDS"), `${group.key}: duplicate IMPORT error code is not DUPLICATE_QUESTION_IDS`);
  const afterRejectedImport = await getGroup(group.code, cookie);
  assert(Number(afterRejectedImport.stats?.total ?? 0) === beforeLogicalTotal + 100, `${group.key}: rejected duplicate import mutated logical Question count`);
  assert(Number(afterRejectedImport.pagination.totalItems) === beforePaginationTotal + 100, `${group.key}: rejected duplicate import mutated Question Bank pagination count`);
  assert(Number(afterRejectedImport.stats?.published ?? beforePublished) === beforePublished, `${group.key}: rejected duplicate import changed published count`);
  pass(`${group.key} duplicate IMPORT — server rejection + no mutation`);

  // Verify audit traceability for one imported QuestionVersion from this group.
  const importedRow = draft.questions.find((q) => q.id.includes(`_E2E_${runToken}`));
  assert(importedRow?.questionVersionId, `${group.key}: imported QuestionVersion ID unavailable for audit check`);
  const audit = await request(`/api/admin/audit?entityType=QUESTION_VERSION&entityId=${encodeURIComponent(importedRow.questionVersionId)}&action=IMPORT&page=1&pageSize=10`, {
    headers: { cookie, accept: "application/json" },
  });
  const auditBody = json(await audit.text());
  assert(audit.ok && auditBody?.ok && Array.isArray(auditBody.items), `${group.key}: audit query failed`);
  assert(auditBody.items.some((event) => event.entityId === importedRow.questionVersionId && event.action === "IMPORT" && event.toStatus === "DRAFT"), `${group.key}: import audit trace missing or incorrect`);
  pass(`${group.key} import audit trace — QUESTION_VERSION IMPORT → DRAFT`);
}

const afterGlobal = await getGroup("", cookie);
assert(Number(afterGlobal.stats?.total ?? 0) === totalBefore + 400, "global latest Question total did not increase by 400");
assert(Number(afterGlobal.stats?.published ?? 0) === publishedBefore, "global published count changed across four-group Import as Draft regression");
pass("four-group global boundary — +400 Questions, published count unchanged");

console.log("V11.7.13 IMPORT RUNTIME E2E: PASS");
