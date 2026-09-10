import { Prisma } from "@prisma/client";
import { prisma } from "./db/prisma";
import {
  createAdminPaginatedResult,
  normalizeAdminPagination,
  type AdminPaginatedResult,
  type AdminPaginationInput,
} from "./admin-pagination";

/**
 * Phase 11.6.1 — Audit Repository Contract.
 *
 * This module establishes the canonical repository boundary for the existing
 * AdminContentAuditEvent store. It intentionally does not introduce
 * pagination, search, filtering UI, or any new mutation semantics; those are
 * separate tasks in the Phase 11.6 roadmap.
 */
export const ADMIN_AUDIT_ENTITY_TYPES = [
  "QUESTION_VERSION",
  "ASSESSMENT_CONFIGURATION_VERSION",
  "USER",
] as const;

export type AdminAuditEntityType = (typeof ADMIN_AUDIT_ENTITY_TYPES)[number];

export type AdminAuditListInput = {
  entityType?: AdminAuditEntityType;
  entityId?: string;
  actorUserId?: string;
  action?: string;
};

export type AdminAuditEventRecord = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  actorUserId: string;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
};

export type AdminAuditRepository = {
  list(input?: AdminAuditListInput): Promise<AdminAuditEventRecord[]>;
  listPaginated(input?: AdminAuditListInput & AdminPaginationInput): Promise<AdminPaginatedResult<AdminAuditEventRecord>>;
  getById(id: string): Promise<AdminAuditEventRecord | null>;
};

const auditEventSelect = {
  id: true,
  entityType: true,
  entityId: true,
  action: true,
  fromStatus: true,
  toStatus: true,
  actorUserId: true,
  metadata: true,
  createdAt: true,
} satisfies Prisma.AdminContentAuditEventSelect;

/**
 * Canonical read boundary for audit events.
 *
 * The legacy list method remains bounded at 200 rows for existing callers.
 * The paginated method below uses the reusable Phase 11.6.2 contract.
 */
export async function listAdminAuditEvents(
  input: AdminAuditListInput = {},
): Promise<AdminAuditEventRecord[]> {
  const where: Prisma.AdminContentAuditEventWhereInput = {};

  if (input.entityType) where.entityType = input.entityType;
  if (input.entityId) where.entityId = input.entityId;
  if (input.actorUserId) where.actorUserId = input.actorUserId;
  if (input.action) where.action = input.action;

  return prisma.adminContentAuditEvent.findMany({
    where,
    select: auditEventSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 200,
  });
}

export async function listAdminAuditEventsPaginated(
  input: AdminAuditListInput & AdminPaginationInput = {},
): Promise<AdminPaginatedResult<AdminAuditEventRecord>> {
  const pagination = normalizeAdminPagination(input);
  const where: Prisma.AdminContentAuditEventWhereInput = {};

  if (input.entityType) where.entityType = input.entityType;
  if (input.entityId) where.entityId = input.entityId;
  if (input.actorUserId) where.actorUserId = input.actorUserId;
  if (input.action) where.action = input.action;

  const [totalItems, items] = await prisma.$transaction([
    prisma.adminContentAuditEvent.count({ where }),
    prisma.adminContentAuditEvent.findMany({
      where,
      select: auditEventSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: pagination.offset,
      take: pagination.limit,
    }),
  ]);

  return createAdminPaginatedResult(items, pagination, totalItems);
}

export async function getAdminAuditEventById(id: string): Promise<AdminAuditEventRecord | null> {
  const normalizedId = id.trim();
  if (!normalizedId) return null;

  return prisma.adminContentAuditEvent.findUnique({
    where: { id: normalizedId },
    select: auditEventSelect,
  });
}

export const adminAuditRepository: AdminAuditRepository = {
  list: listAdminAuditEvents,
  listPaginated: listAdminAuditEventsPaginated,
  getById: getAdminAuditEventById,
};
