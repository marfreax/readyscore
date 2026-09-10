import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function pass(message) {
  console.log(`PASS — ${message}`);
}

function fail(message) {
  console.error(`FAIL — ${message}`);
  process.exit(1);
}

function read(relativePath) {
  const file = path.join(root, relativePath);
  if (!fs.existsSync(file)) fail(`required artifact missing: ${relativePath}`);
  return fs.readFileSync(file, "utf8");
}

const pkg = JSON.parse(read("package.json"));
const scripts = pkg.scripts ?? {};

if (scripts.typecheck !== "prisma generate && tsc --noEmit") {
  fail("package typecheck script is not the expected Prisma generate + TypeScript no-emit contract");
}
if (scripts["v11:6:12:gate"] !== "node scripts/validate-v11-6-12-typecheck.mjs") {
  fail("V11.6.12 gate script is not registered correctly");
}
pass("typecheck command contract");

const tsconfig = JSON.parse(read("tsconfig.json"));
if (tsconfig.compilerOptions?.noEmit !== true) {
  fail("tsconfig noEmit must remain true for the TypeScript typecheck contract");
}
pass("TypeScript no-emit contract");

read("prisma/schema.prisma");
pass("Prisma schema present");

const migrationsDir = path.join(root, "prisma", "migrations");
if (!fs.existsSync(migrationsDir)) fail("prisma/migrations directory missing");
const migrationEntries = fs.readdirSync(migrationsDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name);
if (migrationEntries.some(name => name.includes("v11_6_12"))) {
  fail("V11.6.12 must not introduce a database migration");
}
pass("no V11.6.12 migration");

read("V11_6_12_ARCHITECTURE.md");
read("V11_6_12_DELIVERY_NOTES.md");
read("V11_6_12_MANIFEST.md");
pass("required V11.6.12 delivery artifacts");

console.log("V11.6.12 STATIC GATE: PASS");
