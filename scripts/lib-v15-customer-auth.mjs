export async function getAuthenticatedCookie(baseUrl) {
  const existing = process.env.READYSCORE_SESSION_COOKIE?.trim();
  if (existing) return existing;

  const email = process.env.READYSCORE_E2E_EMAIL?.trim();
  const password = process.env.READYSCORE_E2E_PASSWORD;
  if (!email || !password) {
    throw new Error("Authenticated Phase C validation requires READYSCORE_SESSION_COOKIE or READYSCORE_E2E_EMAIL + READYSCORE_E2E_PASSWORD.");
  }

  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    let detail = "";
    try { detail = JSON.stringify(await response.json()); } catch {}
    throw new Error(`E2E login failed ${response.status}${detail ? ` ${detail}` : ""}`);
  }

  const setCookies = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : [response.headers.get("set-cookie") ?? ""];
  const cookie = setCookies
    .map((value) => value.split(";", 1)[0].trim())
    .find((value) => value.startsWith("readyscore_session="));
  if (!cookie) throw new Error("E2E login succeeded but readyscore_session cookie was not returned.");
  return cookie;
}
