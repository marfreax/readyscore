function escapeHtml(value: string) {
  return value.replace(/[&<>\"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character]!);
}

async function sendResend(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
  attachment?: { filename: string; content: Buffer };
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.READYSCORE_EMAIL_FROM?.trim();
  if (!apiKey || !from) throw new Error("CLIENT_EMAIL_NOT_CONFIGURED");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      ...(input.attachment ? {
        attachments: [{
          filename: input.attachment.filename,
          content: input.attachment.content.toString("base64"),
        }],
      } : {}),
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || typeof result?.id !== "string") throw new Error("CLIENT_EMAIL_DELIVERY_FAILED");
  return { providerMessageId: result.id as string };
}

export async function sendClientInvitationEmail(input: {
  to: string;
  participantName?: string;
  clientName: string;
  clientLogoUrl?: string | null;
  inviteUrl: string;
  expiresAt: Date;
  invitationId: string;
  deliveryAttempt: number;
}) {
  const clientName = escapeHtml(input.clientName);
  const participantName = input.participantName ? escapeHtml(input.participantName) : "";
  const greeting = participantName ? `Halo <strong>${participantName}</strong>,` : "Halo,";
  const expiryText = input.expiresAt.toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Jakarta" });
  const link = escapeHtml(input.inviteUrl);
  const logo = input.clientLogoUrl?.startsWith("https://") ? `<img src="${escapeHtml(input.clientLogoUrl)}" alt="Logo ${clientName}" width="56" height="56" style="object-fit:contain;border:1px solid #E2E8F0;border-radius:12px;padding:4px" />` : "";
  return sendResend({
    to: input.to,
    subject: `Undangan DISC dari ${input.clientName} · ReadyScore`,
    idempotencyKey: `client-disc-invitation/${input.invitationId}/${input.deliveryAttempt}`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.7;color:#0B1D3A;max-width:640px;margin:0 auto;padding:24px">${logo ? `<div style="margin-bottom:16px">${logo}</div>` : ""}<p>${greeting}</p><p><strong>${clientName}</strong> mengundang Anda untuk mengerjakan assessment DISC melalui ReadyScore.</p><p>Sebelum memulai, Anda akan melihat informasi tentang penggunaan data dan siapa yang dapat melihat hasil.</p><p style="margin:28px 0"><a href="${link}" style="display:inline-block;background:#0B1D3A;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700">Mulai assessment DISC</a></p><p>Undangan berlaku sampai ${escapeHtml(expiryText)}.</p><p style="margin-top:28px;font-size:12px;color:#64748B">Assessment provided by ReadyScore</p></div>`,
    text: [
      participantName ? `Halo ${input.participantName},` : "Halo,",
      "",
      `${input.clientName} mengundang Anda untuk mengerjakan assessment DISC melalui ReadyScore.`,
      "Sebelum memulai, halaman undangan menjelaskan penggunaan data dan siapa yang dapat melihat hasil.",
      "",
      `Mulai assessment: ${input.inviteUrl}`,
      `Undangan berlaku sampai ${expiryText} WIB.`,
      "",
      "Assessment provided by ReadyScore",
    ].join("\n"),
  });
}

export async function sendClientResultEmail(input: {
  to: string;
  participantName: string;
  clientName: string;
  invitationId: string;
  deliveryAttempt: number;
  pdf: Buffer;
  fileName: string;
}) {
  const participantName = escapeHtml(input.participantName);
  const clientName = escapeHtml(input.clientName);
  const registerUrl = "https://app.readyscore.id/register";
  return sendResend({
    to: input.to,
    subject: `Hasil assessment DISC · ${input.clientName} · ReadyScore`,
    idempotencyKey: `client-disc-result/${input.invitationId}/${input.deliveryAttempt}`,
    attachment: { filename: input.fileName, content: input.pdf },
    html: `<div style="font-family:Arial,sans-serif;line-height:1.7;color:#0B1D3A;max-width:640px;margin:0 auto;padding:24px"><p>Halo <strong>${participantName}</strong>,</p><p>Assessment DISC yang diundang oleh <strong>${clientName}</strong> telah selesai. Hasil Anda terlampir dalam PDF. Tim client pengundang juga dapat melihat hasil assessment di portal mereka.</p><p>Gunakan hasil ini sebagai bahan refleksi dan diskusi tentang gaya perilaku dalam konteks kerja.</p><div style="margin:28px 0;padding:18px;border-radius:12px;background:#F1F5F9"><p style="margin:0 0 8px;font-weight:700">Kenali ReadyScore lebih jauh</p><p style="margin:0 0 12px">Jelajahi assessment dan insight ReadyScore untuk pengembangan diri.</p><a href="${registerUrl}" style="color:#3730A3;font-weight:700">Jelajahi ReadyScore →</a></div><p style="font-size:12px;color:#64748B">Assessment provided by ReadyScore · Assessment DISC adalah bahan diskusi, bukan keputusan otomatis tentang kelayakan kerja.</p></div>`,
    text: [
      `Halo ${input.participantName},`,
      "",
      `Assessment DISC dari ${input.clientName} telah selesai. Hasil Anda terlampir dalam PDF. Tim client pengundang juga dapat melihat hasil assessment di portal mereka.`,
      "Gunakan hasil ini sebagai bahan refleksi dan diskusi tentang gaya perilaku dalam konteks kerja.",
      "",
      "Kenali ReadyScore lebih jauh: " + registerUrl,
      "",
      "Assessment provided by ReadyScore. Hasil DISC adalah bahan diskusi, bukan keputusan otomatis tentang kelayakan kerja.",
    ].join("\n"),
  });
}
