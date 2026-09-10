export type PaymentCreateInput = {
  orderId: string;
  amountIdr: number;
  currency: string;
  customer: {
    name: string;
    email: string;
  };
};

export type PaymentCreateResult = {
  provider: string;
  providerTransactionId?: string;
  providerReference: string;
  paymentToken?: string;
  redirectUrl?: string;
  raw: Record<string, unknown>;
};

export type PaymentStatusResult = {
  provider: string;
  providerTransactionId?: string;
  providerReference: string;
  providerStatus: string;
  status: "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "CANCELLED";
  grossAmount: number;
  currency: string;
  raw: Record<string, unknown>;
};

export interface PaymentProvider {
  readonly name: string;
  createPayment(input: PaymentCreateInput): Promise<PaymentCreateResult>;
  getPaymentStatus(providerReference: string): Promise<PaymentStatusResult>;
}
