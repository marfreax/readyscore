const WHATSAPP_TIMEOUT_MS = 20_000;
const MAX_ERROR_LENGTH = 500;

export class WhatsAppProviderError extends Error {
  constructor(public readonly code: string, public readonly providerStatus?: number) {
    super(code);
    this.name = "WhatsAppProviderError";
  }
}

function providerCode(status: number, body: unknown): string {
  const error = body && typeof body === "object" && "error" in body ? (body as any).error : null;
  const message = typeof error?.message === "string" ? error.message.toLowerCase() : "";
  if (status === 401 || status === 403) return "WHATSAPP_AUTH_FAILED";
  if (status === 429) return "WHATSAPP_RATE_LIMITED";
  if (message.includes("template") || message.includes("24 hour") || message.includes("24-hour")) return "WHATSAPP_TEMPLATE_REQUIRED";
  if (message.includes("phone") && (message.includes("not found") || message.includes("invalid"))) return "WHATSAPP_PHONE_NOT_FOUND";
  return "WHATSAPP_PROVIDER_REJECTED";
}

function safeProviderMessage(body: unknown): string | null {
  const error = body && typeof body === "object" && "error" in body ? (body as any).error : null;
  const message = typeof error?.message === "string" ? error.message : null;
  return message ? message.slice(0, MAX_ERROR_LENGTH) : null;
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WHATSAPP_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal, cache: "no-store" });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new WhatsAppProviderError("WHATSAPP_NETWORK_ERROR");
    throw new WhatsAppProviderError("WHATSAPP_NETWORK_ERROR");
  } finally {
    clearTimeout(timer);
  }
}

export type WhatsAppSendResult = { providerMessageId: string };

export async function sendWhatsAppText(to: string, text: string): Promise<WhatsAppSendResult> {
  if (process.env.WHATSAPP_E2E_MODE === "1") {
    if (text === "__V17_4_PROVIDER_FAIL__") throw new WhatsAppProviderError("WHATSAPP_PROVIDER_REJECTED", 400);
    return { providerMessageId: `wamid.e2e.${Date.now()}` };
  }
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const graphVersion = process.env.WHATSAPP_GRAPH_VERSION?.trim() || "v23.0";
  if (!token || !phoneNumberId) throw new WhatsAppProviderError("WHATSAPP_PROVIDER_NOT_CONFIGURED");

  let response: Response;
  try {
    response = await fetchWithTimeout(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: to.replace(/\D/g, ""), type: "text", text: { preview_url: false, body: text } }),
    });
  } catch (error) {
    if (error instanceof WhatsAppProviderError) throw error;
    throw new WhatsAppProviderError("WHATSAPP_NETWORK_ERROR");
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const mapped = providerCode(response.status, body);
    const message = safeProviderMessage(body);
    const error = new WhatsAppProviderError(mapped, response.status);
    if (message) error.message = `${mapped}:${message}`;
    throw error;
  }

  const providerMessageId = body?.messages?.[0]?.id;
  if (typeof providerMessageId !== "string" || !providerMessageId) throw new WhatsAppProviderError("WHATSAPP_UNKNOWN_ERROR", response.status);
  return { providerMessageId };
}
