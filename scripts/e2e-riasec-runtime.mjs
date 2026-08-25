const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

function fail(message) {
  throw new Error(message);
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "content-type": "application/json", ...(options.headers ?? {}) },
    ...options,
  });
  let body = null;
  try { body = await response.json(); } catch {}
  return { response, body };
}

console.log("=== RIASEC F.10-C.2-E ACTUAL RUNTIME E2E ===");
console.log(`Base URL : ${baseUrl}`);
console.log("Mode     : REAL HTTP + REAL PostgreSQL runtime");
console.log("Mutation : assessment attempt / answers / result only");

const start = await request("/api/assessment/start", {
  method: "POST",
  body: JSON.stringify({ type: "riasec" }),
});

if (!start.response.ok || !start.body?.ok) {
  fail(`Start failed: HTTP ${start.response.status} ${JSON.stringify(start.body)}`);
}

console.log("Start route reachability : PASS");

const attemptId = start.body.attemptId;
const questions = Array.isArray(start.body.questions) ? start.body.questions : [];

if (!attemptId) fail("Start response did not return attemptId.");
if (questions.length !== 60) {
  fail(`RIASEC runtime returned ${questions.length} questions; expected exactly 60.`);
}

const dimensions = Object.fromEntries(["R","I","A","S","E","C"].map(d => [d, 0]));
for (const q of questions) {
  const d = String(q.domain ?? "").trim().toUpperCase();
  if (!(d in dimensions)) fail(`Invalid RIASEC dimension in runtime question ${q.id}: ${d}`);
  dimensions[d]++;
  if (!q.id) fail("Runtime question missing id.");
}

for (const d of Object.keys(dimensions)) {
  if (dimensions[d] !== 10) fail(`${d} runtime count is ${dimensions[d]}; expected 10.`);
}
console.log("Question selection        : PASS");
console.log("R/I/A/S/E/C distribution  : PASS (10/10/10/10/10/10)");

for (const q of questions) {
  const answer = await request(`/api/assessment/${encodeURIComponent(attemptId)}/answer`, {
    method: "POST",
    body: JSON.stringify({ questionId: q.id, value: 3 }),
  });
  if (!answer.response.ok || !answer.body?.ok) {
    fail(`Answer failed for ${q.id}: HTTP ${answer.response.status} ${JSON.stringify(answer.body)}`);
  }
}
console.log("60 answer submissions     : PASS");

const view = await request(`/api/assessment/${encodeURIComponent(attemptId)}`);
if (!view.response.ok || !view.body?.ok) {
  fail(`Attempt reload failed: HTTP ${view.response.status} ${JSON.stringify(view.body)}`);
}

const progress = view.body.progress;
if (!progress || progress.answered !== 60) {
  fail(`Attempt progress mismatch: ${JSON.stringify(progress)}`);
}
console.log("Persistence / reload      : PASS");

const submit = await request(`/api/assessment/${encodeURIComponent(attemptId)}/submit`, {
  method: "POST",
});
if (!submit.response.ok || !submit.body?.ok) {
  fail(`Submit failed: HTTP ${submit.response.status} ${JSON.stringify(submit.body)}`);
}

const result = submit.body.result;
if (!result) fail("Submit response did not contain result.");
console.log("Submit + scoring          : PASS");

const riasec = result.riasec;
const measurement = riasec?.measurement;
if (!riasec || riasec.contractVersion !== "RIASEC_RESULT_V1") {
  fail("Result does not expose the canonical RIASEC_RESULT_V1 payload.");
}

if (!measurement || measurement.testType !== "RIASEC") {
  fail("Result does not expose the canonical RIASEC measurement payload.");
}

const dimensionScores = Array.isArray(measurement.dimensionScores)
  ? measurement.dimensionScores
  : [];
if (dimensionScores.length !== 6) {
  fail(`RIASEC result exposes ${dimensionScores.length} dimension scores; expected exactly 6.`);
}

const resultDimensions = Object.fromEntries(
  dimensionScores.map((item) => [String(item.dimension).toUpperCase(), item]),
);
for (const d of ["R","I","A","S","E","C"]) {
  const item = resultDimensions[d];
  if (!item) fail(`RIASEC result is missing dimension ${d}.`);
  if (typeof item.score !== "number") fail(`RIASEC result dimension ${d} has no numeric score.`);
}

if (measurement.scoringVersion !== "RIASEC_SCORE_V1") {
  fail(`Unexpected RIASEC scoring version: ${measurement.scoringVersion}`);
}

if (typeof measurement.topCode !== "string" || measurement.topCode.length !== 3) {
  fail(`RIASEC result topCode is invalid: ${JSON.stringify(measurement.topCode)}`);
}

console.log("Result payload            : PASS");
console.log("RIASEC measurement        : PASS (6 dimensions + topCode + scoring version)");
console.log("F.10-C.2-F RIASEC RESULT PAYLOAD E2E: PASS");
console.log(`Attempt ID                : ${attemptId}`);
console.log(`Attempt ID                : ${attemptId}`);
