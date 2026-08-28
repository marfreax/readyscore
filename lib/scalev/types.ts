export type ScalevWebhookEnvelope = {
  event: string;
  unique_id: string;
  timestamp: string;
  data: Record<string, unknown>;
};

export type ScalevOrderLine = {
  variant_sku?: string | null;
  variant_unique_id?: string | null;
  product_name?: string | null;
  quantity?: number | null;
};

export type ScalevOrderLike = Record<string, unknown> & {
  id?: string;
  order_id?: string;
  customer_id?: string | number | null;
  customer?: {
    id?: string | number | null;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  destination_address?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  orderlines?: ScalevOrderLine[] | null;
  payment_status?: string | null;
  paid_time?: string | null;
  settled_time?: string | null;
};
