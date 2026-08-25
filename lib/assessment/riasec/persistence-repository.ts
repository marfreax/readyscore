import type { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma";
import type { RiasecPersistableResult } from "./result-contract";

/**
 * PHASE 3.0-D.1-F.8 / F.9
 *
 * Persistence boundary for RIASEC_RESULT_V1.
 *
 * The Prisma client lives at:
 *   lib/db/prisma
 *
 * This file is under:
 *   lib/assessment/riasec
 *
 * therefore the correct relative path is:
 *   ../../db/prisma
 *
 * This adapter persists the versioned RIASEC payload into the existing
 * AssessmentResult.result JSON field. It does not introduce a new table.
 */

export async function persistRiasecResult(
  result: RiasecPersistableResult,
): Promise<void> {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.assessmentResult.upsert({
      where: {
        attemptId: result.provenance.attemptId,
      },
      create: {
        attemptId: result.provenance.attemptId,
        result: result as unknown as Prisma.InputJsonValue,
      },
      update: {
        result: result as unknown as Prisma.InputJsonValue,
      },
    });
  });
}

export async function getRiasecResult(
  attemptId: string,
): Promise<RiasecPersistableResult | null> {
  const row = await prisma.assessmentResult.findUnique({
    where: { attemptId },
    select: { result: true },
  });

  if (!row?.result || typeof row.result !== "object" || Array.isArray(row.result)) {
    return null;
  }

  const payload = row.result as unknown as Partial<RiasecPersistableResult>;

  if (
    payload.contractVersion !== "RIASEC_RESULT_V1" ||
    !payload.provenance ||
    payload.provenance.testType !== "RIASEC" ||
    !payload.measurement ||
    payload.measurement.testType !== "RIASEC"
  ) {
    return null;
  }

  return payload as RiasecPersistableResult;
}
