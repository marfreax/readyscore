import assert from "node:assert/strict";
import { prisma } from "../lib/db/prisma";
import { assertAttemptRuntimeAccess, RuntimeError } from "../lib/assessment/runtime-service";
import { POST as unlock } from "../app/api/free/unlock/route";

async function main() {
  // Stub storage so these checks never read or write customer data.
  const original = prisma.assessmentAttempt.findUnique;
  let storedType: string | null = "FREE";
  prisma.assessmentAttempt.findUnique = (async () => storedType ? { assessmentType: storedType } : null) as unknown as typeof original;
  try {
    await assertAttemptRuntimeAccess("opaque-free-attempt");
    await assertAttemptRuntimeAccess("opaque-free-attempt", "signed-in-user");
    for (const type of ["RIASEC", "DISC", "EQ", "COGNITIVE", "WORK_ATTITUDE", "LEARNING_PREFERENCE", null]) {
      storedType = type;
      await assert.rejects(() => assertAttemptRuntimeAccess("opaque-attempt"),
        (error: unknown) => error instanceof RuntimeError && error.code === "AUTH_REQUIRED");
    }
    for (const email of [undefined, null, "", "   ", "invalid-email"]) {
      const response = await unlock(new Request("http://localhost/api/free/unlock", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId: "opaque-free-attempt", name: "Test Guest", whatsapp: "081234567890", email, consent: true }),
      }));
      assert.equal(response.status, 400);
      assert.equal((await response.json()).error.code, "INVALID_EMAIL");
    }
    console.log("Free guest access and required email: PASS");
  } finally {
    prisma.assessmentAttempt.findUnique = original;
    await prisma.$disconnect();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
