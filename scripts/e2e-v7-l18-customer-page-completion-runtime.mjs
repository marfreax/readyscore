const base = process.env.BASE_URL || "http://localhost:3000";
const email = `e2e_l18_${Date.now()}@example.test`;
const password = "ReadyScore-L18-2026!";
const name = "ReadyScore L18 Customer";

function fail(message) { throw new Error(message); }

async function request(path, options = {}, cookie = "") {
  const response = await fetch(`${base}${path}`, {
    redirect: "manual",
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...(options.headers ?? {}),
    },
    ...options,
  });
  const text = await response.text();
  let body = null;
  try { body = JSON.parse(text); } catch {}
  return { response, text, body };
}

function assertMarkers(text, markers, label) {
  for (const marker of markers) {
    if (!text.includes(marker)) fail(`${label} marker missing: ${marker}`);
  }
}

console.log("=== READY SCORE V7 L18 CUSTOMER PAGE COMPLETION ACTUAL RUNTIME E2E ===");
console.log(`Base URL : ${base}`);

for (const path of ["/app", "/profile", "/reports", "/reassessment/eq", "/result/nonexistent-l18-attempt", "/reports/nonexistent-l18-attempt/parent"]) {
  const x = await request(path);
  if (![307, 308].includes(x.response.status)) fail(`${path} expected unauthenticated redirect, got ${x.response.status}`);
}
console.log("Unauthenticated customer guards : PASS");

const register = await request("/api/auth/register", {
  method: "POST",
  body: JSON.stringify({ name, email, password }),
});
if (register.response.status !== 201) fail(`registration failed: HTTP ${register.response.status} ${register.text}`);
const cookie = register.response.headers.get("set-cookie")?.split(";")[0];
if (!cookie) fail("customer session cookie missing");
console.log("Authenticated customer session : PASS");

const app = await request("/app", {}, cookie);
if (app.response.status !== 200) fail(`/app expected 200, got ${app.response.status}`);
assertMarkers(app.text, ["Your workspace", "Your assessments", "Recent activity", "Access &amp; plans", "IQ / Cognitive", "Emotional Intelligence", "DISC", "RIASEC"], "/app");
console.log("Customer dashboard             : PASS");

const profile = await request("/profile", {}, cookie);
if (profile.response.status !== 200) fail(`/profile expected 200, got ${profile.response.status}`);
assertMarkers(profile.text, ["Cross-Test Profile", "Akses Cross-Test Profile belum tersedia"], "profile");
console.log("Profile customer surface       : PASS");

const reports = await request("/reports", {}, cookie);
if (reports.response.status !== 200) fail(`/reports expected 200, got ${reports.response.status}`);
assertMarkers(reports.text, ["Customer reports", "Report belum tersedia", "Lihat akses"], "reports");
console.log("Reports unavailable state      : PASS");

const reassessment = await request("/reassessment/eq", {}, cookie);
if (reassessment.response.status !== 200) fail(`/reassessment/eq expected 200, got ${reassessment.response.status}`);
assertMarkers(reassessment.text, ["Customer reassessment", "EQ · Retake", "Assessment EQ"], "reassessment");
console.log("Reassessment customer surface  : PASS");

const start = await request("/api/assessment/start", {
  method: "POST",
  body: JSON.stringify({ type: "eq" }),
}, cookie);
if (!start.response.ok || !start.body?.ok) fail(`EQ start failed: HTTP ${start.response.status} ${start.text}`);
const attemptId = start.body.attemptId;
const questions = start.body.questions || [];
if (!attemptId || questions.length !== 24) fail(`EQ expected 24 questions, got ${questions.length}`);

for (const question of questions) {
  const answer = await request(`/api/assessment/${encodeURIComponent(attemptId)}/answer`, {
    method: "POST",
    body: JSON.stringify({ questionId: question.id, value: 3 }),
  }, cookie);
  if (!answer.response.ok || !answer.body?.ok) fail(`EQ answer failed: HTTP ${answer.response.status} ${answer.text}`);
}

const submit = await request(`/api/assessment/${encodeURIComponent(attemptId)}/submit`, {
  method: "POST",
}, cookie);
if (!submit.response.ok || !submit.body?.ok || !submit.body.result) fail(`EQ submit failed: HTTP ${submit.response.status} ${submit.text}`);
console.log("Real customer result snapshot  : PASS");

const result = await request(`/result/${encodeURIComponent(attemptId)}`, {}, cookie);
if (result.response.status !== 200) fail(`owned result expected 200, got ${result.response.status}`);
assertMarkers(result.text, ["Customer result", "EQ Profile", "Result Summary", "Your Profile", "What to Explore", "Next Action"], "owned result");
console.log("Owned result page              : PASS");

const parent = await request(`/reports/${encodeURIComponent(attemptId)}/parent`, {}, cookie);
if (parent.response.status !== 200) fail(`parent report expected 200, got ${parent.response.status}`);
assertMarkers(parent.text, ["Parent View belum tersedia", "Report hanya dapat dibuka"], "parent report");
console.log("Parent report access boundary  : PASS");

const otherRegister = await request("/api/auth/register", {
  method: "POST",
  body: JSON.stringify({ name: "Other L18 Customer", email: `e2e_l18_other_${Date.now()}@example.test`, password }),
});
if (otherRegister.response.status !== 201) fail(`second registration failed: HTTP ${otherRegister.response.status} ${otherRegister.text}`);
const otherCookie = otherRegister.response.headers.get("set-cookie")?.split(";")[0];
if (!otherCookie) fail("second customer session cookie missing");

const foreign = await request(`/result/${encodeURIComponent(attemptId)}`, {}, otherCookie);
if (![404, 307, 308].includes(foreign.response.status)) fail(`foreign result should be blocked, got HTTP ${foreign.response.status}`);
console.log("Cross-account result isolation  : PASS");

console.log("=== READY SCORE V7 L18 CUSTOMER PAGE COMPLETION ACTUAL RUNTIME E2E: PASS ===");
console.log(`E2E User Email                 : ${email}`);
console.log(`EQ Attempt ID                 : ${attemptId}`);
