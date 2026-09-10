import { UserRole, UserStatus } from "@prisma/client";
import { prisma } from "./db/prisma";
import { updateUserAccessRecord } from "./auth/store";
import {
  AdminPaginatedResult,
  AdminPaginationInput,
  createAdminPaginatedResult,
  normalizeAdminPagination,
} from "./admin-pagination";

export type UserAccessAction = "SET_STATUS" | "SET_ROLE";

export type AdminUserSummary = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  counts: {
    attempts: number;
    entitlements: number;
    addOnEntitlements: number;
    reassessmentCredits: number;
    institutionMemberships: number;
    activeEntitlements: number;
  };
};

export type AdminUsersSummary = {
  total: number;
  active: number;
  inactive: number;
  admins: number;
};

function requireAdmin(actorRole: UserRole) {
  if (actorRole !== UserRole.ADMIN) throw new Error("FORBIDDEN");
}

export async function listAdminUsersPaginated(
  input: AdminPaginationInput = {},
): Promise<AdminPaginatedResult<AdminUserSummary> & { summary: AdminUsersSummary }> {
  const pagination = normalizeAdminPagination(input);

  const [
    total,
    active,
    inactive,
    admins,
    users,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
    prisma.user.count({ where: { status: UserStatus.INACTIVE } }),
    prisma.user.count({ where: { role: UserRole.ADMIN } }),
    prisma.user.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: pagination.offset,
      take: pagination.limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            attempts: true,
            entitlements: true,
            addOnEntitlements: true,
            reassessmentCredits: true,
            institutionMemberships: true,
          },
        },
      },
    }),
  ]);

  const userIds = users.map((user) => user.id);
  const activeEntitlements = userIds.length
    ? await prisma.userEntitlement.groupBy({
        by: ["userId"],
        where: { status: "ACTIVE", userId: { in: userIds } },
        _count: { _all: true },
      })
    : [];
  const activeByUser = new Map(
    activeEntitlements.map((row) => [row.userId, row._count._all]),
  );

  const items = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    counts: {
      ...user._count,
      activeEntitlements: activeByUser.get(user.id) ?? 0,
    },
  }));

  return {
    ...createAdminPaginatedResult(items, pagination, total),
    summary: { total, active, inactive, admins },
  };
}

/** Backward-compatible helper for existing callers. */
export async function listAdminUsers(): Promise<AdminUserSummary[]> {
  const result = await listAdminUsersPaginated({ page: 1, pageSize: 100 });
  return result.items;
}

export async function performUserAccessAction(input: {
  actorUserId: string;
  actorRole: UserRole;
  targetUserId: string;
  action: UserAccessAction;
  value: UserRole | UserStatus;
  confirmed: boolean;
  reason?: string;
}) {
  requireAdmin(input.actorRole);
  if (!input.confirmed) throw new Error("CONFIRMATION_REQUIRED");

  const actor = await prisma.user.findUnique({ where: { id: input.actorUserId }, select: { id: true, role: true, status: true } });
  if (!actor || actor.role !== UserRole.ADMIN || actor.status !== UserStatus.ACTIVE) throw new Error("FORBIDDEN");

  const target = await prisma.user.findUnique({ where: { id: input.targetUserId } });
  if (!target) throw new Error("USER_NOT_FOUND");

  if (input.action === "SET_STATUS") {
    if (!(input.value === UserStatus.ACTIVE || input.value === UserStatus.INACTIVE)) throw new Error("INVALID_STATUS");
    const nextStatus = input.value as UserStatus;
    if (target.status === nextStatus) throw new Error("NO_CHANGE");
    if (target.id === actor.id && nextStatus === UserStatus.INACTIVE) throw new Error("CANNOT_DEACTIVATE_SELF");

    if (nextStatus === UserStatus.INACTIVE && target.role === UserRole.ADMIN) {
      const activeAdmins = await prisma.user.count({ where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE } });
      if (activeAdmins <= 1) throw new Error("LAST_ACTIVE_ADMIN_PROTECTED");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.user.findUnique({ where: { id: target.id } });
      if (!current || current.status !== target.status) throw new Error("CONCURRENT_USER_CHANGE");
      const next = await tx.user.update({ where: { id: target.id }, data: { status: nextStatus } });
      await tx.adminContentAuditEvent.create({
        data: {
          entityType: "USER",
          entityId: next.id,
          action: "SET_STATUS",
          fromStatus: target.status,
          toStatus: next.status,
          actorUserId: actor.id,
          metadata: { reason: input.reason?.trim() || null, targetEmail: next.email, targetRole: next.role, historicalImpact: "NONE" },
        },
      });
      return next;
    });
    updateUserAccessRecord(updated.id, { role: updated.role, status: updated.status });
    return updated;
  }

  if (input.action === "SET_ROLE") {
    if (!(input.value === UserRole.ADMIN || input.value === UserRole.USER)) throw new Error("INVALID_ROLE");
    const nextRole = input.value as UserRole;
    if (target.role === nextRole) throw new Error("NO_CHANGE");
    if (target.id === actor.id && nextRole === UserRole.USER) {
      const activeAdmins = await prisma.user.count({ where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE } });
      if (activeAdmins <= 1) throw new Error("LAST_ACTIVE_ADMIN_PROTECTED");
    }
    if (target.role === UserRole.ADMIN && nextRole === UserRole.USER) {
      const activeAdmins = await prisma.user.count({ where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE } });
      if (target.status === UserStatus.ACTIVE && activeAdmins <= 1) throw new Error("LAST_ACTIVE_ADMIN_PROTECTED");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.user.findUnique({ where: { id: target.id } });
      if (!current || current.role !== target.role || current.status !== target.status) throw new Error("CONCURRENT_USER_CHANGE");
      const next = await tx.user.update({ where: { id: target.id }, data: { role: nextRole } });
      await tx.adminContentAuditEvent.create({
        data: {
          entityType: "USER",
          entityId: next.id,
          action: "SET_ROLE",
          fromStatus: target.role,
          toStatus: next.role,
          actorUserId: actor.id,
          metadata: { reason: input.reason?.trim() || null, targetEmail: next.email, targetStatus: next.status, historicalImpact: "NONE" },
        },
      });
      return next;
    });
    updateUserAccessRecord(updated.id, { role: updated.role, status: updated.status });
    return updated;
  }

  throw new Error("UNSUPPORTED_ACTION");
}
