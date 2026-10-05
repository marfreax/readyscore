import { NextResponse } from "next/server";
import { endSession } from "../../../../lib/auth/session";
import { getPublicAppUrl } from "../../../../lib/public-app-url";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await endSession();
  return NextResponse.redirect(getPublicAppUrl("/login", request), 303);
}
