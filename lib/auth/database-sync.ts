import { prisma } from "../db/prisma";
import { getUserRecord } from "./store";

/**
 * Phase 2.16 bridge: authentication still uses the existing auth store,
 * while account/assessment ownership is now backed by PostgreSQL.
 */
export async function syncUserToDatabase(userId: string) {
  const user = getUserRecord(userId);
  if (!user) throw new Error("USER_NOT_FOUND");

  return prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    },
    update: {
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      updatedAt: new Date(user.updatedAt),
    },
  });
}
