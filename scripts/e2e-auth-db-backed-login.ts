import { prisma } from "../lib/db/prisma";
import { loginUser } from "../lib/auth/service";
import { getUserRecord } from "../lib/auth/store";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Set ${name}`);
  return value;
}

const email = requiredEnv("READYSCORE_AUTH_E2E_EMAIL").toLowerCase();
const password = requiredEnv("READYSCORE_AUTH_E2E_PASSWORD");

async function main() {
  const dbUser = await prisma.user.findUnique({ where: { email } });
  if (!dbUser) throw new Error(`DB user not found: ${email}`);

  const before = getUserRecord(dbUser.id);
  console.log(`DB user: PASS (${dbUser.role})`);
  console.log(`Auth-store before hydration: ${before ? "PRESENT" : "MISSING"}`);

  const user = await loginUser({ email, password });
  const after = getUserRecord(user.id);
  if (!after) throw new Error("Auth-store hydration failed");
  if (after.email !== email) throw new Error("Hydrated email mismatch");
  if (after.role !== dbUser.role) throw new Error("Hydrated role mismatch");
  if (after.passwordHash !== dbUser.passwordHash) throw new Error("Hydrated password hash mismatch");

  console.log("DB-backed login: PASS");
  console.log("Auth-store hydration: PASS");
}

main().finally(async () => {
  await prisma.$disconnect();
});
