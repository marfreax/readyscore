import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../lib/auth/admin";
import {
  ADMIN_AUDIT_ENTITY_TYPES,
  listAdminAuditEventsPaginated,
  type AdminAuditEntityType,
} from "../../../../lib/admin-audit-repository";

export const runtime = "nodejs";

function parsePositiveInteger(value: string | null): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
    throw new Error("INVALID_PAGINATION");
  }
  return parsed;
}

function parseEntityType(value: string | null): AdminAuditEntityType | undefined {
  if (value === null || value.trim() === "") return undefined;
  if (!(ADMIN_AUDIT_ENTITY_TYPES as readonly string[]).includes(value)) {
    throw new Error("INVALID_ENTITY_TYPE");
  }
  return value as AdminAuditEntityType;
}

export async function GET(request: Request) {
  try {
    await requireAdminApi();
    const url = new URL(request.url);
    const entityType = parseEntityType(url.searchParams.get("entityType"));
    const page = parsePositiveInteger(url.searchParams.get("page"));
    const pageSize = parsePositiveInteger(url.searchParams.get("pageSize"));
    const entityId = url.searchParams.get("entityId")?.trim() || undefined;
    const actorUserId = url.searchParams.get("actorUserId")?.trim() || undefined;
    const action = url.searchParams.get("action")?.trim() || undefined;

    const result = await listAdminAuditEventsPaginated({
      entityType,
      entityId,
      actorUserId,
      action,
      page,
      pageSize,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const code = error instanceof Error ? error.message : "ADMIN_AUDIT_FAILED";
    const status = code === "UNAUTHENTICATED" ? 401 : code === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ ok: false, error: { code } }, { status });
  }
}
