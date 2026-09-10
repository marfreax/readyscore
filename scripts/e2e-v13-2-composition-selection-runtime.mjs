import { PrismaClient } from "@prisma/client";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const prisma = new PrismaClient();
const types = [
  ["disc", 24, ["TARGET_D", "TARGET_I", "TARGET_S", "TARGET_C"], 6],
  ["eq", 24, ["EMOTION_AWARENESS", "EMOTION_REGULATION", "EMPATHY_SOCIAL_AWARENESS", "RELATIONSHIP_SOCIAL_RESPONSE"], 6],
  ["cognitive", 24, ["VERBAL_REASONING", "NUMERICAL_REASONING", "LOGICAL_REASONING", "ABSTRACT_REASONING"], 6],
  ["riasec", 60, ["R", "I", "A", "S", "E", "C"], 10],
];

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "content-type": "application/json", ...(options.headers ?? {}) },
    ...options,
  });
  let body = null;
  try { body = await response.json(); } catch {}
  return { response, body };
}
function fail(message) { throw new Error(message); }

async function prepareRuntimeFixtures() {
  for (const [type, total, nodeCodes, requiredCount] of types) {
    const testTypeCode = type === "riasec" ? "RIASEC" : type === "disc" ? "DISC" : type === "eq" ? "EQ" : "COGNITIVE";
    const testType = await prisma.testType.findUnique({ where: { code: testTypeCode } });
    if (!testType) fail(`${type}: TestType ${testTypeCode} not found.`);

    const taxonomy = await prisma.taxonomyVersion.findFirst({
      where: { testTypeId: testType.id, status: "ACTIVE" },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    });
    if (!taxonomy) fail(`${type}: no ACTIVE taxonomy found.`);

    const nodes = await prisma.taxonomyNode.findMany({
      where: { taxonomyId: taxonomy.id, code: { in: nodeCodes } },
    });
    const byCode = new Map(nodes.map((node) => [node.code.toUpperCase(), node]));
    for (const code of nodeCodes) {
      if (!byCode.has(code.toUpperCase())) fail(`${type}: taxonomy node ${code} not found in ${taxonomy.version}.`);
    }

    const packageCode = `E2E_V13_2_${testTypeCode}`;
    const packageId = `e2e-v13-2-package-${testTypeCode.toLowerCase()}`;
    const packageVersionId = `e2e-v13-2-package-version-${testTypeCode.toLowerCase()}-v1`;

    await prisma.questionPackage.upsert({
      where: { id: packageId },
      create: {
        id: packageId,
        testTypeId: testType.id,
        code: packageCode,
        name: `V13.2 E2E ${testTypeCode}`,
        description: "Runtime-only E2E fixture. Not production content.",
      },
      update: { testTypeId: testType.id, code: packageCode },
    });

    await prisma.questionPackageVersion.upsert({
      where: { id: packageVersionId },
      create: {
        id: packageVersionId,
        packageId,
        version: "1",
        totalQuestions: total,
        timeLimitSeconds: 3600,
        taxonomyVersionId: taxonomy.id,
        status: "PUBLISHED",
        metadata: { selectionAlgorithmVersion: "V13.2_COMPOSITION_SELECTION_V1", e2eFixture: true },
      },
      update: {
        packageId,
        version: "1",
        totalQuestions: total,
        timeLimitSeconds: 3600,
        taxonomyVersionId: taxonomy.id,
        status: "PUBLISHED",
        metadata: { selectionAlgorithmVersion: "V13.2_COMPOSITION_SELECTION_V1", e2eFixture: true },
      },
    });

    await prisma.questionPackageCompositionRule.deleteMany({ where: { packageVersionId } });
    await prisma.questionPackageCompositionRule.createMany({
      data: nodeCodes.map((code) => ({
        packageVersionId,
        taxonomyNodeId: byCode.get(code.toUpperCase()).id,
        requiredCount,
      })),
    });
  }
}

try {
  console.log("=== READY SCORE V13.2 COMPOSITION / QUESTION SELECTION E2E ===");
  console.log(`Base URL : ${baseUrl}`);
  console.log("Mode     : REAL HTTP + REAL PostgreSQL runtime");
  console.log("Fixture  : deterministic E2E Question Packages prepared in PostgreSQL");

  await prepareRuntimeFixtures();

  for (const [type, expectedTotal, expectedNodes] of types) {
    const start = await request("/api/assessment/start", {
      method: "POST",
      body: JSON.stringify({ type }),
    });

    if (!start.response.ok || !start.body?.ok) {
      fail(`${type}: start failed HTTP ${start.response.status} ${JSON.stringify(start.body)}`);
    }

    const snapshot = start.body.snapshot;
    const pkg = snapshot?.package;
    if (!pkg?.packageId || !pkg?.packageVersionId) fail(`${type}: package identity missing from snapshot.`);
    if (pkg.packageTotalQuestions !== expectedTotal) fail(`${type}: package total ${pkg.packageTotalQuestions}; expected ${expectedTotal}.`);
    if (!pkg.timeLimitSeconds || pkg.timeLimitSeconds <= 0) fail(`${type}: package timer missing/invalid.`);
    if (!pkg.selectionAlgorithmVersion) fail(`${type}: selection algorithm version missing.`);
    if (!Array.isArray(pkg.composition)) fail(`${type}: composition snapshot missing.`);
    for (const code of expectedNodes) {
      const rule = pkg.composition.find((item) => item.taxonomyNodeCode === code);
      if (!rule) fail(`${type}: composition node ${code} missing.`);
      if (rule.requiredCount <= 0) fail(`${type}: composition node ${code} has invalid requiredCount.`);
      if (rule.availableCount < rule.requiredCount) fail(`${type}: composition node ${code} is under-available.`);
    }

    const questions = Array.isArray(start.body.questions) ? start.body.questions : [];
    if (questions.length !== expectedTotal) fail(`${type}: runtime returned ${questions.length}; expected ${expectedTotal}.`);
    const sequences = questions.map((q) => q.sequence);
    if (new Set(sequences).size !== expectedTotal) fail(`${type}: duplicate question sequence.`);
    if (Math.min(...sequences) !== 1 || Math.max(...sequences) !== expectedTotal) fail(`${type}: sequence boundary invalid.`);
    if (pkg.selectedQuestionIds?.length !== expectedTotal) fail(`${type}: snapshot selectedQuestionIds mismatch.`);
    if (pkg.selectedQuestionVersionIds?.length !== expectedTotal) fail(`${type}: snapshot selectedQuestionVersionIds mismatch.`);
    if (pkg.selectedQuestionSequence?.length !== expectedTotal) fail(`${type}: snapshot selectedQuestionSequence mismatch.`);

    console.log(`${type.toUpperCase()} package + composition + selection + frozen sequence : PASS`);
    console.log(`  Package : ${pkg.packageCode} ${pkg.packageVersion}`);
    console.log(`  Attempt : ${start.body.attemptId}`);
  }
  console.log("V13.2 COMPOSITION / QUESTION SELECTION RUNTIME E2E: PASS");
} finally {
  await prisma.$disconnect();
}
