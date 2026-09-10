import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../../lib/auth/session";
import {
  changePassword,
  CHANGE_PASSWORD_AUTH_REQUIRED_MESSAGE,
  CHANGE_PASSWORD_CONFIRMATION_MESSAGE,
  CHANGE_PASSWORD_INVALID_CURRENT_MESSAGE,
  CHANGE_PASSWORD_TOO_SHORT_MESSAGE,
} from "../../../../lib/auth/change-password";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: { code: "AUTH_REQUIRED", message: CHANGE_PASSWORD_AUTH_REQUIRED_MESSAGE } }, { status: 401 });
  }
  try {
    const body = (await request.json()) as { currentPassword?: string; newPassword?: string; confirmNewPassword?: string };
    if (typeof body.currentPassword !== "string" || typeof body.newPassword !== "string" || typeof body.confirmNewPassword !== "string") {
      return NextResponse.json({ ok: false, error: { code: "INVALID_INPUT", message: "Data password tidak lengkap." } }, { status: 400 });
    }
    return NextResponse.json(await changePassword({
      userId: session.user.id,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
      confirmNewPassword: body.confirmNewPassword,
    }));
  } catch (error) {
    const code = error instanceof Error ? error.message : "CHANGE_PASSWORD_FAILED";
    if (code === "AUTH_REQUIRED") return NextResponse.json({ ok: false, error: { code, message: CHANGE_PASSWORD_AUTH_REQUIRED_MESSAGE } }, { status: 401 });
    if (code === "INVALID_CURRENT_PASSWORD") return NextResponse.json({ ok: false, error: { code, message: CHANGE_PASSWORD_INVALID_CURRENT_MESSAGE } }, { status: 400 });
    if (code === "PASSWORD_TOO_SHORT") return NextResponse.json({ ok: false, error: { code, message: CHANGE_PASSWORD_TOO_SHORT_MESSAGE } }, { status: 400 });
    if (code === "PASSWORD_CONFIRMATION_MISMATCH") return NextResponse.json({ ok: false, error: { code, message: CHANGE_PASSWORD_CONFIRMATION_MESSAGE } }, { status: 400 });
    if (code === "INVALID_INPUT") return NextResponse.json({ ok: false, error: { code, message: "Data password tidak lengkap." } }, { status: 400 });
    return NextResponse.json({ ok: false, error: { code: "CHANGE_PASSWORD_FAILED", message: "Password tidak dapat diubah saat ini." } }, { status: 500 });
  }
}
