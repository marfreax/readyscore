import { NextResponse } from "next/server";
import { captureAffiliateReferral } from "../../../lib/affiliate/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const response = NextResponse.redirect(new URL("/", request.url), 302);
  const valid = await captureAffiliateReferral(code);
  if (!valid) return response;
  // captureAffiliateReferral uses the request cookie jar. Repeat the cookie on
  // this redirect response so the referral survives the navigation reliably.
  response.cookies.set("readyscore_affiliate_ref", code.trim().toUpperCase(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return response;
}
