import { NextResponse } from "next/server";
import { issueScalevHandoff } from "../../../../../lib/scalev/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { orderId?: string; email?: string; phone?: string };

  try {
    body = (await request.json()) as { orderId?: string; email?: string; phone?: string };
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_JSON" } },
      { status: 400 },
    );
  }

  const orderId = body.orderId?.trim();
  const email = body.email?.trim();

  if (!orderId || !email) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "SCALEV_HANDOFF_IDENTITY_REQUIRED",
          message: "orderId dan email diperlukan.",
        },
      },
      { status: 400 },
    );
  }

  try {
    const handoffUrl = await issueScalevHandoff({
      orderId,
      email,
      phone: body.phone,
    });

    return NextResponse.json({
      ok: true,
      handoffUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "SCALEV_HANDOFF_REQUEST_FAILED";

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: message,
          message: "Data order atau identitas tidak dapat diverifikasi.",
        },
      },
      { status: 403 },
    );
  }
}
