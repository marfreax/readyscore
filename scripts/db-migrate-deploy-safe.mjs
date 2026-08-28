import { PrismaClient } from "@prisma/client";
import { execFileSync } from "node:child_process";

const MIGRATION = "20260827110000_v4_l4_disc_mvp";
const prisma = new PrismaClient();

try {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT "migration_name", "finished_at", "rolled_back_at" FROM "_prisma_migrations" WHERE "migration_name" = '${MIGRATION}' ORDER BY "started_at" DESC LIMIT 1`,
  );
  const state = rows[0];
  if (state && !state.finished_at && !state.rolled_back_at) {
    console.log(`Recovering failed migration ${MIGRATION} as rolled back before deployment.`);
    execFileSync("pnpm", ["exec", "prisma", "migrate", "resolve", "--rolled-back", MIGRATION], { stdio: "inherit" });
  }
} finally {
  await prisma.$disconnect();
}

execFileSync("pnpm", ["exec", "prisma", "migrate", "deploy"], { stdio: "inherit" });
