import { prisma } from "../db/prisma";

export const AUTHENTICATION_AUDIT_ACTIONS = [
  "PASSWORD_RESET_REQUESTED",
  "PASSWORD_RESET_SUCCEEDED",
  "PASSWORD_RESET_REJECTED",
  "PASSWORD_CHANGED",
] as const;
export type AuthenticationAuditAction = (typeof AUTHENTICATION_AUDIT_ACTIONS)[number];

export async function recordAuthenticationAudit(input: {
  action: AuthenticationAuditAction;
  actorUserId?: string | null;
  targetUserId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  return prisma.authenticationAuditEvent.create({
    data: {
      action: input.action,
      actorUserId: input.actorUserId ?? null,
      targetUserId: input.targetUserId ?? null,
      metadata: input.metadata ?? undefined,
    },
  });
}
