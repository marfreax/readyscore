import { PrismaClient } from "@prisma/client";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const prisma = new PrismaClient();
const targets = {
  riasec: { count: 60, timer: 1200, scoring: "RIASEC_SCORE_V2", dimensions: 6 },
  disc: { count: 80, timer: 1200, scoring: "DISC_SCORE_V2", dimensions: 4 },
  eq: { count: 50, timer: 1200, scoring: "EQ_SCORE_V2", dimensions: 4 },
  cognitive: { count: 40, timer: 1200, scoring: "COGNITIVE_SCORE_V2", dimensions: 4 },
};
function fail(message) { throw new Error(message); }
async function req(path, options = {}) {
  const response = await fetch(baseUrl + path, {
    headers: { "content-type": "application/json", ...(options.headers ?? {}) },
    ...options,
  });
  let body = null;
  try { body = await response.json(); } catch {}
  return { response, body };
}
function assert(condition, message) { if (!condition) fail(message); }

async function verifyUiSurface(type) {
  const urls = [`/assessments/${type}`, `/assessments/${type}/pre-test`, `/assessments/${type}/test`];
  for (const url of urls) {
    const r = await fetch(baseUrl + url, { redirect: "manual" });
    assert(r.status >= 200 && r.status < 500, `customer UI route unavailable: ${url} (${r.status})`);
  }
}

async function runStandard(type) {
  const target = targets[type];
  const started = await req("/api/assessment/start", { method: "POST", body: JSON.stringify({ type }) });
  assert(started.response.ok && started.body?.ok, `${type}: start failed ${started.response.status} ${JSON.stringify(started.body)}`);
  const attemptId = started.body.attemptId;
  const questions = started.body.questions ?? [];
  assert(attemptId && questions.length === target.count, `${type}: expected ${target.count} questions, got ${questions.length}`);
  assert(started.body.timer?.timeLimitSeconds === target.timer, `${type}: timer mismatch (expected ${target.timer}, got ${started.body.timer?.timeLimitSeconds ?? "null"})`);
  assert(started.body.snapshot?.package?.packageVersionId, `${type}: package snapshot missing`);

  // attemptSeed is server-side runtime metadata and is intentionally not exposed
  // through the public customer snapshot. Validate its persistence directly in
  // PostgreSQL instead of requiring it in the HTTP response.
  const persistedSeed = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    select: { attemptSeed: true, selectionSnapshot: true },
  });
  assert(persistedSeed?.attemptSeed, `${type}: attempt seed not persisted`);
  const snapshotSeed = persistedSeed?.selectionSnapshot && typeof persistedSeed.selectionSnapshot === "object"
    ? persistedSeed.selectionSnapshot.attemptSeed
    : undefined;
  assert(snapshotSeed === persistedSeed.attemptSeed, `${type}: snapshot attempt seed mismatch`);

  const initialFingerprint = questions.map(q => `${q.sequence}:${q.id}`).join("|");
  const first = questions[0];
  const firstValue = Array.isArray(first.scale) && first.scale.length ? first.scale[0] : 1;
  const saved = await req(`/api/assessment/${attemptId}/answer`, { method: "POST", body: JSON.stringify({ questionId: first.id, value: firstValue }) });
  assert(saved.response.ok && saved.body?.saved, `${type}: first answer failed`);

  const resumed = await req(`/api/assessment/${attemptId}`);
  assert(resumed.response.ok && resumed.body?.ok, `${type}: resume failed`);
  assert(resumed.body.attempt.id === attemptId, `${type}: attempt identity changed`);
  assert(resumed.body.snapshot?.package?.packageVersionId === started.body.snapshot.package.packageVersionId, `${type}: package snapshot changed`);
  assert((resumed.body.questions ?? []).map(q => `${q.sequence}:${q.id}`).join("|") === initialFingerprint, `${type}: question sequence changed`);
  assert(resumed.body.questions.find(q => q.id === first.id)?.answer === firstValue, `${type}: answer did not persist`);

  for (const q of questions.slice(1)) {
    const value = Array.isArray(q.scale) && q.scale.length ? q.scale[0] : 1;
    const answer = await req(`/api/assessment/${attemptId}/answer`, { method: "POST", body: JSON.stringify({ questionId: q.id, value }) });
    assert(answer.response.ok && answer.body?.saved, `${type}: answer failed for ${q.code}`);
  }

  const submitted = await req(`/api/assessment/${attemptId}/submit`, { method: "POST", body: "{}" });
  assert(submitted.response.ok && submitted.body?.ok, `${type}: submit failed ${submitted.response.status} ${JSON.stringify(submitted.body)}`);
  const result = submitted.body.result;
  assert(result?.assessmentType?.toLowerCase?.() === type, `${type}: result assessment type mismatch`);
  assert(result?.scoringVersion === target.scoring, `${type}: scoring version mismatch`);
  const measurement = type === "riasec" ? result?.riasec?.measurement
    : type === "disc" ? result?.disc?.measurement
    : type === "eq" ? result?.eq?.measurement
    : result?.cognitive?.measurement;
  assert(measurement, `${type}: measurement payload missing`);
  assert(measurement.testType === type.toUpperCase(), `${type}: measurement test type mismatch`);
  assert(measurement.scoringVersion === target.scoring, `${type}: measurement scoring version mismatch`);
  assert(Array.isArray(measurement.dimensionScores) && measurement.dimensionScores.length === target.dimensions, `${type}: measurement dimension count mismatch`);

  const reloaded = await req(`/api/assessment/${attemptId}`);
  assert(reloaded.response.ok && reloaded.body?.result, `${type}: result persistence/reload failed`);
  return { attemptId, count: questions.length, result };
}

async function runTimeout(type) {
  const target = targets[type];
  const started = await req("/api/assessment/start", { method: "POST", body: JSON.stringify({ type }) });
  assert(started.response.ok && started.body?.ok, `${type} timeout: start failed`);
  const attemptId = started.body.attemptId;
  const first = started.body.questions?.[0];
  assert(started.body.questions?.length === target.count, `${type} timeout: count mismatch`);
  const value = Array.isArray(first.scale) && first.scale.length ? first.scale[0] : 1;
  const answer = await req(`/api/assessment/${attemptId}/answer`, { method: "POST", body: JSON.stringify({ questionId: first.id, value }) });
  assert(answer.response.ok, `${type} timeout: seed answer failed`);
  await prisma.assessmentAttempt.update({ where: { id: attemptId }, data: { expiresAt: new Date(Date.now() - 1000) } });
  const expired = await req(`/api/assessment/${attemptId}`);
  assert(expired.response.ok && expired.body?.attempt?.status === "EXPIRED", `${type} timeout: not finalized as EXPIRED`);
  assert(expired.body?.result, `${type} timeout: result not persisted`);
  assert(expired.body.result?.scoringVersion === target.scoring, `${type} timeout: scoring version mismatch`);
  const rejected = await req(`/api/assessment/${attemptId}/answer`, { method: "POST", body: JSON.stringify({ questionId: first.id, value: 2 }) });
  assert(rejected.response.status === 422 && rejected.body?.error?.code === "ATTEMPT_EXPIRED", `${type} timeout: post-expiry answer accepted`);
  return attemptId;
}

try {
  console.log("========================================");
  console.log("V13.10 — PRODUCTION E2E & CUSTOMER READINESS");
  console.log("========================================");
  console.log(`Base URL : ${baseUrl}`);
  console.log("Mode     : REAL HTTP + REAL PostgreSQL runtime");
  for (const type of Object.keys(targets)) await verifyUiSurface(type);
  console.log("customer assessment/pre-test/test UI surfaces : PASS");

  for (const type of Object.keys(targets)) {
    const standard = await runStandard(type);
    console.log(`${type.toUpperCase()} standard start → selection → snapshot → answer persistence → submit → score → result reload : PASS (${standard.count} questions)`);
    const timeoutId = await runTimeout(type);
    console.log(`${type.toUpperCase()} timeout → server expiry → timeout scoring → result persistence → post-expiry rejection : PASS (${timeoutId})`);
  }

  console.log("V13.10 PRODUCTION E2E / CUSTOMER READINESS: PASS");
} finally {
  await prisma.$disconnect();
}
