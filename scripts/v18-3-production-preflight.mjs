import { PrismaClient } from "@prisma/client";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const prisma = new PrismaClient();
const root = process.cwd();
const migrationsDir = resolve(root, "prisma/migrations");
const criticalTables = [
  ["BusinessLead", "BusinessLead"],
  ["AssessmentAttempt", "AssessmentAttempt"],
  ["WhatsAppConversation", "WhatsAppConversation"],
  ["WhatsAppMessage", "WhatsAppMessage"],
  ["UserEntitlement", "UserEntitlement"],
];

const fail = (message) => {
  console.error(`PREFLIGHT BLOCKED: ${message}`);
  process.exitCode = 2;
};

const safeMigrationNames = () => {
  if (!existsSync(migrationsDir)) return [];
  return readFileSync(resolve(migrationsDir, "../migration_lock.toml"), "utf8")
    ? []
    : [];
};

const localMigrations = existsSync(migrationsDir)
  ? (await (await import("node:fs/promises")).readdir(migrationsDir, { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort()
  : [];

const migrationSqlHash = () => {
  const hash = createHash("sha256");
  for (const name of localMigrations) {
    const file = resolve(migrationsDir, name, "migration.sql");
    if (existsSync(file)) {
      hash.update(name);
      hash.update(readFileSync(file));
    }
  }
  return hash.digest("hex");
};

console.log("=== READY SCORE V18.3 PRODUCTION PREFLIGHT ===");
console.log("READ-ONLY ONLY: no migration, no write, no fixture, no production mutation.");
console.log("");

if (!process.env.DATABASE_URL) {
  fail("DATABASE_URL is not configured. Run this only against the intended production database connection.");
  await prisma.$disconnect();
  process.exit();
}

let dbInfo;
try {
  dbInfo = await prisma.$queryRawUnsafe(`SELECT current_database() AS database_name, current_user AS database_user, version() AS server_version`);
  console.log("Database connectivity: PASS");
  console.log(`Database: ${dbInfo[0]?.database_name ?? "unknown"}`);
  console.log(`Database user: ${dbInfo[0]?.database_user ?? "unknown"}`);
} catch (error) {
  fail(`Database connectivity failed: ${error?.message ?? "unknown error"}`);
  await prisma.$disconnect();
  process.exit();
}

const applied = await prisma.$queryRawUnsafe(`
  SELECT migration_name, finished_at, rolled_back_at
  FROM "_prisma_migrations"
  ORDER BY started_at ASC
`);

const appliedSuccessful = new Set(
  applied.filter((row) => row.finished_at && !row.rolled_back_at).map((row) => row.migration_name),
);
const failed = applied.filter((row) => !row.finished_at && !row.rolled_back_at);
const pending = localMigrations.filter((name) => !appliedSuccessful.has(name));

console.log(`Local migration count: ${localMigrations.length}`);
console.log(`Production applied migration count: ${appliedSuccessful.size}`);
console.log(`Pending local migrations: ${pending.length}`);

if (pending.length) {
  console.log("PENDING MIGRATIONS:");
  for (const name of pending) console.log(`  - ${name}`);
}

if (failed.length) {
  console.log("UNRESOLVED PRODUCTION MIGRATIONS:");
  for (const row of failed) console.log(`  - ${row.migration_name}`);
  fail("Production contains an unfinished migration. Do not deploy until this is reconciled safely.");
}

const migrationHash = migrationSqlHash();
console.log(`Local migration SQL inventory SHA-256: ${migrationHash}`);

// Compare production migration checksums against the local migration files.
// This is read-only and detects migration-history drift even when counts match.
const localMigrationChecksums = new Map();
for (const name of localMigrations) {
  const file = resolve(migrationsDir, name, "migration.sql");
  if (existsSync(file)) localMigrationChecksums.set(name, createHash("sha256").update(readFileSync(file)).digest("hex"));
}
const checksumMismatches = [];
for (const row of applied.filter((r) => r.finished_at && !r.rolled_back_at)) {
  const localChecksum = localMigrationChecksums.get(row.migration_name);
  if (localChecksum && row.checksum && localChecksum !== row.checksum) {
    checksumMismatches.push({ name: row.migration_name, production: row.checksum, local: localChecksum });
  }
}
console.log(`Migration checksum mismatches: ${checksumMismatches.length}`);
if (checksumMismatches.length) {
  console.log("MIGRATION CHECKSUM MISMATCHES:");
  for (const item of checksumMismatches) {
    console.log(`  - ${item.name}`);
    console.log(`    production: ${item.production}`);
    console.log(`    local:      ${item.local}`);
  }
  fail("Production migration checksum drift detected. Do not deploy until the exact migration history is reconciled.");
}

console.log("");
console.log("Critical production data inventory (read-only):");
for (const [label, table] of criticalTables) {
  try {
    const rows = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint AS count FROM "${table}"`);
    console.log(`  ${label}: ${rows[0]?.count?.toString() ?? "0"}`);
  } catch (error) {
    console.log(`  ${label}: UNAVAILABLE (${error?.message ?? "unknown error"})`);
    fail(`Critical table ${table} could not be read.`);
  }
}

console.log("");
console.log("Schema compatibility preflight:");
let diff = "";
try {
  diff = execFileSync(
    "pnpm",
    ["exec", "prisma", "migrate", "diff", "--from-url", process.env.DATABASE_URL, "--to-schema-datamodel", "prisma/schema.prisma", "--script"],
    { cwd: root, env: process.env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  const normalized = diff.trim();
  if (!normalized) {
    console.log("Production schema vs current Prisma schema: NO DIFF");
  } else {
    const lines = normalized.split("\n");
    const destructive = normalized.match(/\b(DROP\s+(TABLE|COLUMN|SCHEMA)|TRUNCATE|DELETE\s+FROM)\b/gi) ?? [];
    console.log(`Production schema vs current Prisma schema: DIFF (${lines.length} lines)`);
    console.log(`Destructive SQL markers detected: ${destructive.length}`);
    console.log("--- BEGIN READ-ONLY SCHEMA DIFF ---");
    lines.forEach((line, index) => console.log(`${String(index + 1).padStart(3, " ")} | ${line}`));
    console.log("--- END READ-ONLY SCHEMA DIFF ---");
    if (destructive.length) {
      fail("Schema diff contains destructive SQL markers. No production deployment is authorized by this preflight.");
    } else {
      console.log("Diff classification: NON-DESTRUCTIVE CANDIDATE — exact SQL review required before any migration decision.");
    }
  }
} catch (error) {
  fail("Prisma schema diff could not be evaluated. Do not infer compatibility from this preflight.");
}

console.log("");
console.log("Backup checkpoint: REQUIRED / OPERATOR VERIFICATION");
console.log("This script intentionally cannot certify that a production backup or snapshot exists.");
console.log("Do not proceed to deployment until a current recoverable backup/snapshot is confirmed outside this script.");

console.log("");
if (process.exitCode === 2) {
  console.log("=== READY SCORE V18.3 PRODUCTION PREFLIGHT — BLOCKED ===");
} else if (pending.length) {
  console.log("=== READY SCORE V18.3 PRODUCTION PREFLIGHT — REVIEW REQUIRED ===");
  console.log("Production has migrations not yet applied. No migration was executed.");
} else {
  console.log("=== READY SCORE V18.3 PRODUCTION PREFLIGHT — READ-ONLY CHECK PASS / BACKUP CONFIRMATION REQUIRED ===");
}

await prisma.$disconnect();
