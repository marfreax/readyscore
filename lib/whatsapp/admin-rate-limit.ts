type Entry = { count: number; resetAt: number };

const entries = new Map<string, Entry>();
const DEFAULT_MAX = 30;
const DEFAULT_WINDOW_SECONDS = 60;
const MAX_KEYS = 10_000;

function config() {
  const maxRaw = Number(process.env.WHATSAPP_ADMIN_SEND_RATE_LIMIT_MAX ?? DEFAULT_MAX);
  const windowRaw = Number(process.env.WHATSAPP_ADMIN_SEND_RATE_LIMIT_WINDOW_SECONDS ?? DEFAULT_WINDOW_SECONDS);
  const max = Number.isInteger(maxRaw) && maxRaw >= 1 && maxRaw <= 120 ? maxRaw : DEFAULT_MAX;
  const windowSeconds = Number.isInteger(windowRaw) && windowRaw >= 10 && windowRaw <= 3600 ? windowRaw : DEFAULT_WINDOW_SECONDS;
  return { max, windowMs: windowSeconds * 1000 };
}

function prune(now: number) {
  for (const [key, entry] of entries) if (entry.resetAt <= now) entries.delete(key);
  while (entries.size > MAX_KEYS) {
    const key = entries.keys().next().value;
    if (!key) break;
    entries.delete(key);
  }
}

export type WhatsAppAdminRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  limit: number;
};

export function checkWhatsAppAdminSendRateLimit(actorUserId: string, now = Date.now()): WhatsAppAdminRateLimitResult {
  const { max, windowMs } = config();
  const key = actorUserId.trim();
  if (!key) return { allowed: false, retryAfterSeconds: Math.ceil(windowMs / 1000), limit: max };
  prune(now);
  const current = entries.get(key);
  if (!current || current.resetAt <= now) {
    entries.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0, limit: max };
  }
  if (current.count >= max) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)), limit: max };
  }
  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0, limit: max };
}

export function resetWhatsAppAdminSendRateLimitForTests() {
  entries.clear();
}
