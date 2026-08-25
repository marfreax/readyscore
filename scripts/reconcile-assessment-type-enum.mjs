import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../lib/db/prisma.ts";

const APPLY = process.argv.includes("--apply");
const root = process.cwd();

function fail(code, message) {
  console.error(`F.10-C.2-E.2 ENUM RECONCILIATION: FAIL`);
  console.error(`${code}: ${message}`);
  process.exitCode = 1;
}

function quoteIdent(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

try {
  console.log("=== RIASEC F.10-C.2-E.2 ASSESSMENTTYPE ENUM RECONCILIATION ===");
  console.log(`Mode       : ${APPLY ? "TARGETED DATABASE RECONCILIATION" : "READ-ONLY PREFLIGHT"}`);
  console.log("Scope      : PostgreSQL enum AssessmentType only");
  console.log("Protection : No QuestionVersion / question lifecycle mutation");
  console.log("");

  const enumRows = await prisma.$queryRawUnsafe(`
    SELECT e.enumlabel AS value
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'AssessmentType'
    ORDER BY e.enumsortorder
  `);

  const values = enumRows.map(r => String(r.value));
  console.log(`Current AssessmentType values: ${values.join(", ") || "(none)"}`);

  if (values.includes("RIASEC")) {
    console.log("RIASEC enum value            : PRESENT");
    console.log("Database mutation             : NONE");
    console.log("F.10-C.2-E.2 ENUM RECONCILIATION: PASS");
    process.exit(0);
  }

  const migrationPath = join(
    root,
    "prisma/migrations/20260822180000_riasec_assessment_type/migration.sql",
  );

  if (!existsSync(migrationPath)) {
    fail(
      "RIASEC_MIGRATION_NOT_FOUND",
      "Expected migration prisma/migrations/20260822180000_riasec_assessment_type/migration.sql was not found.",
    );
    process.exit();
  }

  const migration = readFileSync(migrationPath, "utf8");
  if (!/ALTER\s+TYPE\s+"?AssessmentType"?\s+ADD\s+VALUE\s+IF\s+NOT\s+EXISTS\s+'RIASEC'/i.test(migration)) {
    fail(
      "MIGRATION_CONTENT_MISMATCH",
      "Expected migration does not explicitly add RIASEC to AssessmentType.",
    );
    process.exit();
  }

  console.log("Canonical migration evidence  : PASS");

  if (!APPLY) {
    console.log("RIASEC enum value             : MISSING");
    console.log("Database mutation             : NONE");
    console.log("");
    console.log("Preflight complete.");
    console.log("To apply ONLY the verified enum reconciliation:");
    console.log("pnpm riasec:enum:reconcile -- --apply");
    process.exitCode = 1;
    process.exit();
  }

  // PostgreSQL permits ADD VALUE IF NOT EXISTS. This is the only mutation performed.
  await prisma.$executeRawUnsafe(`
    ALTER TYPE "AssessmentType" ADD VALUE IF NOT EXISTS 'RIASEC'
  `);

  const verifyRows = await prisma.$queryRawUnsafe(`
    SELECT e.enumlabel AS value
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'AssessmentType'
    ORDER BY e.enumsortorder
  `);

  const verified = verifyRows.map(r => String(r.value));
  if (!verified.includes("RIASEC")) {
    fail("RIASEC_ENUM_RECONCILIATION_FAILED", "RIASEC is still absent after reconciliation.");
    process.exit();
  }

  console.log("RIASEC enum value             : ADDED");
  console.log(`Final AssessmentType values   : ${verified.join(", ")}`);
  console.log("Question lifecycle mutation   : NONE");
  console.log("Assessment data mutation      : NONE");
  console.log("F.10-C.2-E.2 ENUM RECONCILIATION: PASS");
} catch (error) {
  fail(
    "DATABASE_RECONCILIATION_ERROR",
    [
      `name=${error?.name ?? "unknown"}`,
      `message=${error?.message ?? String(error)}`,
      `code=${error?.code ?? "n/a"}`,
      `meta=${error?.meta ? JSON.stringify(error.meta) : "n/a"}`,
    ].join("\n"),
  );
} finally {
  await prisma.$disconnect();
}
