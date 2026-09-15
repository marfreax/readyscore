import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const checks = [
  ["lead model", read("prisma/schema.prisma").includes("model FreeLeadCapture")],
  ["lead attempt unique", read("prisma/schema.prisma").includes('attemptId        String   @unique')],
  ["lead consent fields", /consent\s+Boolean[\s\S]*consentAt\s+DateTime/.test(read("prisma/schema.prisma"))],
  ["phase2 migration", fs.existsSync(path.join(root, "prisma/migrations/20260915110000_v16_2_free_lead_unlock/migration.sql"))],
  ["unlock API", fs.existsSync(path.join(root, "app/api/free/unlock/route.ts"))],
  ["POST requires consent", read("app/api/free/unlock/route.ts").includes('CONSENT_REQUIRED')],
  ["POST validates whatsapp", read("app/api/free/unlock/route.ts").includes('INVALID_WHATSAPP')],
  ["completed free attempt gate", read("app/api/free/unlock/route.ts").includes('attempt.status !== "COMPLETED"')],
  ["report helper", fs.existsSync(path.join(root, "lib/free-report.ts"))],
  ["three recommendations", /recommendations: \[/.test(read("lib/free-report.ts"))],
  ["lead gate UI", fs.existsSync(path.join(root, "components/free/FreeLeadGate.tsx"))],
  ["result integrates lead gate", read("app/free/result/[attemptId]/page.tsx").includes("FreeLeadGate")],
  ["result remains visible", read("app/free/result/[attemptId]/page.tsx").includes("HASIL INSTANT")],
];
const failed = checks.filter(([, ok]) => !ok);
if (failed.length) { console.error("V16 PHASE 2 CONTRACT: FAIL"); for (const [name] of failed) console.error(`- ${name}`); process.exit(1); }
console.log("V16 PHASE 2 CONTRACT: PASS");
