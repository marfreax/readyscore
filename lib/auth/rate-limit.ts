type RateLimitEntry = { count: number; resetAt: number };

const entries = new Map<string, RateLimitEntry>();
const DEFAULT_MAX = 5;
const DEFAULT_WINDOW_SECONDS = 15 * 60;
const MAX_KEYS = 10_000;

function config() {
  const maxRaw = Number(process.env.PASSWORD_RESET_RATE_LIMIT_MAX ?? DEFAULT_MAX);
  const windowRaw = Number(process.env.PASSWORD_RESET_RATE_LIMIT_WINDOW_SECONDS ?? DEFAULT_WINDOW_SECONDS);
  const max = Number.isInteger(maxRaw) && maxRaw >= 1 && maxRaw <= 100 ? maxRaw : DEFAULT_MAX;
  const windowSeconds = Number.isInteger(windowRaw) && windowRaw >= 60 && windowRaw <= 86_400 ? windowRaw : DEFAULT_WINDOW_SECONDS;
  return { max, windowMs: windowSeconds * 1000 };
}

function prune(now: number) {
  for (const [key, entry] of entries) if (entry.resetAt <= now) entries.delete(key);
  while (entries.size > MAX_KEYS) {
    const first = entries.keys().next().value;
    if (!first) break;
    entries.delete(first);
  }
}

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number; limit: number };

export function checkPasswordResetRateLimit(keys: string[], now = Date.now()): RateLimitResult {
  const { max, windowMs } = config();
  prune(now);
  let retryAfterSeconds = 0;
  let allowed = true;
  for (const rawKey of keys) {
    const key = rawKey.trim();
    if (!key) continue;
    const current = entries.get(key);
    if (!current || current.resetAt <= now) {
      entries.set(key, { count: 1, resetAt: now + windowMs });
      continue;
    }
    if (current.count >= max) {
      allowed = false;
      retryAfterSeconds = Math.max(retryAfterSeconds, Math.ceil((current.resetAt - now) / 1000));
    } else {
      current.count += 1;
    }
  }
  return { allowed, retryAfterSeconds, limit: max };
}

export function resetPasswordRateLimitForTests() {
  entries.clear();
}
