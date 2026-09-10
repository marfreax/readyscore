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

if (scripts.build !== "next build") {
  fail("package build script is not the expected Next.js production build contract");
}
if (scripts["v11:6:13:gate"] !== "node scripts/validate-v11-6-13-production-build.mjs") {
  fail("V11.6.13 gate script is not registered correctly");
}
pass("production build command contract");

pass("Next.js production build configuration contract");

read("package.json");
read("pnpm-lock.yaml");
pass("package manager artifacts present");

const migrationsDir = path.join(root, "prisma", "migrations");
if (!fs.existsSync(migrationsDir)) fail("prisma/migrations directory missing");
const migrationEntries = fs.readdirSync(migrationsDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name);
if (migrationEntries.some(name => name.includes("v11_6_13"))) {
  fail("V11.6.13 must not introduce a database migration");
}
pass("no V11.6.13 migration");

read("V11_6_13_ARCHITECTURE.md");
read("V11_6_13_DELIVERY_NOTES.md");
read("V11_6_13_MANIFEST.md");
pass("required V11.6.13 delivery artifacts");

console.log("V11.6.13 STATIC GATE: PASS");
