import { PrismaClient } from "@prisma/client";
import { execFileSync } from "node:child_process";

const RECOVERABLE_MIGRATIONS = new Set([
  "20260827110000_v4_l4_disc_mvp",
  "20260926100000_v18_3_runtime_data_reconciliation",
  "20260927150000_v19_2_learning_preference",
  "20260927151000_v19_2_learning_preference_data",
  "20260927220000_v19_2_failed_runtime_attempt_recovery",
]);
const prisma = new PrismaClient();

try {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT "migration_name", "finished_at", "rolled_back_at" FROM "_prisma_migrations" WHERE "finished_at" IS NULL AND "rolled_back_at" IS NULL ORDER BY "started_at" ASC`,
  );
  for (const state of rows) {
    if (!RECOVERABLE_MIGRATIONS.has(state.migration_name)) continue;
    console.log(`Recovering failed migration ${state.migration_name} as rolled back before deployment.`);
    execFileSync("pnpm", ["exec", "prisma", "migrate", "resolve", "--rolled-back", state.migration_name], { stdio: "inherit" });
  }
} finally {
  await prisma.$disconnect();
}

execFileSync("pnpm", ["exec", "prisma", "migrate", "deploy"], { stdio: "inherit" });
