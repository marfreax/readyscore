import type {
  PaymentCreateInput,
  PaymentCreateResult,
  PaymentProvider,
  PaymentStatusResult,
} from "./payment-provider";

const PROVIDER = "MIDTRANS";
const DEFAULT_SANDBOX_API = "https://api.sandbox.midtrans.com";
const DEFAULT_SANDBOX_SNAP = "https://app.sandbox.midtrans.com/snap/v1/transactions";
const DEFAULT_PRODUCTION_API = "https://api.midtrans.com";
const DEFAULT_PRODUCTION_SNAP = "https://app.midtrans.com/snap/v1/transactions";

function requiredServerKey() {
  const value = process.env.MIDTRANS_SERVER_KEY?.trim();
  if (!value) throw new Error("PAYMENT_PROVIDER_NOT_CONFIGURED");
  return value;
}

function apiBase() {
  const explicit = process.env.MIDTRANS_API_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  return process.env.MIDTRANS_ENVIRONMENT?.trim().toLowerCase() === "production"
    ? DEFAULT_PRODUCTION_API
    : DEFAULT_SANDBOX_API;
}

function snapEndpoint() {
  const explicit = process.env.MIDTRANS_SNAP_ENDPOINT?.trim();
  if (explicit) return explicit;
  return process.env.MIDTRANS_ENVIRONMENT?.trim().toLowerCase() === "production"
    ? DEFAULT_PRODUCTION_SNAP
    : DEFAULT_SANDBOX_SNAP;
}

function authHeader() {
  return `Basic ${Buffer.from(`${requiredServerKey()}:`, "utf8").toString("base64")}`;
}

function publicBaseUrl() {
  const configured = process.env.READYSCORE_PUBLIC_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("READYSCORE_PUBLIC_URL_NOT_CONFIGURED");
  }
  return "http://localhost:3000";
}

function jsonRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

async function parseResponse(response: Response) {
  const text = await response.text();
  let body: unknown = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  if (!response.ok) {
    const record = jsonRecord(body);
    const code = typeof record.error_messages === "object"
      ? JSON.stringify(record.error_messages)
      : String(record.status_message ?? response.statusText);
    throw new Error(`MIDTRANS_API_ERROR:${response.status}:${code}`);
  }
  return jsonRecord(body);
}

function amount(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
    throw new Error("MIDTRANS_INVALID_AMOUNT");
  }
  return n;
}

function mapStatus(value: string, fraudStatus?: string): PaymentStatusResult["status"] {
  const status = value.toLowerCase();
  if (status === "settlement" || (status === "capture" && fraudStatus?.toLowerCase() === "accept")) return "PAID";
  if (status === "pending" || status === "authorize") return "PENDING";
  if (status === "expire") return "EXPIRED";
  if (status === "cancel") return "CANCELLED";
  if (["deny", "failure", "refund", "partial_refund", "chargeback", "partial_chargeback"].includes(status)) return "FAILED";
  return "PENDING";
}

export class MidtransSnapProvider implements PaymentProvider {
  readonly name = PROVIDER;

  async createPayment(input: PaymentCreateInput): Promise<PaymentCreateResult> {
    if (input.currency !== "IDR") throw new Error("PAYMENT_CURRENCY_UNSUPPORTED");
    const grossAmount = amount(input.amountIdr);

    const response = await fetch(snapEndpoint(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: authHeader(),
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: input.orderId,
          gross_amount: grossAmount,
        },
        customer_details: {
          first_name: input.customer.name,
          email: input.customer.email,
        },
        callbacks: {
          finish: `${publicBaseUrl()}/checkout/success`,
          error: `${publicBaseUrl()}/checkout/success`,
        },
      }),
      cache: "no-store",
    });

    const body = await parseResponse(response);
    const token = typeof body.token === "string" ? body.token : undefined;
    const redirectUrl = typeof body.redirect_url === "string" ? body.redirect_url : undefined;
    const transactionId = typeof body.transaction_id === "string" ? body.transaction_id : undefined;
    if (!token && !redirectUrl) throw new Error("MIDTRANS_PAYMENT_URL_MISSING");

    return {
      provider: PROVIDER,
      providerTransactionId: transactionId,
      providerReference: input.orderId,
      paymentToken: token,
      redirectUrl,
      raw: body,
    };
  }

  async getPaymentStatus(providerReference: string): Promise<PaymentStatusResult> {
    const response = await fetch(
      `${apiBase()}/v2/${encodeURIComponent(providerReference)}/status`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: authHeader(),
        },
        cache: "no-store",
      },
    );
    const body = await parseResponse(response);
    const orderId = String(body.order_id ?? "").trim();
    const transactionId = typeof body.transaction_id === "string" ? body.transaction_id.trim() : undefined;
    const providerStatus = String(body.transaction_status ?? "").trim().toLowerCase();
    const grossAmount = Number.parseFloat(String(body.gross_amount ?? ""));
    const currency = String(body.currency ?? "").trim().toUpperCase();
    const expectedReference = String(providerReference).trim();
    if (!orderId || orderId !== expectedReference) {
      const actualReference = orderId || "<missing>";
      const actualTransactionId = transactionId || "<missing>";
      const actualStatus = providerStatus || "<missing>";
      const statusCode = String(body.status_code ?? "<missing>").trim();
      throw new Error(
        `MIDTRANS_ORDER_REFERENCE_MISMATCH:expected=${expectedReference}:received=${actualReference}:transactionId=${actualTransactionId}:status=${actualStatus}:statusCode=${statusCode}`,
      );
    }
    if (!Number.isFinite(grossAmount)) throw new Error("MIDTRANS_AMOUNT_MISSING");
    if (!currency) throw new Error("MIDTRANS_CURRENCY_MISSING");

    return {
      provider: PROVIDER,
      providerTransactionId: transactionId,
      providerReference: orderId,
      providerStatus,
      status: mapStatus(providerStatus, String(body.fraud_status ?? "")),
      grossAmount,
      currency,
      raw: body,
    };
  }
}

export function getPaymentProvider(): PaymentProvider {
  const provider = (process.env.READYSCORE_PAYMENT_PROVIDER ?? "MIDTRANS").trim().toUpperCase();
  if (provider === "MIDTRANS") return new MidtransSnapProvider();
  throw new Error(`PAYMENT_PROVIDER_UNSUPPORTED:${provider}`);
}
