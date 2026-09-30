import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../../lib/auth/session";
import { selectActiveSubject } from "../../../../lib/subjects/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ ok: false, error: { code: "AUTH_REQUIRED", message: "Login diperlukan." } }, { status: 401 });
  try {
    const body = (await request.json().catch(() => ({}))) as { subjectId?: string };
    if (!body.subjectId) return NextResponse.json({ ok: false, error: { code: "SUBJECT_REQUIRED", message: "subjectId diperlukan." } }, { status: 400 });
    const subject = await selectActiveSubject(session.user.id, body.subjectId);
    return NextResponse.json({ ok: true, activeSubject: subject });
  } catch (error) {
    const code = error instanceof Error ? error.message : "SUBJECT_SELECT_FAILED";
    return NextResponse.json({ ok: false, error: { code, message: code === "SUBJECT_NOT_FOUND" ? "Subject tidak ditemukan pada account ini." : "Subject gagal dipilih." } }, { status: code === "SUBJECT_NOT_FOUND" ? 404 : 500 });
  }
}
