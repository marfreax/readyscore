import { prisma } from "./db/prisma";

const BUSINESS_LEAD_SOURCE = "FREE_ASSESSMENT";

type BusinessLeadInput = {
  name: string;
  whatsapp: string;
  email: string | null;
  consent: boolean;
  consentAt: Date;
  assessmentAttemptId: string;
};

type BusinessLeadResult = {
  lead: {
    id: string;
    name: string;
    whatsapp: string;
    email: string | null;
    source: string;
    status: string;
    consent: boolean;
    consentAt: Date;
    assessmentAttemptId: string | null;
  };
  action: "CREATED" | "REUSED";
};

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === "P2002",
  );
}

async function findIdentityMatches(whatsapp: string, email: string | null) {
  return prisma.businessLead.findMany({
    where: {
      OR: [
        { whatsapp },
        ...(email ? [{ email }] : []),
      ],
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
}

function assertIdentityMatches(matches: Awaited<ReturnType<typeof findIdentityMatches>>) {
  if (matches.length > 1) throw new Error("BUSINESS_LEAD_IDENTITY_CONFLICT");
  return matches[0] ?? null;
}

export async function createOrUpdateBusinessLead(input: BusinessLeadInput): Promise<BusinessLeadResult> {
  if (!input.consent) throw new Error("CONSENT_REQUIRED");

  const existing = assertIdentityMatches(
    await findIdentityMatches(input.whatsapp, input.email),
  );

  if (existing) {
    try {
      const lead = await prisma.businessLead.update({
        where: { id: existing.id },
        data: {
          name: input.name,
          whatsapp: input.whatsapp,
          email: input.email,
          source: BUSINESS_LEAD_SOURCE,
          status: existing.status || "NEW",
          consent: existing.consent || input.consent,
          consentAt: existing.consent ? existing.consentAt : input.consentAt,
          assessmentAttemptId: input.assessmentAttemptId,
        },
      });
      return { lead, action: "REUSED" };
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
      const refreshed = assertIdentityMatches(
        await findIdentityMatches(input.whatsapp, input.email),
      );
      if (!refreshed) throw new Error("BUSINESS_LEAD_NOT_FOUND_AFTER_CONFLICT");
      if (refreshed.id !== existing.id) throw new Error("BUSINESS_LEAD_IDENTITY_CONFLICT");
      const lead = await prisma.businessLead.update({
        where: { id: refreshed.id },
        data: {
          name: input.name,
          whatsapp: input.whatsapp,
          email: input.email,
          source: BUSINESS_LEAD_SOURCE,
          consent: refreshed.consent || input.consent,
          consentAt: refreshed.consent ? refreshed.consentAt : input.consentAt,
          assessmentAttemptId: input.assessmentAttemptId,
        },
      });
      return { lead, action: "REUSED" };
    }
  }

  try {
    const lead = await prisma.businessLead.create({
      data: {
        name: input.name,
        whatsapp: input.whatsapp,
        email: input.email,
        source: BUSINESS_LEAD_SOURCE,
        status: "NEW",
        consent: input.consent,
        consentAt: input.consentAt,
        assessmentAttemptId: input.assessmentAttemptId,
      },
    });
    return { lead, action: "CREATED" };
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    const existingAfterRace = assertIdentityMatches(
      await findIdentityMatches(input.whatsapp, input.email),
    );
    if (!existingAfterRace) throw new Error("BUSINESS_LEAD_NOT_FOUND_AFTER_CONFLICT");
    const lead = await prisma.businessLead.update({
      where: { id: existingAfterRace.id },
      data: {
        name: input.name,
        whatsapp: input.whatsapp,
        email: input.email,
        source: BUSINESS_LEAD_SOURCE,
        consent: existingAfterRace.consent || input.consent,
        consentAt: existingAfterRace.consent ? existingAfterRace.consentAt : input.consentAt,
        assessmentAttemptId: input.assessmentAttemptId,
      },
    });
    return { lead, action: "REUSED" };
  }
}

export { BUSINESS_LEAD_SOURCE };
