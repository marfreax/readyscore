import { PrismaClient } from "@prisma/client";
import { execFileSync } from "node:child_process";

const prisma = new PrismaClient();

try {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT "migration_name", "finished_at", "rolled_back_at" FROM "_prisma_migrations" WHERE "finished_at" IS NULL AND "rolled_back_at" IS NULL ORDER BY "started_at" ASC`,
  );
  if (rows.length > 0) {
    const names = rows.map((row) => row.migration_name).join(", ");
    throw new Error(
      `STOP: unresolved migration failure(s): ${names}. Review the failed migration's database effects and recovery plan before changing migration history.`,
    );
  }
} finally {
  await prisma.$disconnect();
}

execFileSync("pnpm", ["exec", "prisma", "migrate", "deploy"], { stdio: "inherit" });
