import { prisma } from "../db/prisma";
import {
  authenticate,
  createUser,
  findUserByEmail,
  getUserRecord,
  upsertUserRecord,
  hashPassword,
  toPublicUser,
  verifyPassword,
} from "./store";
import { syncUserToDatabase } from "./database-sync";
import type { PublicUser } from "./types";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function validateCredentials(input: { name?: string; email?: string; password?: string }) {
  const email = normalizeEmail(input.email ?? "");
  const password = input.password ?? "";
  if (!email || !email.includes("@")) throw new Error("INVALID_EMAIL");
  if (password.length < 8) throw new Error("PASSWORD_TOO_SHORT");
  return { email, password };
}

export async function registerUser(input: { name: string; email: string; password: string }): Promise<PublicUser> {
  const name = input.name.trim();
  if (!name) throw new Error("INVALID_NAME");
  const { email, password } = validateCredentials(input);

  const existingDb = await prisma.user.findUnique({ where: { email } });
  const existingAuth = findUserByEmail(email);
  if (existingDb || existingAuth) throw new Error("EMAIL_ALREADY_EXISTS");

  const user = createUser({ name, email, password });
  await syncUserToDatabase(user.id);
  return user;
}

export async function loginUser(input: { email: string; password: string }): Promise<PublicUser> {
  const { email, password } = validateCredentials(input);

  try {
    const user = authenticate({ email, password });
    await syncUserToDatabase(user.id);
    return user;
  } catch (error) {
    if (error instanceof Error && error.message !== "INVALID_CREDENTIALS") throw error;
  }

  const dbUser = await prisma.user.findUnique({ where: { email } });
  if (!dbUser || !verifyPassword(password, dbUser.passwordHash)) {
    throw new Error("INVALID_CREDENTIALS");
  }
  if (dbUser.status !== "ACTIVE") throw new Error("ACCOUNT_INACTIVE");

  const dbRecord = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    passwordHash: dbUser.passwordHash,
    role: dbUser.role,
    status: dbUser.status,
    createdAt: dbUser.createdAt.toISOString(),
    updatedAt: dbUser.updatedAt.toISOString(),
  } as const;

  // The database is an authoritative authentication source for accounts that
  // may have been provisioned outside the local auth-state store. Hydrate the
  // exact verified DB identity into the session store before startSession().
  // This keeps DB-backed accounts loginable without changing password, role, or
  // entitlement semantics.
  upsertUserRecord(dbRecord);
  return toPublicUser(dbRecord);
}
