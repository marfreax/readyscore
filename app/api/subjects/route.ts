import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../lib/auth/session";
import { createChildSubject, getActiveSubject, listSubjects } from "../../../lib/subjects/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ ok: false, error: { code: "AUTH_REQUIRED", message: "Login diperlukan." } }, { status: 401 });
  const [subjects, active] = await Promise.all([listSubjects(session.user.id), getActiveSubject(session.user.id)]);
  return NextResponse.json({ ok: true, activeSubjectId: active.id, subjects });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ ok: false, error: { code: "AUTH_REQUIRED", message: "Login diperlukan." } }, { status: 401 });
  try {
    const body = (await request.json().catch(() => ({}))) as { name?: string };
    const subject = await createChildSubject(session.user.id, body.name ?? "");
    return NextResponse.json({ ok: true, subject }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "SUBJECT_CREATE_FAILED";
    const status = code === "SUBJECT_ALREADY_EXISTS" || code === "INVALID_SUBJECT_NAME" ? 422 : 500;
    return NextResponse.json({ ok: false, error: { code, message: code === "SUBJECT_ALREADY_EXISTS" ? "Subject dengan nama tersebut sudah ada." : code === "INVALID_SUBJECT_NAME" ? "Nama subject minimal 2 karakter." : "Subject gagal dibuat." } }, { status });
  }
}
