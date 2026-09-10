import { NextResponse } from "next/server";
import { loginUser } from "../../../../lib/auth/service";
import { startSession } from "../../../../lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const user = await loginUser({ email: body.email ?? "", password: body.password ?? "" });
    await startSession(user.id);
    return NextResponse.json({ ok: true, user });
  } catch (error) {
    const code = error instanceof Error ? error.message : "LOGIN_FAILED";
    const status = code === "INVALID_CREDENTIALS" || code === "ACCOUNT_INACTIVE" ? 401 : 400;
    return NextResponse.json({ ok: false, error: { code } }, { status });
  }
}
