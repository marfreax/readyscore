import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../lib/auth/session";
import { getInstitutionWorkspace, listUserInstitutions } from "../../../lib/institution/service";

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED", message: "Login diperlukan." },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const institutionId = url.searchParams.get("institutionId");

  if (!institutionId) {
    const institutions = await listUserInstitutions(session.user.id);
    return NextResponse.json({
      contractVersion: "INSTITUTION_V1",
      architectureVersion: "V3_B2B_INSTITUTION_3.13",
      institutions,
    });
  }

  const workspace = await getInstitutionWorkspace(
    session.user.id,
    institutionId,
  );
  if (!workspace) {
    return NextResponse.json(
      { error: "INSTITUTION_ACCESS_DENIED" },
      { status: 403 },
    );
  }

  return NextResponse.json(workspace);
}
