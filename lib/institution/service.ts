import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import type {
  InstitutionEntitlementRef,
  InstitutionMemberRole,
  InstitutionMembershipStatus,
  InstitutionSummary,
} from "./types";
import {
  B2B_INSTITUTION_ARCHITECTURE_VERSION,
  B2B_INSTITUTION_CONTRACT_VERSION,
} from "./types";

function activeWindow(now = new Date()) {
  return {
    startsAt: { lte: now },
    OR: [{ endsAt: null }, { endsAt: { gt: now } }],
  };
}

/**
 * Phase 3.13 canonical institutional context lookup.
 * Institutional membership never changes measurement identity.
 */
export async function listUserInstitutions(userId: string, now = new Date()) {
  return prisma.institutionMembership.findMany({
    where: {
      userId,
      status: "ACTIVE",
      ...activeWindow(now),
      institution: { status: "ACTIVE" },
    },
    orderBy: { createdAt: "asc" },
    select: {
      institutionId: true,
      role: true,
      status: true,
      institution: {
        select: { id: true, code: true, name: true, status: true },
      },
    },
  });
}

/**
 * Returns explicit institutional access for a user only through an active
 * membership. No product tier is consulted.
 */
export async function hasInstitutionEntitlement(
  userId: string,
  ref: Omit<InstitutionEntitlementRef, "institutionId"> & {
    institutionId: string;
  },
  now = new Date(),
): Promise<boolean> {
  const membership = await prisma.institutionMembership.findFirst({
    where: {
      institutionId: ref.institutionId,
      userId,
      status: "ACTIVE",
      ...activeWindow(now),
      institution: { status: "ACTIVE" },
    },
    select: { id: true },
  });
  if (!membership) return false;

  const entitlement = await prisma.institutionEntitlement.findFirst({
    where: {
      institutionId: ref.institutionId,
      type: ref.type,
      resourceType: ref.resourceType,
      resourceKey: ref.resourceKey,
      status: "ACTIVE",
      ...activeWindow(now),
    },
    select: { id: true },
  });

  return Boolean(entitlement);
}

export async function listInstitutionEntitlements(
  userId: string,
  institutionId: string,
  now = new Date(),
) {
  const membership = await prisma.institutionMembership.findFirst({
    where: {
      institutionId,
      userId,
      status: "ACTIVE",
      ...activeWindow(now),
      institution: { status: "ACTIVE" },
    },
    select: { role: true, status: true },
  });
  if (!membership) return null;

  const entitlements = await prisma.institutionEntitlement.findMany({
    where: { institutionId, status: "ACTIVE", ...activeWindow(now) },
    orderBy: [
      { type: "asc" },
      { resourceType: "asc" },
      { resourceKey: "asc" },
    ],
    select: {
      type: true,
      resourceType: true,
      resourceKey: true,
      status: true,
    },
  });

  return {
    role: membership.role as InstitutionMemberRole,
    status: membership.status as InstitutionMembershipStatus,
    entitlements,
  };
}

/**
 * Manual institutional fulfillment primitive.
 * No checkout, subscription, billing, invoice, or payment webhook is invoked.
 */
export async function grantInstitutionEntitlement(
  input: InstitutionEntitlementRef & {
    source?: string;
    startsAt?: Date;
    endsAt?: Date;
    metadata?: Record<string, unknown>;
  },
) {
  return prisma.institutionEntitlement.upsert({
    where: {
      institutionId_type_resourceType_resourceKey: {
        institutionId: input.institutionId,
        type: input.type,
        resourceType: input.resourceType,
        resourceKey: input.resourceKey,
      },
    },
    create: {
      institutionId: input.institutionId,
      type: input.type,
      resourceType: input.resourceType,
      resourceKey: input.resourceKey,
      source: input.source ?? "MANUAL_INSTITUTION",
      startsAt: input.startsAt ?? new Date(),
      endsAt: input.endsAt,
      metadata: input.metadata as Prisma.InputJsonValue,
      status: "ACTIVE",
    },
    update: {
      source: input.source ?? "MANUAL_INSTITUTION",
      startsAt: input.startsAt ?? new Date(),
      endsAt: input.endsAt,
      metadata: input.metadata as Prisma.InputJsonValue,
      status: "ACTIVE",
    },
  });
}

export async function getInstitutionWorkspace(
  userId: string,
  institutionId: string,
  now = new Date(),
): Promise<InstitutionSummary | null> {
  const row = await prisma.institutionMembership.findFirst({
    where: {
      institutionId,
      userId,
      status: "ACTIVE",
      ...activeWindow(now),
      institution: { status: "ACTIVE" },
    },
    select: {
      role: true,
      status: true,
      institution: {
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
        },
      },
    },
  });
  if (!row) return null;

  const entitlements = await prisma.institutionEntitlement.findMany({
    where: { institutionId, status: "ACTIVE", ...activeWindow(now) },
    orderBy: [
      { type: "asc" },
      { resourceType: "asc" },
      { resourceKey: "asc" },
    ],
    select: {
      type: true,
      resourceType: true,
      resourceKey: true,
      status: true,
    },
  });

  return {
    contractVersion: B2B_INSTITUTION_CONTRACT_VERSION,
    architectureVersion: B2B_INSTITUTION_ARCHITECTURE_VERSION,
    institution: row.institution,
    membership: {
      role: row.role as InstitutionMemberRole,
      status: row.status as InstitutionMembershipStatus,
    },
    entitlements,
  };
}
