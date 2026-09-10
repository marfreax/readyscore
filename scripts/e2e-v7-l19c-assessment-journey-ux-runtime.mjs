const base = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const suffix = Date.now();
const email = `e2e_l19c_${suffix}@example.test`;
const password = "ReadyScore-L19C-2026!";
const name = "ReadyScore L19C";

function fail(message) { throw new Error(message); }
async function request(path, options = {}, cookie = "") {
  const response = await fetch(`${base}${path}`, {
    redirect: "manual",
    ...options,
    headers: { ...(options.headers || {}), ...(cookie ? { cookie } : {}) },
  });
  const text = await response.text();
  let body = null; try { body = JSON.parse(text); } catch {}
  return { response, text, body };
}
function assertStatus(response, expected, label) {
  if (response.status !== expected) fail(`${label} expected HTTP ${expected}, got ${response.status}`);
}
function assertMarkers(text, markers, label) {
  for (const marker of markers) if (!text.includes(marker)) fail(`${label} missing marker: ${marker}`);
}

const journeys = [
  { type: "riasec", route: "/trial/riasec", count: 60, result: "RIASEC Interest Profile" },
  { type: "disc", route: "/trial/disc", count: 24, result: "DISC Behavioral Profile" },
  { type: "eq", route: "/trial/eq", count: 24, result: "EQ Profile" },
  { type: "cognitive", route: "/trial/cognitive", count: 24, result: "Cognitive Reasoning Profile" },
];

console.log("=== READY SCORE V7 L19C ASSESSMENT JOURNEY UX ACTUAL RUNTIME E2E ===");
console.log(`Base URL : ${base}`);

for (const journey of journeys) {
  const page = await request(journey.route);
  assertStatus(page.response, 200, `${journey.type} Pre-Test`);
  assertMarkers(page.text, ["Pre-Test", "Sebelum mulai", "durasi", "tujuan", "Mulai Assessment"], `${journey.type} Pre-Test`);
}
console.log("Pre-Test routes / four assessments : PASS");

const register = await request("/api/auth/register", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ name, email, password }),
});
assertStatus(register.response, 201, "Registration");
const setCookie = register.response.headers.get("set-cookie");
if (!setCookie) fail("registration session cookie missing");
const cookie = setCookie.split(";")[0];
console.log("Authenticated customer            : PASS");

const attempts = {};
for (const journey of journeys) {
  const start = await request("/api/assessment/start", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type: journey.type }),
  }, cookie);
  if (!start.response.ok || !start.body?.ok) fail(`${journey.type} start failed: HTTP ${start.response.status} ${JSON.stringify(start.body)}`);
  const attemptId = start.body.attemptId;
  const questions = Array.isArray(start.body.questions) ? start.body.questions : [];
  if (!attemptId) fail(`${journey.type} did not return attemptId`);
  if (questions.length !== journey.count) fail(`${journey.type} returned ${questions.length} questions; expected ${journey.count}`);

  for (const question of questions) {
    const answer = await request(`/api/assessment/${encodeURIComponent(attemptId)}/answer`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ questionId: question.id, value: 3 }),
    }, cookie);
    if (!answer.response.ok || !answer.body?.ok) fail(`${journey.type} answer failed: HTTP ${answer.response.status} ${JSON.stringify(answer.body)}`);
  }

  const submit = await request(`/api/assessment/${encodeURIComponent(attemptId)}/submit`, {
    method: "POST",
  }, cookie);
  if (!submit.response.ok || !submit.body?.ok || !submit.body.result) fail(`${journey.type} submit failed: HTTP ${submit.response.status} ${JSON.stringify(submit.body)}`);

  const result = await request(`/result/${encodeURIComponent(attemptId)}`, {}, cookie);
  assertStatus(result.response, 200, `${journey.type} result`);
  assertMarkers(result.text, ["Customer result", journey.result], `${journey.type} result`);
  attempts[journey.type] = attemptId;
  console.log(`${journey.type.toUpperCase()} Pre-Test → Assessment → Result : PASS`);
}

const other = await request("/api/auth/register", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ name: "Other L19C User", email: `e2e_l19c_other_${suffix}@example.test`, password }),
});
assertStatus(other.response, 201, "Second registration");
const otherCookie = other.response.headers.get("set-cookie")?.split(";")[0];
if (!otherCookie) fail("second customer session cookie missing");
const foreign = await request(`/result/${encodeURIComponent(attempts.eq)}`, {}, otherCookie);
if (![404, 307, 308].includes(foreign.response.status)) fail(`cross-account result should be blocked, got HTTP ${foreign.response.status}`);
console.log("Cross-account result isolation    : PASS");

console.log("=== READY SCORE V7 L19C ASSESSMENT JOURNEY UX ACTUAL RUNTIME E2E: PASS ===");
console.log(`E2E User Email : ${email}`);
for (const [type, attemptId] of Object.entries(attempts)) console.log(`${type} Attempt ID : ${attemptId}`);
