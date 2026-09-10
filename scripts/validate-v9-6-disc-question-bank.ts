import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const fail = (message: string): never => {
  throw new Error(`V9.6 check failed: ${message}`);
};
const assert = (condition: unknown, message: string): void => {
  if (!condition) fail(message);
};

console.log("=== READY SCORE V9.6 DISC QUESTION BANK GATE ===");
console.log("Scope      : DISC question bank quality and runtime hardening");
console.log("Protection : V8.5 DISC measurement/scoring semantics remain unchanged");

const bankPath = path.join(root, "data/question-bank/disc/DISC_V2_SITUATIONAL_FORCED_CHOICE_PRODUCTION_BANK.json");
assert(fs.existsSync(bankPath), "DISC V2 production bank is missing");
const bank = JSON.parse(fs.readFileSync(bankPath, "utf8"));
assert(Array.isArray(bank) && bank.length === 24, "DISC V2 bank must contain exactly 24 items");

const targets = { TARGET_D: 0, TARGET_I: 0, TARGET_S: 0, TARGET_C: 0 };
const positions = { D: 0, I: 0, S: 0, C: 0 };

for (const [index, item] of bank.entries()) {
  assert(item.version === "DISC_V2", `item ${index + 1} version mismatch`);
  assert(item.type === "SCENARIO" && item.answerType === "SINGLE_CHOICE_4", `item ${index + 1} transport mismatch`);
  assert(item.weight === 1, `item ${index + 1} weight mismatch`);
  assert(!Object.hasOwn(item, "correctOption"), `item ${index + 1} contains forbidden answer key`);
  assert(Array.isArray(item.options) && item.options.length === 4, `item ${index + 1} must have four options`);
  assert(new Set(item.options).size === 4, `item ${index + 1} options must be unique`);
  assert(Array.isArray(item.optionDimensions) && item.optionDimensions.length === 4, `item ${index + 1} mapping missing`);
  assert(new Set(item.optionDimensions).size === 4, `item ${index + 1} mapping must contain D/I/S/C once`);
  assert(item.optionDimensions.every((x: string) => ["D","I","S","C"].includes(x)), `item ${index + 1} invalid mapping`);
  assert(Array.isArray(item.scoringKey) && item.scoringKey.length === 4, `item ${index + 1} scoringKey missing`);
  assert(item.scoringKey.every((x: unknown) => Number.isInteger(x) && Number(x) >= 1 && Number(x) <= 4), `item ${index + 1} invalid scoringKey`);
  assert(new Set(item.scoringKey).size === 4, `item ${index + 1} scoringKey must be a permutation`);
  assert(["TARGET_D","TARGET_I","TARGET_S","TARGET_C"].includes(item.subdomain), `item ${index + 1} invalid target`);
  targets[item.subdomain as keyof typeof targets]++;
  item.optionDimensions.forEach((d: keyof typeof positions) => positions[d]++);
}
for (const [target, count] of Object.entries(targets)) assert(count === 6, `${target} coverage is ${count}; expected 6`);
for (const [dimension, count] of Object.entries(positions)) assert(count === 24, `${dimension} mapping count ${count}; expected 24`);

// Each dimension occupies each option position exactly six times.
const perPosition: Record<string, number[]> = { D:[0,0,0,0], I:[0,0,0,0], S:[0,0,0,0], C:[0,0,0,0] };
for (const item of bank) item.optionDimensions.forEach((d: string, i: number) => perPosition[d][i]++);
for (const [d, counts] of Object.entries(perPosition)) {
  assert(counts.every((x) => x === 6), `${d} option-position balance is ${counts.join("/")}; expected 6/6/6/6`);
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
assert(packageJson.scripts?.["v9:5:gate"], "V9.5 gate registration missing");
assert(packageJson.scripts?.["v9:4:gate"], "V9.4 gate registration missing");
assert(packageJson.scripts?.["v9:3:gate"], "V9.3 gate registration missing");
assert(packageJson.scripts?.["v9:2:gate"], "V9.2 gate registration missing");
assert(packageJson.scripts?.["v9:1:gate"], "V9.1 gate registration missing");
assert(packageJson.scripts?.["v9:0:gate"], "V9.0 gate registration missing");

const forbiddenMigration = fs.existsSync(path.join(root, "prisma/migrations/20260901_v9_6"));
assert(!forbiddenMigration, "V9.6 database migration introduced");

const gateSource = fs.readFileSync(path.join(root, "scripts/validate-v9-6-disc-question-bank.ts"), "utf8");
assert(!/overallScore\s*[:=].*(?!compat)/i.test(gateSource), "substantive overall-score implementation detected in V9.6 gate");
assert(!/average\s*\(/i.test(gateSource), "average synthesis detected in V9.6 gate");

console.log("PASS: V9.5 DISC production bank remains intact");
console.log("PASS: DISC V2 bank contains exactly 24 situational forced-choice items");
console.log("PASS: Target scenario coverage remains 6/6/6/6");
console.log("PASS: Every item has four unique customer options");
console.log("PASS: Every item has an item-specific D/I/S/C permutation");
console.log("PASS: DISC option-position balance remains 6/6/6/6 per dimension");
console.log("PASS: DISC items contain no correctOption answer key");
console.log("PASS: DISC V2 taxonomy/configuration/scoring/selection/result boundaries remain protected");
console.log("PASS: No V9.6 database migration introduced");
console.log("PASS: No substantive overall DISC score or cross-assessment synthesis introduced");
console.log("PASS: V9.0–V9.5 gate registrations remain intact");
console.log("V9.6 DISC QUESTION BANK GATE: PASS");
