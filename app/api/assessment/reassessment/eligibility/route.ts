import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../../../lib/auth/session";
import { syncUserToDatabase } from "../../../../../lib/auth/database-sync";
import { getActiveSubject } from "../../../../../lib/subjects/service";
import { getReassessmentEligibility, isReassessmentTestType } from "../../../../../lib/assessment/reassessment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const current = await getCurrentSession();
  if (!current) {
    return NextResponse.json({ ok: false, error: { code: "AUTH_REQUIRED", message: "Login diperlukan." } }, { status: 401 });
  }
  const type = new URL(request.url).searchParams.get("type")?.toLowerCase() ?? "";
  if (!isReassessmentTestType(type)) {
    return NextResponse.json({ ok: false, error: { code: "INVALID_ASSESSMENT_TYPE", message: "Tipe assessment tidak valid." } }, { status: 400 });
  }
  await syncUserToDatabase(current.user.id);
  const subject = await getActiveSubject(current.user.id);
  const eligibility = await getReassessmentEligibility(current.user.id, type, new Date(), subject.id);
  return NextResponse.json({ ok: true, type, ...eligibility });
}
