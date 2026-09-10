import { NextResponse } from "next/server";
import { resetPassword, PASSWORD_RESET_INVALID_MESSAGE, PASSWORD_RESET_SUCCESS_MESSAGE } from "../../../../lib/auth/password-reset";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: string; password?: string; confirmation?: string };
    if (typeof body.token !== "string" || typeof body.password !== "string" || typeof body.confirmation !== "string") {
      return NextResponse.json({ ok: false, error: { code: "INVALID_RESET_REQUEST", message: PASSWORD_RESET_INVALID_MESSAGE } }, { status: 400 });
    }

    return NextResponse.json(await resetPassword({
      token: body.token,
      password: body.password,
      confirmation: body.confirmation,
    }));
  } catch (error) {
    const code = error instanceof Error ? error.message : "PASSWORD_RESET_FAILED";
    if (code === "INVALID_RESET_TOKEN") {
      return NextResponse.json({ ok: false, error: { code, message: PASSWORD_RESET_INVALID_MESSAGE } }, { status: 400 });
    }
    if (code === "PASSWORD_TOO_SHORT") {
      return NextResponse.json({ ok: false, error: { code, message: "Password minimal 8 karakter." } }, { status: 400 });
    }
    if (code === "PASSWORD_CONFIRMATION_MISMATCH") {
      return NextResponse.json({ ok: false, error: { code, message: "Konfirmasi password tidak sama." } }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: { code: "PASSWORD_RESET_FAILED" } }, { status: 500 });
  }
}
