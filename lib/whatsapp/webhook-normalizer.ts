export type WhatsAppWebhookMessage = {
  externalMessageId: string;
  from: string | null;
  timestamp: string | null;
  type: string;
  text: string | null;
  displayName: string | null;
};

export type WhatsAppWebhookStatus = {
  externalMessageId: string;
  status: string;
  recipientId: string | null;
  timestamp: string | null;
};

export type WhatsAppWebhookNormalization = {
  object: string | null;
  messages: WhatsAppWebhookMessage[];
  statuses: WhatsAppWebhookStatus[];
  unsupportedChangeCount: number;
};

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeMessage(value: unknown): WhatsAppWebhookMessage | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const item = value as Record<string, unknown>;
  const id = stringValue(item.id);
  if (!id) return null;

  const type = stringValue(item.type) ?? "unknown";
  const profile =
    item.profile && typeof item.profile === "object" && !Array.isArray(item.profile)
      ? stringValue((item.profile as Record<string, unknown>).name)
      : null;
  const text =
    type === "text" &&
    item.text &&
    typeof item.text === "object" &&
    !Array.isArray(item.text)
      ? stringValue((item.text as Record<string, unknown>).body)
      : null;

  return {
    externalMessageId: id,
    from: stringValue(item.from),
    timestamp: stringValue(item.timestamp),
    type,
    text,
    displayName: profile,
  };
}

function normalizeStatus(value: unknown): WhatsAppWebhookStatus | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const item = value as Record<string, unknown>;
  const id = stringValue(item.id);
  const status = stringValue(item.status);
  if (!id || !status) return null;

  return {
    externalMessageId: id,
    status,
    recipientId: stringValue(item.recipient_id),
    timestamp: stringValue(item.timestamp),
  };
}

export function normalizeWhatsAppWebhookPayload(
  payload: unknown,
): WhatsAppWebhookNormalization {
  const result: WhatsAppWebhookNormalization = {
    object: null,
    messages: [],
    statuses: [],
    unsupportedChangeCount: 0,
  };

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return result;
  }

  const root = payload as Record<string, unknown>;
  result.object = stringValue(root.object);

  if (!Array.isArray(root.entry)) return result;

  for (const entryValue of root.entry) {
    if (!entryValue || typeof entryValue !== "object" || Array.isArray(entryValue)) continue;
    const entry = entryValue as Record<string, unknown>;
    if (!Array.isArray(entry.changes)) continue;

    for (const changeValue of entry.changes) {
      if (!changeValue || typeof changeValue !== "object" || Array.isArray(changeValue)) {
        result.unsupportedChangeCount += 1;
        continue;
      }

      const change = changeValue as Record<string, unknown>;
      const value = change.value;
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        result.unsupportedChangeCount += 1;
        continue;
      }

      const changeValueObject = value as Record<string, unknown>;

      if (Array.isArray(changeValueObject.messages)) {
        for (const message of changeValueObject.messages) {
          const normalized = normalizeMessage(message);
          if (normalized) result.messages.push(normalized);
        }
      }

      if (Array.isArray(changeValueObject.statuses)) {
        for (const status of changeValueObject.statuses) {
          const normalized = normalizeStatus(status);
          if (normalized) result.statuses.push(normalized);
        }
      }

      if (
        !Array.isArray(changeValueObject.messages) &&
        !Array.isArray(changeValueObject.statuses)
      ) {
        result.unsupportedChangeCount += 1;
      }
    }
  }

  return result;
}

export function isWhatsAppWebhookPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
  const root = payload as Record<string, unknown>;
  return root.object === "whatsapp_business_account" && Array.isArray(root.entry);
}
