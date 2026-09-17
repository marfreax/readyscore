import { NextResponse } from "next/server";
import { applyWhatsAppStatus, persistInboundWhatsAppMessage } from "../../../../lib/whatsapp/persistence";
import { getWhatsAppVerifyToken, verifyWhatsAppChallenge, verifyWhatsAppSignature } from "../../../../lib/whatsapp/webhook-security";
import { isWhatsAppWebhookPayload, normalizeWhatsAppWebhookPayload } from "../../../../lib/whatsapp/webhook-normalizer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expectedToken = getWhatsAppVerifyToken();
  if (!expectedToken) return NextResponse.json({ ok: false, error: { code: "WHATSAPP_VERIFY_TOKEN_NOT_CONFIGURED" } }, { status: 503 });
  if (!verifyWhatsAppChallenge(mode, token, expectedToken) || !challenge) return NextResponse.json({ ok: false, error: { code: "WHATSAPP_WEBHOOK_VERIFICATION_FAILED" } }, { status: 403 });
  return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

export async function POST(request: Request) {
  const rawBody = Buffer.from(await request.arrayBuffer());
  if (!verifyWhatsAppSignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ ok: false, error: { code: "INVALID_WHATSAPP_SIGNATURE" } }, { status: 401 });
  }
  let payload: unknown;
  try { payload = JSON.parse(rawBody.toString("utf8")); }
  catch { return NextResponse.json({ ok: false, error: { code: "INVALID_JSON" } }, { status: 400 }); }
  if (!isWhatsAppWebhookPayload(payload)) return NextResponse.json({ ok: false, error: { code: "INVALID_WHATSAPP_WEBHOOK_PAYLOAD" } }, { status: 400 });

  const normalized = normalizeWhatsAppWebhookPayload(payload);
  let persistedMessages = 0;
  let duplicateMessages = 0;
  let invalidMessages = 0;
  let updatedStatuses = 0;
  let ignoredStatuses = 0;
  const persistenceEnabled = process.env.READYSCORE_WHATSAPP_PERSISTENCE_ENABLED !== "false";

  try {
    if (persistenceEnabled) {
      for (const message of normalized.messages) {
        const result = await persistInboundWhatsAppMessage(message, message.displayName);
        if (!result.accepted) invalidMessages += 1;
        else if (result.duplicate) duplicateMessages += 1;
        else persistedMessages += 1;
      }
      for (const status of normalized.statuses) {
        const result = await applyWhatsAppStatus(status);
        if (result.updated) updatedStatuses += 1;
        else ignoredStatuses += 1;
      }
    }
  } catch (error) {
    console.error(`[whatsapp-webhook] persistence_failed code=${error instanceof Error ? error.message : "UNKNOWN"}`);
    return NextResponse.json({ ok: false, error: { code: "WHATSAPP_WEBHOOK_PROCESSING_FAILED" } }, { status: 500 });
  }

  console.info(`[whatsapp-webhook] accepted messages=${normalized.messages.length} persisted=${persistedMessages} duplicates=${duplicateMessages} invalid=${invalidMessages} statuses=${normalized.statuses.length} updatedStatuses=${updatedStatuses} ignoredStatuses=${ignoredStatuses}`);
  return NextResponse.json({ ok: true, accepted: true, messages: normalized.messages.length, persistedMessages, duplicateMessages, invalidMessages, statuses: normalized.statuses.length, updatedStatuses, ignoredStatuses, unsupportedChangeCount: normalized.unsupportedChangeCount });
}
