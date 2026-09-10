const DEFAULT_EXPIRY_MINUTES = 60;

export type PasswordResetEmailInput = {
  email: string;
  resetUrl: string;
  expiresAt: Date;
};

export function passwordResetExpiryMinutes() {
  const raw = Number(process.env.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES ?? DEFAULT_EXPIRY_MINUTES);
  return Number.isFinite(raw) && raw >= 15 && raw <= 120 ? Math.floor(raw) : DEFAULT_EXPIRY_MINUTES;
}

/**
 * V12.1 email delivery boundary. The credential secret remains in memory only
 * and is never logged or persisted by this adapter.
 *
 * RESEND is deliberately implemented through fetch so V12.1 does not add a
 * second mail SDK dependency. Production requires explicit configuration.
 */
export async function sendPasswordResetEmail(input: PasswordResetEmailInput) {
  const provider = (process.env.PASSWORD_RESET_EMAIL_PROVIDER ?? "").trim().toUpperCase();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.PASSWORD_RESET_EMAIL_FROM?.trim();

  if (provider !== "RESEND" || !apiKey || !from) {
    if (process.env.NODE_ENV === "production") throw new Error("PASSWORD_RESET_EMAIL_NOT_CONFIGURED");
    return { delivered: false, provider: "development-unconfigured" as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [input.email],
      subject: "Reset Password ReadyScore",
      text: [
        "Kami menerima permintaan reset password untuk akun ReadyScore Anda.",
        "",
        `Gunakan link berikut untuk melanjutkan: ${input.resetUrl}`,
        "",
        `Link ini berlaku selama ${passwordResetExpiryMinutes()} menit.`,
        "Jika Anda tidak meminta reset password, abaikan email ini.",
      ].join("\\n"),
    }),
  });

  if (!response.ok) throw new Error("PASSWORD_RESET_EMAIL_DELIVERY_FAILED");
  return { delivered: true, provider: "RESEND" as const };
}
