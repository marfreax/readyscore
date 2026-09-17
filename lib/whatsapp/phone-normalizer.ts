/** Canonical Indonesian WhatsApp phone representation used by ReadyScore identity matching. */
export function normalizeWhatsAppPhone(value: string): string | null {
  const compact = value.trim().replace(/[\s().-]/g, "");
  if (!/^(?:\+62|62|0)\d{8,13}$/.test(compact)) return null;
  if (compact.startsWith("+62")) return `+62${compact.slice(3)}`;
  if (compact.startsWith("62")) return `+${compact}`;
  return `+62${compact.slice(1)}`;
}
