import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../db/prisma";
import { resolveClientDiscAssessmentConfiguration } from "../assessment/runtime-configuration";
import { sendClientInvitationEmail, sendClientResultEmail } from "./email";
import { buildAssessmentReportV19_3 } from "../reports/v19-3-engine";
import { renderAssessmentReportPdfV19_3 } from "../reports/pdf-v19-3";
import type { ClientOrganizationRole, ClientOrganizationSummary } from "./types";
import { releaseInvitationCredit, reserveInvitationCredit } from "./credits";

function activeWindow(now = new Date()) {
  return {
    startsAt: { lte: now },
    OR: [{ endsAt: null }, { endsAt: { gt: now } }],
  };
}

/**
 * Lists only organizations the authenticated user actively belongs to.
 * Organization IDs supplied by a browser must never bypass this boundary.
 */
export async function listClientOrganizations(
  userId: string,
  now = new Date(),
): Promise<ClientOrganizationSummary[]> {
  const rows = await prisma.clientOrganizationMembership.findMany({
    where: {
      userId,
      status: "ACTIVE",
      ...activeWindow(now),
      organization: { status: "ACTIVE" },
    },
    orderBy: { createdAt: "asc" },
    select: {
      role: true,
      organization: {
        select: { id: true, code: true, name: true, websiteUrl: true, logoUrl: true, status: true },
      },
    },
  });

  return rows.map((row) => ({
    ...row.organization,
    membership: { role: row.role as ClientOrganizationRole },
  }));
}

/** Creates the first organization for an authenticated client self-signup. */
export async function createClientOrganizationForUser(input: {
  userId: string;
  name: string;
  websiteUrl?: string | null;
  logoUrl?: string | null;
}) {
  const name = input.name.trim();
  const websiteUrl = input.websiteUrl?.trim() || null;
  const logoUrl = input.logoUrl?.trim() || null;
  if (name.length < 2 || name.length > 160) throw new Error("INVALID_CLIENT_ORGANIZATION");
  if (websiteUrl) validateHttpsUrl(websiteUrl, "INVALID_WEBSITE_URL");
  if (logoUrl) {
    validateHttpsUrl(logoUrl, "INVALID_LOGO_URL");
  }

  const membershipCount = await prisma.clientOrganizationMembership.count({ where: { userId: input.userId } });
  if (membershipCount > 0) throw new Error("CLIENT_ORGANIZATION_ALREADY_LINKED");

  const code = `RS-${randomBytes(6).toString("hex").toUpperCase()}`;
  return prisma.$transaction(async (tx) => {
    // Recheck inside the write transaction so parallel requests cannot create
    // multiple organizations for the same new client account.
    const existingMembership = await tx.clientOrganizationMembership.findFirst({ where: { userId: input.userId }, select: { id: true } });
    if (existingMembership) throw new Error("CLIENT_ORGANIZATION_ALREADY_LINKED");
    const organization = await tx.clientOrganization.create({ data: { code, name, websiteUrl, logoUrl } });
    await tx.clientOrganizationMembership.create({ data: { organizationId: organization.id, userId: input.userId, role: "ADMIN", status: "ACTIVE" } });
    await tx.adminContentAuditEvent.create({ data: { entityType: "CLIENT_ORGANIZATION", entityId: organization.id, action: "CLIENT_ORGANIZATION_SELF_REGISTERED", toStatus: "ACTIVE", actorUserId: input.userId, metadata: { code, name } } });
    return organization;
  }, { isolationLevel: "Serializable" });
}

function validateHttpsUrl(value: string, errorCode: string) {
  let parsed: URL;
  try { parsed = new URL(value); } catch { throw new Error(errorCode); }
  if (value.length > 2048 || parsed.protocol !== "https:" || !parsed.hostname) throw new Error(errorCode);
  return value;
}

export async function updateClientOrganizationProfile(input: {
  organizationId: string;
  userId: string;
  name: string;
  websiteUrl?: string | null;
  logoUrl?: string | null;
}) {
  const workspace = await requireClientOrganizationAdmin(input.userId, input.organizationId);
  const name = input.name.trim();
  const websiteUrl = input.websiteUrl?.trim() || null;
  const logoUrl = input.logoUrl?.trim() || null;
  if (name.length < 2 || name.length > 160) throw new Error("INVALID_CLIENT_ORGANIZATION");
  if (websiteUrl) validateHttpsUrl(websiteUrl, "INVALID_WEBSITE_URL");
  if (logoUrl) validateHttpsUrl(logoUrl, "INVALID_LOGO_URL");
  const before = workspace.organization;
  const organization = await prisma.$transaction(async (tx) => {
    const updated = await tx.clientOrganization.update({ where: { id: input.organizationId }, data: { name, websiteUrl, logoUrl } });
    await tx.adminContentAuditEvent.create({
      data: {
        entityType: "CLIENT_ORGANIZATION",
        entityId: updated.id,
        action: "CLIENT_ORGANIZATION_PROFILE_UPDATED",
        actorUserId: input.userId,
        metadata: { changed: { name: before.name !== name, websiteUrl: before.websiteUrl !== websiteUrl, logoUrl: before.logoUrl !== logoUrl } },
      },
    });
    return updated;
  });
  return organization;
}

/**
 * Resolves a single client workspace only through an active membership.
 * Call this from every organization-scoped page/API before loading data.
 */
export async function getClientOrganizationWorkspace(
  userId: string,
  organizationId: string,
  now = new Date(),
) {
  const row = await prisma.clientOrganizationMembership.findFirst({
    where: {
      organizationId,
      userId,
      status: "ACTIVE",
      ...activeWindow(now),
      organization: { status: "ACTIVE" },
    },
    select: {
      role: true,
      organization: {
        select: { id: true, code: true, name: true, websiteUrl: true, logoUrl: true, status: true },
      },
    },
  });

  if (!row) return null;
  return {
    organization: row.organization,
    membership: { role: row.role as ClientOrganizationRole },
  };
}

export async function requireClientOrganizationAdmin(
  userId: string,
  organizationId: string,
  now = new Date(),
) {
  const workspace = await getClientOrganizationWorkspace(userId, organizationId, now);
  if (!workspace) throw new Error("CLIENT_ORGANIZATION_ACCESS_DENIED");
  if (workspace.membership.role !== "ADMIN") throw new Error("CLIENT_ORGANIZATION_ADMIN_REQUIRED");
  return workspace;
}

function normalizeEmail(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error("INVALID_EMAIL");
  return normalized;
}

function invitationTokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createClientInvitation(input: {
  organizationId: string;
  actorUserId: string;
  email: string;
  category: "CANDIDATE" | "EMPLOYEE";
  jobTitle?: string;
  department?: string;
  expiresInDays?: number;
  baseUrl: string;
}) {
  const workspace = await requireClientOrganizationAdmin(input.actorUserId, input.organizationId);
  const email = normalizeEmail(input.email);
  const expiresInDays = input.expiresInDays ?? 7;
  if (!Number.isInteger(expiresInDays) || expiresInDays < 1 || expiresInDays > 30) throw new Error("INVALID_EXPIRY");

  const config = await resolveClientDiscAssessmentConfiguration();
  const packageVersion = config.questionPackageVersion;
  if (!packageVersion || packageVersion.totalQuestions !== 100) throw new Error("CLIENT_DISC_PACKAGE_NOT_READY");

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
  const invitation = await prisma.$transaction(async (tx) => {
    const participant = await tx.clientParticipant.upsert({
      where: { organizationId_email: { organizationId: input.organizationId, email } },
      create: { organizationId: input.organizationId, fullName: null, email, whatsapp: null, category: input.category },
      update: { category: input.category },
      select: { id: true },
    });
    const created = await tx.clientInvitation.create({
      data: {
        organizationId: input.organizationId,
        createdByUserId: input.actorUserId,
        participantId: participant.id,
        email,
        category: input.category,
        jobTitle: input.jobTitle?.trim() || null,
        department: input.department?.trim() || null,
        tokenHash: invitationTokenHash(token),
        status: "DRAFT",
        assessmentConfigurationVersionId: config.id,
        questionPackageVersionId: packageVersion.id,
        expiresAt,
      },
    });
    await reserveInvitationCredit(tx, input.organizationId, created.id);
    await tx.adminContentAuditEvent.create({ data: { entityType: "CLIENT_INVITATION", entityId: created.id, action: "CLIENT_DISC_INVITATION_CREATED", toStatus: "DRAFT", actorUserId: input.actorUserId, metadata: { organizationId: input.organizationId, category: input.category, emailDomain: email.split("@")[1] } } });
    return created;
  });
  const inviteUrl = `${input.baseUrl.replace(/\/$/, "")}/invite/${token}`;

  try {
    const delivery = await prisma.clientInvitation.update({ where: { id: invitation.id }, data: { invitationDeliveryAttempt: { increment: 1 } }, select: { invitationDeliveryAttempt: true } });
    await sendClientInvitationEmail({
      to: email,
      clientName: workspace.organization.name,
      clientLogoUrl: workspace.organization.logoUrl,
      inviteUrl,
      expiresAt,
      invitationId: invitation.id,
      deliveryAttempt: delivery.invitationDeliveryAttempt,
    });
    await prisma.clientInvitation.update({
      where: { id: invitation.id },
      data: { status: "SENT", sentAt: new Date() },
    });
    return { id: invitation.id, status: "SENT" as const, expiresAt: expiresAt.toISOString(), inviteUrl: null };
  } catch {
    await prisma.clientInvitation.update({
      where: { id: invitation.id },
      data: { status: "DELIVERY_FAILED" },
    });
    // Return the one-time URL to the authorized client admin so delivery can
    // still be completed manually without storing the raw token in the DB.
    return { id: invitation.id, status: "DELIVERY_FAILED" as const, expiresAt: expiresAt.toISOString(), inviteUrl };
  }
}

export async function resendClientInvitation(input: { organizationId: string; invitationId: string; userId: string; baseUrl: string }) {
  const workspace = await requireClientOrganizationAdmin(input.userId, input.organizationId);
  const current = await prisma.clientInvitation.findFirst({ where: { id: input.invitationId, organizationId: input.organizationId }, select: { id: true, email: true, status: true, expiresAt: true } });
  if (!current) throw new Error("CLIENT_INVITATION_NOT_FOUND");
  if (!["SENT", "OPENED", "EXPIRED", "DELIVERY_FAILED"].includes(current.status)) throw new Error("CLIENT_INVITATION_CANNOT_RESEND");

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const changed = await prisma.$transaction(async (tx) => {
    const updated = await tx.clientInvitation.updateMany({
      where: { id: current.id, organizationId: input.organizationId, status: current.status },
      data: { tokenHash: invitationTokenHash(token), status: "DRAFT", expiresAt, revokedAt: null },
    });
    if (updated.count !== 1) throw new Error("CLIENT_INVITATION_STATE_CHANGED");
    await reserveInvitationCredit(tx, input.organizationId, current.id);
    await tx.adminContentAuditEvent.create({ data: { entityType: "CLIENT_INVITATION", entityId: current.id, action: "CLIENT_DISC_INVITATION_RESEND_REQUESTED", fromStatus: current.status, toStatus: "DRAFT", actorUserId: input.userId, metadata: { organizationId: input.organizationId } } });
    return tx.clientInvitation.update({ where: { id: current.id }, data: { invitationDeliveryAttempt: { increment: 1 } }, select: { invitationDeliveryAttempt: true } });
  });
  const inviteUrl = `${input.baseUrl.replace(/\/$/, "")}/invite/${token}`;
  try {
    const provider = await sendClientInvitationEmail({ to: current.email, clientName: workspace.organization.name, clientLogoUrl: workspace.organization.logoUrl, inviteUrl, expiresAt, invitationId: current.id, deliveryAttempt: changed.invitationDeliveryAttempt });
    await prisma.clientInvitation.updateMany({ where: { id: current.id, status: "DRAFT" }, data: { status: "SENT", sentAt: new Date() } });
    await prisma.adminContentAuditEvent.create({ data: { entityType: "CLIENT_INVITATION", entityId: current.id, action: "CLIENT_DISC_INVITATION_RESENT", fromStatus: "DRAFT", toStatus: "SENT", actorUserId: input.userId, metadata: { organizationId: input.organizationId, providerMessageId: provider.providerMessageId } } });
    return { id: current.id, status: "SENT" as const, expiresAt: expiresAt.toISOString(), inviteUrl: null };
  } catch {
    await prisma.clientInvitation.updateMany({ where: { id: current.id, status: "DRAFT" }, data: { status: "DELIVERY_FAILED" } });
    await prisma.adminContentAuditEvent.create({ data: { entityType: "CLIENT_INVITATION", entityId: current.id, action: "CLIENT_DISC_INVITATION_RESEND_FAILED", fromStatus: "DRAFT", toStatus: "DELIVERY_FAILED", actorUserId: input.userId, metadata: { organizationId: input.organizationId } } });
    return { id: current.id, status: "DELIVERY_FAILED" as const, expiresAt: expiresAt.toISOString(), inviteUrl };
  }
}

export async function revokeClientInvitation(input: { organizationId: string; invitationId: string; userId: string }) {
  await requireClientOrganizationAdmin(input.userId, input.organizationId);
  const invitation = await prisma.clientInvitation.findFirst({ where: { id: input.invitationId, organizationId: input.organizationId }, select: { id: true, status: true } });
  if (!invitation) throw new Error("CLIENT_INVITATION_NOT_FOUND");
  if (!["DRAFT", "SENT", "OPENED", "DELIVERY_FAILED"].includes(invitation.status)) throw new Error("CLIENT_INVITATION_CANNOT_REVOKE");
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const updated = await tx.clientInvitation.updateMany({ where: { id: invitation.id, organizationId: input.organizationId, status: invitation.status }, data: { status: "REVOKED", revokedAt: now } });
    if (updated.count !== 1) throw new Error("CLIENT_INVITATION_STATE_CHANGED");
    await tx.adminContentAuditEvent.create({ data: { entityType: "CLIENT_INVITATION", entityId: invitation.id, action: "CLIENT_DISC_INVITATION_REVOKED", fromStatus: invitation.status, toStatus: "REVOKED", actorUserId: input.userId, metadata: { organizationId: input.organizationId } } });
  });
  await releaseInvitationCredit(invitation.id, "INVITATION_REVOKED");
  return { id: invitation.id, status: "REVOKED" as const };
}

/** Atomically claims one delivery attempt before generating or sending the participant PDF. */
export async function deliverClientAssessmentResultEmail(invitationId: string) {
  const invitation = await prisma.clientInvitation.findFirst({
    where: { id: invitationId, status: "COMPLETED" },
    select: { id: true, organizationId: true, status: true, resultEmailStatus: true, participant: { select: { fullName: true, email: true } }, organization: { select: { name: true } }, assessmentAttempt: { select: { id: true, assessmentType: true, completedAt: true, result: { select: { result: true } } } } },
  });
  if (!invitation?.participant?.fullName || !invitation.assessmentAttempt?.result?.result || !invitation.assessmentAttempt.completedAt) throw new Error("CLIENT_RESULT_NOT_AVAILABLE");
  if (invitation.resultEmailStatus === "SENT") return "SENT" as const;
  if (invitation.resultEmailStatus === "PENDING") return "PENDING" as const;
  const claimed = await prisma.clientInvitation.updateMany({ where: { id: invitationId, status: "COMPLETED", resultEmailStatus: { in: ["NOT_SENT", "FAILED"] } }, data: { resultEmailStatus: "PENDING", resultEmailError: null, resultEmailAttemptCount: { increment: 1 } } });
  if (claimed.count !== 1) {
    const current = await prisma.clientInvitation.findUnique({ where: { id: invitationId }, select: { resultEmailStatus: true } });
    return current?.resultEmailStatus === "SENT" ? "SENT" as const : "PENDING" as const;
  }
  const attempt = await prisma.clientInvitation.findUniqueOrThrow({ where: { id: invitationId }, select: { resultEmailAttemptCount: true } });
  try {
    const report = buildAssessmentReportV19_3({ attemptId: invitation.assessmentAttempt.id, participantName: invitation.participant.fullName, accountOwnerName: invitation.organization.name, assessmentType: invitation.assessmentAttempt.assessmentType, completedAt: invitation.assessmentAttempt.completedAt, result: invitation.assessmentAttempt.result.result });
    const pdf = await renderAssessmentReportPdfV19_3(report, { clientName: invitation.organization.name });
    const provider = await sendClientResultEmail({ to: invitation.participant.email, participantName: invitation.participant.fullName, clientName: invitation.organization.name, invitationId, deliveryAttempt: attempt.resultEmailAttemptCount, pdf, fileName: `readyscore-disc-${invitation.assessmentAttempt.id}.pdf` });
    await prisma.clientInvitation.update({ where: { id: invitationId }, data: { resultEmailStatus: "SENT", resultEmailSentAt: new Date(), resultEmailError: null, resultEmailProviderMessageId: provider.providerMessageId } });
    return "SENT" as const;
  } catch {
    await prisma.clientInvitation.update({ where: { id: invitationId }, data: { resultEmailStatus: "FAILED", resultEmailError: "DELIVERY_FAILED" } });
    return "FAILED" as const;
  }
}

export async function retryClientResultEmail(input: { organizationId: string; invitationId: string; userId: string }) {
  await requireClientOrganizationAdmin(input.userId, input.organizationId);
  const invitation = await prisma.clientInvitation.findFirst({ where: { id: input.invitationId, organizationId: input.organizationId, status: "COMPLETED" }, select: { id: true, resultEmailStatus: true } });
  if (!invitation) throw new Error("CLIENT_INVITATION_NOT_FOUND");
  if (invitation.resultEmailStatus !== "FAILED") throw new Error("CLIENT_RESULT_EMAIL_NOT_RETRYABLE");
  await prisma.adminContentAuditEvent.create({ data: { entityType: "CLIENT_INVITATION", entityId: invitation.id, action: "CLIENT_DISC_RESULT_EMAIL_RETRY_REQUESTED", fromStatus: "FAILED", toStatus: "PENDING", actorUserId: input.userId, metadata: { organizationId: input.organizationId } } });
  return deliverClientAssessmentResultEmail(invitation.id);
}

export async function listClientInvitations(organizationId: string, userId: string) {
  const workspace = await getClientOrganizationWorkspace(userId, organizationId);
  if (!workspace) throw new Error("CLIENT_ORGANIZATION_ACCESS_DENIED");
  const rows = await prisma.clientInvitation.findMany({
    where: { organizationId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 100,
    select: {
      id: true,
      email: true,
      category: true,
      jobTitle: true,
      department: true,
      status: true,
      expiresAt: true,
      sentAt: true,
      openedAt: true,
      completedAt: true,
      resultEmailStatus: true,
      createdAt: true,
      participant: { select: { id: true, fullName: true, category: true } },
      assessmentConfigurationVersion: { select: { questionCount: true } },
      questionPackageVersion: { select: { timeLimitSeconds: true } },
    },
  });
  return rows.map((row) => ({
    ...row,
    expiresAt: row.expiresAt.toISOString(),
    sentAt: row.sentAt?.toISOString() ?? null,
    openedAt: row.openedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function listClientParticipants(organizationId: string, userId: string) {
  const workspace = await getClientOrganizationWorkspace(userId, organizationId);
  if (!workspace) throw new Error("CLIENT_ORGANIZATION_ACCESS_DENIED");
  const rows = await prisma.clientParticipant.findMany({
    where: { organizationId },
    orderBy: [{ category: "asc" }, { fullName: "asc" }, { email: "asc" }],
    select: {
      id: true, fullName: true, email: true, whatsapp: true, category: true,
      updatedAt: true,
      invitations: {
        where: { status: "COMPLETED" }, orderBy: [{ completedAt: "desc" }, { id: "desc" }], take: 1,
        select: { id: true, status: true, completedAt: true, assessmentAttempt: { select: { result: { select: { result: true } } } } },
      },
    },
  });
  await prisma.adminContentAuditEvent.create({ data: { entityType: "CLIENT_PARTICIPANT_DIRECTORY", entityId: organizationId, action: "CLIENT_DISC_PARTICIPANT_LIST_VIEWED", actorUserId: userId, metadata: { participantCount: rows.length } } });
  return rows.map(({ invitations, ...participant }) => {
    const latest = invitations[0];
    const disc = latest ? extractDiscDirectoryResult(latest.assessmentAttempt?.result?.result) : null;
    return {
      ...participant,
      latestDisc: latest && disc ? {
        invitationId: latest.id,
        completedAt: latest.completedAt?.toISOString() ?? null,
        ...disc,
      } : null,
    };
  });
}

function extractDiscDirectoryResult(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const disc = (value as Record<string, unknown>).disc;
  if (!disc || typeof disc !== "object" || Array.isArray(disc)) return null;
  const measurement = (disc as Record<string, unknown>).measurement;
  if (!measurement || typeof measurement !== "object" || Array.isArray(measurement)) return null;
  const record = measurement as Record<string, unknown>;
  const valid = (code: unknown): code is "D" | "I" | "S" | "C" => code === "D" || code === "I" || code === "S" || code === "C";
  const scores: Partial<Record<"D" | "I" | "S" | "C", number>> = {};
  if (Array.isArray(record.dimensionScores)) {
    for (const item of record.dimensionScores) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      const dimension = (item as Record<string, unknown>).dimension;
      const score = (item as Record<string, unknown>).score;
      if (valid(dimension) && typeof score === "number" && Number.isFinite(score)) scores[dimension] = score;
    }
  }
  if (!["D", "I", "S", "C"].every((code) => typeof scores[code as "D" | "I" | "S" | "C"] === "number")) return null;
  return {
    primaryPattern: valid(record.primaryPattern) ? record.primaryPattern : null,
    secondaryPattern: valid(record.secondaryPattern) ? record.secondaryPattern : null,
    scores: scores as Record<"D" | "I" | "S" | "C", number>,
  };
}

export async function listClientReports(organizationId: string, userId: string, search = "") {
  const workspace = await getClientOrganizationWorkspace(userId, organizationId);
  if (!workspace) throw new Error("CLIENT_ORGANIZATION_ACCESS_DENIED");
  const query = search.trim().slice(0, 120);
  const reports = await prisma.clientInvitation.findMany({
    where: {
      organizationId,
      status: "COMPLETED",
      assessmentAttempt: { isNot: null },
      ...(query ? {
        OR: [
          { participant: { fullName: { contains: query, mode: "insensitive" } } },
          { participant: { email: { contains: query, mode: "insensitive" } } },
          { jobTitle: { contains: query, mode: "insensitive" } },
          { department: { contains: query, mode: "insensitive" } },
        ],
      } : {}),
    },
    orderBy: [{ completedAt: "desc" }, { id: "desc" }],
    take: 250,
    select: {
      id: true, category: true, jobTitle: true, department: true, completedAt: true,
      resultEmailStatus: true,
      participant: { select: { fullName: true, email: true } },
      assessmentConfigurationVersion: { select: { version: true, questionCount: true } },
      questionPackageVersion: { select: { version: true, timeLimitSeconds: true } },
    },
  });
  await prisma.adminContentAuditEvent.create({ data: { entityType: "CLIENT_REPORT_LIST", entityId: organizationId, action: "CLIENT_DISC_REPORT_LIST_VIEWED", actorUserId: userId, metadata: { reportCount: reports.length } } });
  return reports.map((report) => ({
    ...report,
    completedAt: report.completedAt?.toISOString() ?? null,
  }));
}

export async function updateClientParticipantCategory(input: {
  organizationId: string; participantId: string; userId: string;
  category: "CANDIDATE" | "EMPLOYEE" | "ALUMNI";
}) {
  await requireClientOrganizationAdmin(input.userId, input.organizationId);
  const participant = await prisma.clientParticipant.findFirst({ where: { id: input.participantId, organizationId: input.organizationId }, select: { id: true, category: true } });
  if (!participant) throw new Error("CLIENT_PARTICIPANT_NOT_FOUND");
  const allowedTransition = (participant.category === "CANDIDATE" && input.category === "EMPLOYEE") || (participant.category === "EMPLOYEE" && input.category === "ALUMNI");
  if (participant.category !== input.category && !allowedTransition) throw new Error("CLIENT_PARTICIPANT_TRANSITION_NOT_ALLOWED");
  return prisma.$transaction(async (tx) => {
    const updated = await tx.clientParticipant.update({ where: { id: participant.id }, data: { category: input.category }, select: { id: true, fullName: true, email: true, category: true } });
    if (participant.category !== input.category) await tx.adminContentAuditEvent.create({ data: { entityType: "CLIENT_PARTICIPANT", entityId: participant.id, action: "CLIENT_PARTICIPANT_CATEGORY_CHANGED", fromStatus: participant.category, toStatus: input.category, actorUserId: input.userId, metadata: { organizationId: input.organizationId } } });
    return updated;
  });
}

export async function getClientAssessmentResult(
  organizationId: string,
  invitationId: string,
  userId: string,
) {
  const workspace = await getClientOrganizationWorkspace(userId, organizationId);
  if (!workspace) throw new Error("CLIENT_ORGANIZATION_ACCESS_DENIED");
  const invitation = await prisma.clientInvitation.findFirst({
    where: { id: invitationId, organizationId, status: "COMPLETED" },
    select: {
      id: true,
      category: true,
      jobTitle: true,
      department: true,
      completedAt: true,
      resultEmailStatus: true,
      participant: { select: { fullName: true, category: true } },
      organization: { select: { name: true, websiteUrl: true, logoUrl: true } },
      assessmentAttempt: {
        select: {
          id: true,
          completedAt: true,
          assessmentConfigurationVersion: true,
          questionPackageVersionId: true,
          result: { select: { result: true } },
        },
      },
    },
  });
  if (!invitation?.participant?.fullName || !invitation.assessmentAttempt?.result?.result) return null;
  await prisma.adminContentAuditEvent.create({ data: { entityType: "CLIENT_ASSESSMENT_RESULT", entityId: invitation.id, action: "CLIENT_DISC_RESULT_VIEWED", actorUserId: userId, metadata: { organizationId } } });
  return invitation;
}

export async function getClientInvitationByToken(token: string) {
  if (!/^[a-f0-9]{64}$/i.test(token)) return null;
  const row = await prisma.clientInvitation.findUnique({
    where: { tokenHash: invitationTokenHash(token) },
    include: {
      organization: { select: { id: true, name: true, logoUrl: true, status: true } },
      participant: { select: { id: true, fullName: true, email: true, whatsapp: true, category: true } },
      consent: true,
      assessmentAttempt: { select: { id: true, status: true, completedAt: true } },
      assessmentConfigurationVersion: { select: { id: true, version: true, questionCount: true } },
      questionPackageVersion: { select: { id: true, version: true, totalQuestions: true, timeLimitSeconds: true } },
    },
  });
  if (!row || row.organization.status !== "ACTIVE") return null;
  if (["DRAFT", "REVOKED", "EXPIRED"].includes(row.status)) return null;
  if (row.expiresAt <= new Date() && row.status !== "COMPLETED") {
    await prisma.clientInvitation.update({ where: { id: row.id }, data: { status: "EXPIRED" } });
    await releaseInvitationCredit(row.id, "INVITATION_EXPIRED");
    return null;
  }
  return row;
}

export async function captureClientParticipant(input: {
  invitationId: string;
  fullName: string;
  email: string;
  whatsapp: string;
  noticeAccepted: boolean;
  emailMarketing: boolean;
  whatsappMarketing: boolean;
}) {
  const invitation = await prisma.clientInvitation.findUnique({
    where: { id: input.invitationId },
    select: { id: true, organizationId: true, email: true, category: true, status: true, participantId: true, expiresAt: true },
  });
  if (!invitation || ["REVOKED", "EXPIRED"].includes(invitation.status)) throw new Error("INVITATION_NOT_AVAILABLE");
  if (invitation.status === "COMPLETED") throw new Error("INVITATION_ALREADY_COMPLETED");
  if (invitation.status === "DRAFT") throw new Error("INVITATION_NOT_AVAILABLE");
  if (invitation.expiresAt <= new Date()) {
    await prisma.clientInvitation.update({ where: { id: invitation.id }, data: { status: "EXPIRED" } });
    await releaseInvitationCredit(invitation.id, "INVITATION_EXPIRED");
    throw new Error("INVITATION_EXPIRED");
  }
  if (!input.noticeAccepted) throw new Error("NOTICE_REQUIRED");
  const fullName = input.fullName.trim();
  if (fullName.length < 2 || fullName.length > 160) throw new Error("INVALID_NAME");
  const email = normalizeEmail(input.email);
  if (email !== invitation.email) throw new Error("INVITATION_EMAIL_MISMATCH");
  const whatsapp = input.whatsapp.replace(/[^+\d]/g, "").trim();
  if (whatsapp.length < 8 || whatsapp.length > 20) throw new Error("INVALID_WHATSAPP");

  return prisma.$transaction(async (tx) => {
    const participant = await tx.clientParticipant.upsert({
      where: { organizationId_email: { organizationId: invitation.organizationId, email } },
      create: { organizationId: invitation.organizationId, fullName, email, whatsapp, category: invitation.category },
      update: { fullName, whatsapp, category: invitation.category },
    });
    const consent = await tx.clientParticipantConsent.upsert({
      where: { invitationId: invitation.id },
      create: {
        invitationId: invitation.id,
        noticeVersion: "CLIENT_DISC_NOTICE_V1",
        noticeAcceptedAt: new Date(),
        emailMarketing: input.emailMarketing,
        whatsappMarketing: input.whatsappMarketing,
      },
      // Consent is immutable once recorded; retries cannot silently alter it.
      update: {},
    });
    const advanced = await tx.clientInvitation.updateMany({
      where: { id: invitation.id, status: invitation.status, expiresAt: { gt: new Date() } },
      data: { participantId: participant.id, status: invitation.status === "IN_PROGRESS" ? "IN_PROGRESS" : "OPENED", openedAt: new Date() },
    });
    if (advanced.count !== 1) throw new Error("INVITATION_NOT_AVAILABLE");
    return { participant: { ...participant, fullName, whatsapp }, consent };
  });
}

/** Create a ReadyScore marketing lead only after explicit optional opt-in. */
export async function createClientDiscLeadIfConsented(input: {
  fullName: string;
  email: string;
  whatsapp: string;
  assessmentAttemptId: string;
  emailMarketing: boolean;
  whatsappMarketing: boolean;
  consentAt: Date;
}) {
  if (!input.emailMarketing && !input.whatsappMarketing) return null;
  const existing = await prisma.businessLead.findMany({
    where: { OR: [{ email: input.email }, { whatsapp: input.whatsapp }] },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 2,
  });
  if (existing.length > 1) throw new Error("BUSINESS_LEAD_IDENTITY_CONFLICT");
  if (existing[0]) {
    return prisma.businessLead.update({
      where: { id: existing[0].id },
      data: {
        consent: true, consentAt: input.consentAt,
        emailMarketingConsent: existing[0].emailMarketingConsent || input.emailMarketing,
        whatsappMarketingConsent: existing[0].whatsappMarketingConsent || input.whatsappMarketing,
      },
      select: { id: true, emailMarketingConsent: true, whatsappMarketingConsent: true },
    });
  }
  return prisma.businessLead.create({
    data: {
      name: input.fullName,
      email: input.email,
      whatsapp: input.whatsapp,
      source: "CLIENT_DISC",
      status: "NEW",
      consent: true,
      consentAt: input.consentAt,
      emailMarketingConsent: input.emailMarketing,
      whatsappMarketingConsent: input.whatsappMarketing,
      assessmentAttemptId: input.assessmentAttemptId,
    },
    select: { id: true },
  }).catch(async (error) => {
    if (!error || typeof error !== "object" || !("code" in error) || error.code !== "P2002") throw error;
    const raced = await prisma.businessLead.findFirst({
      where: { OR: [{ email: input.email }, { whatsapp: input.whatsapp }] },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true, emailMarketingConsent: true, whatsappMarketingConsent: true },
    });
    if (!raced) throw error;
    return prisma.businessLead.update({
      where: { id: raced.id },
      data: {
        consent: true, consentAt: input.consentAt,
        emailMarketingConsent: raced.emailMarketingConsent || input.emailMarketing,
        whatsappMarketingConsent: raced.whatsappMarketingConsent || input.whatsappMarketing,
      },
      select: { id: true },
    });
  });
}
