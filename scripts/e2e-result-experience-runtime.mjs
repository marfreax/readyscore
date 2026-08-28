const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const suffix = Date.now();
const email = `e2e_result_${suffix}@example.test`;
const password = "ReadyScore-L18-2026!";
const name = "ReadyScore L18 Result";

function fail(message) { throw new Error(message); }

async function request(path, options = {}, cookie = "") {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...(options.headers ?? {}),
    },
    ...options,
  });
  const raw = await response.text();
  let body = null;
  try { body = JSON.parse(raw); } catch {}
  return { response, body, text: raw };
}

async function completeAssessment(type, expectedCount, expectedMarker, cookie) {
  const start = await request("/api/assessment/start", {
    method: "POST",
    body: JSON.stringify({ type }),
  }, cookie);
  if (!start.response.ok || !start.body?.ok) {
    fail(`${type} start failed: HTTP ${start.response.status} ${JSON.stringify(start.body)}`);
  }

  const attemptId = start.body.attemptId;
  const questions = Array.isArray(start.body.questions) ? start.body.questions : [];
  if (!attemptId) fail(`${type} runtime did not return attemptId.`);
  if (questions.length !== expectedCount) {
    fail(`${type} runtime returned ${questions.length} questions; expected ${expectedCount}.`);
  }

  for (const question of questions) {
    const answer = await request(`/api/assessment/${encodeURIComponent(attemptId)}/answer`, {
      method: "POST",
      body: JSON.stringify({ questionId: question.id, value: 3 }),
    }, cookie);
    if (!answer.response.ok || !answer.body?.ok) {
      fail(`${type} answer failed for ${question.id}: HTTP ${answer.response.status} ${JSON.stringify(answer.body)}`);
    }
  }

  const submit = await request(`/api/assessment/${encodeURIComponent(attemptId)}/submit`, {
    method: "POST",
  }, cookie);
  if (!submit.response.ok || !submit.body?.ok || !submit.body.result) {
    fail(`${type} submit failed: HTTP ${submit.response.status} ${JSON.stringify(submit.body)}`);
  }

  const page = await fetch(`${baseUrl}/result/${encodeURIComponent(attemptId)}`, { headers: { cookie } });
  const html = await page.text();
  if (!page.ok) fail(`${type} result page failed: HTTP ${page.status}`);
  for (const marker of [
    "Customer result",
    "Result Summary",
    "What This Means",
    "Your Profile",
    "Strengths",
    "Areas to Watch",
    "What to Explore",
    "Next Action",
    expectedMarker,
  ]) {
    if (!html.includes(marker)) fail(`${type} result page missing marker "${marker}".`);
  }

  return attemptId;
}

console.log("=== READY SCORE V7 L18 CUSTOMER RESULT EXPERIENCE ACTUAL RUNTIME E2E ===");
console.log(`Base URL : ${baseUrl}`);

const unauthenticated = await fetch(`${baseUrl}/result/nonexistent-l18-attempt`, { redirect: "manual" });
if (![307, 308].includes(unauthenticated.status)) fail(`unauthenticated result expected redirect, got ${unauthenticated.status}`);
console.log("Unauthenticated result guard : PASS");

const register = await request("/api/auth/register", {
  method: "POST",
  body: JSON.stringify({ name, email, password }),
});
if (register.response.status !== 201) fail(`registration failed: HTTP ${register.response.status} ${JSON.stringify(register.body)}`);
const setCookie = register.response.headers.get("set-cookie");
if (!setCookie) fail("registration session cookie missing");
const cookie = setCookie.split(";")[0];
console.log("Authenticated customer       : PASS");

const attempts = {};
attempts.riasec = await completeAssessment("riasec", 60, "RIASEC Interest Profile", cookie);
console.log("RIASEC result experience     : PASS");
attempts.disc = await completeAssessment("disc", 24, "DISC Behavioral Profile", cookie);
console.log("DISC result experience       : PASS");
attempts.eq = await completeAssessment("eq", 24, "EQ Profile", cookie);
console.log("EQ result experience         : PASS");
attempts.cognitive = await completeAssessment("cognitive", 24, "Cognitive Reasoning Profile", cookie);
console.log("Cognitive result experience  : PASS");

const secondEmail = `e2e_result_other_${suffix}@example.test`;
const second = await request("/api/auth/register", {
  method: "POST",
  body: JSON.stringify({ name: "Other L18 User", email: secondEmail, password }),
});
if (second.response.status !== 201) fail(`second registration failed: HTTP ${second.response.status}`);
const secondCookie = second.response.headers.get("set-cookie")?.split(";")[0];
if (!secondCookie) fail("second customer session cookie missing");

const foreign = await fetch(`${baseUrl}/result/${encodeURIComponent(attempts.eq)}`, {
  headers: { cookie: secondCookie },
  redirect: "manual",
});
if (foreign.status !== 404 && foreign.status !== 307 && foreign.status !== 308) {
  fail(`foreign result should be blocked, got HTTP ${foreign.status}`);
}
console.log("Cross-account result guard   : PASS");

console.log("=== READY SCORE V7 L18 CUSTOMER RESULT EXPERIENCE ACTUAL RUNTIME E2E: PASS ===");
console.log(`E2E User Email               : ${email}`);
for (const [type, attemptId] of Object.entries(attempts)) console.log(`${type} Attempt ID          : ${attemptId}`);
