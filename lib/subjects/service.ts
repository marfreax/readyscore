import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { prisma } from "../db/prisma";

export const ACTIVE_SUBJECT_COOKIE = "readyscore_active_subject";

export async function ensureOwnerSubject(accountId: string) {
  const existing = await prisma.subjectProfile.findFirst({ where: { accountId, type: "OWNER" }, orderBy: { createdAt: "asc" } });
  if (existing) return existing;
  const user = await prisma.user.findUnique({ where: { id: accountId }, select: { name: true } });
  if (!user) throw new Error("ACCOUNT_NOT_FOUND");
  return prisma.subjectProfile.create({ data: { id: `sub_owner_${randomBytes(10).toString("hex")}`, accountId, name: user.name, type: "OWNER" } });
}

export async function listSubjects(accountId: string) {
  await ensureOwnerSubject(accountId);
  return prisma.subjectProfile.findMany({ where: { accountId }, orderBy: [{ type: "asc" }, { createdAt: "asc" }], select: { id: true, name: true, type: true, createdAt: true } });
}

export async function getSubjectForAccount(accountId: string, subjectId: string) {
  const subject = await prisma.subjectProfile.findFirst({ where: { id: subjectId, accountId }, select: { id: true, accountId: true, name: true, type: true } });
  if (!subject) throw new Error("SUBJECT_NOT_FOUND");
  return subject;
}

export async function createChildSubject(accountId: string, name: string) {
  const normalized = name.trim();
  if (normalized.length < 2) throw new Error("INVALID_SUBJECT_NAME");
  await ensureOwnerSubject(accountId);
  const exists = await prisma.subjectProfile.findFirst({ where: { accountId, name: normalized } });
  if (exists) throw new Error("SUBJECT_ALREADY_EXISTS");
  return prisma.subjectProfile.create({ data: { id: `sub_${randomBytes(12).toString("hex")}`, accountId, name: normalized, type: "CHILD" }, select: { id: true, name: true, type: true, createdAt: true } });
}

export async function getActiveSubject(accountId: string, requestedSubjectId?: string | null) {
  const jar = await cookies();
  const cookieSubjectId = jar.get(ACTIVE_SUBJECT_COOKIE)?.value ?? null;
  const candidate = requestedSubjectId ?? cookieSubjectId;
  if (candidate) {
    const subject = await prisma.subjectProfile.findFirst({ where: { id: candidate, accountId }, select: { id: true, accountId: true, name: true, type: true } });
    if (subject) return subject;
  }
  return ensureOwnerSubject(accountId);
}

export async function selectActiveSubject(accountId: string, subjectId: string) {
  const subject = await getSubjectForAccount(accountId, subjectId);
  const jar = await cookies();
  jar.set(ACTIVE_SUBJECT_COOKIE, subject.id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  return subject;
}
