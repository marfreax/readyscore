import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const schema = read("prisma/schema.prisma");
const subject = read("lib/subjects/service.ts");
const runtime = read("lib/assessment/runtime-service.ts");
const reports = read("lib/reports/service.ts");
const entitlement = read("lib/commercial/entitlement-service.ts");
const reassessment = read("lib/assessment/reassessment.ts");
const checks = [
  ["SubjectProfile model", /model SubjectProfile\s*\{/.test(schema)],
  ["Account → Subject relation", /subjects SubjectProfile\[\]/.test(schema) && /account\s+User/.test(schema)],
  ["Create/List/Select subject API", fs.existsSync(path.join(root,"app/api/subjects/route.ts")) && fs.existsSync(path.join(root,"app/api/subjects/select/route.ts"))],
  ["AssessmentAttempt.subjectId", /subjectId\s+String\?/.test(schema) && /subjectId/.test(runtime)],
  ["Entitlement subject scope", /subjectId\s+String\?/.test(schema) && /subjectId/.test(entitlement)],
  ["Reassessment credit subject scope", /subjectId\s+String\?/.test(schema) && /subjectId/.test(reassessment)],
  ["Same-day subject scope", /subjectId,\s*\n\s*assessmentType: resourceType/.test(reassessment)],
  ["Same-day blocks retake after any completed assessment", /status: "COMPLETED",\s*\n\s*completedAt: \{ gte: start, lt: end \}/.test(reassessment)],
  ["Same-day limit is evaluated before reassessment credit", /if \(dailyCount >= 1\)[\s\S]*?REASSESSMENT_DAILY_LIMIT[\s\S]*?if \(!credit\)/.test(reassessment)],
  ["Same-day UI distinguishes credit availability", /creditAvailable: Boolean\(credit\)/.test(reassessment) && /eligibility\.creditAvailable \? "Credit tersedia · Retake besok" : "Retake Besok"/.test(read("app/access/page.tsx"))],
  ["Result/report subject identity", /participantName: subject.name/.test(reports) && /subjectId: subject.id/.test(reports)],
  ["Active subject context", /ACTIVE_SUBJECT_COOKIE/.test(subject) && /getActiveSubject/.test(runtime)],
  ["Backfill migration", fs.existsSync(path.join(root,"prisma/migrations/20260929061000_v19_3_1_subject_identity/migration.sql"))],
  ["Commercial order subject allocation", /model CommercialOrder[\s\S]*?subjectId\s+String\?/.test(schema) && /subjectId: subject.id/.test(read("lib/commercial/v14-1.ts"))],
];
let failed = false;
for (const [name, ok] of checks) { console.log(`${ok ? "PASS" : "FAIL"} — ${name}`); if (!ok) failed = true; }
if (failed) process.exit(1);
console.log("V19.3.1 Subject Identity & Multi-Profile Foundation static gate: PASS");
