import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../../../lib/auth/session";
import { getAssessmentReportV19_3, ReportAccessError } from "../../../../../lib/reports/service";
import { renderAssessmentReportPdfV19_3 } from "../../../../../lib/reports/pdf-v19-3";

export async function GET(_request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Sign in diperlukan." } }, { status: 401 });
  const { attemptId } = await params;
  try {
    const report = await getAssessmentReportV19_3(session.user.id, attemptId);
    const pdf = await renderAssessmentReportPdfV19_3(report);
    return new NextResponse(pdf, { status: 200, headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="readyscore-${report.assessmentType.toLowerCase()}-${attemptId}.pdf"`, "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof ReportAccessError) return NextResponse.json({ ok: false, error: { code: error.code, message: error.message } }, { status: error.code === "REPORT_ACCESS_REQUIRED" ? 403 : 404 });
    console.error(error);
    return NextResponse.json({ ok: false, error: { code: "PDF_GENERATION_FAILED", message: "PDF report tidak dapat dibuat." } }, { status: 500 });
  }
}
