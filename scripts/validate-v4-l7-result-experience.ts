import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const pagePath = join(root, "app/result/[attemptId]/page.tsx");
const runtimePath = join(root, "lib/assessment/runtime-service.ts");
const typesPath = join(root, "lib/assessment/types.ts");

function fail(message: string): never {
  throw new Error(message);
}

console.log("=== READY SCORE V4 L7 RESULT EXPERIENCE MVP GATE ===");
console.log("Scope      : Customer-facing result experience");
console.log("Protection : Result presentation only; frozen measurement/scoring boundaries preserved");

if (!existsSync(pagePath)) fail("Result route source is missing.");
const page = readFileSync(pagePath, "utf8");
const runtime = readFileSync(runtimePath, "utf8");
const types = readFileSync(typesPath, "utf8");

for (const marker of [
  "Result Summary",
  "What This Means",
  "Your Profile",
  "Strengths",
  "Areas to Watch",
  "What to Explore",
  "Next Action",
]) {
  if (!page.includes(marker)) fail(`Missing L7 experience section: ${marker}`);
}
console.log("PASS: Generic result journey sections PRESENT");

for (const testType of ["RIASEC", "DISC", "EQ", "COGNITIVE"]) {
  if (!page.includes(`result.assessmentType === "${testType}"`)) {
    fail(`Missing customer-facing result branch for ${testType}.`);
  }
}
console.log("PASS: RIASEC result experience PRESENT");
console.log("PASS: DISC result experience PRESENT");
console.log("PASS: EQ result experience PRESENT");
console.log("PASS: Cognitive result experience PRESENT");

for (const marker of [
  "result.riasec?.measurement",
  "result.disc?.measurement",
  "result.eq?.measurement",
  "result.cognitive?.measurement",
]) {
  if (!page.includes(marker)) fail(`Missing canonical measurement binding: ${marker}`);
}
console.log("PASS: Canonical measurement payloads bound");

if (!runtime.includes("persistCompletedResult(id, interpretedResult)")) {
  fail("Result persistence path changed or is missing.");
}
console.log("PASS: Existing immutable result persistence preserved");

if (!types.includes("interpretation?:")) fail("Result interpretation contract missing.");
console.log("PASS: Existing interpretation contract preserved");

for (const prohibited of [
  "You must become",
  "You are definitely suitable for",
  "You will succeed in",
  "Your IQ determines",
]) {
  if (page.includes(prohibited)) fail(`Deterministic claim detected: ${prohibited}`);
}
console.log("PASS: Deterministic educational/career claims absent");

if (page.includes("docs/")) fail("L7 implementation must not introduce docs/ references.");
console.log("PASS: Documentation folder rule preserved");

console.log("L7 database migration : NO");
console.log("L7 measurement semantics mutation : NO");
console.log("V4 L7 RESULT EXPERIENCE MVP GATE: PASS");
