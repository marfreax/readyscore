import fs from "node:fs";
import path from "node:path";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

function fail(message) { throw new Error(message); }

async function request(pathname, options = {}, retries = pathname === "/api/assessment/start" ? 3 : 0) {
  try {
    const response = await fetch(`${baseUrl}${pathname}`, {
      headers: { "content-type": "application/json", ...(options.headers ?? {}) },
      ...options,
    });
    let body = null;
    try { body = await response.json(); } catch {}
    if (response.status === 404 && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return request(pathname, options, retries - 1);
    }
    return { response, body };
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return request(pathname, options, retries - 1);
    }
    throw error;
  }
}

console.log("=== READY SCORE V8.5 DISC INSTRUMENT ACTUAL RUNTIME E2E ===");
console.log(`Base URL : ${baseUrl}`);
console.log("Mode     : REAL HTTP + REAL PostgreSQL runtime");
console.log("Mutation : DISC assessment attempt / answers / result only");

const bank = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "data/question-bank/disc/DISC_V2_SITUATIONAL_FORCED_CHOICE_PRODUCTION_BANK.json"),
    "utf8",
  ),
);
const bankByCode = new Map(bank.map((item) => [item.code, item]));

if (bank.length !== 24) fail(`Source bank has ${bank.length} items; expected 24.`);

const start = await request("/api/assessment/start", {
  method: "POST",
  body: JSON.stringify({ type: "disc" }),
});
if (!start.response.ok || !start.body?.ok) {
  fail(`Start failed: HTTP ${start.response.status} ${JSON.stringify(start.body)}`);
}

const attemptId = start.body.attemptId;
const questions = Array.isArray(start.body.questions) ? start.body.questions : [];
if (!attemptId) fail("Start response did not return attemptId.");
if (questions.length !== 24) fail(`DISC runtime returned ${questions.length} questions; expected exactly 24.`);
console.log("Start + question count       : PASS (24)");

const targetCounts = { TARGET_D: 0, TARGET_I: 0, TARGET_S: 0, TARGET_C: 0 };
const optionPositionKeys = new Set();

for (const q of questions) {
  if (q.domain !== "DISC") fail(`DISC V2 question ${q.id} has domain ${q.domain}; expected DISC.`);
  if (!(q.subdomain in targetCounts)) fail(`Invalid DISC target ${q.subdomain} in ${q.id}.`);
  targetCounts[q.subdomain]++;

  if (q.answerType !== "SINGLE_CHOICE_4") fail(`DISC question ${q.id} answerType mismatch.`);
  if (!Array.isArray(q.options) || q.options.length !== 4) fail(`DISC question ${q.id} must expose four options.`);
  if (new Set(q.options).size !== 4) fail(`DISC question ${q.id} options are not unique.`);
  if ("correctOption" in q) fail(`DISC runtime leaked correctOption for ${q.id}.`);
  if ("scoringKey" in q) fail(`DISC runtime leaked scoringKey for ${q.id}.`);

  const source = bankByCode.get(q.code);
  if (!source) fail(`Runtime question ${q.code} is absent from V8.5 bank.`);
  optionPositionKeys.add(JSON.stringify(source.scoringKey));
}

for (const [target, count] of Object.entries(targetCounts)) {
  if (count !== 6) fail(`${target} runtime target count ${count}; expected 6.`);
}
if (optionPositionKeys.size <= 1) fail("DISC option-position mapping did not vary across runtime items.");

console.log("Blueprint target coverage      : PASS (6/6/6/6)");
console.log("Customer scoring metadata      : PASS (keys hidden)");
console.log("Item-specific position mapping : PASS");

const invalid = await request(`/api/assessment/${encodeURIComponent(attemptId)}/answer`, {
  method: "POST",
  body: JSON.stringify({ questionId: questions[0].id, value: 5 }),
});
if (invalid.response.ok) fail("DISC accepted invalid answer value 5; expected rejection.");
console.log("Answer boundary 1–4            : PASS");

for (const q of questions) {
  const answer = await request(`/api/assessment/${encodeURIComponent(attemptId)}/answer`, {
    method: "POST",
    body: JSON.stringify({ questionId: q.id, value: 1 }),
  });
  if (!answer.response.ok || !answer.body?.ok) {
    fail(`Answer failed for ${q.id}: HTTP ${answer.response.status} ${JSON.stringify(answer.body)}`);
  }
}
console.log("24 answer submissions          : PASS");

const view = await request(`/api/assessment/${encodeURIComponent(attemptId)}`);
if (!view.response.ok || !view.body?.ok) {
  fail(`Reload failed: HTTP ${view.response.status} ${JSON.stringify(view.body)}`);
}
if (view.body.progress?.answered !== 24) {
  fail(`Progress mismatch: ${JSON.stringify(view.body.progress)}`);
}
console.log("Persistence / reload           : PASS");

const submit = await request(`/api/assessment/${encodeURIComponent(attemptId)}/submit`, { method: "POST" });
if (!submit.response.ok || !submit.body?.ok) {
  fail(`Submit failed: HTTP ${submit.response.status} ${JSON.stringify(submit.body)}`);
}

const result = submit.body.result;
if (!result) fail("Submit response missing result.");
if (result.disc?.contractVersion !== "DISC_RESULT_V2") {
  fail(`Unexpected DISC result contract: ${result.disc?.contractVersion}`);
}
const measurement = result.disc?.measurement;
if (!measurement) fail("DISC measurement missing.");
if (measurement.testType !== "DISC") fail(`Unexpected testType: ${measurement.testType}`);
if (measurement.scoringVersion !== "DISC_SCORE_V2") {
  fail(`Unexpected scoring version: ${measurement.scoringVersion}`);
}
if (measurement.profileModel !== "IPSATIVE_FORCED_CHOICE") {
  fail(`Unexpected profile model: ${measurement.profileModel}`);
}
if (measurement.scoreMeaning !== "SHARE_OF_FORCED_CHOICES") {
  fail(`Unexpected score meaning: ${measurement.scoreMeaning}`);
}
if (!Array.isArray(measurement.dimensionScores) || measurement.dimensionScores.length !== 4) {
  fail("Expected four DISC dimension scores.");
}

const dimensionNames = ["D", "I", "S", "C"];
const expectedCounts = Object.fromEntries(dimensionNames.map((d) => [d, 0]));
for (const q of questions) {
  const source = bankByCode.get(q.code);
  const dimensionOrdinal = source.scoringKey[0];
  const dimension = dimensionNames[dimensionOrdinal - 1];
  expectedCounts[dimension]++;
}
for (const dimension of dimensionNames) {
  const actual = measurement.dimensionScores.find((item) => item.dimension === dimension);
  if (!actual) fail(`Missing DISC dimension ${dimension}.`);
  const expectedScore = Math.round((expectedCounts[dimension] / 24) * 100);
  if (actual.selectedCount !== expectedCounts[dimension]) {
    fail(`Selected count mismatch for ${dimension}: expected ${expectedCounts[dimension]}, got ${actual.selectedCount}`);
  }
  if (actual.score !== expectedScore) {
    fail(`DISC score mismatch for ${dimension}: expected ${expectedScore}, got ${actual.score}`);
  }
}
const scoreSum = measurement.dimensionScores.reduce((sum, item) => sum + item.score, 0);
if (scoreSum < 99 || scoreSum > 101) fail(`DISC dimension percentages should sum to 100; got ${scoreSum}.`);

const ranked = [...measurement.dimensionScores].sort(
  (a, b) => b.selectedCount - a.selectedCount || dimensionNames.indexOf(a.dimension) - dimensionNames.indexOf(b.dimension),
);
if (measurement.primaryPattern !== ranked[0].dimension) fail("Primary pattern mismatch.");
if (measurement.secondaryPattern !== ranked[1].dimension) fail("Secondary pattern mismatch.");
if (result.interpretation?.interpretationVersion !== "DISC_INTERPRETATION_V2") {
  fail(`Unexpected interpretation version: ${result.interpretation?.interpretationVersion}`);
}

console.log("Ipsative keyed scoring          : PASS");
console.log("Dimension profile + ranking     : PASS");
console.log("Interpretation                  : PASS (DISC_INTERPRETATION_V2)");
console.log("DISC V2 INSTRUMENT ACTUAL RUNTIME E2E: PASS");
console.log(`Attempt ID                      : ${attemptId}`);
