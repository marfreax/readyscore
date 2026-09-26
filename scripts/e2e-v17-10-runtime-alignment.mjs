import { PrismaClient } from "@prisma/client";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const prisma = new PrismaClient();
const types = ["free", "riasec", "disc", "eq", "cognitive"];

function fail(message) { throw new Error(message); }

async function request(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  let bodyJson = null;
  try { bodyJson = await response.json(); } catch {}
  return { response, body: bodyJson };
}

try {
  console.log("=== READY SCORE V17.10 RUNTIME ALIGNMENT E2E ===");

  for (const type of types) {
    const cfg = await prisma.assessmentConfigurationVersion.findFirst({
      where: {
        status: "ACTIVE",
        configuration: { assessmentType: type.toUpperCase() },
      },
      include: {
        questionPackageVersion: { include: { package: true } },
        configuration: true,
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    });

    if (!cfg) fail(`${type}: active DB configuration missing`);
    if (!cfg.questionPackageVersionId || !cfg.questionPackageVersion) fail(`${type}: package relation missing`);
    if (cfg.questionCount !== cfg.questionPackageVersion.totalQuestions) fail(`${type}: configuration/package count mismatch`);
    if (cfg.questionPackageVersion.status !== "PUBLISHED") fail(`${type}: package not PUBLISHED`);
    if (!cfg.taxonomyVersion.trim() || !cfg.scoringVersion.trim() || !cfg.selectionAlgorithmVersion.trim()) {
      fail(`${type}: incomplete configuration identity`);
    }

    const start = await request("/api/assessment/start", { type });

    if (type !== "free" && start.response.status === 422 && start.body?.error?.code === "AUTHENTICATION_REQUIRED") {
      console.log(`${type.toUpperCase()} configuration + package contract : PASS (AUTHENTICATION_REQUIRED guard)`);
      continue;
    }

    if (!start.response.ok || !start.body?.ok) {
      if (start.response.status === 404) fail(`${type}: /api/assessment/start returned 404. Start/restart the local Next.js server or set BASE_URL to the correct running app.`);
      fail(`${type}: start HTTP ${start.response.status} — ${JSON.stringify(start.body)}`);
    }

    if (!Array.isArray(start.body.questions) || start.body.questions.length !== cfg.questionCount) {
      fail(`${type}: runtime returned ${start.body.questions?.length}; expected ${cfg.questionCount}`);
    }

    const snapshot = start.body.snapshot;
    if (snapshot?.assessmentConfigurationVersion !== cfg.version) {
      fail(`${type}: snapshot configuration version mismatch`);
    }
    if (snapshot?.package?.packageVersionId !== cfg.questionPackageVersionId) {
      fail(`${type}: snapshot package identity mismatch`);
    }
    if (snapshot?.selectedQuestionVersionIds?.length !== cfg.questionCount) {
      fail(`${type}: selectedQuestionVersionIds mismatch`);
    }

    console.log(`${type.toUpperCase()} runtime + DB configuration + package snapshot : PASS`);
  }

  console.log("V17.10 RUNTIME ALIGNMENT E2E: PASS");
} finally {
  await prisma.$disconnect();
}
