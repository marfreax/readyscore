import { prisma } from "./db/prisma";
import { buildFreeReport } from "./free-report";
import type { AssessmentResult } from "./assessment/types";
import {
  AdminPaginatedResult,
  AdminPaginationInput,
  createAdminPaginatedResult,
  normalizeAdminPagination,
} from "./admin-pagination";

export type AdminBusinessLead = {
  id: string;
  name: string;
  whatsapp: string;
  email: string | null;
  source: string;
  status: string;
  consent: boolean;
  consentAt: string;
  createdAt: string;
  updatedAt: string;
  assessmentAttemptId: string | null;
  assessmentResult: string | null;
  pdfStatus: string | null;
  whatsappStatus: string | null;
  emailStatus: string | null;
};

export type AdminBusinessLeadSummary = {
  total: number;
  new: number;
  withEmail: number;
};

export async function listAdminBusinessLeadsPaginated(
  input: AdminPaginationInput = {},
): Promise<AdminPaginatedResult<AdminBusinessLead> & { summary: AdminBusinessLeadSummary }> {
  const pagination = normalizeAdminPagination(input);
  const [total, fresh, withEmail, leads] = await prisma.$transaction([
    prisma.businessLead.count(),
    prisma.businessLead.count({ where: { status: "NEW" } }),
    prisma.businessLead.count({ where: { email: { not: null } } }),
    prisma.businessLead.findMany({
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      skip: pagination.offset,
      take: pagination.limit,
      include: {
        assessmentAttempt: {
          select: {
            id: true,
            result: { select: { result: true } },
            freeReportDelivery: {
              select: { pdfStatus: true, whatsappStatus: true, emailStatus: true },
            },
          },
        },
      },
    }),
  ]);

  const items = leads.map((lead) => {
    let assessmentResult: string | null = null;
    if (lead.assessmentAttempt?.result?.result) {
      try {
        assessmentResult = buildFreeReport(lead.assessmentAttempt.result.result as unknown as AssessmentResult).typeName;
      } catch {
        assessmentResult = null;
      }
    }
    return {
      id: lead.id,
      name: lead.name,
      whatsapp: lead.whatsapp,
      email: lead.email,
      source: lead.source,
      status: lead.status,
      consent: lead.consent,
      consentAt: lead.consentAt.toISOString(),
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
      assessmentAttemptId: lead.assessmentAttemptId,
      assessmentResult,
      pdfStatus: lead.assessmentAttempt?.freeReportDelivery?.pdfStatus ?? null,
      whatsappStatus: lead.assessmentAttempt?.freeReportDelivery?.whatsappStatus ?? null,
      emailStatus: lead.assessmentAttempt?.freeReportDelivery?.emailStatus ?? null,
    };
  });

  return {
    ...createAdminPaginatedResult(items, pagination, total),
    summary: { total, new: fresh, withEmail },
  };
}
