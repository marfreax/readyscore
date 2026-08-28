import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../lib/auth/session";
import { getUserReport, ReportAccessError } from "../../../lib/reports/service";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Sign in diperlukan." } }, { status: 401 });
  try {
    const report = await getUserReport(session.user.id);
    return NextResponse.json({ ok: true, report });
  } catch (error) {
    if (error instanceof ReportAccessError) {
      return NextResponse.json({ ok: false, error: { code: error.code, message: error.message } }, { status: error.code === "REPORT_ACCESS_REQUIRED" ? 403 : 404 });
    }
    console.error(error);
    return NextResponse.json({ ok: false, error: { code: "INTERNAL_ERROR", message: "Report tidak dapat dimuat." } }, { status: 500 });
  }
}
