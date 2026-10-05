import { NextResponse } from "next/server";
import { startSession } from "../../../../lib/auth/session";
import { claimScalevHandoff } from "../../../../lib/scalev/service";
import { getPublicAppUrl } from "../../../../lib/public-app-url";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.json(
      { ok: false, error: { code: "SCALEV_HANDOFF_TOKEN_REQUIRED" } },
      { status: 400 },
    );
  }

  try {
    const userId = await claimScalevHandoff(token);
    await startSession(userId);

    return NextResponse.redirect(getPublicAppUrl("/app", request));
  } catch (error) {
    const message = error instanceof Error ? error.message : "SCALEV_HANDOFF_FAILED";

    const status =
      message === "SCALEV_HANDOFF_EXPIRED" ||
      message === "SCALEV_HANDOFF_CONSUMED" ||
      message === "SCALEV_HANDOFF_INVALID"
        ? 410
        : 400;

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: message,
          message: "Link akses ReadyScore tidak valid atau sudah kedaluwarsa.",
        },
      },
      { status },
    );
  }
}
