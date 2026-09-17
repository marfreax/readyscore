import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const MIGRATION = "20260917220000_v17_2_whatsapp_conversation_message";
const migrationPath = resolve(process.cwd(), "prisma", "migrations", MIGRATION, "migration.sql");
const prisma = new PrismaClient();

function assertSafeIdentifier(value) {
  if (!/^[A-Za-z0-9_]+$/.test(value)) throw new Error(`Unsafe migration identifier: ${value}`);
}

function splitStatements(sql) {
  // V17.2 migration contains plain PostgreSQL DDL without semicolons inside literals.
  return sql
    .split(/;\s*(?:\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

try {
  assertSafeIdentifier(MIGRATION);
  const sql = await readFile(migrationPath, "utf8");
  const checksum = createHash("sha256").update(sql).digest("hex");

  const history = await prisma.$queryRaw`
    SELECT "migration_name", "checksum", "finished_at", "rolled_back_at"
    FROM "_prisma_migrations"
    WHERE "migration_name" = ${MIGRATION}
    ORDER BY "started_at" DESC
    LIMIT 1
  `;

  if (history[0]?.finished_at && !history[0]?.rolled_back_at) {
    if (history[0].checksum !== checksum) {
      throw new Error(`V17.2 migration history checksum mismatch for ${MIGRATION}; refusing to modify migration history.`);
    }
    console.log(`V17.2 migration already applied: ${MIGRATION}`);
    process.exit(0);
  }

  const tableCheck = await prisma.$queryRaw`
    SELECT
      to_regclass('public."WhatsAppConversation"')::text AS "conversationTable",
      to_regclass('public."WhatsAppMessage"')::text AS "messageTable"
  `;
  const tablesExist = Boolean(tableCheck[0]?.conversationTable && tableCheck[0]?.messageTable);

  if (tablesExist) {
    throw new Error(
      "V17.2 tables already exist but migration history is not marked applied; refusing to guess or modify _prisma_migrations. Inspect the local migration state before continuing.",
    );
  }

  const statements = splitStatements(sql);
  console.log(`Applying only ${MIGRATION} directly in one PostgreSQL transaction.`);
  console.log("Existing migration files/history are not modified.");

  await prisma.$transaction(async (tx) => {
    for (const statement of statements) {
      await tx.$executeRawUnsafe(statement);
    }

    const now = new Date();
    await tx.$executeRaw`
      INSERT INTO "_prisma_migrations"
        ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
      VALUES
        (${randomUUID()}, ${checksum}, ${now}, ${MIGRATION}, NULL, NULL, ${now}, 1)
    `;
  });

  console.log(`V17.2 migration applied and recorded: ${MIGRATION}`);
  console.log("No previous migration file or migration record was modified.");
} finally {
  await prisma.$disconnect();
}
