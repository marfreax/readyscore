import { NextResponse } from "next/server";
import { registerUser } from "../../../../lib/auth/service";
import { startSession } from "../../../../lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; email?: string; password?: string };
    const user = await registerUser({
      name: body.name ?? "",
      email: body.email ?? "",
      password: body.password ?? "",
    });
    await startSession(user.id);
    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "REGISTER_FAILED";
    const status = code === "EMAIL_ALREADY_EXISTS" ? 409 : 400;
    return NextResponse.json({ ok: false, error: { code } }, { status });
  }
}
