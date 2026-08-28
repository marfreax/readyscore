import { NextResponse } from "next/server";
import { getTestCatalog } from "../../../lib/catalog/test-catalog";
export async function GET(){try{return NextResponse.json({ok:true,architectureVersion:"V3_TEST_CATALOG_TAXONOMY_V2",catalog:await getTestCatalog()});}catch(error){console.error(error);return NextResponse.json({ok:false,error:{code:"TEST_CATALOG_UNAVAILABLE",message:"Test catalog tidak tersedia."}},{status:500});}}
