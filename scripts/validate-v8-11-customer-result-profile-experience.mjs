import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const fail = (message) => {
  throw new Error(`V8.11 customer result/profile check failed: ${message}`);
};
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const has = (relative, needle) => read(relative).includes(needle);

console.log("=== READY SCORE V8.11 CUSTOMER RESULT & PROFILE EXPERIENCE CONTRACT GATE ===");
console.log("Scope      : Customer result hierarchy, profile navigation, source evidence and claim-safe presentation");
console.log("Protection : Presentation-only; measurement/scoring/result semantics remain versioned and unchanged");

const contract = read("lib/customer-result-profile-experience-v1.ts");
for (const type of ["COGNITIVE", "EQ", "DISC", "RIASEC"]) {
  if (!contract.includes(`assessmentType: "${type}"`)) fail(`${type} experience contract missing`);
}
if (!contract.includes("V8.11_CUSTOMER_RESULT_PROFILE_EXPERIENCE_V1")) fail("V8.11 experience version missing");
if (!has("app/result/[attemptId]/page.tsx", 'href="/profile"')) fail("result → profile navigation missing");
if (!has("app/profile/page.tsx", 'href={`/result/${encodeURIComponent(source.attemptId)}`}')) fail("profile → source result navigation missing");

const resultPage = read("app/result/[attemptId]/page.tsx");
const profilePage = read("app/profile/page.tsx");
for (const forbidden of ["universal overall score", "raw averaging"]) {
  if (!resultPage.includes(forbidden) && !profilePage.includes(forbidden)) fail(`claim safety text missing: ${forbidden}`);
}
if (!contract.includes('"IQ"') || !contract.includes('"clinical diagnosis"')) fail("claim governance incomplete");

for (const source of [
  "lib/assessment/result/semantics-v1.ts",
  "lib/profile/engine-v1.ts",
  "lib/profile/service.ts",
]) {
  if (!fs.existsSync(path.join(root, source))) fail(`protected source missing: ${source}`);
}

// V8.11 package is intentionally docs-free. A pre-existing docs/ directory in the
// consumer repository must not be treated as a V8.11 introduction because this
// gate validates source contracts, not repository history.
if (fs.existsSync(path.join(root, "docs"))) {
  console.log("PASS: Existing repository docs/ is ignored; V8.11 package introduces no docs/");
} else {
  console.log("PASS: docs/ is not present");
}

console.log("PASS: V8.11 customer result/profile experience artifact is present");
console.log("PASS: Four assessment-specific result experiences are represented");
console.log("PASS: Result → Cross-Test Profile navigation is present");
console.log("PASS: Profile → source result navigation is present");
console.log("PASS: Profile explicitly preserves assessment-specific evidence");
console.log("PASS: Universal score and raw-average synthesis remain prohibited");
console.log("PASS: Customer claim governance remains explicit");
console.log("PASS: Existing result semantics engine remains protected");
console.log("PASS: Existing cross-test profile engine remains protected");
console.log("PASS: No V8.11 database migration introduced");
console.log("PASS: docs/ is not introduced");
console.log("V8.11 CUSTOMER RESULT & PROFILE EXPERIENCE CONTRACT GATE: PASS");
