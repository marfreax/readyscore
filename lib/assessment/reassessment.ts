import { prisma } from "../db/prisma";
import type { AssessmentType } from "../assessment-config";
import { hasTestAccess } from "../commercial/entitlement-service";

export type ReassessmentTestType = "riasec" | "disc" | "eq" | "cognitive";

const CORE: readonly ReassessmentTestType[] = ["riasec", "disc", "eq", "cognitive"];

export function isReassessmentTestType(value: string): value is ReassessmentTestType {
  return CORE.includes(value as ReassessmentTestType);
}

function prismaTestType(type: ReassessmentTestType) {
  return type.toUpperCase() as "RIASEC" | "DISC" | "EQ" | "COGNITIVE";
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
) {
  if (!isReassessmentTestType(type)) {
    return { eligible: false as const, code: "INVALID_ASSESSMENT_TYPE", message: "Tipe assessment reassessment tidak valid." };
  }

  const resourceType = prismaTestType(type);
  const [access, priorResult, credit, dailyCount] = await Promise.all([
    hasTestAccess(userId, resourceType, now),
    prisma.assessmentAttempt.findFirst({
      where: {
        userId,
        assessmentType: resourceType,
        status: "COMPLETED",
        result: { isNot: null },
      },
      select: { id: true, completedAt: true },
      orderBy: { completedAt: "desc" },
    }),
    prisma.reassessmentCredit.findFirst({
      where: { userId, testType: resourceType, status: "AVAILABLE" },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    }),
    (() => {
      const { start, end } = dayBounds(now);
      return prisma.assessmentAttempt.count({
        where: {
          userId,
          assessmentType: resourceType,
          startedAt: { gte: start, lt: end },
          selectionSnapshot: {
            path: ["reassessment"],
            equals: true,
          },
        },
      });
    })(),
  ]);

  if (!access) return { eligible: false as const, code: "TEST_ACCESS_REQUIRED", message: "Test belum unlocked pada akun ini." };
  if (!priorResult) return { eligible: false as const, code: "INITIAL_ASSESSMENT_REQUIRED", message: "Reassessment hanya tersedia setelah assessment awal selesai." };
  if (!credit) return { eligible: false as const, code: "REASSESSMENT_CREDIT_REQUIRED", message: "Reassessment Credit tidak tersedia." };
  if (dailyCount >= 1) return { eligible: false as const, code: "REASSESSMENT_DAILY_LIMIT", message: "Maksimum 1 reassessment untuk test ini per hari." };

  return {
    eligible: true as const,
    priorAttemptId: priorResult.id,
    creditId: credit.id,
  };
}

export async function consumeReassessmentCreditForAttempt(input: {
  creditId: string;
  userId: string;
  attemptId: string;
  testType: ReassessmentTestType;
}) {
  return prisma.$transaction(async (tx) => {
    const credit = await tx.reassessmentCredit.findUnique({
      where: { id: input.creditId },
    });
    if (!credit || credit.userId !== input.userId) throw new Error("REASSESSMENT_CREDIT_NOT_FOUND");
    if (credit.status !== "AVAILABLE") throw new Error("REASSESSMENT_CREDIT_NOT_AVAILABLE");
    if (credit.testType !== prismaTestType(input.testType)) throw new Error("REASSESSMENT_CREDIT_TYPE_MISMATCH");

    const updated = await tx.reassessmentCredit.updateMany({
      where: { id: input.creditId, userId: input.userId, status: "AVAILABLE" },
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
