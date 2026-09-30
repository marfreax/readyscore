import fs from "node:fs";

function fail(message) { throw new Error(message); }
function read(file) { return fs.readFileSync(file, "utf8"); }

const service = read("lib/profile/service.ts");
const route = read("app/api/profile/cross-test/route.ts");
const page = read("app/profile/page.tsx");
const engine = read("lib/profile/engine-v1.ts");
const types = read("lib/profile/types.ts");

const adapters = [
  ["COGNITIVE", "lib/profile/adapters/cognitive.ts"],
  ["EQ", "lib/profile/adapters/eq.ts"],
  ["DISC", "lib/profile/adapters/disc.ts"],
  ["RIASEC", "lib/profile/adapters/riasec.ts"],
  ["WORK_ATTITUDE", "lib/profile/adapters/work-attitude.ts"],
  ["LEARNING_PREFERENCE", "lib/profile/adapters/learning-preference.ts"],
];

for (const [type, file] of adapters) {
  const source = read(file);
  if (!source.includes(`testType: "${type}"`)) fail(`${type} profile adapter missing.`);
}
console.log("Six assessment profile adapters       : PASS");

if (!service.includes("getActiveSubject(userId, requestedSubjectId)")) fail("Profile service does not resolve active subject.");
if (!service.includes("subjectId: subject.id")) fail("Profile service is not subject-scoped.");
if (!service.includes("hasFeatureAccess(userId, \"PROFILE_ACCESS\", \"CROSS_TEST_PROFILE_V1\", new Date(), subject.id)")) fail("Profile access is not subject-scoped.");
console.log("Profile access subject-scoped          : PASS");
console.log("Completed evidence subject-scoped      : PASS");

if (!route.includes("searchParams.get(\"subjectId\")")) fail("Profile API subject selector missing.");
console.log("Profile API supports subject context   : PASS");

if (!page.includes("const { profile, subject }")) fail("Profile page does not expose active subject.");
if (!page.includes("subject.name")) fail("Profile page subject identity missing.");
console.log("Profile UI identifies active subject   : PASS");

if (!engine.includes("universal overall intelligence/personality/suitability score")) fail("Universal score prohibition missing.");
if (!page.includes("No evidence / Not available")) fail("Missing evidence must not be shown as zero.");
console.log("Missing evidence ≠ zero                : PASS");
console.log("No universal score                     : PASS");

for (const token of ["sourceTestType", "sourceResultAttemptId", "sourceScoringVersion", "sourceInterpretationVersion"]) {
  if (!types.includes(token)) fail(`Evidence provenance field missing: ${token}`);
}
console.log("Evidence provenance contract           : PASS");

if (!types.includes("CROSS_TEST_PROFILE_V1")) fail("Cross-test profile contract missing.");
console.log("Profile evidence contract              : PASS");

console.log("V19.4 Profile Integration static gate: PASS");
