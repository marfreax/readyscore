import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../lib/auth/admin";
import {
  activateConfigurationVersion, archiveConfigurationVersion, createConfiguration,
  createConfigurationVersion, getAssessmentConfiguration, getAssessmentConfigurationStats,
  listAssessmentConfigurations,
} from "../../../../lib/assessment-configuration-repository";
import { AssessmentType } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES = new Set(Object.values(AssessmentType));

function failResponse(error: unknown) {
  const code = error instanceof Error ? error.message : "INTERNAL_ERROR";
  const status = ["UNAUTHENTICATED"].includes(code) ? 401 : ["FORBIDDEN"].includes(code) ? 403 :
    ["CONFIGURATION_NOT_FOUND","VERSION_NOT_FOUND"].includes(code) ? 404 : 422;
  return NextResponse.json({ ok:false, error:{ code, message:"Assessment configuration action failed." } }, { status });
}

export async function GET(request: Request) {
  try {
    await requireAdminApi();
    const id = new URL(request.url).searchParams.get("id");
    if (id) {
      const item = await getAssessmentConfiguration(id);
      if (!item) return NextResponse.json({ok:false,error:{code:"CONFIGURATION_NOT_FOUND"}},{status:404});
      return NextResponse.json({ok:true, configuration:item});
    }
    return NextResponse.json({ok:true, configurations:await listAssessmentConfigurations(), stats:await getAssessmentConfigurationStats()});
  } catch (e) { return failResponse(e); }
}

export async function POST(request: Request) {
  try {
    await requireAdminApi();
    const body = await request.json() as Record<string, unknown>;
    const action = String(body.action ?? "");
    if (action === "CREATE") {
      const assessmentType = String(body.assessmentType ?? "").toUpperCase() as AssessmentType;
      if (!TYPES.has(assessmentType)) throw new Error("INVALID_ASSESSMENT_TYPE");
      const created = await createConfiguration({
        code:String(body.code??""), name:String(body.name??""), assessmentType,
        description: body.description == null ? null : String(body.description),
        version: body.version == null ? undefined : String(body.version),
        questionBankVersion:String(body.questionBankVersion??""),
        taxonomyVersion:String(body.taxonomyVersion??""),
        scoringVersion:String(body.scoringVersion??""),
        selectionAlgorithmVersion:String(body.selectionAlgorithmVersion??""),
        questionCount:Number(body.questionCount),
      });
      return NextResponse.json({ok:true,created},{status:201});
    }
    if (action === "EDIT") {
      const id=String(body.configurationId??"");
      const version=await createConfigurationVersion(id,{
        questionBankVersion:String(body.questionBankVersion??""), taxonomyVersion:String(body.taxonomyVersion??""),
        scoringVersion:String(body.scoringVersion??""), selectionAlgorithmVersion:String(body.selectionAlgorithmVersion??""),
        questionCount:Number(body.questionCount),
      });
      return NextResponse.json({ok:true,version:version.version});
    }
    if (action === "ACTIVATE") {
      const version=await activateConfigurationVersion(String(body.versionId??""));
      return NextResponse.json({ok:true,version});
    }
    if (action === "ARCHIVE") {
      const version=await archiveConfigurationVersion(String(body.versionId??""));
      return NextResponse.json({ok:true,version});
    }
    throw new Error("INVALID_ACTION");
  } catch (e) { return failResponse(e); }
}
