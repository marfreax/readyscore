import { prisma } from "../db/prisma";
import type { AssessmentType } from "../assessment-config";
import { hasTestAccess } from "../commercial/entitlement-service";
import { ensureOwnerSubject } from "../subjects/service";

export type ReassessmentTestType = "riasec" | "disc" | "eq" | "cognitive" | "work-attitude" | "learning-preference";

const CORE: readonly ReassessmentTestType[] = ["riasec", "disc", "eq", "cognitive", "work-attitude", "learning-preference"];

export function isReassessmentTestType(value: string): value is ReassessmentTestType {
  return CORE.includes(value as ReassessmentTestType);
}

function prismaTestType(type: ReassessmentTestType) {
  return type.toUpperCase().replace("-", "_") as "RIASEC" | "DISC" | "EQ" | "COGNITIVE" | "WORK_ATTITUDE" | "LEARNING_PREFERENCE";
}

function dayBounds(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function grantReassessmentCredit(input: {
  userId: string;
  subjectId?: string;
  testType: ReassessmentTestType;
  source?: string;
}) {
  const addOn = await prisma.addOnProduct.findUnique({
    where: { id: "addon-reassessment-credit-v1" },
    select: { id: true, status: true },
  });
  if (!addOn || addOn.status !== "ACTIVE") throw new Error("REASSESSMENT_CREDIT_PRODUCT_NOT_ACTIVE");
  return prisma.reassessmentCredit.create({
    data: {
      userId: input.userId,
      subjectId: input.subjectId ?? (await ensureOwnerSubject(input.userId)).id,
      addOnProductId: addOn.id,
      testType: prismaTestType(input.testType),
      source: input.source ?? "MANUAL",
    },
  });
}

export async function getReassessmentEligibility(
  userId: string,
  type: ReassessmentTestType,
  now = new Date(),
  subjectId?: string,
) {
  if (!isReassessmentTestType(type)) {
    return { eligible: false as const, code: "INVALID_ASSESSMENT_TYPE", message: "Tipe assessment reassessment tidak valid." };
  }

  const resourceType = prismaTestType(type);
  const [access, priorResult, credit, dailyCount] = await Promise.all([
    hasTestAccess(userId, resourceType, now, subjectId),
    prisma.assessmentAttempt.findFirst({
      where: {
        userId,
        subjectId,
        assessmentType: resourceType,
        status: "COMPLETED",
        result: { isNot: null },
      },
      select: { id: true, completedAt: true },
      orderBy: { completedAt: "desc" },
    }),
    prisma.reassessmentCredit.findFirst({
      where: { userId, subjectId, testType: resourceType, status: "AVAILABLE" },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    }),
    (() => {
      const { start, end } = dayBounds(now);
      return prisma.assessmentAttempt.count({
        where: {
          userId,
          subjectId,
          assessmentType: resourceType,
          status: "COMPLETED",
          completedAt: { gte: start, lt: end },
        },
      });
    })(),
  ]);

  if (!access) return { eligible: false as const, code: "TEST_ACCESS_REQUIRED", message: "Test belum unlocked pada akun ini." };
  if (!priorResult) return { eligible: false as const, code: "INITIAL_ASSESSMENT_REQUIRED", message: "Reassessment hanya tersedia setelah assessment awal selesai." };
  if (dailyCount >= 1) return { eligible: false as const, code: "REASSESSMENT_DAILY_LIMIT", creditAvailable: Boolean(credit), message: "Maksimum 1 assessment untuk test ini per hari." };
  if (!credit) return { eligible: false as const, code: "REASSESSMENT_CREDIT_REQUIRED", message: "Reassessment Credit tidak tersedia." };

  return {
    eligible: true as const,
    priorAttemptId: priorResult.id,
    creditId: credit.id,
  };
}

export async function consumeReassessmentCreditForAttempt(input: {
  creditId: string;
  userId: string;
  subjectId: string;
  attemptId: string;
  testType: ReassessmentTestType;
}) {
  return prisma.$transaction(async (tx) => {
    const credit = await tx.reassessmentCredit.findUnique({
      where: { id: input.creditId },
    });
    if (!credit || credit.userId !== input.userId || credit.subjectId !== input.subjectId) throw new Error("REASSESSMENT_CREDIT_NOT_FOUND");
    if (credit.status !== "AVAILABLE") throw new Error("REASSESSMENT_CREDIT_NOT_AVAILABLE");
    if (credit.testType !== prismaTestType(input.testType)) throw new Error("REASSESSMENT_CREDIT_TYPE_MISMATCH");

    const updated = await tx.reassessmentCredit.updateMany({
      where: { id: input.creditId, userId: input.userId, subjectId: input.subjectId, status: "AVAILABLE" },
      data: {
        status: "CONSUMED",
        consumedAt: new Date(),
        consumedAttemptId: input.attemptId,
      },
    });
    if (updated.count !== 1) throw new Error("REASSESSMENT_CREDIT_RACE");
    return credit;
  });
}
