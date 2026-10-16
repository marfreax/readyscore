import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";

const base = process.env.READYSCORE_BASE_URL ?? "http://localhost:3000";
const prisma = new PrismaClient();
let attemptId = null;
try {
  const start = await fetch(`${base}/api/assessment/start`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "free" }) });
  const startData = await start.json();
  if (!start.ok || !startData.ok) throw new Error(`start failed: ${JSON.stringify(startData)}`);
  attemptId = startData.attemptId;
  if (!Array.isArray(startData.questions) || startData.questions.length !== 10) throw new Error("free test did not return 10 questions");

  const resumed = await fetch(`${base}/api/assessment/${attemptId}`);
  const resumedData = await resumed.json();
  if (!resumed.ok || !resumedData.ok || resumedData.attempt.assessmentType !== "free") throw new Error("anonymous free resume failed");

  for (const question of startData.questions) {
    const response = await fetch(`${base}/api/assessment/${attemptId}/answer`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ questionId: question.id, value: 5 }) });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(`answer failed: ${JSON.stringify(data)}`);
  }

  const submit = await fetch(`${base}/api/assessment/${attemptId}/submit`, { method: "POST" });
  const submitData = await submit.json();
  if (!submit.ok || !submitData.ok) throw new Error(`submit failed: ${JSON.stringify(submitData)}`);

  const before = await fetch(`${base}/api/free/unlock?attemptId=${encodeURIComponent(attemptId)}`);
  const beforeData = await before.json();
  if (!before.ok || !beforeData.ok || beforeData.unlocked !== false) throw new Error("expected locked state before lead submission");

  const invalid = await fetch(`${base}/api/free/unlock`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ attemptId, name: "Phase 2 Test", whatsapp: "081234567890", email: "phase2@example.com", consent: false }) });
  const invalidData = await invalid.json();
  if (invalid.status !== 400 || invalidData?.error?.code !== "CONSENT_REQUIRED") throw new Error("consent validation failed");

  const missingEmail = await fetch(`${base}/api/free/unlock`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ attemptId, name: "Phase 2 Test", whatsapp: "081234567890", consent: true }) });
  const missingEmailData = await missingEmail.json();
  if (missingEmail.status !== 400 || missingEmailData?.error?.code !== "INVALID_EMAIL") throw new Error("email must be required after completion");

  const valid = await fetch(`${base}/api/free/unlock`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ attemptId, name: "Phase 2 Test", whatsapp: "081234567890", email: `phase2-${randomBytes(4).toString("hex")}@example.com`, consent: true, source: "phase2-e2e" }) });
  const validData = await valid.json();
  if (!valid.ok || !validData.ok || validData.unlocked !== true) throw new Error(`unlock failed: ${JSON.stringify(validData)}`);
  if (!validData.report || !Array.isArray(validData.report.recommendations) || validData.report.recommendations.length !== 3) throw new Error("free report payload is incomplete");

  const after = await fetch(`${base}/api/free/unlock?attemptId=${encodeURIComponent(attemptId)}`);
  const afterData = await after.json();
  if (!after.ok || !afterData.ok || afterData.unlocked !== true) throw new Error("expected unlocked state after lead submission");

  console.log("V16 PHASE 2 RUNTIME E2E: PASS");
  console.log(`attemptId=${attemptId}`);
} catch (error) {
  console.error("V16 PHASE 2 RUNTIME E2E: FAIL");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  if (attemptId) {
    await prisma.assessmentAttempt.delete({ where: { id: attemptId } }).catch(() => {});
  }
  await prisma.$disconnect();
}
